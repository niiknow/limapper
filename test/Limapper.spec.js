/*global describe, it, before */

import chai from 'chai';
import Library from '../lib/limapper.js';

chai.expect();

const expect = chai.expect;

let lib;

describe('Given an instance of my limapper',  () => {
  before(() => {
    lib = new Limapper();
  });
  describe('when I need the name', () => {
    it('should return the name', () => {
      expect(lib.name).to.be.equal('Limapper');
    });
  });
});
