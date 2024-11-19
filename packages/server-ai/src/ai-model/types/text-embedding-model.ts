import { Embeddings } from '@langchain/core/embeddings'
import { ICopilotModel } from '@metad/contracts'
import { AIModel } from '../ai-model'
import { TChatModelOptions } from './types'

export abstract class TextEmbeddingModelManager extends AIModel {
	abstract getEmbeddingInstance(copilotModel: ICopilotModel, options?: TChatModelOptions): Embeddings
}
