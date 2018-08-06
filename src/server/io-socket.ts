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

interface SocketMetadata {
  id       : string
  protocol : IoProtocol
  token    : string
  version  : string
}

// export interface WebSocketInterface {
//   verifyClient: WebSocket.VerifyClientCallbackAsync,
// }

export interface IoSocketOptions {
  httpServer : http.Server,
  httpPath?  : string,
  auth       : (req: http.IncomingMessage) => Promise<string>,
  connect    : (client: WebSocket) => void,
}

class IoSocket /* implements WebSocketInterface */ {
  /**
   *
   * Static
   *
   *
   */
  private static socketMetadataDict = new WeakMap<WebSocket, SocketMetadata>()

  public static metadata (socket: WebSocket, metadata: SocketMetadata) : void
  public static metadata (socket: WebSocket)                           : SocketMetadata

  public static metadata (
    socket       : WebSocket,
    newMetadata? : SocketMetadata
  ): void | SocketMetadata {
    const existingMetadata = this.socketMetadataDict.get(socket)

    if (newMetadata) {
      if (existingMetadata) {
        throw new Error('metadata can not be set twice')
      }
      this.socketMetadataDict.set(socket, newMetadata)
      return
    }

    if (!existingMetadata) {
      throw new Error('no metadata for this socket')
    }
    return existingMetadata
  }

  /**
   *
   * Instance
   *
   */
  private wss?: WebSocket.Server

  private requestTokenDict: WeakMap<http.IncomingMessage, string>

  constructor (
    private options: IoSocketOptions,
  ) {
    log.verbose('IoSocket', 'constructor()')

    this.requestTokenDict = new WeakMap<http.IncomingMessage, string>()
  }

  public async start (): Promise<void> {
    log.verbose('IoSocket', 'start()')

    // https://github.com/websockets/ws/blob/master/doc/ws.md
    const options: WebSocket.ServerOptions = {
      handleProtocols : this.handleProtocols.bind(this),
      path            : this.options.httpPath,
      server          : this.options.httpServer,
      verifyClient    : (info, done) => { this.verifyClient(info, done) },
      // , host: process.env.IP
      // , port: process.env.PORT
    }

    // console.log('fdasfadsfasd')
    /**
     * TODO: should not extend the srver directly
     *      should do: Multiple servers sharing a single HTTP/S server
     *  https://github.com/websockets/ws#multiple-servers-sharing-a-single-https-server
     */
    this.wss = new WebSocket.Server(options)

    this.wss.on('connection', (client, req) => {
      const [protocol, version, id] = client.protocol.split('|')

      // const token = client.upgradeReq['token']
      // XXX: does this work??? https://github.com/websockets/ws/pull/1104
      // const token = (req as any).token
      const token = this.requestTokenDict.get(req)
      if (!token) {
        throw new Error('no token')
      }

      const clientInfo: SocketMetadata = {
        id,
        protocol: protocol as IoProtocol,
        token,
        version,
      }
      IoSocket.metadata(client, clientInfo)

      this.options.connect(client)
    })

    return
  }

  /**
   * https://bugs.chromium.org/p/chromium/issues/detail?id=398407#c2
   */
  protected handleProtocols (
    protocols : string[],
    request   : http.IncomingMessage,
  ): false | string {
    log.verbose('IoSocket', 'handleProtocols(%s, %s)', protocols.join(', '))
    return protocols[0]
  }

  /**
   * check token for websocket client
   * http://stackoverflow.com/a/19155613/1123955
   */
  private async verifyClient (
    info: {
      origin : string,
      secure : boolean,
      req    : http.IncomingMessage,
    },
    done: (res: boolean, code?: number, message?: string) => void
  ): Promise<void> {
    // log.verbose('IoSocket', 'verifyClient(info: {%s}, done: %s)',
    //                         Object.keys(info).join(', '),
    //                         typeof done,
    //             )
    const { origin, secure, req } = info
    log.verbose('IoSocket', 'verifyClient({origin=%s, secure=%s, req.url=%s}, %s)',
                            origin,
                            secure,
                            req.url,
                            typeof done,
                )

    try {
      const token = await this.options.auth(req)
      log.verbose('IoSocket', 'verifyClient() auth succ for token: %s', token)

      this.requestTokenDict.set(req, token)
      // req.token = token

      return done(true, 200, 'Ok')

    } catch (e) {
      log.verbose('IoSocket', 'verifyClient() auth fail: %s', e.message)

      return done(false, 401, 'Unauthorized: ' + e.message)

    }
  }
}

export { IoSocket, SocketMetadata }
