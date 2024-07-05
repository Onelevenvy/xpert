import { DataSource, Type } from '@metad/ocap-core'
import { XmlaDataSource } from '@metad/ocap-xmla'
import { ProxyAgent } from './agent'
import { NgmDSCoreService } from './core.service'
import { OCAP_AGENT_TOKEN, OCAP_DATASOURCE_TOKEN } from './types'

export function provideOcap() {
	return [
		NgmDSCoreService,
		{
			provide: OCAP_AGENT_TOKEN,
			useClass: ProxyAgent
		},
		{
			provide: OCAP_DATASOURCE_TOKEN,
			useValue: {
				type: 'XMLA',
				factory: async (): Promise<Type<DataSource>> => {
					// const { XmlaDataSource } = await import('@metad/ocap-xmla')
					return XmlaDataSource
				}
			},
			multi: true
		}
	]
}
