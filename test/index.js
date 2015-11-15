'use strict';

const Lab = require('lab');
const Code = require('code');

const lab = exports.lab = Lab.script();
const validator = require('../lib');

lab.experiment('houdin', () => {

    lab.experiment('validate()', () => {

        lab.test('should work', (done) => {

            Code.expect(validator.validate).to.be.a.function();
            validator.validate('foobar', null, (err) => {

                Code.expect(err).to.not.exist();
            });

            done();
        });
    });
});
