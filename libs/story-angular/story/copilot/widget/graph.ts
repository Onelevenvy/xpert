import { computed, inject, signal } from '@angular/core'
import { SystemMessage } from '@langchain/core/messages'
import { SystemMessagePromptTemplate } from '@langchain/core/prompts'
import { CreateGraphOptions, createReactAgent } from '@metad/copilot'
import { injectDimensionMemberTool, makeCubeRulesPrompt } from '@metad/core'
import { NxStoryService } from '@metad/story/core'
import { NGXLogger } from 'ngx-logger'
import { derivedAsync } from 'ngxtension/derived-async'
import { of } from 'rxjs'
import { injectCreateChartTool, injectCreateTableTool } from './tools'
import { widgetAgentState } from './types'

export function injectCreateWidgetAgent() {
  const logger = inject(NGXLogger)
  const storyService = inject(NxStoryService)

  const memberRetrieverTool = injectDimensionMemberTool()

  const defaultModel = signal<string>(null)
  const defaultDataSource = signal<string>(null)
  const defaultEntity = signal<string>(null)
  const defaultDataSettings = computed(() => {
    const entitySet = defaultEntity()
    const dataSource = defaultDataSource()
    return dataSource && entitySet
      ? {
          dataSource,
          entitySet
        }
      : null
  })
  const defaultCube = derivedAsync(() => {
    const dataSettings = defaultDataSettings()
    return dataSettings ? storyService.selectEntityType(dataSettings) : of(null)
  })

  const createTableTool = injectCreateTableTool(defaultDataSettings, defaultCube)
  const createChartTool = injectCreateChartTool(defaultDataSettings, defaultCube)

  return async ({ llm }: CreateGraphOptions) => {
    return createReactAgent({
      state: widgetAgentState,
      llm,
      tools: [memberRetrieverTool, createTableTool, createChartTool],
      messageModifier: async (state) => {
        const systemTemplate = `You are a BI analysis expert. Please use MDX technology to edit or create chart widget configurations based on Cube information.
{{role}}
You must first call the 'dimensionMemberKeySearch' tool to obtain documentation related to dimension member keys (unique member name).
A dimension can only be used once, and a hierarchy cannot appear on multiple independent axes.

${makeCubeRulesPrompt()}

for examples

qustion: 'sales amout by customer country filter by product bikes'
think: call 'dimensionMemberKeySearch' tool with query param 'product bikes' to get member key of 'product bikes'

The cube context:
{{context}}
`
        const system = await SystemMessagePromptTemplate.fromTemplate(systemTemplate, {
          templateFormat: 'mustache'
        }).format(state)
        return [new SystemMessage(system), ...state.messages]
      }
    })
  }
}
