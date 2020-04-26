import { StateSwitch } from 'state-switch'
import { Sockie } from 'sockie'

import {
  log,
}           from './config'

import { JsonRpc } from './json-rpc'
import { Selector } from './selector'

interface IoEvent {
  type: string,
  channel: string,
  source: string,
  payload: object,
}

interface BroadcastEvent {
  source  : string,
  payload : object,
}

export class Io {

  private state: StateSwitch

  private role: 'slave' | 'master'

  private sockie: undefined | Sockie
  private jsonRpc: undefined | JsonRpc

  private cleanCallbackList: (() => void) []

  constructor (
    public token: string,
  ) {
    log.verbose('Io', 'constructor(%s)', token)

    this.role = 'slave'
    this.state = new StateSwitch(`io<${token}>`)

    this.cleanCallbackList = []
  }

  async start (master = false): Promise<void> {
    log.verbose('Io', 'start(master=%s)', master)

    if (this.state.on()) {
      log.warn('Io', 'start() on an already started instance')
      await this.state.on()
      return
    }

    try {
      this.state.on('pending')

      this.sockie = new Sockie()
      this.jsonRpc = new JsonRpc()

      this.sockie
        .pipe(this.jsonRpc)
        .pipe(this.sockie)

      if (master) {
        await this.master(true)
      }

      this.state.on(true)
    } catch (e) {
      log.error('Io', 'start() rejection: %s', e.message)
      this.state.off(true)
    }
  }

  async stop (): Promise<void> {
    log.verbose('Io', 'stop()')

    if (this.state.off()) {
      log.warn('Io', 'stop() on an already stopped instance')
      await this.state.off()
      return
    }

    if (!this.jsonRpc) {
      throw new Error('this.jsonRpc not found')
    }

    if (!this.sockie) {
      throw new Error('this.sockie not found!')
    }

    try {
      this.state.off('pending')

      log.silly('Io', 'stop() this.cleanCallbackList.length=%s', this.cleanCallbackList.length)
      this.cleanCallbackList.forEach(callback => callback())
      this.cleanCallbackList = []

      this.sockie.unsubscribe()
      this.sockie = undefined

      this.jsonRpc = undefined

    } catch (e) {
      log.error('Io', 'stop() rejection: %s', e.message)
    } finally {

      this.state.off(true)

    }
  }

  // Check whether this io instance is master
  master (): boolean
  // Announce this io instance to master
  master (declare: true): Promise<void>

  master (declare? : true): boolean | Promise<void> {
    log.verbose('Io', 'master(%s)',
      typeof declare === 'undefined'
        ? ''
        : declare
    )

    /**
     * Check if this instance is in role of master
     */
    if (typeof declare === 'undefined') {
      return this.role === 'master'
    }

    /**
     * Declare this instance to be a master
     */
    return this.jsonRpc!.master(true)
      .then((result: any) => {
        if (!result) {
          throw new Error('declare to be master failed! error message: ' + result.errorMessage)
        }
        return result
      })
  }

  async addMethod<T extends Function> (
    selector : Selector<T>,
    method   : Function,
  ): Promise<void> {
    log.verbose('Io', 'addMethod(%s, %s)', selector, method.name)
  }

  async response<T> (
    selector: Selector<T>,
  ): Promise<boolean> {
    log.verbose('Io', 'response(%s)', selector)
    return false
  }

  async perform<T> (
    selector: () => T,
  ): Promise<T> {
    log.verbose('Io', 'perform(%s)', selector)
    return {} as T
  }

  async broadcast (event: BroadcastEvent): Promise<void> {
    log.verbose('Io', 'broadcast("%s")', JSON.stringify(event))

    this.jsonRpc.broadcast(event)
  }

  /**
   * Listen the broadcast io events
   *
   * @param event Event name
   * @param listener Callback listener function
   *
   * @returns A callback that undo the listen
   */
  listen (
    event    : string,
    listener : (event: BroadcastEvent) => void
  ): () => void {
    log.verbose('Io', 'listen(%s, %s)', event, listener)

    if (!this.jsonRpc) {
      throw new Error('this.jsonRpc not found')
    }

    const myListener = (event: BroadcastEvent) => listener(event)
    this.jsonRpc.on(event, myListener)

    const offCallback = () => this.jsonRpc?.off(event, myListener)
    return offCallback
  }

}
