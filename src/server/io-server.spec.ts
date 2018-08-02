#!/usr/bin/env ts-node

// tslint:disable:arrow-parens
// tslint:disable:max-line-length
// tslint:disable:member-ordering
// tslint:disable:no-shadowed-variable
// tslint:disable:unified-signatures
import test  from 'blue-tape'
// import sinon from 'sinon'

import http from 'http'

import {
  IoServer,
}                                 from './io-server'

test('test', async t => {
  const server = new IoServer()
  await server.start()
  await server.stop()
  t.ok('ok')
})

test('IoServer smoking test', t => {
  const httpServer = http.createServer()
  const ioServer = new IoServer(httpServer)

  t.ok(ioServer, 'should instanciated an IoServer')

  t.end()
})
