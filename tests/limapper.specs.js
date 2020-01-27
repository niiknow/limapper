import test from 'ava'
import limapper from '../src/index.js'

test('limapper return correct name', t => {
  const ip = new limapper()
  t.is(ip.name, 'limapper')
})
