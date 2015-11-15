'use strict';

const Hoek = require('hoek');
const Items = require('items');
const Magik = require('magik');
const some = require('lodash.some');

const internals = {};

internals.validate = function (payload, options) {

    return function (item, next) {

        if (!(payload[item] instanceof Buffer)) {
            return next();
        }

        Magik.guess(payload[item], (err, types) => {

            if (err) {
                return next({ name: item, description: 'could not be validated' });
            }

            if (!types.length) {
                return next({ name: item, description: 'type is unknown' });
            }

            if (!Hoek.contain(options.whitelist, types)) {
                return next({ name: item, description: 'type is not allowed' });
            }

            next();
        });
    };
};

exports.validate = function (payload, options, next) {

    if (!some(payload, (v) => v instanceof Buffer)) {
        return next();
    }

    const items = Object.keys(payload);
    Items.serial(items, internals.validate(payload, options), (err) => {

        if (err) {
            const msg = `child \"${err.name}\" fails because [\"${err.name}\" ${err.description}]`;
            const error = new Error(msg);
            error.name = 'ValidationError';
            error.details = [{
                message: err.description,
                path: err.name,
                context: {
                    key: err.name
                }
            }];

            return next(error);
        }

        next(null, payload);
    });
};
