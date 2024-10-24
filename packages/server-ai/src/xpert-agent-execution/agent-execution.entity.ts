import { IXpert, IXpertAgentExecution, XpertAgentExecutionEnum } from '@metad/contracts'
import { TenantOrganizationBaseEntity } from '@metad/server-core'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsJSON, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, RelationId } from 'typeorm'
import { Xpert } from '../core/entities/internal'

@Entity('xpert_agent_execution')
export class XpertAgentExecution extends TenantOrganizationBaseEntity implements IXpertAgentExecution {
	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	@Column({ nullable: true, length: 100 })
	title?: string

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	@Column({ nullable: true, length: 100 })
	agentKey?: string

	@ApiPropertyOptional({ type: () => Object })
	@IsJSON()
	@IsOptional()
	@Column({ type: 'json', nullable: true })
	inputs?: any

	@ApiProperty({ type: () => String, enum: XpertAgentExecutionEnum })
	@IsEnum(XpertAgentExecutionEnum)
	@IsOptional()
	@Column({ nullable: true })
	status?: XpertAgentExecutionEnum

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	@Column({ nullable: true })
	error?: string

	@ApiProperty({ type: () => Number })
	@IsNumber()
	@IsOptional()
	@Column({ type: 'numeric', nullable: true })
	elapsedTime?: number

	@ApiProperty({ type: () => Number })
	@IsNumber()
	@IsOptional()
	@Column({ type: 'integer', nullable: true })
	tokens?: number

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	@Column({ nullable: true, length: 100 })
	thread_id?: string

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	@Column({ nullable: true, length: 100 })
	parent_thread_id?: string

	/*
    |--------------------------------------------------------------------------
    | @ManyToOne
    |--------------------------------------------------------------------------
    */
	@ApiProperty({ type: () => XpertAgentExecution })
	@ManyToOne(() => XpertAgentExecution, {
		nullable: true,
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	parent?: IXpertAgentExecution

	@ApiProperty({ type: () => String })
	@RelationId((it: XpertAgentExecution) => it.parent)
	@IsString()
	@Column({ nullable: true })
	parentId?: string

	@ApiProperty({ type: () => XpertAgentExecution, isArray: true })
	@OneToMany(() => XpertAgentExecution, (_) => _.parent)
	subExecutions?: IXpertAgentExecution[]

	@ApiProperty({ type: () => Xpert })
	@ManyToOne(() => Xpert, {
		nullable: true
	})
	@JoinColumn()
	xpert: IXpert

	@ApiProperty({ type: () => String, readOnly: true })
	@RelationId((it: XpertAgentExecution) => it.xpert)
	@IsString()
	@Column({ nullable: true })
	readonly xpertId: string
}
