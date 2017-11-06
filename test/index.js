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

    let goodServer;
    let badServer;
    let unknown;
    let png;
    let gif;

    lab.before(() => {

        goodServer = new Hapi.Server({
            routes: {
                validate: {
                    options: {
                        whitelist: ['image/png', 'png']
                    }
                }
            }
        });

        badServer = new Hapi.Server({
            routes: {
                validate: {
                    options: { }
                }
            }
        });

        const validConfig = {
            method: 'POST',
            options: {
                handler: (request) => null,
                validate: {
                    failAction: (request, h, err) => {

                        throw err;
                    },
                    payload: Houdin.validate
                }
            },
            path: '/data'
        };

        goodServer.route(validConfig);
        badServer.route(validConfig);

        badServer.route({
            method: 'POST',
            options: {
                handler: (request) => null,
                payload: {
                    output: 'stream'
                }
            },
            path: '/stream'
        });

        badServer.route({
            method: 'POST',
            options: {
                handler: (request) => null,
                payload: {
                    output: 'file'
                }
            },
            path: '/file'
        });
    });

    lab.beforeEach(() => {
        // Create unknown format file
        unknown = Path.join(Os.tmpdir(), 'unknown');

        return new Promise((resolve, reject) => {

            Fs.createWriteStream(unknown)
                .on('error', reject)
                .end(Buffer.from('0000000000000000', 'hex'), resolve);
        });
    });

    lab.beforeEach(() => {
        // Create fake png file
        png = Path.join(Os.tmpdir(), 'foo.png');

        return new Promise((resolve, reject) => {

            Fs.createWriteStream(png)
                .on('error', reject)
                .end(Buffer.from('89504e470d0a1a0a', 'hex'), resolve);
        });
    });

    lab.beforeEach(() => {
        // Create fake gif file
        const magicNumber = ['474946383761', '474946383961'][Math.floor(Math.random())];
        gif = Path.join(Os.tmpdir(), 'foo.gif');

        return new Promise((resolve, reject) => {

            Fs.createWriteStream(gif)
                .on('error', reject)
                .end(Buffer.from(magicNumber, 'hex'), resolve);
        });
    });

    lab.test('should return control to the server if the payload does not contain any file', async () => {

        const form = new Form();
        form.append('foo', 'bar');

        const { statusCode } = await goodServer.inject({
            headers: form.getHeaders(),
            method: 'POST',
            payload: form.stream(),
            url: '/data'
        });

        Code.expect(statusCode).to.equal(200);
    });

    lab.test('should return error if the file type is not known', async () => {

        const form = new Form();
        form.append('file', Fs.createReadStream(unknown));
        form.append('foo', 'bar');

        const { result, statusCode } = await goodServer.inject({
            headers: form.getHeaders(),
            method: 'POST',
            payload: form.stream(),
            url: '/data'
        });

        Code.expect(statusCode).to.equal(400);
        Code.expect(result).to.include(['message', 'validation']);
        Code.expect(result.message).to.equal('child \"file\" fails because [\"file\" type is unknown]');
        Code.expect(result.validation).to.include(['source', 'keys']);
        Code.expect(result.validation.source).to.equal('payload');
        Code.expect(result.validation.keys).to.include('file');
    });

    lab.test('should return error if some file in the payload is not allowed', async () => {

        const form = new Form();
        form.append('file1', Fs.createReadStream(gif));
        form.append('file2', Fs.createReadStream(png));
        form.append('file3', Fs.createReadStream(gif));
        form.append('foo', 'bar');

        const { result, statusCode } = await goodServer.inject({
            headers: form.getHeaders(),
            method: 'POST',
            payload: form.stream(),
            url: '/data'
        });

        Code.expect(statusCode).to.equal(400);
        Code.expect(result).to.include(['message', 'validation']);
        Code.expect(result.message).to.equal('child \"file1\" fails because [\"file1\" type is not allowed]');
        Code.expect(result.validation).to.include(['source', 'keys']);
        Code.expect(result.validation.source).to.equal('payload');
        Code.expect(result.validation.keys).to.include('file1');
    });

    lab.test('should return error if no whitelist is specified', async () => {

        const form = new Form();
        form.append('file', Fs.createReadStream(png));

        const { result, statusCode } = await badServer.inject({
            headers: form.getHeaders(),
            method: 'POST',
            payload: form.stream(),
            url: '/data'
        });

        Code.expect(statusCode).to.equal(400);
        Code.expect(result).to.include(['message', 'validation']);
        Code.expect(result.message).to.equal('child \"file\" fails because [\"file\" type is not allowed]');
        Code.expect(result.validation).to.include(['source', 'keys']);
        Code.expect(result.validation.source).to.equal('payload');
        Code.expect(result.validation.keys).to.include('file');
    });

    lab.test('should return control to the server if all files the payload are allowed', async () => {

        const form = new Form();
        form.append('file1', Fs.createReadStream(png));
        form.append('file2', Fs.createReadStream(png));
        form.append('foo', 'bar');

        const { statusCode } = await goodServer.inject({
            headers: form.getHeaders(),
            method: 'POST',
            payload: form.stream(),
            url: '/data'
        });

        Code.expect(statusCode).to.equal(200);
    });

    lab.test('should return control to the server if the payload is parsed as a temporary file', async () => {

        const { statusCode } = await badServer.inject({
            method: 'POST',
            payload: undefined,
            url: '/file'
        });

        Code.expect(statusCode).to.equal(200);
    });

    lab.test('should return control to the server if the payload is parsed as a stream', async () => {

        const { statusCode } = await badServer.inject({
            method: 'POST',
            payload: undefined,
            url: '/stream'
        });

        Code.expect(statusCode).to.equal(200);
    });
});
