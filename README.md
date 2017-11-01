# houdin
Route-level file type validation for [hapi](https://github.com/hapijs/hapi) parsed in-memory `multipart/form-data` request payloads. Also works as a standalone module.

[![NPM Version][version-img]][version-url] [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url] [![Dependencies][david-img]][david-url] [![Dev Dependencies][david-dev-img]][david-dev-url]

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
Validates all `Buffer` values in a `payload` given a `whitelist` of file types provided in the `options`. Results in a [joi](https://github.com/hapijs/joi)-like `ValidationError` if some file type is not allowed or unknown otherwise it returns the original parsed payload to account for additional custom validation.

#### Hapi

```js
const Hapi = require('hapi');
const Houdin = require('houdin');

const server = new Hapi.Server();

server.connection({
    routes: {
        validate: {
            options: {
                whitelist: ['image/png']
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

const options = { whitelist: ['image/png'] };
const png = Buffer.from('89504e47', 'hex');

Houdin.validate({ file: png }, options, (err, value) => {

    console.log(err); // null
    console.log(value); // { file: <Buffer 89 50 4e 47> }
});
```

```js
const Houdin = require('houdin');

const options = { whitelist: ['image/png'] };
const gif = Buffer.from('47494638', 'hex');

Houdin.validate({ file: gif }, options, (err, value) => {

    console.log(err); // [ValidationError: child "file" fails because ["file" type is not allowed]]
    console.log(value); // undefined
});
```

## Supported File Types
The same as [file-type](https://github.com/sindresorhus/file-type#supported-file-types).

[coveralls-img]: https://img.shields.io/coveralls/ruiquelhas/houdin.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/ruiquelhas/houdin
[david-img]: https://img.shields.io/david/ruiquelhas/houdin.svg?style=flat-square
[david-url]: https://david-dm.org/ruiquelhas/houdin
[david-dev-img]: https://img.shields.io/david/dev/ruiquelhas/houdin.svg?style=flat-square
[david-dev-url]: https://david-dm.org/ruiquelhas/houdin?type=dev
[version-img]: https://img.shields.io/npm/v/houdin.svg?style=flat-square
[version-url]: https://www.npmjs.com/package/houdin
[travis-img]: https://img.shields.io/travis/ruiquelhas/houdin.svg?style=flat-square
[travis-url]: https://travis-ci.org/ruiquelhas/houdin
