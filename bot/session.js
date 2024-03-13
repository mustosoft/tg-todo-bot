const fs = require('fs');

const SESSION_FILE = 'session';

function loadSession() {
    if (!fs.existsSync(SESSION_FILE)) {
        return '';
    }

    return fs.readFileSync(SESSION_FILE, { encoding: 'utf8', flag: 'r' });
}

function saveSession(sessionString) {
    return fs.writeFileSync(SESSION_FILE, sessionString, { encoding: 'utf8', flag: 'w' });
}

module.exports = {
    loadSession,
    saveSession,
};
