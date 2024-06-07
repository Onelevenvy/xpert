import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  Input,
  ViewContainerRef
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { NgmValueHelpComponent } from '@metad/ocap-angular/controls'
import {
  AggregationRole,
  CompareToEnum,
  DataSettings,
  Dimension,
  DisplayBehaviour,
  EntityType,
  FilterSelectionType,
  getEntityProperty,
  isSemanticCalendar
} from '@metad/ocap-core'
import { TranslateModule } from '@ngx-translate/core'
import { distinctUntilChanged, filter, firstValueFrom, startWith } from 'rxjs'

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngm-compare-member-select',
  templateUrl: './member-select.component.html',
  styleUrls: ['./member-select.component.scss'],
  host: {
    class: 'ngm-compare-member-select'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => NgmCompareMemberSelectComponent)
    }
  ]
})
export class NgmCompareMemberSelectComponent implements ControlValueAccessor {
  AggregationRole = AggregationRole
  DISPLAY_BEHAVIOUR = DisplayBehaviour.descriptionAndId
  COMPARE_TO_ENUM = CompareToEnum

  private readonly _dialog? = inject(MatDialog, { optional: true })
  private readonly _viewContainerRef = inject(ViewContainerRef)

  @Input() appearance: MatFormFieldAppearance = 'fill'
  @Input() label: string

  readonly dataSettings = input<DataSettings>()
  readonly entityType = input<EntityType>()
  readonly dimension = input<Dimension>()

  @Input() disabled: boolean

  readonly formGroup: FormGroup = new FormGroup({
    type: new FormControl(null, Validators.required),
    value: new FormControl(null)
  })

  get type() {
    return this.formGroup.value.type
  }
  set type(value) {
    this.formGroup.patchValue({ type: value })
  }

  get value() {
    return this.formGroup.value.value
  }
  set value(value) {
    this.formGroup.patchValue({ value: value })
  }

  /**
  |--------------------------------------------------------------------------
  | Signals
  |--------------------------------------------------------------------------
  */
  readonly property = computed(() =>
    this.entityType() ? getEntityProperty(this.entityType(), this.dimension()) : null
  )

  readonly formGroupSignal = toSignal(this.formGroup.valueChanges.pipe(startWith(this.formGroup.value)))

  readonly triggerLabel = computed(() => {
    const property = this.property()
    const model = this.formGroupSignal()
    if (!property) {
      return 'No Base dimension'
    }
    if (model.type === CompareToEnum.SelectedMember) {
      return property.caption + ': ' + model.value
    } else if (model.type) {
      return property.caption + `: ${model.type}`
    }

    return property.caption
  })

  readonly isCalendar = computed(() => isSemanticCalendar(this.property()))

  /**
  |--------------------------------------------------------------------------
  | Subscriptions (effect)
  |--------------------------------------------------------------------------
  */
  private _typeChanging = this.formGroup
    .get('type')
    .valueChanges.pipe(distinctUntilChanged())
    .subscribe((type) => {
      if (type === CompareToEnum.CurrentMember) {
        this.value = null
      }
    })

  private valueChangesSub = this.formGroup.valueChanges.pipe(filter(() => this.formGroup.valid)).subscribe((value) => {
    this._onChange?.(value)
  })

  private _onChange: any

  writeValue(obj: any): void {
    if (obj) {
      this.formGroup.patchValue(obj)
    }
  }
  registerOnChange(fn: any): void {
    this._onChange = fn
  }
  registerOnTouched(fn: any): void {}
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  async selectByMember(event) {
    event.stopPropagation()
    const slicer = await firstValueFrom(
      this._dialog
        .open(NgmValueHelpComponent, {
          viewContainerRef: this._viewContainerRef,
          data: {
            dimension: this.dimension(),
            slicer: {
              members: this.type === CompareToEnum.SelectedMember && this.value ? [{ value: this.value }] : []
            },
            dataSettings: this.dataSettings(),
            options: {
              selectionType: FilterSelectionType.Single,
              searchable: true,
              initialLevel: 1
            }
          }
        })
        .afterClosed()
    )

    if (slicer) {
      this.formGroup.patchValue({
        type: CompareToEnum.SelectedMember,
        value: slicer.members?.[0]?.value
      })
    }
  }
}
