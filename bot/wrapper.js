const logger = require('./logger');

/**
 * Wraps an async function to handle its error.
 *
 * @param {Function} func The async function to be wrapped.
 * @returns {Promise} A new async function that handles the error.
 */
function wrap(func) {
    // eslint-disable-next-line consistent-return
    async function wrappedFunc(...args) {
        try {
            return await func(...args);
        } catch (error) {
            logger.error(`${error}\nSTACK: ${error.stack}`);
        }
    }

    return wrappedFunc;
}

module.exports = wrap;
