import test from 'ava'
import Limapper from '../src/index.js'

test('Limapper return correct name', t => {
  const ip = new Limapper()
  t.is(ip.name, 'Limapper')
})
