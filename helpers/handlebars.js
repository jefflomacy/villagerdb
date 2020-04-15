const format = require('../helpers/format');

module.exports = {
    /**
     * Handlebars helper to add commas to a number
     * Usage {{toLocaleString param}}
     *
     * @param number
     * @returns {string}
     */
    toLocaleString: function (number) {
        return number.toLocaleString()
    },
    toSlug:function(name){
        return format.getSlug(name);
    },
    gameNamesList:function(games){
        let gameNames = games.map(function(game){
            return game.gameTitle;
        });
        return format.andList(gameNames);
    },
    ifEquals:function(arg1, arg2, options) {
        return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    }
};