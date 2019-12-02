const birthdays = require('../db/birthdays');

/**
 * Return application state information.
 *
 * @returns {Promise<void>}
 */
module.exports.getAppState = async (res) => {
    const state = {};
    state.birthdays =  await birthdays.getBirthdays();
    state.shouldDisplayBirthdays = state.birthdays.length > 0;
    return state;
};