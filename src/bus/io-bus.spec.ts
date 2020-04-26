#!/usr/bin/env ts-node

import test  from 'blue-tape'
// import sinon from 'sinon'

import http from 'http'

import {
  IoBus,
}                                 from './io-bus'

test('IoServer smoking test', async t => {
  const httpServer = http.createServer()
  const ioBus = new IoBus({ httpServer })

  t.ok(ioBus, 'should instanciated an IoBus')
})
