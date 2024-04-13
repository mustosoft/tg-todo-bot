module.exports = {
    BOT_NAME: 'Todo-Check Bot',
    OID_RE: '[a-fA-F\\d]{24}', // lower case
    OWNER_RE: '(?<ownerType>user|channel|chat)Id:(?<ownerId>\\d+)',
    MAX_SYNCED_INSTANCES: 5,
};
