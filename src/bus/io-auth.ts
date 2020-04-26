/**
 *
 * Wechaty Io Server Class
 *
 * IoAuth
 *
 * https://github.com/chatie/io
 *
 */
import http from 'http'

import { log } from '../config'

export class IoAuth {

  constructor () {
    log.verbose('IoAuth', 'constructor()')
  }

  public async auth (req: http.IncomingMessage): Promise<string> {
    log.verbose('IoAuth', 'auth()')
    const token = this.getToken(req)

    if (!token) {
      throw new Error('cannot get token from request')
    }

    // TODO: check auth
    if (!token) {
      throw new Error('auth failed')
    }

    return token
  }

  private getToken (req: http.IncomingMessage): null | string {
    log.verbose('IoAuth', 'getToken()')

    const token = fromHeader(req.headers.authorization)
                  || fromUrl(req.url)

    return token

    /** ------------- */

    function fromUrl (url?: string): null | string {
      if (!url) {
        return null
      }

      const matches = url.match(/token\/(.+)$/i)
      if (matches) {
        return matches[1]
      }

      return null
    }

    function fromHeader (authorization?: string): null | string {
      // https://github.com/KevinPHughes/ws-basic-auth-express/blob/master/index.js
      if (!authorization) {
        log.verbose('IoAuth', 'authToken() no authorization')
        return null
      }
      const parts = authorization.split(' ')
      if (parts.length !== 2) {
        log.verbose('IoAuth', 'authorization part is not 2')
        return null
      }

      const scheme      = parts[0]
      const headerToken = parts[1]

      if (!/Token/i.test(scheme) || !headerToken) {
        log.verbose('IoAuth', 'authorization schema is not Token')
        return null
      }
      return headerToken
    }
  }

}
