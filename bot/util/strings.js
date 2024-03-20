/**
 * Trims empty lines from a string
 * @param {string} str String to trim empty lines
 * @returns {string} String with empty lines trimmed
 */
function trimEmptyLines(str) {
    return str.trim().replace(/^\s*\n/gm, '');
}

module.exports = {
    trimEmptyLines,
};
