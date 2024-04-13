const { StopPropagation } = require('telegram/client/updates');

const { CallbackQueryEvent } = require('telegram/events/CallbackQuery');
const logger = require('./logger');

/**
 * Wraps an async function to handle its error. If the error is an instance of
 * `StopPropagation`, it will be thrown again.
 *
 * @param {Function} func The async function to be wrapped.
 * @returns {Promise} A new async function that handles the error.
 */
function wrap(func) {
    // eslint-disable-next-line consistent-return
    async function wrappedFunc(...args) {
        const [arg0] = args;

        try {
            return await func(...args);
        } catch (error) {
            if (error instanceof StopPropagation) {
                throw error;
            }

            if (arg0 instanceof CallbackQueryEvent) {
                await arg0.answer({ message: 'Sorry, unable to process your request.' });
            }

            logger.error(`${error}\nSTACK: ${error.stack}`);
        }
    }

    return wrappedFunc;
}

module.exports = wrap;
