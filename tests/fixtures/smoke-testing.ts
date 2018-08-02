#!/usr/bin/env ts-node

// tslint:disable:no-console

import {
  IoClient,
  IoServer,
}               from '@chatie/io'

async function main () {
  const server = new IoServer()

  await server.start()
  await server.stop()

  console.log(`@chatie/io@${server.version()} smoking test passed.`)
  return 0
}

main()
.then(process.exit)
.catch(e => {
  console.error(e)
  process.exit(1)
})
