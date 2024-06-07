import { DragDropModule } from '@angular/cdk/drag-drop'
import { CommonModule } from '@angular/common'
import { Component, effect, forwardRef, inject, input, Input, model, ViewContainerRef } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldAppearance } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatRadioModule } from '@angular/material/radio'
import { NgmDisplayBehaviourComponent, NgmInputComponent } from '@metad/ocap-angular/common'
import { DisplayDensity, ISelectOption, OcapCoreModule } from '@metad/ocap-angular/core'
import {
  DataSettings,
  EntityType,
  nonNullable,
  ParameterControlEnum,
  parameterFormatter,
  ParameterProperty
} from '@metad/ocap-core'
import { TranslateModule } from '@ngx-translate/core'
import { firstValueFrom, map } from 'rxjs'
import { NgmParameterCreateComponent } from '../parameter-create/parameter-create.component'

@Component({
  standalone: true,
  selector: 'ngm-parameter-select',
  templateUrl: 'parameter-select.component.html',
  styleUrls: ['parameter-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => NgmParameterSelectComponent)
    }
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatRadioModule,
    MatDividerModule,
    MatAutocompleteModule,
    TranslateModule,

    OcapCoreModule,
    NgmDisplayBehaviourComponent,
    NgmInputComponent
  ]
})
export class NgmParameterSelectComponent implements ControlValueAccessor {
  ParameterControlEnum = ParameterControlEnum

  private readonly _dialog = inject(MatDialog)
  readonly #viewContainerRef = inject(ViewContainerRef)

  @Input() appearance: MatFormFieldAppearance = 'fill'
  @Input() label = 'Parameter'
  @Input() placeholder = '@'

  readonly dataSettings = input<DataSettings>()
  readonly entityType = input<EntityType>()

  @Input() disabled: boolean
  @Input() displayDensity: DisplayDensity | string

  // formControl = new FormControl()

  readonly parameters$ = toObservable(this.entityType).pipe(
    map<EntityType, ISelectOption<ParameterProperty>[]>((entityType) => {
      return Object.keys(entityType?.parameters ?? {}).map((key) => ({
        key: parameterFormatter(key),
        caption: entityType.parameters[key].caption || key,
        value: entityType.parameters[key]
      }))
    })
  )

  // public selectOptions$ = combineLatest([this.parameters$, this.formControl.valueChanges.pipe(startWith(null))]).pipe(
  //   map(([parameters, value]) => filterSearch(parameters, value))
  // )

  // get value() {
  //   return this.formControl.value
  // }
  // set value(value) {
  //   this.formControl.setValue(value)
  //   this.onChange?.(value)
  // }

  readonly model = model<string | number | null>(null)

  private onChange: any
  private onTouched: any

  constructor() {
    effect(
      () => {
        if (nonNullable(this.model())) {
          this.onChange?.(this.model())
        }
      },
      { allowSignalWrites: true }
    )
  }

  writeValue(obj: any): void {
    // this.formControl.setValue(obj)
    if (obj) {
      this.model.set(obj)
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  onOptionSelected(event) {
    //
  }

  async openCreate() {
    await firstValueFrom(
      this._dialog
        .open(NgmParameterCreateComponent, {
          viewContainerRef: this.#viewContainerRef,
          data: {
            dataSettings: this.dataSettings(),
            entityType: this.entityType()
          }
        })
        .afterClosed()
    )
  }

  openEditParameter(key: string) {
    this._dialog
      .open(NgmParameterCreateComponent, {
        viewContainerRef: this.#viewContainerRef,
        data: {
          dataSettings: this.dataSettings(),
          entityType: this.entityType(),
          name: key
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          console.log(result)
        }
      })
  }
}
