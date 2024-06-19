import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, model } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { CommandDialogComponent } from '@metad/copilot-angular'
import { nonBlank } from '@metad/core'
import { NgmCommonModule, NgmTableComponent, ResizerModule, SplitterModule } from '@metad/ocap-angular/common'
import { OcapCoreModule, effectAction } from '@metad/ocap-angular/core'
import { NgmEntitySchemaComponent } from '@metad/ocap-angular/entity'
import { NxDesignerModule, NxSettingsPanelService } from '@metad/story/designer'
import { ContentLoaderModule } from '@ngneat/content-loader'
import { TranslateService } from '@ngx-translate/core'
import { MaterialModule, SharedModule, TranslationBaseComponent } from 'apps/cloud/src/app/@shared'
import { isEqual, uniq } from 'lodash-es'
import { derivedFrom } from 'ngxtension/derived-from'
import { Observable, combineLatest, pipe } from 'rxjs'
import { distinctUntilChanged, filter, map, startWith, switchMap, tap, withLatestFrom } from 'rxjs/operators'
import { ToastrService, routeAnimations } from '../../../../@core'
import { AppService } from '../../../../app.service'
import { TablesJoinModule } from '../../tables-join'
import { injectHierarchyCommand } from '../copilot'
import { ModelComponent } from '../model.component'
import { SemanticModelService } from '../model.service'
import { ModelDesignerType, TOOLBAR_ACTION_CATEGORY } from '../types'
import { ModelDimensionService } from './dimension.service'

@Component({
  standalone: true,
  selector: 'pac-model-dimension',
  templateUrl: 'dimension.component.html',
  styleUrls: ['dimension.component.scss'],
  animations: [routeAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ModelDimensionService, NxSettingsPanelService],
  imports: [
    CommonModule,
    SharedModule,
    MaterialModule,
    ContentLoaderModule,

    NxDesignerModule,

    OcapCoreModule,
    ResizerModule,
    SplitterModule,
    NgmEntitySchemaComponent,
    NgmCommonModule,
    NgmTableComponent,

    TablesJoinModule
  ]
})
export class ModelDimensionComponent extends TranslationBaseComponent implements OnInit {
  public appService = inject(AppService)
  public modelService = inject(SemanticModelService)
  private modelComponent = inject(ModelComponent)
  private dimensionService = inject(ModelDimensionService)
  public settingsService = inject(NxSettingsPanelService)
  readonly #toastrService = inject(ToastrService)
  readonly #route = inject(ActivatedRoute)
  readonly #router = inject(Router)
  readonly #destroyRef = inject(DestroyRef)
  readonly #translate = inject(TranslateService)
  readonly dialog = inject(MatDialog)

  public readonly dimension$ = this.dimensionService.dimension$

  /**
   |--------------------------------------------------------------------------
   | Signals
   |--------------------------------------------------------------------------
   */
  readonly detailsOpen = model(false)
  public readonly hierarchies = toSignal(this.dimensionService.hierarchies$)
  public readonly dimension = toSignal(this.dimensionService.dimension$)
  readonly isMobile = this.appService.isMobile
  readonly error = toSignal(
    this.dimensionService.name$.pipe(switchMap((entity) => this.modelService.selectOriginalEntityError(entity)))
  )

  readonly tables = computed(
    () =>
      uniq(
        this.hierarchies()
          ?.flatMap((h) => h.tables)
          .flatMap((t) => t?.name)
      ),
    { equal: isEqual }
  )
  readonly tableTypes = derivedFrom(
    [this.tables],
    pipe(
      switchMap(([tables]) => combineLatest(tables.map((table) => this.modelService.selectOriginalEntityType(table))))
    ),
    { initialValue: [] }
  )

  /**
  |--------------------------------------------------------------------------
  | Copilot
  |--------------------------------------------------------------------------
  */
  #createHierarchyCommand = injectHierarchyCommand(this.dimensionService, this.tableTypes)

  /**
  |--------------------------------------------------------------------------
  | Subscriptions (effects)
  |--------------------------------------------------------------------------
  */
  #paramSub = this.#route.paramMap
    .pipe(
      startWith(this.#route.snapshot.paramMap),
      map((paramMap) => paramMap.get('id')),
      filter(nonBlank),
      map(decodeURIComponent),
      distinctUntilChanged(),
      takeUntilDestroyed()
    )
    .subscribe((id) => {
      this.dimensionService.init(id)
      this.modelService.setCrrentEntity(id)
    })

  #errorSub = effect(() => {
    const error = this.error()
    if (error) {
      this.#toastrService.error(error)
    }
  })

  /**
  |--------------------------------------------------------------------------
  | Methods
  |--------------------------------------------------------------------------
  */
  ngOnInit(): void {
    this.openDesigner()
    this.settingsService.setEditable(true)

    this.modelComponent.toolbarAction$
      .pipe(
        filter(({ category, action }) => category === TOOLBAR_ACTION_CATEGORY.DIMENSION),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(({ category, action }) => {
        if (action === 'NewHierarchy') {
          this.dimensionService.newHierarchy(null)
        } else if (action === 'RemoveHierarchy') {
          this.dimensionService.removeHierarchy('')
        }
      })
  }

  isDirty(id: string) {
    return this.dimensionService.dirty()[id]
  }

  openDesignerPanel() {
    this.detailsOpen.set(true)
  }

  readonly openDesigner = effectAction((origin$: Observable<void>) => {
    return origin$.pipe(
      withLatestFrom(this.dimension$),
      switchMap(([, dimension]) =>
        this.settingsService.openDesigner(
          ModelDesignerType.dimension,
          this.dimension$.pipe(
            map((dimension) => ({ modeling: dimension, shared: true, hierarchies: dimension.hierarchies }))
          ),
          dimension.__id__
        )
      ),
      tap((result: { modeling }) => {
        this.dimensionService.update(result.modeling)
      })
    )
  })

  editDimension() {
    this.openDesignerPanel()
    this.openDesigner()
  }

  editHierarchy(key: string) {
    this.openDesignerPanel()
    this.dimensionService.setupHierarchyDesigner(key)
  }

  removeHierarchy(key: string) {
    this.dimensionService.removeHierarchy(key)
  }

  newHierarchy() {
    this.dialog
      .open(CommandDialogComponent, {
        backdropClass: 'bg-transparent',
        data: {
          commands: ['hierarchy']
        }
      })
      .afterClosed()
      .subscribe((result) => {})
    // this.dimensionService.newHierarchy(null)
  }

  duplicateHierarchy(key: string) {
    this.dimensionService.duplicateHierarchy(key)
  }

  navigateTo(id: string) {
    this.#router.navigate([`hierarchy/${id}`], { relativeTo: this.#route })
  }
}
