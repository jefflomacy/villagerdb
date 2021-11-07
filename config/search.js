const cache = require('../db/cache');

/**
 * Cache key for the name of the elastic search index.
 * @type {string}
 */
const CACHE_INDEX_NAME = 'elasticSearchIndexName';


module.exports = {
    CACHE_INDEX_NAME: CACHE_INDEX_NAME,
    getElasticSearchIndexName: async () => {
        return cache.get(CACHE_INDEX_NAME);
    },
    villagerEntityType: 'villager',
    itemEntityType: 'item',
    searchResultsPageSize: 50,
    maxQueryLength: 64,
    textQuerySearchKey: 'q',
    filters: {
        q: {
            name: 'Searching for',
            canAggregate: false,
            isTextSearch: true
        },
        type: {
            name: 'Type',
            values: {
                'villager': 'Villager',
                'item': 'Item'
            },
            canAggregate: true,
            sort: 1
        },
        game: {
            name: 'Games',
            values: {
                'nh': 'New Horizons',
                'nl': 'New Leaf',
                'cf': 'City Folk',
                'ww': 'Wild World',
                'afe+': 'Animal Forest e+',
                'ac': 'Animal Crossing',
                'af+': 'Animal Forest+',
                'af': 'Animal Forest'
            },
            canAggregate: true,
            sort: 2
        },
        tag: {
            name: 'Tags',
            canAggregate: true,
            gameDependent: true,
            sort: 3
        },
        category: {
            name: 'Category',
            canAggregate: true,
            sort: 4
        },
        fashionTheme: {
            name: 'Fashion Theme',
            canAggregate: true,
            gameDependent: true,
            sort: 5
        },
        interiorTheme: {
            name: 'Interior Theme',
            canAggregate: true,
            gameDependent: true,
            sort: 6
        },
        gender: {
            name: 'Gender',
            values: {
                male: 'Male',
                female: 'Female'
            },
            canAggregate: true,
            sort: 7
        },
        personality: {
            name: 'Personality',
            values: {
                cranky: 'Cranky',
                jock: 'Jock',
                lazy: 'Lazy',
                normal: 'Normal',
                peppy: 'Peppy',
                smug: 'Smug',
                snooty: 'Snooty',
                uchi: 'Uchi (Sisterly)'
            },
            canAggregate: true,
            gameDependent: true,
            sort: 8
        },
        subtype: {
            name: 'Subtype',
            canAggregate: true,
            gameDependent: true,
            sort: 9
        },
        hobby: {
            name: 'Hobby',
            canAggregate: true,
            gameDependent: true,
            sort: 10
        },
        favoriteColor: {
            name: 'Favorite Color',
            canAggregate: true,
            gameDependent: true,
            sort: 11
        },
        favoriteStyle: {
            name: 'Favorite Style',
            canAggregate: true,
            gameDependent: true,
            sort: 12
        },
        species: {
            name: 'Species',
            values: {
                alligator: 'Alligator',
                anteater: 'Anteater',
                bear: 'Bear',
                bird: 'Bird',
                bull: 'Bull',
                cat: 'Cat',
                chicken: 'Chicken',
                cow: 'Cow',
                cub: 'Cub',
                deer: 'Deer',
                dog: 'Dog',
                duck: 'Duck',
                eagle: 'Eagle',
                elephant: 'Elephant',
                frog: 'Frog',
                goat: 'Goat',
                gorilla: 'Gorilla',
                hamster: 'Hamster',
                hippo: 'Hippo',
                horse: 'Horse',
                kangaroo: 'Kangaroo',
                koala: 'Koala',
                lion: 'Lion',
                monkey: 'Monkey',
                mouse: 'Mouse',
                octopus: 'Octopus',
                ostrich: 'Ostrich',
                penguin: 'Penguin',
                pig: 'Pig',
                rabbit: 'Rabbit',
                rhino: 'Rhino',
                sheep: 'Sheep',
                squirrel: 'Squirrel',
                tiger: 'Tiger',
                wolf: 'Wolf',
            },
            canAggregate: true,
            sort: 13
        },
        zodiac: {
            name: 'Star Sign',
            values: {
                aquarius: 'Aquarius',
                aries: 'Aries',
                cancer: 'Cancer',
                capricorn: 'Capricorn',
                gemini: 'Gemini',
                leo: 'Leo',
                libra: 'Libra',
                pisces: 'Pisces',
                sagittarius: 'Sagittarius',
                scorpio: 'Scorpio',
                taurus: 'Taurus',
                virgo: 'Virgo'
            },
            canAggregate: true,
            sort: 14
        },
        collab: {
            name: 'Collaboration',
            canAggregate: true,
            sort: 15
        },
        version: {
            name: 'Game Version',
            canAggregate: true,
            sort: 16
        }
    }
};