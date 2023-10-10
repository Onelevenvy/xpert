import { Component, HostBinding, Inject, Input, Optional, computed, inject } from '@angular/core'
import { FormBuilder, FormControl, FormGroup } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { NgmDSCoreService } from '@metad/ocap-angular/core'
import {
  AdvancedSlicerOperator,
  DataSettings,
  DisplayBehaviour,
  EntityType,
  nonNullable
} from '@metad/ocap-core'
import { PropertyCapacity } from '@metad/components/property'
import { NxCoreService } from '@metad/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { filter, map, startWith, switchMap } from 'rxjs/operators'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { TranslateService } from '@ngx-translate/core'

const ADVANCED_SLICER_OPERATORS = [
  {
    value: AdvancedSlicerOperator.Equal,
    label: 'Equal'
  },
  {
    value: AdvancedSlicerOperator.NotEqual,
    label: 'Not Equal'
  },
  {
    value: AdvancedSlicerOperator.LessThan,
    label: 'Less Than'
  },
  {
    value: AdvancedSlicerOperator.GreaterThan,
    label: 'Greater Than'
  },
  {
    value: AdvancedSlicerOperator.LessEqual,
    label: 'Less Equal'
  },
  {
    value: AdvancedSlicerOperator.GreaterEqual,
    label: 'Greater Equal'
  },
  {
    value: AdvancedSlicerOperator.Between,
    label: 'Between',
    valueSize: 2
  },
  {
    value: AdvancedSlicerOperator.NotBetween,
    label: 'NotBetween',
    valueSize: 2
  },
  {
    value: AdvancedSlicerOperator.TopCount,
    label: 'Top Count',
    hasOther: true
  },
  {
    value: AdvancedSlicerOperator.BottomCount,
    label: 'Bottom Count',
    hasOther: true
  },
  {
    value: AdvancedSlicerOperator.TopPercent,
    label: 'Top Percent',
    hasOther: true
  },
  {
    value: AdvancedSlicerOperator.BottomPercent,
    label: 'Bottom Percent',
    hasOther: true
  },
  {
    value: AdvancedSlicerOperator.TopSum,
    label: 'Top Sum',
    hasOther: true
  },
  {
    value: AdvancedSlicerOperator.BottomSum,
    label: 'Bottom Sum',
    hasOther: true
  }
]

@Component({
  selector: 'ngm-advanced-slicer',
  templateUrl: './advanced-slicer.component.html',
  styleUrls: ['./advanced-slicer.component.scss']
})
export class AdvancedSlicerComponent {
  @HostBinding('class.ngm-dialog-container') isDialogContainer = true
  DisplayBehaviour = DisplayBehaviour
  PropertyCapacity = PropertyCapacity

  public readonly coreService = inject(NxCoreService)
  public readonly dsCoreService = inject(NgmDSCoreService)
  private readonly translateService = inject(TranslateService)
  private readonly _formBuilder = inject(FormBuilder)
  private readonly dialogRef?  = inject<MatDialogRef<AdvancedSlicerComponent>>(MatDialogRef)

  @Input() get dataSettings(): DataSettings {
    return this.dataSettings$.value
  }
  set dataSettings(value: DataSettings) {
    this.dataSettings$.next(value)
  }
  private dataSettings$ = new BehaviorSubject<DataSettings>(null)

  formGroup = new FormGroup({
    context: new FormControl(),
    path: new FormControl(),
    operator: new FormControl(),
    value: this._formBuilder.array([null, null]),
    measure: new FormControl(),
    other: new FormControl()
  })

  public readonly entityType$: Observable<EntityType> = this.dataSettings$.pipe(
    filter(nonNullable),
    switchMap(({ dataSource, entitySet }) => this.dsCoreService.selectEntitySet(dataSource, entitySet)),
    map(({ entityType }) => entityType)
  )

  public readonly operator = toSignal(this.formGroup.valueChanges.pipe(
    startWith(this.formGroup.value),
    map(({ operator }) => {
      operator = operator || this.formGroup.value.operator
      return ADVANCED_SLICER_OPERATORS.find((item) => item.value === operator)
    }),
  ))
  public readonly to = computed(() => this.operator()?.valueSize === 2)
  public readonly hasOther = computed(() => this.operator()?.hasOther)

  public readonly advancedSlicerOperators = toSignal(
    this.translateService.stream('COMPONENTS.SELECTION.ADVANCED_SLICER').pipe(
      map((i18n) => ADVANCED_SLICER_OPERATORS.map((item) => ({
        ...item,
        label: i18n[item.value] ?? item.label
      })))
    )
  )

  private _operatorChanged = this.formGroup.get('operator').valueChanges.pipe(takeUntilDestroyed())
    .subscribe((operator) => {
      if (ADVANCED_SLICER_OPERATORS.find((item) => item.value === operator)?.valueSize !== 2) {
        this.formGroup.patchValue({
          value: [this.formGroup.value.value[0], null]
        })
      }
    })

  constructor(
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public data,
  ) {
    this.dataSettings = this.data?.dataSettings

    if (this.data?.model) {
      this.formGroup.patchValue(this.data.model)
    }
    if (this.data?.coreService) {
      this.coreService = this.data?.coreService
    }
  }

  onApply() {
    this.dialogRef.close(this.formGroup.value)
  }
}
