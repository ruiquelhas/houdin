# houdin
Route-level file type validation for [hapi](https://github.com/hapijs/hapi) parsed in-memory `multipart/form-data` request payloads.
Also works as a standalone module.

[![NPM Version][fury-img]][fury-url] [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url] [![Dependencies][david-img]][david-url]

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [`validate(payload, options, fn)`](#validatepayload-options-fn)
        - [Hapi](#hapi)
        - [Standalone](#standalone)
- [Supported File Types](#supported-file-types)

## Installation
Install via [NPM](https://www.npmjs.org).

```sh
$ npm install houdin
```

## Usage

### `validate(payload, options, fn)`

Validates all `Buffer` values in a `payload` given a `whitelist` of file types provided in the `options`.
Results in a [joi](https://github.com/hapijs/joi)-like `ValidationError` if some file type is not allowed or unknown otherwise it returns the original parsed payload to account for additional custom validation.

#### Hapi

```js
const Hapi = require('hapi');
const Houdin = require('houdin');

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
        payload: {
            output: 'data',
            parse: true
        }
    }
});
```

### Standalone

```js
const Houdin = require('houdin');

const options = { whitelist: ['png'] };

Houdin.validate({ file: new Buffer([0x89, 0x50]) }, options, (err, value) => {

    console.log(err); // null
    console.log(value); // { file: <Buffer 89 50> }
});

Houdin.validate({ file: new Buffer([0x47, 0x49]) }, options, (err, value) => {

    console.log(err); // [ValidationError: child "file" fails because ["file" type is not allowed]]
    console.log(value); // undefined
});
```

## Supported File Types

The same as [magik](https://github.com/ruiquelhas/magik#supported-file-types).

[coveralls-img]: https://coveralls.io/repos/ruiquelhas/houdin/badge.svg
[coveralls-url]: https://coveralls.io/github/ruiquelhas/houdin
[david-img]: https://david-dm.org/ruiquelhas/houdin.svg
[david-url]: https://david-dm.org/ruiquelhas/houdin
[fury-img]: https://badge.fury.io/js/houdin.svg
[fury-url]: https://badge.fury.io/js/houdin
[travis-img]: https://travis-ci.org/ruiquelhas/houdin.svg
[travis-url]: https://travis-ci.org/ruiquelhas/houdin
