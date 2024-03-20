const { trimEmptyLines } = require('../util/strings');

test('trim empty lines', () => {
    const str = 'Hello\nWorld\n\nHow are you?\n';

    expect(trimEmptyLines(str)).toBe('Hello\nWorld\nHow are you?');
});
