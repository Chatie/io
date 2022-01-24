/**
 *
 * Wechaty Io Server Class
 *
 * IoManager
 *
 * https://github.com/zixia/wechaty
 *
 */

import WebSocket    from 'ws'
import isPortReachable from 'is-port-reachable'

// import { Listag }   from 'listag'
import pTimeout from 'p-timeout'

import { log }      from '../config.js'

import {
  IoSocket,
  SocketMetadata,
}                   from './io-socket.js'

export type ServerEventName =
    'sys'
  | 'online'
  | 'offline'
  | 'hostie'
  | 'jsonrpc'

export type WechatyEventName =
    'scan'
  | 'login'
  | 'logout'
  | 'message'
  | 'heartbeat'
  | 'error'
  | 'ding'
  | 'dong'

export type EventName =
    'raw'
  | ServerEventName
  | WechatyEventName

export interface IoEvent {
  name    : EventName
  payload : string | object
}

export class IoManager {

  // private ltSocks = new Listag()
  private clientList: WebSocket[]

  constructor () {
    log.verbose('IoManager', 'constructor()')

    this.clientList = []
  }

  public register (client: WebSocket): void {
    log.verbose('IoManager', 'register()')

    // console.log(ws)
    // console.log(': ' + ws.upgradeReq.client.user)
    // upgradeReq.socket/connection/client

    const metadata = IoSocket.metadata(client)
    if (!metadata) {
      log.error('IoManager', 'register() client has no metadata found')
      return
    }

    this.clientList.push(client)

    log.verbose('IoManager', 'register token[%s] protocol[%s] version[%s] uuid[%s]'
      , metadata.token
      , metadata.protocol
      , metadata.version
      , metadata.id,
    )

    log.info('IoManager', '◉ register() token online: %s', metadata.token)

    // this.ltSocks.add(client, {
    //   protocol : metadata.protocol,
    //   token    : metadata.token,
    //   uuid     : metadata.id,
    // })

    // var location = url.parse(client.upgradeReq.url, true);
    // you might use location.query.access_token to authenticate or share sessions
    // or client.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    client.on('message', this.onMessage.bind(this, client))
    client.on('close', this.deregister.bind(this, client))

    // close will be called on every socket.
    // on error need not unregister again.
    client.on('error', e => {
      log.warn('IoManager', '‼ client.on(error) %s', e)

      // const ltItem = this.ltSocks.item(client)
      // if (!ltItem) {
      //   log.error('IoManager', 'error client can not found in ltSocks')
      //   return
      // }

      // const tagMap = ltItem.tag()
      // if (tagMap) {
      //   log.warn('IoManager', 'error client is not removed from ltSocks yet?!')
      // } else {
      //   log.verbose('IoManager', 'error client is already removed from ltSocks')
      // }
    })

    const onlineEvent: IoEvent = {
      name: 'online',
      payload: metadata.protocol,
    }
    this.castFrom(client, onlineEvent)

    const registerEvent: IoEvent = {
      name: 'sys',
      payload: 'registered',
    }

    this.sendTo(client, registerEvent)
  }

  private deregister (client: WebSocket, code: number, reason: string) {
    log.verbose('IoManager', '∅ deregister(%d: %s)', code, reason)

    client.close()

    const metadata = IoSocket.metadata(client)
    if (!metadata) {
      log.error('IoManager', 'deregister() client can not found metadata')
      return
    }

    log.info('IoManager', 'deregister() token offline: %s', metadata.token)

    const index = this.clientList.indexOf(client)
    if (index !== -1) {
      this.clientList.splice(index, 1)
    } else {
      log.warn('IoManager', 'deregister() can not find socket in socketList')
    }

    // this.ltSocks.del(client)
    // client.close()

    const offlineEvent: IoEvent = {
      name    : 'offline',
      payload : metadata.protocol,
    }
    this.castFrom(client, offlineEvent)
  }

  private async onMessage (client: WebSocket, data: any) {
    log.verbose('IoManager', '_____________________________________________')
    log.verbose('IoManager', '⇑ onMessage() received: %s', data)

    const metadata = IoSocket.metadata(client)
    if (!metadata) {
      log.warn('IoManager', 'onMessage() client has no metadata')
      return
    }

    const ioEvent: IoEvent = {
      name    : 'raw',
      payload : data,
    }
    try {
      const obj = JSON.parse(data)
      ioEvent.name    = obj.name
      ioEvent.payload = obj.payload
    } catch (e) {
      log.warn('IoManager', 'onMessage() parse data fail. orig data: [%s]', data)
    }

    if (ioEvent.name === 'hostie') {
      const { host } = await this.discoverHostie(metadata.token)

      const hostieEvent: IoEvent = {
        name: 'hostie',
        payload: host,
      }

      this.sendTo(client, hostieEvent)
      return
    }

    this.castFrom(client, ioEvent)

    const rogerEvent: IoEvent = {
      name: 'sys',
      payload: 'roger',
    }
    this.sendTo(client, rogerEvent)
  }

  private sendTo (client: WebSocket, ioEvent: IoEvent) {
    const metadata = IoSocket.metadata(client)
    if (!metadata) {
      log.error('IoManager', 'sendTo() client has no metadata')
      return
    }

    log.verbose('IoManager', '⇓ send() to token[%s@%s], event[%s:%s]',
      metadata.token,
      metadata.protocol,
      ioEvent.name,
      ioEvent.payload,
    )
    return client.send(JSON.stringify(ioEvent))
  }

  private castFrom (client: WebSocket, ioEvent: IoEvent): void {
    // log.verbose('IoManager', 'castBy()')

    // const ltSocks = this.ltSocks

    const metadata = IoSocket.metadata(client)
    if (!metadata) {
      log.error('IoManager', 'castFrom() client has no metadata')
      return
    }

    log.verbose('IoManager', 'castBy() token[%s] protocol[%s]', metadata.token, metadata.protocol)

    log.verbose('IoManager', 'castBy() total online connections: %d, detail below:', this.clientList.length)

    // for (let n = 0; n < this.ltSocks.length; n++) {

    //   const ltItem = this.ltSocks.item(this.ltSocks[n])
    //   if (!ltItem) {
    //     log.error('IoManager', 'error client can not found in ltSocks')
    //     continue
    //   }

    //   const tagMapTmp = ltItem.tag()
    //   tagMapTmp.ts = moment.duration(tagMapTmp.ts - Date.now()).humanize(true)

    //   log.verbose('IoManager', 'castBy() connections#%d: %s', n, JSON.stringify(tagMapTmp))
    // }

    function hasMeta (o: {
      client: WebSocket,
      meta?: SocketMetadata,
    }): o is {
      client: WebSocket,
      meta: SocketMetadata,
    } {
      return !!o.meta
    }

    const targetClientList = this.clientList
      .map(client => ({
        client,
        meta: IoSocket.metadata(client),
      }))
      .filter(hasMeta)
      //  skip the same protocol, only broadcast to the protocols other than this one
      .filter(o => o.meta.protocol  !== metadata.protocol)
      .filter(o => o.meta.token     === metadata.token)
      .map(o => o.client)

    // log.verbose('IoManager', 'castBy() filter by tagMap: %s', JSON.stringify(tagMap))
    log.verbose('IoManager', 'castBy() filtered # of connections: %d', targetClientList.length)

    // if (socks) {
    //   socks.forEach(s => {
    //     if (s.readyState === WebSocket.OPEN) {
    //       log.verbose('IoManager', 'castBy() sending to sock now')
    //       this.sendTo(s, ioEvent)
    //     } else {
    //       log.warn('IoManager', 'castBy() skipped an non-OPEN WebSocket')
    //     }
    //   })
    // }

    targetClientList.forEach(s => {
      if (s.readyState === WebSocket.OPEN) {
        log.verbose('IoManager', 'castBy() sending to sock now')
        this.sendTo(s, ioEvent)
      } else {
        log.warn('IoManager', 'castBy() skipped an non-OPEN WebSocket')
      }
    })
  }

  public getHostieCount (): number {
    log.verbose('IoManager', 'getHostieCount()')
    return this.clientList.length
  }

  public async discoverHostie (token: string): Promise<{
    host: string,
    /**
     * `ip` will be kept for compatible before Dec 31, 2022
     */
    ip: string, // <- deprecated: use host instead. Huan(202108)
    port: number,
  }> {
    log.verbose('IoManager', 'discoverHostie(%s)', token)

    function hasMeta (o: {
      client: WebSocket,
      meta?: SocketMetadata,
    }): o is {
      client: WebSocket,
      meta: SocketMetadata,
    } {
      return !!o.meta
    }

    const metaList = this.clientList
      .map(client => ({
        client,
        meta: IoSocket.metadata(client),
      }))
      .filter(hasMeta)
      .filter(o => o.meta.protocol === 'io')
      .filter(o => o.meta.token    === token)
      .map(o => o.meta)

    // const tagMap = {
    //   protocol: 'io',
    //   token,
    // }

    // const sockList = this.ltSocks.get(tagMap)

    if (metaList.length <= 0) {
      return {
        host : '0.0.0.0',
        ip   : '0.0.0.0', // <- deprecated: Huan(202108)
        port : 0,
      }
    }

    if (metaList.length > 1) {
      log.verbose('IoManager', 'discoverHostie(%s) metaList.length > 1 ???', token)
    }

    // console.info('metadata', metadata)
    const { host, jsonRpc } = metaList[0]!

    let port = 8788
    try {
      port = await pTimeout(
        jsonRpc!.request('getHostieGrpcPort'),
        5000,
      )
    } catch (e) {
      log.verbose('IoManager', 'discoverHostie(%s) timeout.', token)
    }

    /**
     * Huan(202201): test whether the puppet service server host/port
     *  can be visited by the internet
     */
    const isReachable = await isPortReachable(port, {
      host,
      timeout: 5 * 1000,
    })

    const data = {
      host: isReachable ? host : '127.0.0.1',
      ip: host, //  <- `ip` is deprecated, use `host` instead. Will be removed after Dec 31, 2022 Huan(202108)
      port,
    }
    // console.info('data', data)
    return data
  }

}
