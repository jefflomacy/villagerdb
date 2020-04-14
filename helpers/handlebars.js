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
    }
};