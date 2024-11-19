import { TenantModule } from '@metad/server-core'
import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RouterModule } from 'nest-router'
import { CopilotProviderController } from './copilot-provider.controller'
import { CopilotProvider } from './copilot-provider.entity'
import { CopilotProviderService } from './copilot-provider.service'
import { CopilotProviderModel } from '../core'
import { CopilotProviderModelService } from './models/copilot-provider-model.service'
import { CommandHandlers } from './commands/handlers'
import { QueryHandlers } from './queries/handlers'

@Module({
	imports: [
		RouterModule.forRoutes([{ path: '/copilot-provider', module: CopilotProviderModule }]),
		TypeOrmModule.forFeature([CopilotProvider, CopilotProviderModel]),
		TenantModule,
		CqrsModule
	],
	controllers: [CopilotProviderController],
	providers: [CopilotProviderService, CopilotProviderModelService, ...CommandHandlers, ...QueryHandlers],
	exports: [CopilotProviderService]
})
export class CopilotProviderModule {}
