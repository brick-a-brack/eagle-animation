const FR = require('./fr');
const EN = require('./en');

const languages = {
    FR, EN
};

const SELECTED_LANGUAGE = 'EN';

module.exports = languages[SELECTED_LANGUAGE];
