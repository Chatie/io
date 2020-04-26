/**
 * TypeScript need to keep the file extention as `.ts`
 * https://github.com/TypeStrong/ts-node/issues/116#issuecomment-234995536
 */

// tslint:disable:no-console

import * as http  from 'http'
import {
  AddressInfo,
}                 from 'net'

import {
  IoHub,
  log,
}             from '../src/'

async function main (): Promise<number> {

  const httpServer  = http.createServer()
  const port    = process.env.PORT || 8080 // process.env.PORT is set by Heroku/Cloud9

  httpServer.listen(port, () => {
    const address = httpServer.address() as AddressInfo
    log.info('IoHubExample', 'Listening on ' + address.port)
  })

  const ioHub = new IoHub({
    httpServer,
  })

  try {
    await ioHub.start()
    log.info('IoHubExample', 'init succeed')
  } catch (e) {
    log.error('IoHubExample', 'init failed: %s', e.message)
    throw e
  }
  return 0
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
