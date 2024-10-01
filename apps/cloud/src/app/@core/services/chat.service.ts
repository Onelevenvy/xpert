import { Injectable, inject, signal } from '@angular/core'
import { Store } from '@metad/cloud/state'
import { nonNullable } from '@metad/core'
import { BehaviorSubject, Subject } from 'rxjs'
import { distinctUntilChanged, filter } from 'rxjs/operators'
import { Socket, io } from 'socket.io-client'
import { environment } from '../../../environments/environment'
import { AuthStrategy } from '../auth'
import { getWebSocketUrl } from '../utils'
import { ChatGatewayMessage } from '../types'

@Injectable({ providedIn: 'root' })
export class ChatService {
  static readonly namespace = 'chat'

  readonly #store = inject(Store)
  readonly #auth = inject(AuthStrategy)

  readonly socket$ = new BehaviorSubject<Socket>(null)
  get socket() {
    return this.socket$.value
  }
  set socket(socket: Socket) {
    this.socket$.next(socket)
  }

  readonly #connected$ = new BehaviorSubject<boolean>(false)
  readonly #disconnected$ = new Subject<boolean>()
  readonly connected$ = this.#connected$.asObservable().pipe(distinctUntilChanged())
  readonly disconnected$ = this.#disconnected$.asObservable().pipe(distinctUntilChanged())
  readonly refreshTokening = signal(false)

  refreshToken() {
    this.refreshTokening.set(true)
    this.#auth.refreshToken().subscribe(() => {
      /**
       * Reconnect the socket using new token
       */
      this.connect()
      this.refreshTokening.set(false)
    })
  }

  connect() {
    if (!this.socket || this.socket.disconnected || !this.#connected$.value) {
      this.socket = io(`${getWebSocketUrl(environment.API_BASE_URL)}/${ChatService.namespace}`, {
        auth: (cb: (param: { token: string }) => void) => {
          cb({ token: this.#store.token })
        }
      })

      let socketId = this.socket.id
      this.socket.on('connect', () => {
        socketId = this.socket.id
        this.setStatus(true)
      })

      this.socket.on('exception', (data) => {
        console.error('chat socket exception message:', data)
        if (data.status === 401 && socketId === this.socket.id) {
          this.setStatus(false)
          if (!this.refreshTokening()) {
            this.refreshToken()
          }
        }
      })

      this.socket.on('disconnect', () => {
        this.setStatus(false)
      })
    }

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }

  emit(event: string, ...args: any[]) {
    this.socket.emit(event, ...args, (val) => {
      console.log('ack', val)
    })
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket$.pipe(filter(nonNullable)).subscribe((socket) => {
      socket.on(event, callback)
    })
  }

  setStatus(status: boolean) {
    this.#connected$.next(status)
    this.#disconnected$.next(!status)
  }

  message(data: Omit<ChatGatewayMessage, 'organizationId'>) {
    this.emit('message', {...data, organizationId: this.#store.selectedOrganization.id})
  }
}
