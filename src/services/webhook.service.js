'use strict';

const axios = require('axios');
const { config } = require('./../config')

const googleChat = async (text) => {
    return await axios.post(config.google_chat_webhooks, {
        text: text
    }, {
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        }
    }).then(function (response) {
        return response.data
    }).catch(function (err) {
        throw new Error(err);
    });
};

module.exports = {
    googleChat,
};