/**
 *
 * Wechaty Io Server Class
 *
 * IoManager
 *
 * https://github.com/zixia/wechaty
 *
 */

import moment       from 'moment'
import WebSocket    from 'ws'

import { Listag }   from 'listag'

import { log }      from '../config'

import { ClientInfo } from './io-socket'

export type ServerEventName =
    'sys'
  | 'online'
  | 'offline'

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
  name: EventName
  payload: string | object
}

export class IoManager {
  private ltSocks = new Listag()

  constructor () {
    log.verbose('IoManager', 'constructor()')
  }

  public register (client: WebSocket): void {
    log.verbose('IoManager', 'register()')

    // console.log(ws)
    // console.log(': ' + ws.upgradeReq.client.user)
    // upgradeReq.socket/connection/client

    const clientInfo = client.clientInfo as ClientInfo
    log.verbose('IoManager', 'register token[%s] protocol[%s] version[%s] uuid[%s]'
                            , clientInfo.token
                            , clientInfo.protocol
                            , clientInfo.version
                            , clientInfo.uuid
              )

    log.info('IoManager', '◉ register() token online: %s', clientInfo.token)

    this.ltSocks.add(client, {
      protocol: clientInfo.protocol
      , token:  clientInfo.token
      , uuid:   clientInfo.uuid
    })

    // var location = url.parse(client.upgradeReq.url, true);
    // you might use location.query.access_token to authenticate or share sessions
    // or client.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    client.on('message', this.onMessage.bind(this, client))
    client.on('close', this.unregister.bind(this, client))

    // close will be called on every socket.
    // on error need not unregister again.
    client.on('error', e => {
      log.warn('IoManager', '‼ client.on(error) %s', e)

      const ltItem = this.ltSocks.item(client)
      if (!ltItem) {
        log.error('IoManager', 'error client can not found in ltSocks')
        return
      }

      const tagMap = ltItem.tag()
      if (tagMap) {
        log.warn('IoManager', 'error client is not removed from ltSocks yet?!')
      } else {
        log.verbose('IoManager', 'error client is already removed from ltSocks')
      }
    })

    const onlineEvent: IoEvent = {
      name: 'online'
      , payload: clientInfo.protocol
    }
    this.castBy(client, onlineEvent)

    const registerEvent: IoEvent = {
      name: 'sys'
      , payload: 'registered'
    }
    this.send(client, registerEvent)

    return
  }

  private unregister (client: WebSocket, code: number, reason: string) {
    log.verbose('IoManager', '∅ unregister(%d: %s)', code, reason)

    const ltItem = this.ltSocks.item(client)
    if (!ltItem) {
      log.error('IoManager', 'error client can not found in ltSocks')
      client.close()
      return
    }

    const tagMap = ltItem.tag()
    log.info('IoManager', 'unregister() token offline: %s', tagMap.token)

    this.ltSocks.del(client)
    client.close()

    const offlineEvent: IoEvent = {
      name    : 'offline',
      payload : tagMap.protocol,
    }
    this.castBy(client, offlineEvent)
  }

  private onMessage (client: WebSocket, data: any) {
    log.verbose('IoManager', '_____________________________________________')
    log.verbose('IoManager', '⇑ onMessage() received: %s', data)

    const item = this.ltSocks.item(client)
    if (item) {
      item.tag({ ts: Date.now() })
    } else {
      log.warn('IoManager', 'listag get client null')
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
    this.castBy(client, ioEvent)

    const rogerEvent: IoEvent = {
      name: 'sys'
      , payload: 'roger'
    }
    this.send(client, rogerEvent)
  }

  private send (client: WebSocket, ioEvent: IoEvent) {
    const clientInfo = client['clientInfo'] as ClientInfo
    log.verbose('IoManager', '⇓ send() to token[%s@%s], event[%s:%s]'
                          , clientInfo.token
                          , clientInfo.protocol
                          , ioEvent.name
                          , ioEvent.payload
               )
    return client.send(JSON.stringify(ioEvent))
  }

  private castBy(client: WebSocket, ioEvent: IoEvent): void {
    // log.verbose('IoManager', 'castBy()')

    const ltSocks = this.ltSocks

    const clientInfo = client['clientInfo'] as ClientInfo
    log.verbose('IoManager', 'castBy() token[%s] protocol[%s]', clientInfo.token, clientInfo.protocol)

    log.verbose('IoManager', 'castBy() total online connections: %d, detail below:', this.ltSocks.length)
    for (let n = 0; n < this.ltSocks.length; n++) {

      const ltItem = this.ltSocks.item(this.ltSocks[n])
      if (!ltItem) {
        log.error('IoManager', 'error client can not found in ltSocks')
        continue
      }

      const tagMapTmp = ltItem.tag()
      tagMapTmp.ts = moment.duration(tagMapTmp.ts - Date.now()).humanize(true)

      log.verbose('IoManager', 'castBy() connections#%d: %s', n, JSON.stringify(tagMapTmp))
    }

    const tagMap = {
      protocol: '-' + clientInfo.protocol
      , token:  clientInfo.token
    }
    const socks = this.ltSocks.get(tagMap)

    log.verbose('IoManager', 'castBy() filter by tagMap: %s', JSON.stringify(tagMap))
    log.verbose('IoManager', 'castBy() filtered # of connections: %d', (socks && socks.length))

    if (socks) {
      socks.forEach(s => {
        if (s.readyState === WebSocket.OPEN) {
          log.verbose('IoManager', 'castBy() sending to sock now')
          this.send(s, ioEvent)
        } else {
          log.warn('IoManager', 'castBy() skipped an non-OPEN WebSocket')
        }
      })
    }
  }
}
