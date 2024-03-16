const { BOT_NAME } = require('../consts/var');

/**
 *
 * @param {import('telegram').TelegramClient} client Telegram client
 */
async function sendBotStartedNotification(client) {
    if (!process.env.ADMIN_CHAT_ID) {
        throw new Error('ADMIN_CHAT_ID is not set');
    }

    await client.sendMessage(
        Number(process.env.ADMIN_CHAT_ID),
        { message: `**[${BOT_NAME}]** Bot started` },
    );
}

module.exports = {
    sendBotStartedNotification,
};
