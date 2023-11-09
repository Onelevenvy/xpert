import { CopilotChatMessageRoleEnum, getFunctionCall } from '@metad/copilot'
import { calcEntityTypePrompt } from '@metad/core'
import { DataSettings, assignDeepOmitBlank, cloneDeep, omit, omitBlank } from '@metad/ocap-core'
import { StoryCopilotChatConversation, StoryWidget, WidgetComponentType } from '@metad/story/core'
import { map, of, switchMap } from 'rxjs'
import { chartAnnotationCheck, editWidgetChart } from './schema'
import { checkDefaultEntity } from '../common'


export function chatChartWidget(copilot: StoryCopilotChatConversation, widget?: StoryWidget) {
  const { logger, copilotService, prompt, entityType } = copilot

  const systemPrompt = `You are a BI analysis expert, please edit or create the chart widget configuration based on the cube information and the question.
One dimension can only be used once. one hierarchy can't appears in more than one independent axis.
The cube is ${calcEntityTypePrompt(entityType)}.
Original widget is ${JSON.stringify(widget ?? 'empty')}`

  return copilotService
    .chatCompletions(
      [
        {
          role: CopilotChatMessageRoleEnum.System,
          content: systemPrompt
        },
        {
          role: CopilotChatMessageRoleEnum.User,
          content: prompt
        }
      ],
      {
        ...editWidgetChart,
        ...omitBlank(copilot.options)
      }
    )
    .pipe(
      map(({ choices }) => {
        try {
          copilot.response = getFunctionCall(choices[0].message)
        } catch (err) {
          copilot.error = err as Error
        }
        return copilot
      })
    )
}

export function editChartWidgetCommand(copilot: StoryCopilotChatConversation) {
  const { logger, storyService } = copilot

  const widget = storyService.currentWidget()
  const page = storyService.currentPage()

  logger?.debug(`Original chart widget is`, widget, page)

  const widgetKey = widget?.key
  const pageKey = page?.key

  return (widget ? of(copilot) : checkDefaultEntity(copilot)).pipe(
    switchMap((copilot) => chatChartWidget(copilot, widget)),
    switchMap((copilot) => {
      const { response, entityType, dataSource } = copilot
      const { arguments: anwser } = response

      logger?.debug(`Edit chart widget anwser is`, anwser)

      if (widgetKey) {
        storyService.updateWidget({
          pageKey,
          widgetKey,
          widget: {
            ...omit(anwser, 'chartAnnotation'),
            dataSettings: assignDeepOmitBlank(cloneDeep(widget.dataSettings), {
              ...(anwser.dataSettings ?? {}),
              chartAnnotation: chartAnnotationCheck(anwser.chartAnnotation, entityType),
              presentationVariant: {
                maxItems: anwser.dataSettings?.limit
              }
            }, 5) as DataSettings
          }
        })
      } else {
        storyService.createStoryWidget({
          component: WidgetComponentType.AnalyticalCard,
          title: anwser.title,
          position: anwser.position,
          dataSettings: {
            dataSource,
            entitySet: entityType.name,
            chartAnnotation: chartAnnotationCheck(anwser.chartAnnotation, entityType),
            presentationVariant: {
              maxItems: anwser.dataSettings?.limit
            }
          } as DataSettings,
          options: anwser.options
        })
      }

      return of(copilot)
    })
  )
}
