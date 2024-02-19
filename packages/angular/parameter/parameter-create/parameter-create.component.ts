import { DragDropModule } from '@angular/cdk/drag-drop'
import { CommonModule } from '@angular/common'
import { Component, Inject, Input, inject } from '@angular/core'
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatRadioModule } from '@angular/material/radio'
import { NgmInputModule } from '@metad/ocap-angular/common'
import { ControlsModule, TreeControlOptions } from '@metad/ocap-angular/controls'
import { NgmDSCoreService, OcapCoreModule } from '@metad/ocap-angular/core'
import { NgmHierarchySelectComponent } from '@metad/ocap-angular/entity'
import {
  DataSettings,
  Dimension,
  EntityType,
  FilterSelectionType,
  ParameterControlEnum,
  getEntityDimensions,
  getEntityHierarchy,
  isNil,
  uuid
} from '@metad/ocap-core'
import { TranslateModule } from '@ngx-translate/core'
import { BehaviorSubject, filter, map } from 'rxjs'

@Component({
  standalone: true,
  selector: 'ngm-parameter-create',
  templateUrl: 'parameter-create.component.html',
  styleUrls: ['parameter-create.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatIconModule,
    MatRadioModule,
    MatDialogModule,
    MatCheckboxModule,
    TranslateModule,
    OcapCoreModule,
    ControlsModule,
    NgmHierarchySelectComponent,
    NgmInputModule
  ]
})
export class NgmParameterCreateComponent {
  ParameterControlEnum = ParameterControlEnum

  readonly #dsCoreService = inject(NgmDSCoreService)

  @Input() appearance: MatFormFieldAppearance = 'fill'
  @Input() label = 'Parameter'

  @Input() dataSettings: DataSettings
  @Input() get entityType(): EntityType {
    return this.entityType$.value
  }
  set entityType(value) {
    this.entityType$.next(value)
  }
  private entityType$ = new BehaviorSubject<EntityType>(null)

  /**
   * 编辑模式, 否则为创建模式
   */
  public edit: boolean

  memberTreeOptions: TreeControlOptions = {
    selectionType: FilterSelectionType.Multiple,
    initialLevel: 1,
    searchable: true
  }

  formGroup: FormGroup = this._formBuilder.group({
    __id__: uuid(),
    name: ['', [Validators.required, this.forbiddenNameValidator()]],
    caption: null,
    dimension: null,
    hierarchy: null,
    paramType: null,
    value: null,
    dataType: null,
    members: [],
    availableMembers: this._formBuilder.array([])
  })
  get availableMembers(): FormArray {
    return this.formGroup.get('availableMembers') as FormArray
  }
  get name() {
    return this.formGroup.get('name')
  }
  get paramType() {
    return this.formGroup.get('paramType')
  }
  get dataType() {
    return this.formGroup.get('dataType') as FormControl
  }
  get value() {
    return this.formGroup.get('value') as FormControl
  }
  get dimension() {
    return this.formGroup.value.dimension
  }

  get hierarchy() {
    return this.formGroup.value.hierarchy
  }

  get slicer() {
    return this._slicer
  }
  set slicer(value) {
    this._slicer.members = value?.members ?? []
    this.setAvailableMembers(
      this._slicer.members.map((member) => ({ ...member, isDefault: member.isDefault ?? false }))
    )
  }
  private _slicer = { members: [] }

  public readonly dimensions$ = this.entityType$.pipe(map((entityType) => getEntityDimensions(entityType)))
  public readonly dimension$ = this.formGroup.valueChanges.pipe(
    filter((value) => !isNil(value.dimension)),
    map((value) => ({
      dimension: value.dimension,
      hierarchy: value.hierarchy
    }))
  )

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _dialogRef: MatDialogRef<NgmParameterCreateComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      name: string
      dataSettings: DataSettings
      entityType: EntityType
      dimension: Dimension
    }
  ) {
    if (this.data) {
      this.dataSettings = this.data.dataSettings
      this.entityType = this.data.entityType
      if (this.data.name) {
        this.edit = true
        const property = this.entityType.parameters[this.data.name]
        this.formGroup.patchValue(property)
        this.slicer = {
          ...this.slicer,
          members: [...property.availableMembers]
        }
      } else {
        this.formGroup.patchValue(this.data.dimension)
      }
    }
  }

  onApply() {
    this.#dsCoreService.updateStory({
      type: 'Parameter',
      dataSettings: this.dataSettings,
      parameter: {
        ...this.formGroup.value,
        members: this.formGroup.value.availableMembers.filter((member) => member.isDefault)
      }
    })

    this._dialogRef.close()
  }

  create(item?): FormGroup {
    return this._formBuilder.group(
      item ?? {
        value: [null, Validators.required],
        label: null,
        isDefault: null
      }
    )
  }

  setAvailableMembers(members) {
    this.availableMembers.clear() // .reset()
    members?.forEach((member) => {
      this.availableMembers.push(this.create(member))
    })
  }

  add(): void {
    this.availableMembers.push(this.create())
  }

  remove(i) {
    this.availableMembers.removeAt(i)
  }

  forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const forbidden =
        !this.edit &&
        this.entityType?.parameters &&
        !!Object.values(this.entityType.parameters).find((item) => item.name === control.value)
      return forbidden ? { forbiddenName: { value: control.value } } : null
    }
  }

  onHierarchyChange(hierarchy: string) {
    this.formGroup.patchValue({
      dimension: getEntityHierarchy(this.entityType, hierarchy)?.dimension,
      hierarchy: hierarchy
    })
  }
}
