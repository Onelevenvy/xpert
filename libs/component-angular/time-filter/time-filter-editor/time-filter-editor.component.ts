import { ChangeDetectionStrategy, Component, HostBinding, Inject, Input, OnInit } from '@angular/core'
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import {
  calcRange,
  DataSettings,
  EntityType,
  formatRangeCurrentPeriod,
  getEntityProperty,
  Property,
  TimeRange,
  TimeRangesSlicer
} from '@metad/ocap-core'
import { NxCoreService } from '@metad/core'
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, startWith } from 'rxjs'

/**
 * 时间维度的 Filter 编辑界面
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngm-time-filter-editor',
  templateUrl: './time-filter-editor.component.html',
  styleUrls: ['./time-filter-editor.component.scss']
})
export class NxTimeFilterEditorComponent implements OnInit {
  @HostBinding('class.ngm-dialog-container') isDialogContainer = true

  @Input() get entityType() {
    return this.entityType$.value
  }
  set entityType(value) {
    this.entityType$.next(value)
  }
  protected entityType$ = new BehaviorSubject<EntityType>(null)

  public formGroup = new FormGroup({
    dimension: new FormGroup({
      dimension: new FormControl<string>(null),
      hierarchy: new FormControl<string>(null)
    }),
    currentDate: new FormControl(),
    ranges: new FormArray([]),
    allowModifySelections: new FormControl<boolean>(null),
    selctionType: new FormControl()
  })

  public property$: Observable<Property> = combineLatest([
    this.entityType$,
    this.formGroup
      .get('dimension')
      .get('dimension')
      .valueChanges.pipe(startWith(this.formGroup.value.dimension?.dimension))
  ]).pipe(
    map(([entityType, dimension]) => getEntityProperty(entityType, dimension)),
    shareReplay(1)
  )

  public hierarchies$ = this.property$.pipe(
    map((property) => property?.hierarchies)
  )

  forControl = false
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      dataSettings: DataSettings
      entityType: EntityType
      slicer: TimeRangesSlicer
      forControl: boolean
    },
    private coreService: NxCoreService,
    private formBuilder: FormBuilder,
    private _dialogRef: MatDialogRef<NxTimeFilterEditorComponent>
  ) {
    this.property$.subscribe()
  }

  ngOnInit(): void {
    if (this.data) {
      this.entityType = this.data.entityType
      const current = this.coreService.execDateVariables(this.data.slicer.currentDate) as Date
      this.data.slicer.ranges.forEach((range) => {
        const currentPeriod = formatRangeCurrentPeriod(current, range)
        const result = calcRange(current, range)
        this.ranges.push(
          this.buildRangeForm({
            ...range,
            currentPeriod,
            result
          } as TimeRange)
        )
      })

      this.formGroup.patchValue(this.data.slicer)

      this.forControl = this.data.forControl
    }

    this.formGroup.valueChanges.subscribe((value) => {
      try {
        const current = this.coreService.execDateVariables(value.currentDate) as Date
        value.ranges.forEach((range, i) => {
          const currentPeriod = formatRangeCurrentPeriod(current, range)
          const result = calcRange(current, range)
          this.ranges.controls[i].patchValue(
            {
              currentPeriod,
              result
            },
            { emitEvent: false }
          )
        })
      } catch (err) {
        console.warn(err)
      }
    })
  }

  buildRangeForm(range?: TimeRange) {
    const form = this.formBuilder.group({
      type: new FormControl(),
      granularity: new FormControl(),
      current: new FormGroup({
        direction: new FormControl(),
        granularity: new FormControl(),
        amount: new FormControl()
      }),
      lookBack: new FormControl(),
      lookAhead: new FormControl(),
      currentPeriod: new FormControl({ value: null, disabled: true }),
      formatter: new FormControl(),
      result: new FormControl()
    })
    if (range) {
      form.patchValue(range)
    }
    return form
  }

  get ranges() {
    return this.formGroup.get('ranges') as FormArray
  }

  addRange(event) {
    this.ranges.push(this.buildRangeForm())
    event?.preventDefault()
  }

  onApply() {
    this._dialogRef.close({
      ...this.formGroup.value
    })
  }
}
