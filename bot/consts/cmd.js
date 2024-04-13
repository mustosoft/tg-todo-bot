const { Api } = require('telegram');
const { MAX_SYNCED_INSTANCES } = require('./var');

// This module contains the messages for static commands
module.exports = {
    START: {
        parseMode: 'markdown',
        message:
`Welcome to the Todo-Check bot! You can start creating your list by sending me a list of items separated by a new line, just like the example below:

**Complete project report**
**Attend team meeting at 2 PM**
**Send updated email to clients**


You can also use the hashtag (#) at the first line to give a title to your list, like this:

**# My tasks**
**Complete project report**
**Attend team meeting at 2 PM**
**Send updated email to clients**


**Try it now!**

For more information, type /help
`,
    },
    ABOUT: {
        parseMode: 'html',
        message:
`This bot is created and maintained by <a href="tg://user?id=147948549">Mustosoft</a>
The bot is open source and available at <a href="https://github.com/mustosoft/tg-todo-bot">Github</a>

🌐 <a href="https://mustosoft.dev/">Dev</a>`,
    },
    HELP: {
        parseMode: 'html',
        buttons: new Api.KeyboardButtonCallback({
            text: '👍 Got it and delete this long message',
            data: Buffer.from('delete-help'),
        }),
        message:
`<b>❔ How to use the Todo-Check bot ❔</b>


<u><b>📝 Creating Todo List</b></u>

To create a new list, you just need to send me a list of items separated by a new line. You can also use the hashtag (#) at the first line to give a title to your list. For example:

# My Tasks
Complete project report
Attend team meeting at 2 PM
Send updated email to clients

Note that the title is optional, but it can help you to organize your lists when you save them. The default title is "<b>Your list</b>".

<u><b>💾 Saving Todo List</b></u>

To save a list, you can use the "<b>Save</b>" button at the bottom of the list. Saved list can be accessed later by typing /mylist then select the list you want to view, and the message will be an instance of the list.

When you make changes to the list, it will be updated across all saved instances (maximum is ${MAX_SYNCED_INSTANCES}), so they will be in sync.

<u><b>📋 Viewing Saved Todo List</b></u>

To view your saved lists, you can type /mylist. The bot will show you a list of your saved lists as buttons. You can select the list you want to view, and the message will be an instance of the list. The order of the lists is from the latest saved list.

<u><b>🗑 Unsave Todo List</b></u>

To unsave a list, you can use the "<b>Unsave</b>" button at the bottom of the list. This action will remove the list from your saved lists. Note that every list instance will be unsaved and they are not in sync anymore.

___

For more update and information, you can visit the official bot channel <a href="https://t.me/TgTodoCheckBotUpdates">here</a>
`,
    },
};
