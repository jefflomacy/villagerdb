/**
 * Return application state information.
 *
 * @returns {Promise<void>}
 */
module.exports.getAppState = async (res) => {
    const state = {};
    const birthdays = await res.app.locals.db.birthdays.getBirthdays();
    state.birthdays = birthdays;
    state.shouldDisplayBirthdays = birthdays.length > 0;
    return state;
};