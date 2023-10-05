import { Component, OnInit, signal } from '@angular/core'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { JsonOutputFunctionsParser } from 'langchain/output_parsers'
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from 'langchain/prompts'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

@Component({
  standalone: true,
  selector: 'ngm-ocap-structured-output',
  templateUrl: './structured-output.component.html',
  styleUrls: ['./structured-output.component.scss']
})
export class StructuredOutputComponent implements OnInit {
  output = signal<string>('')

  async ngOnInit() {
    const zodSchema = z.object({
      foods: z
        .array(
          z.object({
            name: z.string().describe('The name of the food item'),
            healthy: z.boolean().describe('Whether the food is good for you'),
            color: z.string().optional().describe('The color of the food')
          })
        )
        .describe('An array of food items mentioned in the text')
    })

    const prompt = new ChatPromptTemplate({
      promptMessages: [
        SystemMessagePromptTemplate.fromTemplate('List all food items mentioned in the following text.'),
        HumanMessagePromptTemplate.fromTemplate('{inputText}')
      ],
      inputVariables: ['inputText']
    })

    const llm = new ChatOpenAI({
      configuration: {
        baseURL: ''
      },
      openAIApiKey: '',
      modelName: 'gpt-3.5-turbo-0613',
      temperature: 0
    })

    // Binding "function_call" below makes the model always call the specified function.
    // If you want to allow the model to call functions selectively, omit it.
    const functionCallingModel = llm.bind({
      functions: [
        {
          name: 'output_formatter',
          description: 'Should always be used to properly format output',
          parameters: zodToJsonSchema(zodSchema)
        }
      ],
      function_call: { name: 'output_formatter' }
    })

    const outputParser = new JsonOutputFunctionsParser()

    const chain = prompt.pipe(functionCallingModel).pipe(outputParser)

    const response = await chain.invoke({
      inputText: 'I like apples, bananas, oxygen, and french fries.'
    })

    this.output.set(JSON.stringify(response, null, 2))
    console.log(this.output())
  }
}
