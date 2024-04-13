const bigInt = require('big-integer');
const {
    getIdOfPeer, getTypeOfPeer, getPeerIdFieldName, createPeerId,
} = require('../util/message');
const { trimEmptyLines, removeNewLines } = require('../util/strings');

describe('Trim empty lines', () => {
    const cases = [
        {
            name: 'empty lines trimmed',
            input: 'Hello\nWorld\n\nHow are you?\n',
            output: 'Hello\nWorld\nHow are you?',
        },
    ];

    cases.forEach(({ name, input, output }) => {
        test(name, () => {
            expect(trimEmptyLines(input)).toBe(output);
        });
    });
});

describe('Remove new lines', () => {
    const cases = [
        {
            name: 'new lines removed',
            input: 'Hello\nWorld\n\nHow are you?\n',
            output: 'HelloWorldHow are you?',
        },
    ];

    cases.forEach(({ name, input, output }) => {
        test(name, () => {
            expect(removeNewLines(input)).toBe(output);
        });
    });
});

describe('Get id of peer', () => {
    const cases = [
        {
            name: 'Peer id should be 123',
            input: { userId: bigInt(123) },
            output: bigInt(123),
        },
        {
            name: 'Peer id should be 456',
            input: { channelId: bigInt(456) },
            output: bigInt(456),
        },
        {
            name: 'Peer id should be 789',
            input: { chatId: bigInt(789) },
            output: bigInt(789),
        },
        {
            name: 'Peer id should be 1234',
            input: { userId: bigInt(1234), channelId: bigInt(456) },
            output: bigInt(1234),
        },
        {
            name: 'Peer id should be 1234',
            input: { userId: bigInt(1234), chatId: bigInt(789) },
            output: bigInt(1234),
        },
        {
            name: 'Peer id should be 456',
            input: { channelId: bigInt(456), chatId: bigInt(789) },
            output: bigInt(456),
        },
        {
            name: 'Peer id should be 1234',
            input: { userId: bigInt(1234), channelId: bigInt(456), chatId: bigInt(789) },
            output: bigInt(1234),
        },
    ];

    cases.forEach(({ name, input, output }) => {
        test(name, () => {
            expect(getIdOfPeer(input)).toStrictEqual(output);
        });
    });
});

describe('Get type of peer', () => {
    const cases = [
        {
            name: 'Peer type should be user',
            input: { className: 'PeerUser' },
            output: 'user',
        },
        {
            name: 'Peer type should be channel',
            input: { className: 'PeerChannel' },
            output: 'channel',
        },
        {
            name: 'Peer type should be chat',
            input: { className: 'PeerChat' },
            output: 'chat',
        },
    ];

    cases.forEach(({ name, input, output }) => {
        test(name, () => {
            expect(getTypeOfPeer(input)).toBe(output);
        });
    });
});

describe('Get peer id field name', () => {
    const cases = [
        {
            name: 'Peer id field name should be userId',
            input: { userId: bigInt(123) },
            output: 'userId',
        },
        {
            name: 'Peer id field name should be channelId',
            input: { channelId: bigInt(456) },
            output: 'channelId',
        },
        {
            name: 'Peer id field name should be chatId',
            input: { chatId: bigInt(789) },
            output: 'chatId',
        },
    ];

    cases.forEach(({ name, input, output }) => {
        test(name, () => {
            expect(getPeerIdFieldName(input)).toBe(output);
        });
    });
});

describe('Create peer id', () => {
    const cases = [
        {
            name: 'Peer id should be { className: User, userId: 123 }',
            input: ['user', 123n],
            output: { className: 'User', userId: '123' },
        },
        {
            name: 'Peer id should be { className: Channel, channelId: 456 }',
            input: ['channel', 456n],
            output: { className: 'Channel', channelId: '456' },
        },
        {
            name: 'Peer id should be { className: Chat, chatId: 789 }',
            input: ['chat', 789n],
            output: { className: 'Chat', chatId: '789' },
        },
    ];

    cases.forEach(({ name, input, output }) => {
        test(name, () => {
            expect(createPeerId(...input)).toStrictEqual(output);
        });
    });
});
