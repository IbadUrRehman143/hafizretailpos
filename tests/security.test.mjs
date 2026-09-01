import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('auth proxy exists',()=>assert.equal(fs.existsSync('proxy.ts'),true));
test('example env documents auth secret',()=>assert.match(fs.readFileSync('.env.example','utf8'),/AUTH_SECRET=/));
test('messaging log model exists',()=>assert.match(fs.readFileSync('src/prisma/contract.prisma','utf8'),/model MessageLog/));
