import { coerceBooleanProperty } from '@angular/cdk/coercion'
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop'
import { CommonModule } from '@angular/common'
import {
  Component,
  Input,
  ViewChild,
  ViewContainerRef,
  booleanAttribute,
  effect,
  forwardRef,
  inject,
  input,
  model
} from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { NgmCommonModule, NgmHighlightDirective, ResizerModule } from '@metad/ocap-angular/common'
import { NgmDSCoreService, OcapCoreModule } from '@metad/ocap-angular/core'
import { NgmBaseEditorDirective } from '@metad/ocap-angular/formula'
import { MDXReference, NgmMDXEditorComponent } from '@metad/ocap-angular/mdx'
import { NgmParameterCreateComponent } from '@metad/ocap-angular/parameter'
import {
  C_MEASURES,
  DataSettings,
  EntityType,
  ParameterProperty,
  Syntax,
  getEntityCalculations,
  getEntityParameters,
  isIndicatorMeasureProperty,
  isPropertyMeasure,
  nonNullable
} from '@metad/ocap-core'
import { TranslateModule } from '@ngx-translate/core'
import { negate, sortBy } from 'lodash-es'
import { MarkdownModule } from 'ngx-markdown'
import { combineLatestWith, distinctUntilChanged, filter, firstValueFrom, map, of, startWith, switchMap } from 'rxjs'
import { NgmEntitySchemaComponent } from '../entity-schema/entity-schema.component'
import { EntityCapacity } from '../entity-schema/types'
import { NgmEntityPropertyComponent } from '../property/property.component'

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatSidenavModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatTooltipModule,
    MatExpansionModule,
    TranslateModule,
    MarkdownModule,

    OcapCoreModule,
    NgmCommonModule,
    ResizerModule,
    NgmEntityPropertyComponent,
    NgmEntitySchemaComponent,
    NgmHighlightDirective,
    NgmMDXEditorComponent
  ],
  selector: 'ngm-calculated-measure',
  templateUrl: './calculated-measure.component.html',
  styleUrls: ['./calculated-measure.component.scss'],
  host: {
    class: 'ngm-calculated-measure'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => NgmCalculatedMeasureComponent)
    }
  ]
})
export class NgmCalculatedMeasureComponent implements ControlValueAccessor {
  Syntax = Syntax
  EntityCapacity = EntityCapacity
  FUNCTIONS = []

  private readonly _dialog = inject(MatDialog)
  private readonly _viewContainerRef = inject(ViewContainerRef)

  readonly dsCoreService = input<NgmDSCoreService>()
  readonly dataSettings = input<DataSettings>()
  readonly entityType = input<EntityType>()
  // readonly coreService = input<NxCoreService>()
  readonly syntax = input<Syntax>()

  @Input() get story() {
    return this._story
  }
  set story(value: boolean | string) {
    this._story = coerceBooleanProperty(value)
  }
  private _story = false

  readonly disabled = input<boolean, string | boolean>(false, {
    transform: booleanAttribute
  })

  readonly opened = input<boolean, string | boolean>(false, {
    transform: booleanAttribute
  })

  @ViewChild('editor') editor!: NgmBaseEditorDirective

  readonly drawerOpened = model(false)

  calculatedMemberSearch = new FormControl<string>('')
  get calculatedMemberHighlight() {
    return this.calculatedMemberSearch.value
  }

  fnSearchControl = new FormControl<string>(null)
  get fnHighlight() {
    return this.fnSearchControl.value
  }

  readonly statement = new FormControl<string>(null)

  calculations = []
  private _onChange: any

  public readonly calculations$ = toObservable(this.entityType).pipe(
    map(getEntityCalculations),
    map((values) => [
      ...sortBy(values.filter(negate(isIndicatorMeasureProperty)), 'calculationType'),
      ...values.filter(isIndicatorMeasureProperty)
    ]),
    combineLatestWith(this.calculatedMemberSearch.valueChanges.pipe(startWith(''))),
    map(([values, search]) =>
      values.filter(
        (v) =>
          v.caption?.toLowerCase().includes(search.toLowerCase()) || v.name.toLowerCase().includes(search.toLowerCase())
      )
    )
  )
  public readonly parameters$ = toObservable(this.entityType).pipe(map(getEntityParameters))

  public readonly functions$ = of(sortBy(MDXReference.FUNCTIONS, 'label')).pipe(
    switchMap((functions) =>
      this.fnSearchControl.valueChanges.pipe(
        startWith(''),
        map((text) => {
          text = text?.trim().toLowerCase()
          return text ? functions.filter((item) => item.label.toLowerCase().includes(text)) : functions
        })
      )
    )
  )

  private statementSub = this.statement.valueChanges
    .pipe(distinctUntilChanged(), filter(nonNullable), takeUntilDestroyed())
    .subscribe((value) => {
      this._onChange?.(value)
    })

  constructor() {
    effect(
      () => {
        if (this.opened()) {
          this.drawerOpened.set(this.opened())
        }
      },
      { allowSignalWrites: true }
    )

    effect(() => {
      this.disabled() ? this.statement.disable() : this.statement.enable()
    })
  }

  writeValue(obj: any): void {
    this.statement.setValue(obj)
  }
  registerOnChange(fn: any): void {
    this._onChange = fn
  }
  registerOnTouched(fn: any): void {}
  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.statement.disable() : this.statement.enable()
  }

  toggleSideMenu() {
    this.drawerOpened.update((v) => !v)
  }

  async openCreateParameter(parameter?: ParameterProperty) {
    const result = await firstValueFrom(
      this._dialog
        .open(NgmParameterCreateComponent, {
          viewContainerRef: this._viewContainerRef,
          data: {
            dataSettings: this.dataSettings(),
            entityType: this.entityType(),
            // coreService: this.coreService,
            dimension: {}, // TODO
            name: parameter?.name
          }
        })
        .afterClosed()
    )

    if (result) {
      // 参数创建成功
      console.debug(result)
    }
  }

  drop(event: CdkDragDrop<Array<{ name: string }>>) {
    if (event.container.id === 'ngm-calculated-editor') {
      if (event.previousContainer.id === 'ngm-calculated-calculations') {
        this.editor.insert(`[${C_MEASURES}].[${event.item.data.name}]`)
      } else if (event.previousContainer.id === 'ngm-calculated-parameters') {
        this.editor.insert(`[@${event.item.data.name}]`)
      } else if (event.previousContainer.id === 'ngm-calculated-measure__entity-schema') {
        if (isPropertyMeasure(event.item.data)) {
          this.editor.insert(`[${C_MEASURES}].[${event.item.data.name}]`)
        } else {
          this.editor.insert(event.item.data.name)
        }
      } else if (typeof event.item.data === 'string') {
        this.editor.insert(event.item.data)
      }
    }
  }

  openHelp(event) {
    window.open('https://docs.microsoft.com/en-us/sql/mdx/mdx-function-reference-mdx', '_blank')
  }
}
