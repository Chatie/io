import { EventEmitter } from 'events'

import {
  log,
}           from './config'
// import StateSwitch from 'state-switch'

export class JsonRpc extends EventEmitter {

  constructor () {
    super()
    log.verbose('JsonRpc', 'constructor()')

    // this.state = new StateSwitch('JsonRpc')
  }

  /**
   * Get Root Privilidge
   */
  su () {

  }

  /**
   * Check whether this connection is a master connection
   */
  async master (declare?: boolean) {

  }

}
