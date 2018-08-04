#!/usr/bin/env ts-node

// tslint:disable:no-console

import http from 'http'

import {
  IoServer,
}               from '@chatie/io'

async function main () {
  const httpServer = http.createServer()

  const ioServer = new IoServer({ httpServer })

  await ioServer.start()
  await ioServer.stop()

  console.log(`@chatie/io@${ioServer.version()} smoking test passed.`)
  return 0
}

main()
.then(process.exit)
.catch(e => {
  console.error(e)
  process.exit(1)
})
