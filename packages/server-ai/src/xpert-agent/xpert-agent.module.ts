import { TenantModule } from '@metad/server-core'
import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RouterModule } from 'nest-router'
import { XpertAgentController } from './xpert-agent.controller'
import { XpertAgent } from './xpert-agent.entity'
import { XpertAgentService } from './xpert-agent.service'
import { CommandHandlers } from './commands/handlers'
import { CopilotCheckpointModule } from '../copilot-checkpoint'
import { XpertAgentExecutionModule } from '../xpert-agent-execution'

@Module({
	imports: [
		RouterModule.forRoutes([{ path: '/xpert-agent', module: XpertAgentModule }]),
		TypeOrmModule.forFeature([XpertAgent]),
		TenantModule,
		CqrsModule,
		
		CopilotCheckpointModule,
		XpertAgentExecutionModule
	],
	controllers: [XpertAgentController],
	providers: [XpertAgentService, ...CommandHandlers],
	exports: [XpertAgentService]
})
export class XpertAgentModule {}
