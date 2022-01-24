/**
 * TypeScript need to keep the file extention as `.ts`
 * https://github.com/TypeStrong/ts-node/issues/116#issuecomment-234995536
 */

// tslint:disable:no-console

import * as http  from 'http'
import type {
  AddressInfo,
}                 from 'net'

import {
  IoServer,
  log,
}             from '../src/mod.js'

async function main (): Promise<number> {

  const httpServer  = http.createServer()
  const port    = process.env['PORT'] || 8080 // process.env.PORT is set by Heroku/Cloud9

  httpServer.listen(port, () => {
    const address = httpServer.address() as AddressInfo
    log.info('IoServerExample', 'Listening on ' + address.port)
  })

  const ioServer = new IoServer({
    httpServer,
  })

  try {
    await ioServer.start()
    log.info('IoServerExample', 'init succeed')
  } catch (e) {
    log.error('IoServerExample', 'init failed: %s', (e as Error).message)
    throw e
  }
  return 0
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
