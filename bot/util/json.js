/**
 * JSON custom parser for Buffer object
 * @param {string} k Key
 * @param {any} v Value
 * @returns {any}
 */
function bufferParser(k, v) {
    if (this[k] instanceof Buffer) {
        return { ...v, string: this[k].toString('utf8') };
    }

    return v;
}

module.exports = {
    bufferParser,
};
