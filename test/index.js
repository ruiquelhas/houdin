'use strict';

const fs = require('fs');
const path = require('path');

const Code = require('code');
const FormData = require('form-data');
const Hapi = require('hapi');
const Lab = require('lab');
const Magik = require('magik');
const sinon = require('sinon');
const streamToPromise = require('stream-to-promise');

const lab = exports.lab = Lab.script();
const houdin = require('../lib');

lab.experiment('houdin', () => {

    let server;

    lab.before((done) => {

        server = new Hapi.Server();
        server.connection({
            routes: {
                validate: {
                    options: {
                        whitelist: ['png']
                    }
                }
            }
        });

        server.route({
            config: {
                validate: {
                    payload: houdin.validate
                },
                handler: (request, reply) => reply()
            },
            method: 'POST',
            path: '/'
        });

        done();
    });

    lab.test('should return control to the server if the payload does not contain any file', (done) => {

        const form = new FormData();
        form.append('foo', 'bar');

        streamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    lab.test('should return error if the file type cannot be guessed', (done) => {

        sinon.stub(Magik, 'guess');
        Magik.guess.yieldsAsync(new Error());

        // Use payload with a file of a known type to ensure Magik is used.
        const file = path.join(__dirname, 'static', 'file.gif');

        const form = new FormData();
        form.append('file', fs.createReadStream(file));
        form.append('foo', 'bar');

        streamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Magik.guess.restore();

                Code.expect(response.statusCode).to.equal(400);
                Code.expect(response.result).to.include(['message', 'validation']);
                Code.expect(response.result.message).to.equal('child \"file\" fails because [\"file\" could not be validated]');
                Code.expect(response.result.validation).to.include(['source', 'keys']);
                Code.expect(response.result.validation.source).to.equal('payload');
                Code.expect(response.result.validation.keys).to.include('file');
                done();
            });
        });
    });

    lab.test('should return error if the file type is not known', (done) => {

        sinon.stub(Magik, 'guess');
        Magik.guess.yieldsAsync(null, []);

        // Use payload with a file of a known type to ensure Magik is used.
        const file = path.join(__dirname, 'static', 'file.gif');

        const form = new FormData();
        form.append('file', fs.createReadStream(file));
        form.append('foo', 'bar');

        streamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Magik.guess.restore();

                Code.expect(response.statusCode).to.equal(400);
                Code.expect(response.result).to.include(['message', 'validation']);
                Code.expect(response.result.message).to.equal('child \"file\" fails because [\"file\" type is unknown]');
                Code.expect(response.result.validation).to.include(['source', 'keys']);
                Code.expect(response.result.validation.source).to.equal('payload');
                Code.expect(response.result.validation.keys).to.include('file');
                done();
            });
        });
    });

    lab.test('should return error if some file in the payload is not allowed', (done) => {

        const file1 = path.join(__dirname, 'static', 'file.gif');
        const file2 = path.join(__dirname, 'static', 'file.png');

        const form = new FormData();
        form.append('file1', fs.createReadStream(file1));
        form.append('file2', fs.createReadStream(file2));
        form.append('file3', fs.createReadStream(file1));
        form.append('foo', 'bar');

        streamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(400);
                Code.expect(response.result).to.include(['message', 'validation']);
                Code.expect(response.result.message).to.equal('child \"file1\" fails because [\"file1\" type is not allowed]');
                Code.expect(response.result.validation).to.include(['source', 'keys']);
                Code.expect(response.result.validation.source).to.equal('payload');
                Code.expect(response.result.validation.keys).to.include('file1');
                done();
            });
        });
    });

    lab.test('should return control to the server if all files the payload are allowed', (done) => {

        const file = path.join(__dirname, 'static', 'file.png');

        const form = new FormData();
        form.append('file1', fs.createReadStream(file));
        form.append('file2', fs.createReadStream(file));
        form.append('foo', 'bar');

        streamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
});
