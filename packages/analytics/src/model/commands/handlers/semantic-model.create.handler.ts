import { ISemanticModel } from '@metad/contracts'
import { omit, pick } from '@metad/server-common'
import { RequestContext } from '@metad/server-core'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SemanticModelService } from '../../model.service'
import { SemanticModelCreateCommand } from '../semantic-model.create.command'

@CommandHandler(SemanticModelCreateCommand)
export class SemanticModelCreateHandler implements ICommandHandler<SemanticModelCreateCommand> {
	constructor(private readonly modelService: SemanticModelService) {}

	public async execute(command: SemanticModelCreateCommand): Promise<ISemanticModel> {
		const { input } = command

		const model = await this.modelService.create(omit(input, ['roles', 'queries']))

		if (model) {
			const userId = RequestContext.currentUserId()

			const request = {
				...model,
				roles: input.roles?.map((role) => ({
					...role,
					...pick(model, ['tenantId', 'organizationId']),
					modelId: model.id,
					createdById: userId,
					updatedById: userId
				})),
				queries: input.queries?.map((item) => ({
					...item,
					...pick(model, ['tenantId', 'organizationId']),
					modelId: model.id,
					createdById: userId,
					updatedById: userId
				}))
			}

			return await this.modelService.create(request as any)
		}

		return null
	}
}
