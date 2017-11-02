'use strict';

const Hoek = require('hoek');
const Magic = require('file-type');

const internals = {};

internals.validate = function (payload, { whitelist = [] }) {

    const keys = Object.keys(Object.assign({}, payload));

    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const parameter = payload[key];

        if (!(parameter instanceof Buffer)) {
            continue;
        }

        const type = Magic(parameter);

        if (!type) {
            const error = new Error('type is unknown');
            error.item = key;
            error.valid = whitelist;

            throw error;
        }

        if (Hoek.contain(whitelist, type.ext) || Hoek.contain(whitelist, type.mime)) {
            continue;
        }

        const error = new Error('type is not allowed');
        error.item = key;
        error.valid = whitelist;

        throw error;
    };

    return payload;
};

exports.validate = function (payload, options) {

    try {
        return internals.validate(payload, options);
    }
    catch ({ item, message, valid }) {
        const msg = `child \"${item}\" fails because [\"${item}\" ${message}]`;
        const error = new Error(msg);
        error.isJoi = true;
        error.name = 'ValidationError';
        error.details = [{
            message,
            path: [item],
            context: {
                key: item
            }
        }];

        throw error;
    }
};
