#!/usr/bin/env ts-node

import test  from 'blue-tape'
// import sinon from 'sinon'

import http from 'http'

import {
  IoServer,
}                                 from './io-server'

test('IoServer smoking test', async t => {
  const httpServer = http.createServer()
  const ioServer = new IoServer({ httpServer })

  t.ok(ioServer, 'should instanciated an IoServer')
})
