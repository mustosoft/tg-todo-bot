const joi = require('joi');
const BigInt = require('big-integer');

module.exports = {
    OIDValidator: joi.string().hex().length(24).required(),
    BigIntValidator: joi
        .custom((value, helpers) => (
            (typeof value === 'bigint' || BigInt.isInstance(value))
                ? value
                : helpers.error('bigint.base')))
        .messages({ 'bigint.base': 'value must be a BigInt' }),
};
