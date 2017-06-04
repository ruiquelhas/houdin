'use strict';

const Hoek = require('hoek');
const Magic = require('file-type');

const internals = {};

internals.validate = function (payload, options, next) {

    Object.keys(Object.assign({}, payload)).forEach((key) => {

        const parameter = payload[key];

        if (!(parameter instanceof Buffer)) {
            return;
        }

        const type = Magic(parameter);
        const list = options.whitelist || [];

        if (!type) {
            return next({ name: key, description: 'type is unknown' });
        }

        if (Hoek.contain(list, type.ext) || Hoek.contain(list, type.mime)) {
            return;
        }

        return next({ name: key, description: 'type is not allowed' });
    });

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
