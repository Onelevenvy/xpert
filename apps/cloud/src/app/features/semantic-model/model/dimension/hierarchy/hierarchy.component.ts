import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop'
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ViewChildren,
  computed,
  effect,
  inject,
  model,
  signal
} from '@angular/core'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { nonNullable } from '@metad/core'
import { NgmCommonModule, ResizerModule, SplitterModule, SplitterType } from '@metad/ocap-angular/common'
import { OcapCoreModule } from '@metad/ocap-angular/core'
import {
  EntityCapacity,
  EntitySchemaNode,
  EntitySchemaType,
  NgmEntitySchemaComponent
} from '@metad/ocap-angular/entity'
import { C_MEASURES, Dimension, DisplayBehaviour, OrderDirection, PropertyLevel, QueryOptions, Table } from '@metad/ocap-core'
import { C_MEASURES_ROW_COUNT, serializeMeasureName, serializeMemberCaption, serializeUniqueName } from '@metad/ocap-sql'
import { NxSettingsPanelService } from '@metad/story/designer'
import { ContentLoaderModule } from '@ngneat/content-loader'
import { TranslateService } from '@ngx-translate/core'
import { NgmError, ToastrService, uuid } from 'apps/cloud/src/app/@core'
import { MaterialModule, SharedModule } from 'apps/cloud/src/app/@shared'
import { isEqual } from 'lodash-es'
import { NGXLogger } from 'ngx-logger'
import { BehaviorSubject, of } from 'rxjs'
import {
  combineLatestWith,
  debounceTime,
  delayWhen,
  distinctUntilChanged,
  filter,
  first,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
  withLatestFrom
} from 'rxjs/operators'
import { TablesJoinModule } from '../../../tables-join'
import { ModelComponent } from '../../model.component'
import { SemanticModelService } from '../../model.service'
import { HierarchyColumnType, TOOLBAR_ACTION_CATEGORY } from '../../types'
import { ModelDimensionComponent } from '../dimension.component'
import { ModelDimensionService } from '../dimension.service'
import { HierarchyTableComponent } from '../hierarchy-table/hierarchy-table.component'
import { HierarchyTableDataType } from '../types'
import { ModelHierarchyService } from './hierarchy.service'

@Component({
  standalone: true,
  selector: 'pac-model-hierarchy',
  templateUrl: 'hierarchy.component.html',
  styleUrls: ['hierarchy.component.scss'],
  host: {
    class: 'pac-model-hierarchy'
  },
  providers: [ModelHierarchyService],
  imports: [
    SharedModule,
    MaterialModule,
    ContentLoaderModule,
    OcapCoreModule,
    ResizerModule,
    SplitterModule,
    NgmEntitySchemaComponent,
    NgmCommonModule,
    TablesJoinModule,
    HierarchyTableComponent
  ]
})
export class ModelHierarchyComponent implements AfterViewInit {
  uuid = uuid()
  DisplayBehaviour = DisplayBehaviour
  COLUMN_TYPE = HierarchyColumnType
  EntityCapacity = EntityCapacity
  SplitterType = SplitterType

  private readonly dimensionComponent = inject(ModelDimensionComponent)
  private readonly settingsService = inject(NxSettingsPanelService)
  private readonly toastrService = inject(ToastrService)
  readonly destroyRef = inject(DestroyRef)

  @ViewChildren(CdkDropList) cdkDropList: CdkDropList[]

  // Translations
  private T_Count = 'Count'

  // Signal
  // States
  readonly designerComponentId = toSignal(this.settingsService.settingsComponent$.pipe(map((settings) => settings?.id)))

  entities = [] as any
  get dataSourceName() {
    return this.modelService.originalDataSource?.options.name
  }

  tablesJoinCollapsed = true

  public readonly tables$ = this.hierarchyService.tables$.pipe(
    tap((tables) => {
      if (tables?.length > 1) {
        this.tablesJoinCollapsed = false
      }
    })
  )
  public readonly tableName$ = this.hierarchyService.tableName$
  public readonly levels$ = this.hierarchyService.levels$

  public readonly columns$ = this.levels$.pipe(
    filter(nonNullable),
    combineLatestWith(this.dimensionService.name$, this.hierarchyService.name$, this.modelService.dialect$),
    map(([levels, dimension, hierarchy, dialect]) => {
      const columns = []
      levels.forEach((level) => {
        columns.push({
          name: serializeUniqueName(dialect, dimension, hierarchy, level.name, 'MEMBER_CAPTION'),
          caption: level.caption || level.name
        })

        if (level.parentColumn) {
          columns.push({
            name: serializeUniqueName(dialect, dimension, hierarchy, level.name, 'PARENT_UNIQUE_NAME'),
            caption: (level.caption || level.name) + '(Parent)'
          })
        }

        level.properties
          ?.filter((property) => property.column && property.name)
          .forEach((property) => {
            columns.push({
              name: serializeUniqueName(dialect, dimension, hierarchy, property.name),
              caption: property.caption || property.name
            })
          })
      })

      columns.push({
        name: serializeMeasureName(dialect, C_MEASURES_ROW_COUNT),
        caption: this.T_Count
      })
      return columns
    })
  )

  private refresh$ = new BehaviorSubject<void>(null)

  /**
  |--------------------------------------------------------------------------
  | Signals
  |--------------------------------------------------------------------------
  */
  readonly dialect = toSignal(this.modelService.dialect$)
  readonly dimensionName = toSignal(this.dimensionService.name$)
  readonly hierarchyName = toSignal(this.hierarchyService.name$)
  readonly levels = toSignal(this.hierarchyService.levels$)
  readonly viewMode = model<'table' | 'tree'>('table')
  readonly columns = toSignal(this.columns$)
  readonly levelColumns = computed<Dimension[]>(() => {
    const levels = this.levels()
    const dialect = this.dialect()
    const dimension = this.dimensionName()
    const hierarchy = this.hierarchyName()

    return levels.map((level) => ({
      dimension: serializeUniqueName(dialect, dimension),
      hierarchy: serializeUniqueName(dialect, dimension, hierarchy),
      level: serializeUniqueName(dialect, dimension, hierarchy, level.name),
      caption: level.caption || level.name,
      properties: level.properties
        ?.filter((property) => property.column && property.name)
        .map((property) => serializeUniqueName(dialect, dimension, hierarchy, property.name))
    }))
  })
  readonly levelTableColumns = computed(() => {
    const columns = this.levelColumns()
    const hasAll = this.hierarchyService.hasAll()
    const allLevelName = this.hierarchyService.allLevelName()
    const allLevelCaption = this.hierarchyService.allLevelCaption()
    const tableColumns = columns.map((column) => ({
      name: column.level,
      caption: column.caption,
    }))
    if (hasAll) {
      return [
        {
          name: allLevelName,
          caption: allLevelCaption
        },
        ...tableColumns
      ]
    }
    return tableColumns
  })
  
  readonly treeData = computed(() => {
    const data = this.data()
    const hasAll = this.hierarchyService.hasAll()
    const allMemberName = this.hierarchyService.allMemberName()
    const allMemberCaption = this.hierarchyService.allMemberCaption()
    const allLevelName = this.hierarchyService.allLevelName()
    const levels = this.levelColumns()
    if (data) {
      const treeTable = arrayToTreeTable(
        data,
        levels.map((column) => ({
          name: column.level,
          caption: serializeMemberCaption(column.level)
        }))
      )
      if (hasAll) {
        return [
          {
            levelNumber: 0,
            level: allLevelName,
            children: treeTable,
            value: {
              [allLevelName]: allMemberName,
              [serializeMemberCaption(allLevelName)]: allMemberCaption
            }
          }
        ]
      }
      return treeTable
    }
    return null
  })

  readonly queryOptions = computed(() => {
    return {
      rows: this.levelColumns(),
      columns: [
        {
          dimension: C_MEASURES,
          measure: C_MEASURES_ROW_COUNT
        }
      ],
      orderbys: [
        ...this.levelColumns().map((column) => ({
          by: column.level,
          order: OrderDirection.ASC
        }))
      ]
    } as QueryOptions
  }, { equal: isEqual})

  readonly loading = signal(false)
  readonly query$ = toObservable(this.queryOptions).pipe(
    // Waiting for Dimension Schema updated in DataSource
    debounceTime(300),
    // Waiting for entityService
    delayWhen(() => this.dimensionService.dimEntityService$),
    withLatestFrom(this.dimensionService.dimEntityService$),
    switchMap(([queryOptions, entityService]) => {
      return queryOptions.rows?.length
        ? entityService.selectEntityType().pipe(
            filter(nonNullable), // Wait for EntityType initialed
            first(),
            switchMap(() => this.refresh$),
            switchMap(() => {
              this.loading.set(true)
              return entityService.selectQuery(queryOptions).pipe(tap(() => (this.loading.set(false))))
            })
          )
        : of({
            data: [],
            error: null
          })
    }),
    tap((result) => this.logger.debug(`Dimension Levels Preview Query result`, result)),
    takeUntilDestroyed(),
    shareReplay(1)
  )

  public readonly data$ = this.query$.pipe(map(({ data }) => data))
  public readonly error$ = this.query$.pipe(map(({ error }) => error))

  readonly data = toSignal(this.data$)

  /**
  |--------------------------------------------------------------------------
  | Subscriptions (effect)
  |--------------------------------------------------------------------------
  */
  // 手动 Stop Receiving dropListRef, 因为官方的程序在跨页面 DropList 间似乎 detectChanges 时间先后有问题
  private _dragReleasedSub = this.modelService.dragReleased$.pipe(takeUntilDestroyed()).subscribe((_dropListRef) => {
    this.cdkDropList.forEach((list) => list._dropListRef._stopReceiving(_dropListRef))
    this._cdr.detectChanges()
  })

  private toolbarActionsSub = this.modelComponent.toolbarAction$
    .pipe(
      filter(({ category, action }) => category === TOOLBAR_ACTION_CATEGORY.HIERARCHY),
      takeUntilDestroyed()
    )
    .subscribe(({ category, action }) => {
      if (action === 'RemoveLevel') {
        this.hierarchyService.removeCurrentLevel()
      }
    })
  private countTSub = this.translateService
    .get('PAC.MODEL.DIMENSION.Count', { Default: 'Count' })
    .pipe(takeUntilDestroyed())
    .subscribe((value) => {
      this.T_Count = value
    })

  constructor(
    public modelService: SemanticModelService,
    private modelComponent: ModelComponent,
    private dimensionService: ModelDimensionService,
    private hierarchyService: ModelHierarchyService,
    private route: ActivatedRoute,
    private logger: NGXLogger,
    private translateService: TranslateService,
    private _cdr: ChangeDetectorRef
  ) {
    this.route.paramMap
      .pipe(
        startWith(this.route.snapshot.paramMap),
        map((paramMap) => paramMap.get('id')),
        filter((value) => !!value),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((id) => {
        this.hierarchyService.init(id)
      })

    effect(() => {
      console.log(this.treeData())
    })
  }

  ngAfterViewInit(): void {
    this.hierarchyService.setupDesigner()
  }

  trackByName(i: number, item: Table) {
    return item.name
  }

  tablesPredicate(event: CdkDrag<EntitySchemaNode>) {
    return (
      event.dropContainer.id === 'pac-model-entitysets' ||
      event.dropContainer.id === 'pac-model-dimension__hierarchy-levels'
    )
  }

  /**
   * 往 Tables 区域添加 table
   */
  dropTable(event: CdkDragDrop<{ name: string }[]>) {
    if (event.previousContainer.id === 'pac-model-entitysets' && event.item.data.name) {
      this.hierarchyService.appendTable(event.item.data.name)
    } else if (event.previousContainer.id === 'pac-model-dimension__hierarchy-levels') {
      this.hierarchyService.removeLevel(event.item.data.__id__)
    } else if (event.previousContainer.id === event.container.id) {
      this.hierarchyService.moveItemInTables(event)
    }
  }

  levelPredicate(item: CdkDrag<EntitySchemaNode>) {
    return item.data.type === EntitySchemaType.Dimension || item.data.type === EntitySchemaType.IMeasure
  }

  dropLevel(event: CdkDragDrop<PropertyLevel[]>) {
    try {
      if (event.previousContainer.id === event.container.id) {
        this.hierarchyService.moveLevelInArray(event)
      } else if (event.previousContainer.id === 'pac-model-dimension__hierarchy-tables' && event.item.data.name) {
        this.hierarchyService.appendLevel({ name: event.item.data.name, table: event.item.data.entity })
      }
    } catch (err: any) {
      this.toastrService.error((<NgmError>err).code, '', { Default: (<NgmError>err).message })
    }
  }

  onLevelSelect(id: string | number) {
    this.hierarchyService.setupLevelDesigner(id)
    this.dimensionComponent.openDesignerPanel()
  }

  onTablesChange(event) {
    this.hierarchyService.setTables(event)
  }

  levelRemovePredicate(item: CdkDrag<PropertyLevel>) {
    return item.dropContainer.id === 'pac-model-dimension__hierarchy-levels'
  }

  removeLevel(event: CdkDragDrop<PropertyLevel[]>) {
    this.hierarchyService.removeLevel(event.item.data.__id__)
  }

  tableRemovePredicate(item: CdkDrag<EntitySchemaNode>) {
    return (
      item.dropContainer.id === 'pac-model-dimension__hierarchy-tables' && item.data.type === EntitySchemaType.Entity
    )
  }

  removeTable(event: CdkDragDrop<EntitySchemaNode[]>) {
    this.hierarchyService.removeTable(event.item.data.name)
  }

  refresh() {
    this.refresh$.next()
  }
}

function arrayToTreeTable<T>(array: Array<T>, levels: {name: string; caption: string;}[]): HierarchyTableDataType<T>[] {
  const tree = []
  const map = new Map()

  array.forEach((item) => {
    for (let i = 0; i < levels.length; i++) {
      const key = levels
        .slice(0, i + 1)
        .map((level) => item[level.name])
        .join('-')
      if (!map.has(key)) {
        const node = {
          levelNumber: i + 1,
          level: levels[i].name,
          children: [],
          value: {}
        }
        levels.slice(0, i + 1).forEach((level) => {
          node.value[level.name] = item[level.name]
          node.value[level.caption] = item[level.caption]
        })
        map.set(key, node)

        if (i === 0) {
          tree.push(node)
        } else {
          const parentKey = levels
            .slice(0, i)
            .map((level) => item[level.name])
            .join('-')
          map.get(parentKey).children.push(node)
        }
      }
    }
  })

  return tree
}
