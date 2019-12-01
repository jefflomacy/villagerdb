const express = require('express');
const format = require('../helpers/format.js');

/**
 * Find the latest game a villager was featured in.
 *
 * @param villager
 * @returns the game ID or undefined if none found.
 */
function findLatestGame(villager) {
    let gameIndex = -1;
    let latestGame = undefined;
    for (let game in villager.games) {
        if (gameIndex < format.games[game].order) {
            latestGame = game;
            gameIndex = format.games[game].order;
        }
    }

    return latestGame;
}

/**
 * Generate a sentence for the given villager.
 *
 * @param villager
 * @param formattedVillager
 */
function generateParagraph(villager, formattedVillager) {
    // Find the latest game they are in.
    let latestGameId = findLatestGame(villager);
    if (!latestGameId) {
        return '';
    }
    let gameData = villager.games[latestGameId];

    // Properties
    let name = formattedVillager.name;
    let pronoun = (villager.gender === 'male' ? 'he' : 'she');
    let posessivePronoun = (villager.gender == 'male' ? 'his' : 'her');
    let posessive = formattedVillager.name + '\'s';
    let species = formattedVillager.species.toLowerCase();
    let personality = gameData.personality;
    let birthday = formattedVillager.birthday;
    let zodiac = formattedVillager.zodiac;

    // Build paragraph
    let paragraph = name + ' is ' + format.aOrAn(personality.toLowerCase()) + ' ' + species + ' villager. ' +
        format.capFirstLetter(pronoun) + ' was born on ' + birthday + ' and ' + posessivePronoun +
        ' star sign  is ' + zodiac + '. ';
    if (gameData.clothes) {
        paragraph += name + ' wears the ' + gameData.clothes + '. ';
    }
    if (gameData.song) {
        paragraph += format.capFirstLetter(posessivePronoun) + ' favorite song is ' + gameData.song + '. ';
    }
    if (gameData.goal) {
        paragraph += posessive + ' goal is to be ' + format.aOrAn(gameData.goal.toLowerCase()) + '. ';
    }
    if (gameData.skill) {
        paragraph += format.capFirstLetter(pronoun) + ' is talented at ' + gameData.skill.toLowerCase() + '. ';
    }
    if (gameData.favoriteStyle && gameData.dislikedStyle) {
        paragraph += format.capFirstLetter(posessivePronoun) + ' favorite style is ' +
            gameData.favoriteStyle.toLowerCase() + ', but ' + pronoun + ' dislikes the ' +
            gameData.dislikedStyle.toLowerCase() + ' style. ';
    }
    if (gameData.favoriteColor) {
        paragraph += posessive + ' favorite color is ' + gameData.favoriteColor.toLowerCase() + '. ';
    }
    if (gameData.siblings) {
        paragraph += 'In ' + posessivePronoun + ' family, ' + name + ' is the ' + gameData.siblings.toLowerCase() +
            '. ';
    }

    return paragraph;

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
 * Get quotes for the villager. They will be sorted in reverse chronological order because that's the way the
 * formatted villager game list comes back.
 *
 * @param villager
 * @param formattedVillager
 * @returns {Array}
 */
function getQuotes(villager, formattedVillager) {
    const quotes = [];
    for (let game in formattedVillager.games) {
        if (villager.games[game].quote) {
            quotes.push({
                title: format.games[game].title,
                quote: villager.games[game].quote
            });
        }
    }

    return quotes;
}

/**
 * Load the specified villager.
 *
 * @param collection
 * @param id
 * @returns {Promise<{}>}
 */
async function loadVillager(collection, id) {
    // Load villager
    const villager = await collection.getById(id);
    if (!villager) {
        let e = new Error('Villager not found');
        e.status = 404;
        throw e;
    }

    // Format villager
    const result = format.formatVillager(villager);

    // Some extra metadata the template needs.
    result.id = villager.id;
    result.pageTitle = villager.name;

    // Game-specific attributes.
    result.quotes = getQuotes(villager, result);
    result.personalities = compressGameData(result.games, 'personality');
    result.clothing = compressGameData(result.games, 'clothes');
    result.phrases = compressGameData(result.games, 'phrase');
    result.songs = compressGameData(result.games, 'song');

    // Booleans for the template.
    result.hasPersonalities = result.personalities.length > 0;
    result.hasClothing = result.clothing.length > 0;
    result.hasPhrases = result.phrases.length > 0;
    result.hasSongs = result.songs.length > 0;
    result.hasQuotes = result.quotes.length > 0;
    result.hasCoffee = result.coffee.length > 0;

    // Generate the paragraph.
    result.paragraph = generateParagraph(villager, result);

    // Social media information
    result.shareUrl = encodeURIComponent('https://villagerdb.com/villager/' + result.id);

    // For frontend awake/asleep calculation.
    result.personalityMap = JSON.stringify(compressGameData(result.games, 'personality'));

    return result;
}

const router = express.Router();
router.get('/:id', function (req, res, next) {
    loadVillager(res.app.locals.db.villagers, req.params.id)
        .then((data) => {
            data.pageTitle = data.name;
            res.render('villager', data);
        }).catch(next);
});

module.exports = router;
