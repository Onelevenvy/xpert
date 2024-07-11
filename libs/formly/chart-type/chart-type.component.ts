import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostBinding,
  inject,
  OnInit,
  signal,
  TemplateRef,
  ViewChild
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormArray, FormControl, FormGroup } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { CommandDialogComponent, NgmCopilotService } from '@metad/copilot-angular'
import { injectChartCommand, NxChartType } from '@metad/core'
import { NgmFormlyArrayComponent } from '@metad/formly/array'
import { NgmThemeService } from '@metad/ocap-angular/core'
import { EditorThemeMap } from '@metad/ocap-angular/formula'
import {
  BarVariant,
  HeatmapVariant,
  isEqual,
  isNil,
  isString,
  omit,
  PieVariant,
  ScatterVariant,
  TreeVariant,
  WaterfallVariant
} from '@metad/ocap-core'
import { STORY_DESIGNER_SCHEMA } from '@metad/story/designer'
import { ChartOptionsSchemaService } from '@metad/story/widgets/analytical-card'
import { FieldType } from '@ngx-formly/core'
import { TranslateService } from '@ngx-translate/core'
import { NGXLogger } from 'ngx-logger'
import { NgxPopperjsPlacements, NgxPopperjsTriggers } from 'ngx-popperjs'
import { BehaviorSubject, distinctUntilChanged, map, startWith } from 'rxjs'
import { CHART_TYPES, GeoProjections } from './types'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'pac-formly-chart-type',
  templateUrl: './chart-type.component.html',
  styleUrls: ['chart-type.component.scss'],
  providers: [
    {
      provide: STORY_DESIGNER_SCHEMA,
      useClass: ChartOptionsSchemaService
    }
  ]
})
export class PACFormlyChartTypeComponent extends FieldType implements OnInit {
  @HostBinding('class.pac-formly-chart-type') readonly _hostClass = true

  NgxPopperjsTriggers = NgxPopperjsTriggers
  NgxPopperjsPlacements = NgxPopperjsPlacements
  NxChartType = NxChartType
  GeoProjections = [
    {
      key: null,
      caption: '--'
    },
    ...GeoProjections.map((geoProjection) => ({
      key: geoProjection,
      caption: geoProjection
    }))
  ]

  readonly formlyArray2? = inject(NgmFormlyArrayComponent, { optional: true })
  readonly schema = inject<ChartOptionsSchemaService>(STORY_DESIGNER_SCHEMA)
  readonly #copilotService = inject(NgmCopilotService)
  readonly #translate = inject(TranslateService)
  readonly #logger = inject(NGXLogger)
  readonly #themeService = inject(NgmThemeService)
  readonly #dialog = inject(MatDialog)

  @ViewChild('mapTemp') mapTemplate: TemplateRef<unknown>

  ORIENTS = [
    { value: 'horizontal', label: 'Horizontal', icon: 'align_horizontal_left' },
    { value: 'vertical', label: 'Vertical', icon: 'align_vertical_bottom' }
  ]

  HAS_ORIENTS = {
    [NxChartType.Bar]: true,
    [NxChartType.Waterfall]: true,
    [NxChartType.Line]: true,
    [NxChartType.Heatmap]: true,
    [NxChartType.Tree]: true,
    [NxChartType.Sankey]: true
  }
  VARIANTS = {
    Bar: [
      { value: BarVariant.None, label: 'None' },
      { value: BarVariant.Polar, label: 'Polar' },
      { value: BarVariant.Stacked, label: 'Stacked' }
    ],
    Waterfall: [
      {
        value: WaterfallVariant.None,
        label: 'None'
      },
      {
        value: WaterfallVariant.Polar,
        label: 'Polar'
      }
    ],
    Pie: [
      { value: PieVariant.None, label: 'Pie' },
      { value: PieVariant.Doughnut, label: 'Doughnut' },
      { value: PieVariant.Nightingale, label: 'Nightingale' }
    ],
    Scatter: [
      { value: ScatterVariant.None, label: 'None' },
      { value: ScatterVariant.Polar, label: 'Polar' }
    ],
    Tree: [
      { value: TreeVariant.None, label: 'None' },
      { value: TreeVariant.Reverse, label: 'Reverse' },
      { value: TreeVariant.Radial, label: 'Radial' }
    ],
    [NxChartType.Heatmap]: [
      { value: HeatmapVariant.None, label: 'None' },
      { value: HeatmapVariant.Calendar, label: 'Calendar' }
    ]
  }

  chartTypeForm = new FormGroup({
    name: new FormControl(null),
    type: new FormControl(null),
    orient: new FormControl(null),
    variant: new FormControl(null),
    scripts: new FormControl(null),
    chartOptions: new FormControl(null)
  })
  get name() {
    return this.chartTypeForm.get('name') as FormControl
  }
  get chartTypeControl() {
    return this.chartTypeForm.get('type') as FormControl
  }
  get type() {
    return this.chartType()?.type
  }
  get typeLabel() {
    return this.getChartType(this.chartType()?.type)?.label
  }

  chartTypeGroups = CHART_TYPES

  get orient() {
    return this.chartTypeForm.get('orient').value
  }
  set orient(value) {
    this.chartTypeForm.patchValue({ orient: value })
  }
  get variant() {
    return this.chartTypeForm.get('variant').value
  }
  set variant(value) {
    this.chartTypeForm.patchValue({ variant: value })
  }
  get scripts() {
    return this.chartTypeForm.get('scripts').value
  }
  set scripts(value) {
    this.chartTypeForm.patchValue({ scripts: value })
  }

  get chartOptions() {
    return this.chartTypeForm.value?.chartOptions
  }
  set chartOptions(value) {
    this.chartTypeForm.patchValue({
      chartOptions: value
    })
  }

  // Form for geomap type
  mapFormGroup = new FormGroup({
    map: new FormControl(null),
    mapUrl: new FormControl(null),
    projection: new FormControl(null),
    isTopoJSON: new FormControl<boolean>(null),
    features: new FormControl(null)
  })

  get removable() {
    return this.field.props?.['removable']
  }

  showMore = signal(false)
  showCustomCode = signal(false)

  chartType = toSignal(
    this.chartTypeForm.valueChanges.pipe(
      map((value) => omit(value, 'chartOptions')),
      distinctUntilChanged(isEqual)
    )
  )

  prompt = ''
  answering = false
//   systemPrompt = `假设你一名程序员，请根据注释需求补全代码，要求：编写一个函数用于绘制 ECharts 图形，只要编写函数体内部代码，函数只返回 ECharts options，输入参数有 data chartAnnotation chartOptions chartSettings
// data 数据类型为 {data: <实际数据对象（包含measure对应的属性）>[]} chartAnnotation 类型为 {measures: {measure: string}[]}`

  public editor$ = new BehaviorSubject(null)
  readonly editorOptions = computed(() => {
    return {
      theme: EditorThemeMap[this.#themeService.themeClass()],
      language: 'javascript',
      automaticLayout: true
    }
  })

  readonly logic = toSignal(this.chartTypeForm.get('scripts').valueChanges.pipe(startWith(this.scripts)))

  /**
  |--------------------------------------------------------------------------
  | Copilot
  |--------------------------------------------------------------------------
  */
  #chartCommands = injectChartCommand(this.logic, async ({ logic }) => {
    this.scripts = logic
    return `Chart created!`
  })

  constructor() {
    super()
    effect(
      () => {
        this.schema.chartType = this.chartType()
      },
      { allowSignalWrites: true }
    )
  }

  ngOnInit(): void {
    if (isNil(this.field.formControl.value) || isString(this.field.formControl.value)) {
      this.chartTypeForm.patchValue({ type: this.field.formControl.value })
    } else {
      this.chartTypeForm.patchValue(this.field.formControl.value)
    }

    this.chartTypeForm.valueChanges.subscribe((value) => {
      this.field.formControl.setValue(value)
    })
  }

  confirmMap(ok?: boolean) {
    if (ok) {
      this.field.formControl.setValue({
        ...this.mapFormGroup.value,
        ...this.chartTypeForm.value
      })
    } else {
      this.mapFormGroup.reset()
    }
    this.mapFormGroup.markAsPristine()
  }

  getChartType(type: string) {
    let chart = null
    this.chartTypeGroups.find((group) => {
      return group.charts.find((item) => {
        if (item.value === type) {
          chart = item
          return true
        }
        return false
      })
    })
    return chart
  }

  killMyself() {
    if (this.field.form instanceof FormArray) {
      const index = this.field.parent.fieldGroup.indexOf(this.field)
      this.formlyArray2?.remove(index)
    } else {
      const index = this.field.parent.fieldGroup.findIndex((field) => field.key === this.field.key)
      if (index > -1) {
        this.field.parent.fieldGroup.splice(index, 1)
        this.field.parent.model[this.field.key as string] = null
      }
      this.field.parent.formControl.setValue(this.field.parent.model)
    }
  }

  aiGenerate() {
    this.#dialog
      .open(CommandDialogComponent, {
        backdropClass: 'bg-transparent',
        data: {
          commands: ['chart']
        }
      })
      .afterClosed()
      .subscribe((result) => {})
  }
}
