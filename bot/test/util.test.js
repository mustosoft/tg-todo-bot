const { trimEmptyLines, removeNewLines } = require('../util/strings');

test('trim empty lines', () => {
    const cases = [
        {
            input: 'Hello\nWorld\n\nHow are you?\n',
            output: 'Hello\nWorld\nHow are you?',
        },
    ];

    cases.forEach(({ input, output }) => {
        expect(trimEmptyLines(input)).toBe(output);
    });
});

test('remove new lines', () => {
    const cases = [
        {
            input: 'Hello\nWorld\n\nHow are you?\n',
            output: 'HelloWorldHow are you?',
        },
    ];

    cases.forEach(({ input, output }) => {
        expect(removeNewLines(input)).toBe(output);
    });
});
