import { AxiosResponse } from 'axios'
import * as https from 'https'
import { BaseHTTPQueryRunner, HttpAdapterOptions, register } from '../base'
import { IDSSchema } from '../types'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

export interface XmlaAdapterOptions extends HttpAdapterOptions {
  path?: string
  use_ssl?: boolean
  disable_reject_cert?: boolean
}

export class XMLA extends BaseHTTPQueryRunner<XmlaAdapterOptions> {
  static type = 'xmla'

  name = 'XMLA'
  type = XMLA.type
  syntax = 'mdx'
  protocol = 'xmla'

  // Inner status
  private authCookie: string

  get configurationSchema() {
    return {
      type: 'object',
      properties: {
        use_ssl: { type: 'boolean', title: 'Use SSL', default: false },
        host: { type: 'string' },
        port: { type: 'number', default: 80 },
        path: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
        data_source_info: { type: 'string', title: 'Data Source Info' },
        disable_reject_cert: { type: 'boolean', title: 'Disable reject cert', default: false }
      },
      required: ['host', 'port', 'path'],
      order: ['host', 'port', 'path'],
      secret: ['password']
    }
  }

  get url() {
    let url = `${this.options.use_ssl ? 'https' : 'http'}://${this.options.host}:${this.options.port}`
    if (this.options.path) {
      url = `${url}${(this.options.path as string).startsWith('/') ? '' : '/'}${this.options.path}`
    }
    return url
  }

  getAuth() {
    return {
      // TODO 这里是 Options.username 在 SQL 里是 user 需要统一
      username: this.options.username,
      password: this.options.password
    }
  }

  override async runQuery(query: string, options?: Record<string, any>) {
    const _headers = {
      ...(options?.headers || {}),
      Accept: 'text/xml, application/xml, application/soap+xml',
      'Content-Type': 'text/xml'
    }

    let response: AxiosResponse
    try {
      // console.log(`use authCookie`, this.authCookie)
      const headers = { ..._headers }
      if (this.authCookie) {
        headers['Cookie'] = this.authCookie
      }
      response = await this.post(query, {
        headers: {
          ...headers
        },
        auth: this.authCookie
          ? null
          : this.getAuth(),
        httpsAgent: this.options.disable_reject_cert ? httpsAgent : null
      })

      if (response.headers['set-cookie']) {
        this.authCookie = response.headers['set-cookie']
        // console.log(`set-cookie:`, this.authCookie)
      }

      return response
    } catch (error: any) {
      if (error.response.status === 401) {
        // If unauthorized, re-authenticate
        // Retry the request with auth
        response = await this.post(query, {
          auth: this.getAuth(),
          headers: {
            ..._headers
          },
          httpsAgent: this.options.disable_reject_cert ? httpsAgent : null
        })

        if (response.headers['set-cookie']) {
          this.authCookie = response.headers['set-cookie']
          // console.log(`set-cookie:`, this.authCookie)
        }

        return response
      } else {
        throw error
      }
    }
  }

  getCatalogs(): Promise<IDSSchema[]> {
    throw new Error('Method not implemented.')
  }
  getSchema(): Promise<IDSSchema[]> {
    throw new Error('Method not implemented.')
  }

  async ping(): Promise<void> {
    await this.run(``)
  }

  async teardown() {
    this.authCookie = null
  }
}

register(XMLA.type, XMLA)
