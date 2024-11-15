import { AIMessage, MessageContent, MessageContentComplex } from '@langchain/core/messages'
import { ChatGenerationChunk } from '@langchain/core/outputs'
import { nanoid as _nanoid } from 'nanoid'
import { ZodType, ZodTypeDef } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { CopilotChatMessage } from './types'

export function zodToAnnotations(obj: ZodType<any, ZodTypeDef, any>) {
  return (<{ properties: any }>zodToJsonSchema(obj)).properties
}

export function nanoid() {
  return _nanoid()
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value != null
}

export function isNil(value: unknown): value is null | undefined {
  return value == null
}

export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String
}

export function isBlank(value: unknown) {
  return isNil(value) || (isString(value) && !value.trim())
}

export function nonBlank<T>(value: T): value is NonNullable<T> {
  return !isBlank(value)
}

/**
 * Split the prompt into command and prompt
 *
 * @param prompt
 * @returns
 */
export function getCommandPrompt(prompt: string) {
  prompt = prompt.trim()
  // a regex match `/command prompt`
  const match = prompt.match(/^\/([a-zA-Z\-]*)\s*/i)
  const command = match?.[1]

  return {
    command,
    prompt: command ? prompt.replace(`/${command}`, '').trim() : prompt
  }
}

export function referencesCommandName(commandName: string) {
  return `${commandName}/references`
}

export const AgentRecursionLimit = 20

export function sumTokenUsage(output) {
  let tokenUsed = 0
  output.generations?.forEach((generation) => {
    generation.forEach((item) => {
      tokenUsed += (<AIMessage>(<ChatGenerationChunk>item).message).usage_metadata.total_tokens
    })
  })
  return tokenUsed
}

// stringify MessageContent
export function stringifyMessageContent(content: MessageContent | MessageContentComplex) {
  if (typeof content === 'string') {
    return content
  } else if (Array.isArray(content)) {
    return content.map(stringifyMessageContent).join('\n\n')
  } else if (content) {
    if (content.type === 'text') {
      return content.text
    } else if (content.type === 'component') {
      return JSON.stringify(content['data'])
    } else {
      return JSON.stringify(content)
    }
  }
  return ''
}


export function appendMessageContent(aiMessage: CopilotChatMessage, content: MessageContent) {
	const _content = aiMessage.content
	if (typeof content === 'string') {
		if (typeof _content === 'string') {
			aiMessage.content = _content + content
		} else if (Array.isArray(_content)) {
			const lastContent = _content[_content.length - 1]
			if (lastContent.type === 'text') {
				lastContent.text = lastContent.text + content
			} else {
				_content.push({
					type: 'text',
					text: content
				})
			}
		} else {
			aiMessage.content = content
		}
	} else {
		if (Array.isArray(_content)) {
			_content.push(content)
		} else if(_content) {
			aiMessage.content = [
				{
					type: 'text',
					text: _content
				},
				content
			]
		} else {
			aiMessage.content = [
				content
			]
		}
	}
}