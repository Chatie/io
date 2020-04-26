#!/usr/bin/env ts-node

import test  from 'blue-tape'

import {
  Sockie,
}                   from './sockie'

test('tbw', async (t) => {
  const s = new Sockie()
  t.ok(s, 's')
})
