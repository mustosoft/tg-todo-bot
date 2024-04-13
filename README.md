## About this bot

Telegram Todo-Check Bot is a simple bot that helps you to manage your tasks in an interactive Todo list manner. It simply parses every line of a message into an inline keyboard button, and you can check or uncheck them by clicking on the buttons.

## Activity

![Alt](https://repobeats.axiom.co/api/embed/4081b49aa729cb94425ef9be96d03c3cc193943d.svg "Repobeats analytics image")

## How to Deploy

Use docker-compose to deploy the bot. You need to set the environment variable

### Setup Environment

```bash
TOKEN=<YOUR_BOT_TOKEN>
API_ID=<YOUR_API_ID>
API_HASH=<YOUR_API_HASH>
MONGO_URI=mongodb://db:27017/bot
ADMIN_CHAT_ID=<YOUR_ADMIN_CHAT_ID>
```

- `YOUR_BOT_TOKEN`
  The token of your bot, you can get it from [BotFather](https://t.me/BotFather)

- `YOUR_API_ID` and `API_HASH`
  You can get them from [Telegram API](https://my.telegram.org/auth). Login into your Telegram account

- `MONGO_URI`
  The URI of your MongoDB database. You can use a local database or a cloud database like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

- `ADMIN_CHAT_ID`
  The chat id of the admin or you. It is the user the notification should sent to. You can get it by sending `/id` to [userinfobot](https://t.me/userinfobot). Note that the user should have started a chat with the bot

### Run The Bot

```bash
docker-compose -f docker-compose.yml up --build -d
```

## Change Logs

### [1.0.0](https://github.com/mustosoft/tg-todo-bot/releases/tag/v1.0.0) (2024-03-17)

- Initial release

Full Changelog: https://github.com/mustosoft/tg-todo-bot/commits/v1.0.0

### [1.2.0-alpha](https://github.com/mustosoft/tg-todo-bot/releases/tag/v1.2.0-alpha) (2024-03-22)

- Add Title feature
- Add Edit feature
- Improve code
- Setup tests
- Add readme
- Fix ESLint issues

Full Changelog: https://github.com/mustosoft/tg-todo-bot/compare/v1.0.0...v1.2.0-alpha
