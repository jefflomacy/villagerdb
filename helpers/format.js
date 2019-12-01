const moment = require('moment');

/**
 * Zodiac start/end dates.
 * @type {*[]}
 */
const zodiacData = [
    {title: 'Capricorn',   start: moment('12-22-1999', 'MM-DD-YYYY').unix(), end: moment('01-20-2000', 'MM-DD-YYYY').unix()},
    {title: 'Aquarius',    start: moment('01-20-2000', 'MM-DD-YYYY').unix(), end: moment('02-19-2000', 'MM-DD-YYYY').unix()},
    {title: 'Pisces',      start: moment('02-19-2000', 'MM-DD-YYYY').unix(), end: moment('03-21-2000', 'MM-DD-YYYY').unix()},
    {title: 'Aries',       start: moment('03-21-2000', 'MM-DD-YYYY').unix(), end: moment('04-20-2000', 'MM-DD-YYYY').unix()},
    {title: 'Taurus',      start: moment('04-20-2000', 'MM-DD-YYYY').unix(), end: moment('05-21-2000', 'MM-DD-YYYY').unix()},
    {title: 'Gemini',      start: moment('05-21-2000', 'MM-DD-YYYY').unix(), end: moment('06-21-2000', 'MM-DD-YYYY').unix()},
    {title: 'Cancer',      start: moment('06-21-2000', 'MM-DD-YYYY').unix(), end: moment('07-23-2000', 'MM-DD-YYYY').unix()},
    {title: 'Leo',         start: moment('07-23-2000', 'MM-DD-YYYY').unix(), end: moment('08-23-2000', 'MM-DD-YYYY').unix()},
    {title: 'Virgo',       start: moment('08-23-2000', 'MM-DD-YYYY').unix(), end: moment('09-23-2000', 'MM-DD-YYYY').unix()},
    {title: 'Libra',       start: moment('09-23-2000', 'MM-DD-YYYY').unix(), end: moment('10-23-2000', 'MM-DD-YYYY').unix()},
    {title: 'Scorpio',     start: moment('10-23-2000', 'MM-DD-YYYY').unix(), end: moment('11-22-2000', 'MM-DD-YYYY').unix()},
    {title: 'Sagittarius', start: moment('11-22-2000', 'MM-DD-YYYY').unix(), end: moment('12-22-2000', 'MM-DD-YYYY').unix()},
    {title: 'Capricorn',   start: moment('12-22-2000', 'MM-DD-YYYY').unix(), end: moment('12-31-2000', 'MM-DD-YYYY').unix()},
    {title: 'Capricorn',   start: moment('12-31-2000', 'MM-DD-YYYY').unix(), end: moment('01-20-2001', 'MM-DD-YYYY').unix()}
];

/**
 * Game data with English name and sort order.
 *
 * @type {{}}
 */
const games = {
    'af':   {shortTitle: 'AF',   title: 'Animal Forest',    year: 2001, order: 1},
    'af+':  {shortTitle: 'AF+',  title: 'Animal Forest+',   year: 2001, order: 2},
    'ac':   {shortTitle: 'AC',   title: 'Animal Crossing',  year: 2002, order: 3},
    'afe+': {shortTitle: 'AFe+', title: 'Animal Forest e+', year: 2003, order: 4},
    'ww':   {shortTitle: 'WW',   title: 'Wild World',       year: 2005, order: 5},
    'cf':   {shortTitle: 'CF',   title: 'City Folk',        year: 2008, order: 6},
    'nl':   {shortTitle: 'NL',   title: 'New Leaf',         year: 2012, order: 7},
    'nh':   {shortTitle: 'NH',   title: 'New Horizons',     year: 2020, order: 8}
};
module.exports.games = games;

/**
 * Capitalize first letter of given string.
 *
 * @param string
 * @returns {*}
 */
function capFirstLetter(string) {
    if (string.length === 0) {
        return string;
    }

    return string[0].toUpperCase() + string.substr(1, string.length - 1);
}
module.exports.capFirstLetter = capFirstLetter;

/**
 * Format a villager for user display.
 *
 * @param villager
 */
function formatVillager(villager) {
    const result = {};

    // Name, gender, species and birthday
    result.id = villager.id;
    result.name = villager.name;
    result.gender = capFirstLetter(villager.gender);
    result.species = capFirstLetter(villager.species);

    if (villager.birthday) {
        let momentBirthdate = moment(villager.birthday + '-2000', 'MM-DD-YYYY'); // we only store month/year, so add 2000.
        result.birthday = momentBirthdate.format('MMMM Do');
        result.zodiac = getZodiac(momentBirthdate);
    } else {
        result.birthday = 'Unknown';
        result.zodiac = 'Unknown';
    }

    // All the game-specific data, sort games in reverse chronological order.
    result.games = {};
    result.gameTitles = [];
    const gamesSorted = Object.entries(games)
        .sort((a, b) => {
            return (a[1].order >= b[1].order) ? -1 : 1;
        })
        .map((a) => {
            return a[0];
        });
    for (let game of gamesSorted) {
        let data = villager.games[game];
        if (data) {
            result.gameTitles.push(games[game].title);
            result.games[game] = {
                personality: capFirstLetter(data.personality),
                clothes: data.clothes,
                song: data.song,
                phrase: data.phrase
            };
        }
    }

    // Coffee data, if we have any (new leaf only)
    result.coffee = [];
    if (villager.games['nl'] && villager.games['nl'].coffee) {
        result.coffee.push(villager.games['nl'].coffee.beans + ',');
        result.coffee.push(villager.games['nl'].coffee.milk + ',');
        result.coffee.push(villager.games['nl'].coffee.sugar);
    }

    return result;
}
module.exports.formatVillager = formatVillager;

/**
 * Get zodiac sign from moment date.
 *
 * @param date from moment
 * @return name of zodiac sign
 */
function getZodiac(date) {
    let unix = date.unix();
    for (let z of zodiacData) {
        if (unix >= z.start && unix < z.end) {
            return z.title;
        }
    }
}
module.exports.getZodiac = getZodiac;

/**
 * Return a <word> or an <word> depending on first character.
 *
 * @param word
 * @returns {string}
 */
function aOrAn(word) {
    if (word.length === 0) {
        return '';
    }

    const firstChar = word[0].toLowerCase();
    if (firstChar === 'a' || firstChar === 'e' || firstChar === 'i' || firstChar === 'o' || firstChar === 'u') {
        return 'an ' + word;
    }

    return 'a ' + word;
}
module.exports.aOrAn = aOrAn;