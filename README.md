# houdin
Route-level file type validation for [hapi](https://github.com/hapijs/hapi) parsed in-memory `multipart/form-data` request payloads. Also works as a standalone module.

[![NPM Version][version-img]][version-url] [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url] [![Dependencies][david-img]][david-url] [![Dev Dependencies][david-dev-img]][david-dev-url]

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
  - [`validate(payload, options)`](#validatepayload-options)
    - [Hapi](#hapi)
    - [Standalone](#standalone)
- [Supported File Types](#supported-file-types)

## Installation
Install via [NPM](https://www.npmjs.org).

```sh
$ npm install houdin
```

## Usage
### `validate(payload, options)`
Validates all `Buffer` values in a `payload` given a `whitelist` of file types provided in the `options`. Throws a [joi](https://github.com/hapijs/joi)-like `ValidationError` if some file type is not allowed or unknown otherwise it returns the original payload.

#### Hapi

```js
const Hapi = require('hapi');
const Houdin = require('houdin');

const server = new Hapi.Server({
    routes: {
        validate: {
            options: {
                whitelist: ['image/png']
            }
        }
    }
});

server.route({
    options: {
        validate: {
            // override the default `failAction` if you want further
            // details about the validation error
            failAction: (request, h, err) => {
                // throw the error as is
                throw err;
            },
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
const png = Buffer.from('89504e470d0a1a0a', 'hex');

const payload = Houdin.validate({ file: png }, options);

console.log(payload); // { file: <Buffer 89 50 4e 47 0d 0a 1a 0a> }
```

```js
const Houdin = require('houdin');

const options = { whitelist: ['image/png'] };
const gif = Buffer.from('474946383761', 'hex');

try {
    Houdin.validate({ file: gif }, options);
}
catch (err) {
    console.log(err); // [ValidationError: child "file" fails because ["file" type is not allowed]]
}
```

## Supported File Types
The same as [file-type](https://github.com/sindresorhus/file-type/tree/v7.0.0#supported-file-types).

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
