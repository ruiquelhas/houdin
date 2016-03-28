'use strict';

const Hoek = require('hoek');
const Magic = require('file-type');

const internals = {};

internals.validate = function (payload, options, next) {

    for (const item in payload) {
        if (payload[item] instanceof Buffer) {
            const type = Magic(payload[item]);

            if (!type) {
                return next({ name: item, description: 'type is unknown' });
            }

            const list = options.whitelist;

            if (!Hoek.contain(list, type.ext) && !Hoek.contain(list, type.mime)) {
                return next({ name: item, description: 'type is not allowed' });
            }
        }
    }

    next();
};

exports.validate = function (payload, options, next) {

    internals.validate(payload, options, (err) => {

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
