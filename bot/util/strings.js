/**
 * Trims empty lines from a string
 * @param {string} str String to trim empty lines
 * @returns {string} String with empty lines trimmed
 */
function trimEmptyLines(str) {
    return str.trim().replace(/^\s*\n/gm, '');
}

/**
 * Removes new lines from a string
 * @param {string} str String to remove new lines
 * @returns {string} String with new lines removed
 */
function removeNewLines(str) {
    return str.replace(/\n/g, '');
}

module.exports = {
    trimEmptyLines,
    removeNewLines,
};
