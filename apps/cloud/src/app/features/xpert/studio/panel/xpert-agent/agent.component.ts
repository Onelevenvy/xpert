import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChild
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { FFlowModule } from '@foblex/flow'
import { TranslateModule } from '@ngx-translate/core'
import {
  ICopilotModel,
  IfAnimation,
  injectHelpWebsite,
  IXpertAgent,
  IXpertAgentExecution,
  ModelType,
  OrderTypeEnum,
  TAvatar,
  TXpertParameter,
  XpertAgentExecutionService,
  XpertService
} from 'apps/cloud/src/app/@core'
import { CopilotModelSelectComponent, CopilotPromptEditorComponent, MaterialModule, XpertParametersEditComponent } from 'apps/cloud/src/app/@shared'
import { AppService } from 'apps/cloud/src/app/app.service'
import { XpertStudioApiService } from '../../domain'
import { XpertStudioPanelAgentExecutionComponent } from '../agent-execution/execution.component'
import { XpertStudioPanelComponent } from '../panel.component'
import { XpertStudioPanelToolsetSectionComponent } from './toolset-section/toolset.component'
import { derivedAsync } from 'ngxtension/derived-async'
import { map } from 'rxjs'
import { CdkMenuModule } from '@angular/cdk/menu'
import { EmojiAvatarComponent } from 'apps/cloud/src/app/@shared/avatar'
import { XpertStudioPanelKnowledgeSectionComponent } from './knowledge-section/knowledge.component'

@Component({
  selector: 'xpert-studio-panel-agent',
  templateUrl: './agent.component.html',
  styleUrls: ['./agent.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CdkMenuModule,
    FFlowModule,
    MaterialModule,
    FormsModule,
    TranslateModule,

    EmojiAvatarComponent,
    XpertStudioPanelToolsetSectionComponent,
    CopilotModelSelectComponent,
    XpertStudioPanelAgentExecutionComponent,
    XpertParametersEditComponent,
    CopilotPromptEditorComponent,
    XpertStudioPanelKnowledgeSectionComponent
  ],
  host: {
    tabindex: '-1',
  },
  animations: [IfAnimation]
})
export class XpertStudioPanelAgentComponent {
  eModelType = ModelType

  readonly regex = `{{(.*?)}}`
  readonly elementRef = inject(ElementRef)
  readonly appService = inject(AppService)
  readonly apiService = inject(XpertStudioApiService)
  readonly xpertService = inject(XpertService)
  readonly executionService = inject(XpertAgentExecutionService)
  readonly panelComponent = inject(XpertStudioPanelComponent)
  readonly helpWebsite = injectHelpWebsite()

  readonly key = input<string>()
  readonly nodes = computed(() => this.apiService.viewModel()?.nodes)
  readonly node = computed(() => this.nodes()?.find((_) => _.key === this.key()))
  readonly xpertAgent = computed(() => this.node()?.entity as IXpertAgent)
  readonly promptInputElement = viewChild('editablePrompt', { read: ElementRef<HTMLDivElement> })

  readonly xpert = computed(() => this.apiService.viewModel()?.team)
  readonly xpertId = computed(() => this.xpert()?.id)
  readonly xpertCopilotModel = computed(() => this.xpert()?.copilotModel)
  readonly toolsets = computed(() => this.xpertAgent()?.toolsets)
  readonly name = computed(() => this.xpertAgent()?.name)
  readonly title = computed(() => this.xpertAgent()?.title)
  readonly prompt = model<string>()
  readonly promptLength = computed(() => this.prompt()?.length)

  readonly parameters = computed(() => this.xpertAgent()?.parameters)


  readonly nameError = computed(() => {
    const name = this.name()
    return name ? this.nodes()
      .filter((_) => _.key !== this.key())
      .some((n) => n.entity.name === name) : false
  })

  readonly copilotModel = model<ICopilotModel>()

  readonly openedExecution = signal(false)
  readonly executionId = model<string>(null)
  // readonly execution = model<IXpertAgentExecution>(null)

  readonly executions = derivedAsync(() => {
    const xpertId = this.xpertId()
    const agentKey = this.key()
    return this.executionService.findAllByXpertAgent(xpertId, agentKey, {
      order: {
        updatedAt: OrderTypeEnum.DESC
      }
    }).pipe(
      map(({items}) => items)
    )
  })

  constructor() {
    effect(
      () => {
        if (this.xpertAgent()) {
          this.prompt.set(this.xpertAgent().prompt)
          this.copilotModel.set(this.xpertAgent().copilotModel)
        }
      },
      { allowSignalWrites: true }
    )

    effect(() => {
      console.log(`copilotModel:`, this.copilotModel())
    })
  }

  onNameChange(event: string) {
    this.apiService.updateXpertAgent(this.key(), { name: event }, { emitEvent: false })
  }
  onTitleChange(event: string) {
    this.apiService.updateXpertAgent(
      this.key(),
      {
        title: event
      },
      { emitEvent: false }
    )
  }
  onDescChange(event: string) {
    this.apiService.updateXpertAgent(this.key(), { description: event }, { emitEvent: false })
  }
  onBlur() {
    this.apiService.reload()
  }
  onPromptChange(event: string) {
    this.apiService.updateXpertAgent(this.key(), { prompt: event })
  }

  updateCopilotModel(model: ICopilotModel) {
    this.apiService.updateXpertAgent(this.key(), { copilotModel: model })
  }

  updateAvatar(avatar: TAvatar) {
    this.apiService.updateXpertAgent(this.key(), { avatar })
  }

  openExecution(execution?: IXpertAgentExecution) {
    this.executionId.set(execution?.id)
    this.openedExecution.set(true)
  }
  closeExecution() {
    this.openedExecution.set(false)
  }

  closePanel() {
    this.panelComponent.close()
  }

  onParameters(event: TXpertParameter[]) {
    this.apiService.updateXpertAgent(this.key(), { parameters: event })
  }
}
