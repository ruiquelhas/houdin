'use strict';

const Fs = require('fs');
const Os = require('os');
const Path = require('path');

const Code = require('code');
const Form = require('multi-part');
const Hapi = require('hapi');
const Lab = require('lab');

const Houdin = require('../lib');

const lab = exports.lab = Lab.script();

lab.experiment('houdin', () => {

    let server;
    let unknown;
    let png;
    let gif;

    lab.before((done) => {

        server = new Hapi.Server();
        server.connection({
            routes: {
                validate: {
                    options: {
                        whitelist: ['image/png', 'png']
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

    lab.beforeEach((done) => {
        // Create unknown format file
        unknown = Path.join(Os.tmpdir(), 'unknown');
        Fs.createWriteStream(unknown).on('error', done).end(Buffer.from('0000', 'hex'), done);
    });

    lab.beforeEach((done) => {
        // Create fake png file
        png = Path.join(Os.tmpdir(), 'foo.png');
        Fs.createWriteStream(png).on('error', done).end(Buffer.from('89504e47', 'hex'), done);
    });

    lab.beforeEach((done) => {
        // Create fake gif file
        gif = Path.join(Os.tmpdir(), 'foo.gif');
        Fs.createWriteStream(gif).on('error', done).end(Buffer.from('47494638', 'hex'), done);
    });

    lab.test('should return control to the server if the payload does not contain any file', (done) => {

        const form = new Form();
        form.append('foo', 'bar');

        server.inject({ headers: form.getHeaders(), method: 'POST', payload: form.stream(), url: '/' }, (response) => {

            Code.expect(response.statusCode).to.equal(200);
            done();
        });
    });

    lab.test('should return error if the file type is not known', (done) => {

        const form = new Form();
        form.append('file', Fs.createReadStream(unknown));
        form.append('foo', 'bar');

        server.inject({ headers: form.getHeaders(), method: 'POST', payload: form.stream(), url: '/' }, (response) => {

            Code.expect(response.statusCode).to.equal(400);
            Code.expect(response.result).to.include(['message', 'validation']);
            Code.expect(response.result.message).to.equal('child \"file\" fails because [\"file\" type is unknown]');
            Code.expect(response.result.validation).to.include(['source', 'keys']);
            Code.expect(response.result.validation.source).to.equal('payload');
            Code.expect(response.result.validation.keys).to.include('file');
            done();
        });
    });

    lab.test('should return error if some file in the payload is not allowed', (done) => {

        const form = new Form();
        form.append('file1', Fs.createReadStream(gif));
        form.append('file2', Fs.createReadStream(png));
        form.append('file3', Fs.createReadStream(gif));
        form.append('foo', 'bar');

        server.inject({ headers: form.getHeaders(), method: 'POST', payload: form.stream(), url: '/' }, (response) => {

            Code.expect(response.statusCode).to.equal(400);
            Code.expect(response.result).to.include(['message', 'validation']);
            Code.expect(response.result.message).to.equal('child \"file1\" fails because [\"file1\" type is not allowed]');
            Code.expect(response.result.validation).to.include(['source', 'keys']);
            Code.expect(response.result.validation.source).to.equal('payload');
            Code.expect(response.result.validation.keys).to.include('file1');
            done();
        });
    });

    lab.test('should return control to the server if all files the payload are allowed', (done) => {

        const form = new Form();
        form.append('file1', Fs.createReadStream(png));
        form.append('file2', Fs.createReadStream(png));
        form.append('foo', 'bar');

        server.inject({ headers: form.getHeaders(), method: 'POST', payload: form.stream(), url: '/' }, (response) => {

            Code.expect(response.statusCode).to.equal(200);
            done();
        });
    });
});
