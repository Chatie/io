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

export class IoServer {
  protected ioManager = new IoManager()
  protected ioAuth    = new IoAuth()

  protected ioSocket: IoSocket

  public static readonly VERSION = VERSION

  /**
   *
   *
   * Constructor
   *
   *
   */
  constructor (
    private httpServer: http.Server
  ) {
    log.verbose('IoServer', 'constructor()')

    this.ioSocket = new IoSocket(
      httpServer,
      this.ioAuth.auth.bind(this.ioAuth),
      // this will hook unRegister as well
      this.ioManager.register.bind(this.ioManager),
    )
  }

  public version (): string {
    return VERSION
  }

  public async start () {
    log.verbose('IoServer', 'start()')
    await this.ioSocket.init()
  }

  public async stop () {
    log.verbose('IoServer', 'stop()')
    // await this.ioSocket.stop()
  }
}
