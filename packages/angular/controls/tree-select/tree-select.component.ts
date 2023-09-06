import { CommonModule } from '@angular/common'
import {
  Component,
  computed,
  effect,
  EventEmitter,
  forwardRef,
  HostBinding,
  inject,
  Input,
  Output,
  signal,
  SimpleChanges,
  ViewContainerRef
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatRadioModule } from '@angular/material/radio'
import { NgmCommonModule } from '@metad/ocap-angular/common'
import { NgmAppearance, OcapCoreModule } from '@metad/ocap-angular/core'
import { NgmEntityPropertyComponent } from '@metad/ocap-angular/entity'
import {
  DataSettings,
  Dimension,
  DisplayBehaviour,
  FilterSelectionType,
  FlatTreeNode,
  getEntityProperty,
  ISlicer,
  TreeNodeInterface
} from '@metad/ocap-core'
import { firstValueFrom } from 'rxjs'
import { NgmSmartFilterService } from '../smart-filter.service'
import { TreeControlOptions } from '../types'
import { NgmValueHelpComponent } from '../value-help/value-help.component'

export interface MemberTreeSelectOptions extends TreeControlOptions {
  maxTagCount?: number
  virtualScroll?: boolean
  autocomplete?: boolean
  panelWidth?: string | number

  autoSelectActive?: boolean
}

@Component({
  standalone: true,
  selector: 'ngm-member-tree-select',
  templateUrl: 'tree-select.component.html',
  styleUrls: ['tree-select.component.scss'],
  providers: [
    NgmSmartFilterService,
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => NgmMemberTreeSelectComponent)
    }
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatIconModule,
    MatRadioModule,
    MatButtonModule,

    NgmCommonModule,
    OcapCoreModule,
    NgmEntityPropertyComponent
  ]
})
export class NgmMemberTreeSelectComponent implements ControlValueAccessor {
  @HostBinding('class.ngm-member-tree-select') _isMemberTreeSelectComponent = true
  DisplayBehaviour = DisplayBehaviour

  private smartFilterService = inject(NgmSmartFilterService)
  private _dialog = inject(MatDialog)
  private _viewContainerRef = inject(ViewContainerRef)

  @Input() data: TreeNodeInterface<any>[]

  @Input() get dataSettings(): DataSettings {
    return this.dataSettings$()
  }
  set dataSettings(value) {
    this.dataSettings$.set(value)
  }
  private dataSettings$ = signal<DataSettings>(null)

  @Input() get dimension(): Dimension {
    return this.dimensionSignal()
  }
  set dimension(value) {
    this.dimensionSignal.set(value)
  }
  private dimensionSignal = signal<Dimension>(null)

  @Input() appearance: NgmAppearance

  @Input() get options(): MemberTreeSelectOptions {
    return this.options$()
  }
  set options(value) {
    this.options$.set(value)
  }
  private options$ = signal<MemberTreeSelectOptions>({} as MemberTreeSelectOptions)

  @Input() disabled: boolean

  @Output() loadingChanging = new EventEmitter<boolean>()

  get displayBehaviour() {
    return this.dimension?.displayBehaviour ?? DisplayBehaviour.descriptionOnly
  }
  get hierarchy() {
    return this.dimension?.hierarchy ?? this.dimension?.dimension
  }
  set hierarchy(value) {
    this.dimension = {
      ...this.dimension,
      hierarchy: value,
      level: null
    }
  }

  private slicer = signal<ISlicer>(null)
  public readonly memberKeys = computed(() => (this.slicer()?.members ?? []).map((member) => member.value))
  private readonly members = toSignal(this.smartFilterService.selectOptions$)

  private readonly entityType = toSignal(this.smartFilterService.selectEntityType())
  private readonly property = computed(() => getEntityProperty(this.entityType(), this.dimensionSignal()))
  public readonly label = computed(
    () => this.options$().label || this.property()?.caption || this.property()?.name
  )
  public readonly hierarchies = computed(() => this.property()?.hierarchies)

  readonly treeData$ = this.smartFilterService.membersTree$
  public readonly loading$ = this.smartFilterService.loading$

  onChange: (input: any) => void

  // Subscribers
  private _refreshSub = this.smartFilterService.onAfterServiceInit().subscribe(() => {
    this.smartFilterService.refresh()
  })
  private _loadingSub = this.smartFilterService.loading$.subscribe((loading) => {
    this.loadingChanging.emit(loading)
  })

  constructor() {
    effect(() => {
      if (this.slicer() !== null) {
        this.onChange?.(this.slicer())
      }
    })
    // 在 effect 里设置 dataSettings 会触发后续的 allowSignalWrites 问题
    // effect(() => {
    //   if (this.dataSettings) {
    //     this.smartFilterService.dataSettings = this.dataSettings
    //   }
    // })

    effect(() => {
      if (this.options.defaultMembers?.length && !this.slicer()) {
        this.slicer.set({
          ...(this.slicer() ?? {}),
          dimension: this.dimension,
          members: this.options.defaultMembers
        })
      }
    }, {allowSignalWrites: true})

    effect(() => {
      if (this.dimension) {
        this.smartFilterService.options = {
          ...this.options,
          dimension: this.dimension
        }
      }
    })
  }

  ngOnChanges({ dataSettings, dimension, options }: SimpleChanges): void {
    if (dataSettings?.currentValue) {
      this.smartFilterService.dataSettings = dataSettings.currentValue
    }
  }

  writeValue(obj: any): void {
    if (obj) {
      this.slicer.set(obj)
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn
  }
  registerOnTouched(fn: any): void {
    //
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  displayFn(item: FlatTreeNode<any>): string {
    return typeof item === 'string' ? item : item?.label || item?.key
  }

  trackByName(index, item) {
    return item?.name
  }

  onModelChange(event) {
    this.slicer.set({
      ...(this.slicer() ?? {}),
      dimension: this.dimension,
      members: Array.isArray(event)
        ? event.map((key) => ({
            value: key,
            caption: this.members()?.find((item) => item.value === key)?.caption
          }))
        : event
        ? [{ value: event, caption: this.members()?.find((item) => item.value === event)?.caption }]
        : null
    })
  }

  async openValueHelp(event) {
    const slicer = await firstValueFrom(
      this._dialog
        .open(NgmValueHelpComponent, {
          viewContainerRef: this._viewContainerRef,
          data: {
            dataSettings: this.dataSettings,
            dimension: this.dimension,
            options: {
              ...(this.options ?? {}),
              selectionType:
                this.options?.selectionType ?? (this.options?.multiple ? FilterSelectionType.Multiple : null),
              searchable: true,
              initialLevel: 1
            },
            slicer: this.slicer()
          }
        })
        .afterClosed()
    )

    if (slicer) {
      this.dimension = {
        ...this.dimension,
        hierarchy: slicer.dimension.hierarchy,
        displayBehaviour: slicer.dimension.displayBehaviour
      }
      if (slicer.members.length > 1) {
        this.options.multiple = true
      }
      this.slicer.set({
        ...(this.slicer() ?? {}),
        dimension: this.dimension,
        members: slicer.members ?? [],
        exclude: slicer.exclude
      })
    }
  }
}
