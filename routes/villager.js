const express = require('express');
const moment = require('moment');
const format = require('../helpers/format.js');
const villagers = require('../db/entity/villagers');

/**
 * Format a villager for user display.
 *
 * @param villager
 */
function formatVillager(villager) {
    const result = {};

    // Name, gender, species and birthday
    result.gender = format.capFirstLetter(villager.gender);
    result.species = format.capFirstLetter(villager.species);

    if (villager.birthday) {
        let momentBirthdate = moment(villager.birthday + '-2000', 'MM-DD-YYYY'); // we only store month/year, so add 2000.
        result.birthday = momentBirthdate.format('MMMM Do');
        result.zodiac = format.getZodiac(momentBirthdate);
    }

    // All the game-specific data, sort games in reverse chronological order.
    result.games = [];
    result.gameTitles = [];
    for (let gameId in format.games) {
        let game = villager.games[gameId];
        if (game) {
            let personality = format.capFirstLetter(game.personality);
            if (personality === 'Uchi') {
                personality += ' (Sisterly)'
            }
            result.gameTitles.push(format.games[gameId].title);
            result.games.push({
                gameTitle: format.games[gameId].title,
                hasClothes: typeof game.clothesName !== 'undefined',
                clothesName: game.clothesName,
                clothesUrl: game.clothesUrl,
                hasPersonality: typeof personality !== 'undefined',
                personality: personality,
                hasPhrase: typeof game.phrase !== 'undefined',
                phrase: game.phrase,
                hasSong: typeof game.song !== 'undefined',
                song: game.song,
                hasHobby: typeof game.hobby !== 'undefined',
                hobby: game.hobby,
                hasSubtype: typeof game.subtype !== 'undefined',
                subtype: game.subtype
            });
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

/**
 * Generate a sentence for the given villager.
 *
 * @param villager
 * @param formattedVillager
 */
function generateParagraph(villager, formattedVillager) {
    // Find the latest game they are in.
    let gameData = undefined;
    for (let gameId in format.games) {
        if (villager.games[gameId]) {
            gameData = villager.games[gameId];
            break;
        }
    }
    if (!gameData) {
        return '';
    }

    // Properties
    const name = villager.name;
    const pronoun = (villager.gender === 'male' ? 'he' : 'she');
    const posessivePronoun = (villager.gender == 'male' ? 'his' : 'her');
    const posessive = villager.name + '\'s';
    const species = formattedVillager.species.toLowerCase();
    const birthday = formattedVillager.birthday;
    const zodiac = formattedVillager.zodiac;

    // Personality
    let personality = gameData.personality.toLowerCase();
    if (personality === 'uchi') {
        personality += ' (sisterly)';
    }

    // Build paragraph
    const paragraph = [];
    paragraph.push(name + ' is ' + format.aOrAn(personality.toLowerCase()) + ' ' + species + ' villager. ');
    if (birthday) {
        paragraph.push(format.capFirstLetter(pronoun) + ' was born on ' + birthday + ' and ' + posessivePronoun +
            ' star sign  is ' + zodiac + '. ');
    }
    if (gameData.clothesName) {
        paragraph.push(name + ' wears the ' + gameData.clothesName + '. ');
    }
    if (gameData.song) {
        paragraph.push(format.capFirstLetter(posessivePronoun) + ' favorite song is ' + gameData.song + '.');
    }
    if (gameData.hobby) {
        paragraph.push(name + '\'s favorite hobby is ' + gameData.hobby.toLowerCase() + '.');
    }
    if (gameData.goal) {
        paragraph.push(posessive + ' goal is to be ' + format.aOrAn(gameData.goal.toLowerCase()) + '. ');
    }
    if (gameData.skill) {
        paragraph.push(format.capFirstLetter(pronoun) + ' is talented at ' + gameData.skill.toLowerCase() + '. ');
    }

    if (gameData.favoriteStyles) {
        let p = format.capFirstLetter(posessivePronoun) + ' favorite ' +
            format.singularOrPlural('style', gameData.favoriteStyles) + ' ' +
            format.isOrAre(gameData.favoriteStyles) + ' ' +
            format.andList(gameData.favoriteStyles)
        if (gameData.dislikedStyle) {
            p += ', but ' + pronoun + ' dislikes the ' +
                gameData.dislikedStyle.toLowerCase() + ' style. '
        } else {
            p += '.';
        }
        paragraph.push(p);
    }

    if (gameData.favoriteColors) {
        paragraph.push(posessive +
            ' favorite ' + format.singularOrPlural('color', gameData.favoriteColors) +
            ' ' + format.isOrAre(gameData.favoriteColors) + ' ' +
            format.andList(gameData.favoriteColors) + '. ');
    }

    if (gameData.siblings) {
        paragraph.push('In ' + posessivePronoun + ' family, ' + name + ' is the ' + gameData.siblings.toLowerCase() +
            '. ');
    }

    return paragraph.join(' ');

}

/**
 * Reduce game-specific properties down to only differing values.
 *
 * @param games
 * @param property
 */
function compressGameData(games, property) {
    let result = [];

    let lastValue = undefined;
    for (let game in games) {
        // Do a case insensitive compare without any extra spaces.
        let newValue = games[game][property];
        if (newValue) {
            newValue = newValue.trim().toLowerCase().replace(/\s+/g, ' ');
            result.push({
                shortTitle: format.games[game].shortTitle,
                title: format.games[game].title,
                year: format.games[game].year,
                value: games[game][property],
                isNew: (lastValue !== newValue)
            });
            lastValue = newValue;
        }
    }

    return result;
}

/**
 * Get quotes for the villager. Equal quotes will be grouped.
 *
 * @param villager
 * @param formattedVillager
 * @returns {Array}
 */
function getQuotes(villager, formattedVillager) {
    const uniqueQuotes = {}; // quote to games mapping
    const quotes = [];

    // Get unique...
    for (let game of Object.keys(format.games)) {
        if (typeof villager.games[game] !== 'undefined' && villager.games[game].quote) {
            const quote = villager.games[game].quote;
            if (!uniqueQuotes[quote]) {
                uniqueQuotes[quote] = [];
            }
            uniqueQuotes[quote].push(format.games[game].title);
        }
    }

    // Now collapse
    for (let quote of Object.keys(uniqueQuotes)) {
        quotes.push({
            title: format.andList(uniqueQuotes[quote]),
            quote: quote
        });
    }

    return quotes;
}

/**
 * Load the specified villager.
 *
 * @param id
 * @returns {Promise<{}>}
 */
async function loadVillager(id) {
    // Load villager
    const villager = await villagers.getById(id);
    if (!villager) {
        const e = new Error('Villager not found');
        e.status = 404;
        throw e;
    }

    // Format villager
    const result = {};
    Object.assign(result, formatVillager(villager));

    // Some extra metadata the template needs.
    result.id = villager.id;
    result.pageTitle = villager.name;
    result.collab = villager.collab;
    
    // Quotes
    result.quotes = getQuotes(villager, result);
    result.hasQuotes = result.quotes.length > 0;

    // Generate the paragraph.
    result.paragraph = generateParagraph(villager, result);

    // For frontend awake/asleep calculation.
    result.personalityMap = JSON.stringify(compressGameData(villager.games, 'personality'));

    // Images.
    result.image = villager.image;
    result.serializedImages = JSON.stringify(villager.image);

    // Social media information
    result.pageUrl = 'https://villagerdb.com/villager/' + result.id;
    result.pageDescription = result.paragraph;
    result.pageImage = 'https://villagerdb.com' + result.image.full;
    result.shareUrl = 'https://villagerdb.com/villager/' + result.id;

    return result;
}

const router = express.Router();
router.get('/:id', function (req, res, next) {
    loadVillager(req.params.id)
        .then((data) => {
            res.render('villager', data);
        }).catch(next);
});

module.exports = router;
