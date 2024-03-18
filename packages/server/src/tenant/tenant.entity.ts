import { ApiProperty } from '@nestjs/swagger';
import {
	BaseEntity, FeatureOrganization, ImportRecord, Organization, RolePermission, TenantSetting,
} from '../core/entities/internal';
import { Entity, Column, Index, OneToMany, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import {
	ITenant,
	IOrganization,
	IRolePermission,
	IFeatureOrganization,
	IImportRecord,
	ITenantSetting
} from '@metad/contracts';
import { TenantCreatedEvent } from './events';

@Entity('tenant')
export class Tenant extends BaseEntity implements ITenant {
	@ApiProperty({ type: () => String })
	@Index()
	@IsString()
	@IsNotEmpty()
	@Column({ nullable: false })
	name?: string;

	/*
    |--------------------------------------------------------------------------
    | @OneToMany 
    |--------------------------------------------------------------------------
    */
	@ApiProperty({ type: () => Organization })
	@OneToMany(() => Organization, (organization) => organization.tenant, {
		cascade: true
	})
	@JoinColumn()
	organizations?: IOrganization[];

	@ApiProperty({ type: () => RolePermission })
	@OneToMany(() => RolePermission, (rolePermission) => rolePermission.tenant, {
		cascade: true
	})
	rolePermissions?: IRolePermission[];

	@ApiProperty({ type: () => FeatureOrganization })
	@OneToMany(() => FeatureOrganization, (featureOrganization) => featureOrganization.tenant, {
		cascade: true
	})
	featureOrganizations?: IFeatureOrganization[];

	@ApiProperty({ type: () => TenantSetting })
	@OneToMany(() => TenantSetting, (settings) => settings.tenant, {
		cascade: true
	})
	settings?: ITenantSetting[];

	@ApiProperty({ type: () => ImportRecord })
	@OneToMany(() => ImportRecord, (importRecord) => importRecord.tenant, {
		cascade: true
	})
	importRecords?: IImportRecord[];

	afterCreated() {
		// logic
		this.apply(new TenantCreatedEvent(this.id))
	}
}
