/**
 *
 * Wechaty Io Server Class
 *
 * IoSocket
 *
 * https://github.com/chatie/io
 *
 */
import http from 'http'

import WebSocket from 'ws'

import { log } from '../config'

export type IoProtocol = 'io' | 'web'

interface ClientInfo {
  token:    string
  protocol: IoProtocol
  version:  string
  uuid:     string
}

export interface WebSocketInterface {
  verifyClient: WebSocket.VerifyClientCallbackAsync,
}

class IoSocket implements WebSocketInterface {
  private wss?: WebSocket.Server

  constructor (
    private server  : http.Server,
    private auth    : (req: http.ServerRequest) => Promise<string>,
    private connect : (client: WebSocket) => void,
  ) {
    log.verbose('IoSocket', 'constructor()')
  }

  public async init (): Promise<void> {
    log.verbose('IoSocket', 'init()')

    // https://github.com/websockets/ws/blob/master/doc/ws.md
    const options: WebSocket.ServerOptions = {
      handleProtocols:  this.handleProtocols.bind(this),
      server:           this.server,
      verifyClient:     this.verifyClient.bind(this),
      // , host: process.env.IP
      // , port: process.env.PORT
    }

    /**
     * TODO: should not extend the srver directly
     *      should do: Multiple servers sharing a single HTTP/S server
     *  https://github.com/websockets/ws#multiple-servers-sharing-a-single-https-server
     */
    this.wss = new WebSocket.Server(options)

    this.wss.on('connection', (client, req) => {
      const [protocol, version, uuid] = client.protocol.split('|')

      // const token = client.upgradeReq['token']
      // XXX: does this work??? https://github.com/websockets/ws/pull/1104
      const token = (req as any).token

      const clientInfo: ClientInfo = {
        protocol: protocol as IoProtocol,
        token,
        uuid,
        version,
      }
      client['clientInfo'] = clientInfo
      this.connect(client)
    })

    return
  }

  /**
   * https://bugs.chromium.org/p/chromium/issues/detail?id=398407#c2
   */
  protected handleProtocols (
    protocols : string[],
    done      : (status: boolean, protocol: string) => void,
  ): void {
    log.verbose('IoSocket', 'handleProtocols() protocols: ' + protocols)
    done(true, protocols[0])
  }

  /**
   * check token for websocket client
   * http://stackoverflow.com/a/19155613/1123955
   */
  private async verifyClient (
    info: {
      origin: string,
      secure: boolean,
      req: http.ServerRequest,
    },
    done: (res: boolean, code?: number, message?: string) => void
  ): Promise<void> {
    log.verbose('IoSocket', 'verifyClient()')

    const { origin, secure, req } = info
    log.verbose('IoSocket', 'verifyClient() req.url = %s', req.url)

    try {
      const token = await this.auth(req)
      log.verbose('IoSocket', 'verifyClient() auth succ for token: %s', token)

      req['token'] = token

      return done(true, 200, 'Ok')

    } catch (e) {
      log.verbose('IoSocket', 'verifyClient() auth fail: %s', e.message)

      return done(false, 401, 'Unauthorized: ' + e.message)

    }
  }
}

export { IoSocket, ClientInfo }
