import { ICopilotProviderModel } from '@metad/contracts'
import { TenantOrganizationAwareCrudService } from '@metad/server-core'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AIModelGetProviderQuery, ModelProvider } from '../../ai-model'
import { CopilotProviderModel } from './copilot-provider-model.entity'
import { CopilotProviderService } from '../copilot-provider.service'

@Injectable()
export class CopilotProviderModelService extends TenantOrganizationAwareCrudService<CopilotProviderModel> {
	constructor(
		@InjectRepository(CopilotProviderModel)
		repository: Repository<CopilotProviderModel>,
		private readonly providerService: CopilotProviderService,
		private readonly queryBus: QueryBus
	) {
		super(repository)
	}

	async upsertModel(entity: Partial<ICopilotProviderModel>) {
		const modelProperties = entity.modelProperties
		const providerId = entity.providerId
		// Must provider Credentials when Create
		if (!entity.id && !modelProperties) {
			throw new HttpException(`Must provider model properties when create`, HttpStatus.FORBIDDEN)
		}

		const copilotProvider = await this.providerService.findOne(providerId)

		if (modelProperties) {
			const providerInstance = await this.queryBus.execute<AIModelGetProviderQuery, ModelProvider>(
				new AIModelGetProviderQuery(copilotProvider.providerName)
			)
			const modelManager = providerInstance.getModelManager(entity.modelType)
			await modelManager.validateCredentials(entity.modelName, entity.modelProperties)
		}

		if (entity.id) {
			await this.update(entity.id, entity)
			return await this.findOne(entity.id)
		}
		return await this.create(entity)
	}
}
