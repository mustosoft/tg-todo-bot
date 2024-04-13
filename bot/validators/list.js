const joi = require('joi');

const { ITEM_STATES, PEER_TYPES } = require('../consts/list');

const itemStateValidator = joi.string().required().valid(...Object.values(ITEM_STATES));
const ownerValidator = joi.object({
    ownerType: joi.string().valid(...Object.values(PEER_TYPES)).required(),
    ownerId: joi.number().required(),
});

module.exports = {
    itemStateValidator,
    createOneValidator: joi.object({
        owner: ownerValidator.required().options({ stripUnknown: true }),
        name: joi.string().trim().required(),
        items: joi.array().items(
            joi.object({
                state: itemStateValidator,
                text: joi.string().trim().required(),
            }).options({ stripUnknown: true }),
        ).required(),
    }).options({ stripUnknown: true }),
};
