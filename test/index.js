'use strict';

const Fs = require('fs');
const Os = require('os');
const Path = require('path');

const Code = require('code');
const FormData = require('form-data');
const Hapi = require('hapi');
const Lab = require('lab');
const StreamToPromise = require('stream-to-promise');

const Houdin = require('../lib');

const lab = exports.lab = Lab.script();

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
                    payload: Houdin.validate
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

        StreamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    lab.test('should return error if the file type cannot be guessed', (done) => {

        const invalid = Path.join(Os.tmpdir(), 'invalid');

        Fs.createWriteStream(invalid).end(new Buffer([0x00]));

        const form = new FormData();
        form.append('file', Fs.createReadStream(invalid));
        form.append('foo', 'bar');

        StreamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

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

        const unknown = Path.join(Os.tmpdir(), 'unknown');

        Fs.createWriteStream(unknown).end(new Buffer([0x00, 0x00]));

        const form = new FormData();
        form.append('file', Fs.createReadStream(unknown));
        form.append('foo', 'bar');

        StreamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

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

        const png = Path.join(Os.tmpdir(), 'foo.png');
        const gif = Path.join(Os.tmpdir(), 'foo.gif');

        Fs.createWriteStream(png).end(new Buffer([0x89, 0x50]));
        Fs.createWriteStream(gif).end(new Buffer([0x47, 0x49]));

        const form = new FormData();
        form.append('file1', Fs.createReadStream(gif));
        form.append('file2', Fs.createReadStream(png));
        form.append('file3', Fs.createReadStream(gif));
        form.append('foo', 'bar');

        StreamToPromise(form).then((payload) => {

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

        const png = Path.join(Os.tmpdir(), 'foo.png');

        Fs.createWriteStream(png).end(new Buffer([0x89, 0x50]));

        const form = new FormData();
        form.append('file1', Fs.createReadStream(png));
        form.append('file2', Fs.createReadStream(png));
        form.append('foo', 'bar');

        StreamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
});
