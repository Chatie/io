/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

// tslint:disable:arrow-parens
// tslint:disable:max-line-length
// tslint:disable:member-ordering
// tslint:disable:unified-signatures

import http from 'http'

import {
  log,
  VERSION,
}                       from '../config'

import {
  IoAuth,
}             from './io-auth'
import {
  IoManager,
}             from './io-manager'
import {
  IoSocket,
}             from './io-socket'

export interface IoBusOptions {
  httpServer : http.Server,
  httpPath?  : string,
}

export class IoBus {

  public static readonly VERSION = VERSION

  protected ioManager: IoManager
  protected ioAuth: IoAuth

  protected ioSocket: IoSocket

  /**
   * Constructor
   */
  constructor (
    public options: IoBusOptions,
  ) {
    log.verbose('IoBus', 'constructor()')

    this.ioManager = new IoManager()
    this.ioAuth    = new IoAuth()

    this.ioSocket = new IoSocket({
      auth: this.ioAuth.auth.bind(this.ioAuth),
      // this will hook unRegister as well
      connect    : this.ioManager.register.bind(this.ioManager),
      httpPath   : options.httpPath,
      httpServer : options.httpServer,
    })
  }

  public version (): string {
    return VERSION
  }

  public async start () {
    log.verbose('IoBus', 'start()')
    await this.ioSocket.start()
  }

  public async stop () {
    log.verbose('IoBus', 'stop()')
    // await this.ioSocket.stop()
  }

}
