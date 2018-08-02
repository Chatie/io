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
  IoServer,
  log,
}             from '../src/'

async function main (): Promise<number> {

  const server  = http.createServer()
  const port    = process.env.PORT || 8080 // process.env.PORT is set by Heroku/Cloud9

  server.listen(port, () => {
    const address = server.address() as AddressInfo
    log.info('IoServerExample', 'Listening on ' + address.port)
  })

  const ioServer = new IoServer(server)
  try {
    await ioServer.start()
    log.info('IoServerExample', 'init succeed')
  } catch (e) {
    log.error('IoServerExample', 'init failed: %s', e.message)
    throw e
  }
  return 0
}

main()
.catch(e => {
  console.error(e)
  process.exit(1)
})
