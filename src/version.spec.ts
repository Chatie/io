#!/usr/bin/env ts-node

import { test } from 'tstest'

import {
  GIT_COMMIT_HASH,
  VERSION,
}                   from './version.js'

test('Make sure the VERSION is fresh in source code', async t => {
  t.equal(VERSION, '0.0.0', 'version should be 0.0.0 in source code, only updated before publish to NPM')
  t.equal(GIT_COMMIT_HASH, '', 'git commit hash should be empty')
})
