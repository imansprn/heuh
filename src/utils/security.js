const crypto = require('crypto');
const { config } = require('../config');

/**
 * Verify the signature of a webhook request
 * @param {string} signature - The signature from the request header
 * @param {string} body - The raw request body
 * @param {string} secret - The webhook secret
 * @returns {boolean} - Whether the signature is valid
 */
function verifySignature(signature, body, secret) {
    if (!signature || !body || !secret) {
        throw new Error('Invalid signature');
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(body).digest('hex'), 'utf8');
    const checksum = Buffer.from(signature.replace('sha256=', ''), 'utf8');

    if (checksum.length !== digest.length) {
        throw new Error('Invalid signature');
    }

    return crypto.timingSafeEqual(digest, checksum);
}

module.exports = {
    verifySignature
}; 