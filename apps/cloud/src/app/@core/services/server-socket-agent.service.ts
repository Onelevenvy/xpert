import { HttpClient, HttpParams } from '@angular/common/http'
import { Inject, Injectable, computed, effect, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import { API_DATA_SOURCE, DataSourceService } from '@metad/cloud/state'
import { AuthenticationEnum, IDataSource, IDataSourceAuthentication, ISemanticModel } from '@metad/contracts'
import { Agent, AgentStatus, AgentType, DataSourceOptions, UUID } from '@metad/ocap-core'
import { Observable, Subject, bufferToggle, firstValueFrom, from, merge, mergeMap, windowToggle } from 'rxjs'
import { AbstractAgent, AuthInfoType } from '../auth'
import { getErrorMessage, uuid } from '../types'
import { AgentService } from './agent.service'
import { PAC_SERVER_AGENT_DEFAULT_OPTIONS, PacServerAgentDefaultOptions } from './server-agent.service'

export type ServerSocketEventType = {
  id: UUID
  dataSourceId: string
  modelId: string
  body: string
  forceRefresh: boolean
}

@Injectable()
export class ServerSocketAgent extends AbstractAgent implements Agent {
  readonly #agentService = inject(AgentService)

  type = AgentType.Server

  private error$ = new Subject()

  readonly queuePoolSize = 500
  readonly queuePool = signal<
    Record<UUID, { resolve: (value) => void; reject: (reason?: any) => void; complete?: boolean }>
  >({})
  readonly request$ = new Subject<ServerSocketEventType>()

  readonly bufferSize = computed(() => Object.keys(this.queuePool()).length)
  readonly completeSize = computed(() => Object.values(this.queuePool()).filter((x) => x.complete).length)

  constructor(
    @Inject(PAC_SERVER_AGENT_DEFAULT_OPTIONS)
    private options: PacServerAgentDefaultOptions,
    private httpClient: HttpClient,
    dataSourceService: DataSourceService,
    _bottomSheet: MatBottomSheet
  ) {
    super(dataSourceService, _bottomSheet)

    merge(
      this.request$.pipe(bufferToggle(this.#agentService.disconnected$, () => this.#agentService.connected$)),
      this.request$.pipe(windowToggle(this.#agentService.connected$, () => this.#agentService.disconnected$))
    )
      .pipe(
        // then flatten buffer arrays and window Observables
        mergeMap((x) => x),
        takeUntilDestroyed()
      )
      .subscribe((request) => {
        this.#agentService.emit('olap', request)
      })

    this.#agentService.on('olap', (result) => {
      const { id, cache, data, status, statusText } = result
      const request = this.queuePool()[id]

      if (request) {
        const { resolve, reject } = request
        this.queuePool.update((state) => {
          state[id] = {
            ...state[id],
            complete: true
          }

          //Clear completed requests when the queue is full
          if (Object.keys(state).length > this.queuePoolSize) {
            Object.keys(state).filter((key) => state[key].complete).forEach((key) => delete state[key])
          }

          return {
            ...state
          }
        })

        if (status === 500) {
          reject({
            status: status,
            error: statusText
          })
        } else if (data) {
          resolve(data)
        } else {
          reject({
            status: status,
            error: statusText
          })
        }
      }
    })

    this.#agentService.connect()
  }

  selectStatus(): Observable<AgentStatus> {
    throw new Error('Method not implemented.')
  }

  selectError() {
    return this.error$
  }

  error(err: any): void {
    this.error$.next(err)
  }

  async request(semanticModel: ISemanticModel & DataSourceOptions, options: any): Promise<any> {
    options.headers = options.headers || {}
    const modelId = semanticModel.id
    const dataSourceId = semanticModel.dataSource?.id
    const id = uuid()

    let url = ''
    let method = 'GET'
    let params = new HttpParams()
    let body = options.body

    // Require auth info if authType is Basic
    if (semanticModel?.dataSource?.authType === AuthenticationEnum.BASIC) {
      const auth = await this.authenticate({
        data: {
          dataSource: semanticModel?.dataSource,
          request: {
            url,
            body
          }
        }
      } as any)

      if (!semanticModel?.dataSource?.id && auth) {
        body.authentications = [auth]
      }
    }

    if (options.url === 'ping') {
      throw new Error('Method not implemented.')

      // url = semanticModel.dataSource?.id
      //   ? `${API_DATA_SOURCE}/${semanticModel.dataSource.id}/ping`
      //   : `${API_DATA_SOURCE}/ping`
      // method = 'POST'

      // try {
      //   return await firstValueFrom(this.httpClient.post(url, body, { params }))
      // } catch (err) {
      //   const message = getErrorMessage(err)
      //   this.error$.next(message)
      //   throw new Error(message)
      // }
    } else {
      if (semanticModel.type === 'XMLA') {
        /**
         * @todo 使用更好的办法判断 (用类型判断?)
         */
        // url = (<ISemanticModel>semanticModel).dataSourceId
        //   ? `${this.options.modelBaseUrl}/${modelId}/olap`
        //   : `${API_DATA_SOURCE}/${semanticModel.dataSource?.id}/olap`
        // method = 'POST'

        return new Promise((resolve, reject) => {
          this.queuePool.update((state) => {
            state[id] = { resolve, reject }
            return {
              ...state
            }
          })
          this.request$.next({
            id,
            dataSourceId,
            modelId,
            body,
            forceRefresh: options.forceRefresh
          })
        })
      } else if (semanticModel.type === 'SQL') {
        url = `${API_DATA_SOURCE}/${semanticModel.dataSource?.id}`
        switch (options.url) {
          case 'schema': {
            if (options.catalog) {
              params = params.set('catalog', options.catalog)
            }
            if (options.table) {
              params = params.set('table', options.table)
            }
            if (options.statement) {
              params = params.set('statement', options.statement)
            }
            url = `${url}/schema`
            break
          }
          case 'catalogs': {
            url = `${url}/catalogs`
            break
          }
          case 'query': {
            url = `${this.options.modelBaseUrl}/${modelId}/query`
            method = 'POST'
            body = { id, query: options.body }
            break
          }
          case 'import': {
            url = `${this.options.modelBaseUrl}/${modelId}/import`
            method = 'POST'
            body = options.body
            break
          }
          case 'drop': {
            url = `${this.options.modelBaseUrl}/${modelId}/table/${options.body.name}`
            method = 'DELETE'
            body = null
            break
          }
          // case 'ping': {
          //   url = semanticModel.dataSource?.id ? `${API_DATA_SOURCE}/${semanticModel.dataSource.id}/ping` : `${API_DATA_SOURCE}/ping`
          //   method = 'POST'
          //   break
          // }
        }

        try {
          return await firstValueFrom(
            this.httpClient.request(method, url, {
              body,
              params
            })
          )
        } catch (err) {
          const message = getErrorMessage(err)
          this.error$.next(message)
          throw new Error(message)
        }
      }
    }

    return Promise.reject(`未找到相应 Agent 响应方法`)
  }

  _request?(semanticModel: ISemanticModel & DataSourceOptions, options: any): Observable<any> {
    return from(this.request(semanticModel, options))
  }

  getPingCallback(request: any, dataSource?: IDataSource) {
    return async (auth: AuthInfoType) => {
      dataSource = {
        ...dataSource,
        authentications: [
          {
            ...(auth as IDataSourceAuthentication)
          }
        ]
      }
      return await firstValueFrom(
        dataSource.id ? this.dataSourceService.ping(dataSource.id, dataSource) : this.dataSourceService.ping(dataSource)
      )
    }
  }
}
