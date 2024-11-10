import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, model, output, signal } from '@angular/core'
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { EntriesPipe, routeAnimations } from '@metad/core'
import { pick } from '@metad/ocap-core'
import { TranslateModule } from '@ngx-translate/core'
import {
  ApiProviderAuthType,
  ApiToolBundle,
  getErrorMessage,
  IXpert,
  IXpertTool,
  IXpertToolset,
  TagCategoryEnum,
  ToastrService,
  TXpertToolEntity,
  XpertToolsetCategoryEnum,
  XpertToolsetService
} from 'apps/cloud/src/app/@core'
import { TagSelectComponent } from 'apps/cloud/src/app/@shared'
import { EmojiAvatarComponent } from 'apps/cloud/src/app/@shared/avatar'
import { CdkMenuModule } from '@angular/cdk/menu'
import { NgmSpinComponent } from '@metad/ocap-angular/common'
import { Samples } from '../types'
import { outputFromObservable } from '@angular/core/rxjs-interop'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { NgmDensityDirective } from '@metad/ocap-angular/core'
import { XpertToolAuthorizationInputComponent } from '../../authorization'
import { XpertToolTestDialogComponent } from '../../tool-test'
import { XpertConfigureToolComponent } from '../../api-tool/types'


@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CdkMenuModule,
    TranslateModule,
    MatSlideToggleModule,

    EntriesPipe,
    EmojiAvatarComponent,
    TagSelectComponent,
    NgmSpinComponent,
    NgmDensityDirective,

    XpertToolAuthorizationInputComponent
  ],
  selector: 'xpert-tool-odata-configure',
  templateUrl: './configure.component.html',
  styleUrl: 'configure.component.scss',
  animations: [routeAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: XpertConfigureToolComponent,
      useExisting: XpertStudioConfigureODataComponent
    }
  ]
})
export class XpertStudioConfigureODataComponent extends XpertConfigureToolComponent {
  eTagCategoryEnum = TagCategoryEnum
  eSamples = Samples

  readonly toolsetService = inject(XpertToolsetService)
  readonly #toastr = inject(ToastrService)
  readonly #formBuilder = inject(FormBuilder)
  readonly #dialog = inject(MatDialog)
  readonly #cdr = inject(ChangeDetectorRef)
  readonly #fb = inject(FormBuilder)

  readonly toolset = input<IXpertToolset>(null)
  readonly loading = signal(false)

  readonly formGroup = new FormGroup({
    id: this.#formBuilder.control(null),
    name: new FormControl(null, [Validators.required]),
    avatar: new FormControl(null),
    description: new FormControl(null),
    schema: new FormControl<string>(null, [Validators.required]),
    type: this.#formBuilder.control('odata'),
    category: this.#formBuilder.control(XpertToolsetCategoryEnum.API),
    tools: new FormArray([]),
    credentials: this.#formBuilder.control({
      auth_type: ApiProviderAuthType.NONE
    }),
    tags: this.#formBuilder.control(null),
    privacyPolicy: this.#formBuilder.control(null),
    customDisclaimer: this.#formBuilder.control(null),

    options: this.#formBuilder.group({
      baseUrl: this.#fb.control('')
    })
  })

  readonly valueChange = outputFromObservable(this.formGroup.valueChanges)

  isValid() {
    return this.formGroup.valid
  }
  isDirty() {
    return this.formGroup.dirty
  }

  get name() {
    return this.formGroup.get('name')
  }
  get avatar() {
    return this.formGroup.get('avatar').value
  }
  set avatar(avatar) {
    this.formGroup.patchValue({ avatar })
  }
  get schema() {
    return this.formGroup.get('schema')
  }
  get credentials() {
    return this.formGroup.get('credentials') as FormControl
  }
  get tools() {
    return this.formGroup.get('tools') as FormArray
  }
  get value() {
    return { ...this.formGroup.value }
  }
  get tags() {
    return this.formGroup.get('tags') as FormControl
  }
  get options() {
    return this.formGroup.get('options') as FormGroup
  }
  get baseUrl() {
    return this.options.get('baseUrl') as FormControl
  }

  readonly url = model('')

  // readonly schemas = toSignal(
  //   this.schema.valueChanges.pipe(
  //     filter(() => !this.toolset()),
  //     distinctUntilChanged(),
  //     switchMap((schema) => (!schema?.trim() ? of(null) : this.toolsetService.parserODataSchema(schema)))
  //   )
  // )

  constructor() {
    super()

    effect(() => {
      this.loading() ? this.formGroup.disable() : this.formGroup.enable()
    },
    { allowSignalWrites: true })

    effect(
      () => {
        if (this.toolset() && !this.formGroup.value.id) {
          this.formGroup.patchValue({
            ...pick(
              this.toolset(),
              'id',
              'name',
              'avatar',
              'description',
              'options',
              'schema',
              'type',
              'category',
              'tags',
              'privacyPolicy',
              'customDisclaimer'
            ),
            credentials: this.toolset().credentials ?? {},
            tools: []
          } as any)
          this.#cdr.detectChanges()
        }
      },
      { allowSignalWrites: true }
    )
  }

  addTool(toolSchema: TXpertToolEntity) {
    this.tools.push(
      this.#formBuilder.group({
        enabled: this.#formBuilder.control(false),
        // options: this.#formBuilder.control({ api_bundle: apiBundle }),
        name: this.#formBuilder.control(toolSchema.name),
        description: this.#formBuilder.control(toolSchema.description),
        schema: this.#formBuilder.control(toolSchema)
      })
    )
  }

  triggerSample(name: keyof typeof Samples) {
    this.baseUrl.setValue(Samples[name].url)
    this.getMetadata()
  }

  // Get Metadata
  getMetadata() {
    this.loading.set(true)
    this.toolsetService.getODataRemoteMetadata(this.url(), this.credentials.value).subscribe({
      next: (result) => {
        console.log(result)
        this.loading.set(false)
        // Handle the success scenario here
        this.formGroup.patchValue({
          schema: result.schema,
        })
        result.tools.forEach((tool) => this.addTool(tool))
      },
      error: (err) => {
        this.#toastr.error(getErrorMessage(err))
        this.loading.set(false)
        // Handle the error scenario here
      }
    })
  }

  openToolTest(tool: Partial<IXpertTool>) {
    this.#dialog.open(XpertToolTestDialogComponent, {
      panelClass: 'medium',
      data: {
        tool: {
          ...tool,
          toolset: this.formGroup.value
        }
      }
    }).afterClosed().subscribe({
      next: (result) => {

      }
    })
  }
}
