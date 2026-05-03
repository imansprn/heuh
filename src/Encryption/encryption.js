const crypto = require('crypto');

const ALGORITHM   = 'aes-256-gcm';
const IV_LENGTH   = 12; // 12 bytes = GCM standard
const TAG_LENGTH  = 16; // 16 bytes = 128-bit auth tag

// Validate key at startup — fail fast if misconfigured
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Fail fast: validate key length at startup
if (ENCRYPTION_KEY && Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be 64 hex chars (32 bytes). Got: ${ENCRYPTION_KEY.length} chars.`);
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} text - plaintext to encrypt
 * @returns {string} format: iv:authTag:cipherText (all hex)
 */
const encrypt = (text) => {
    if (!text) return text;
    if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY is missing in .env');

    const iv     = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        iv,
        { authTagLength: TAG_LENGTH }
    );

    // AAD: binds ciphertext to this application (prevents cross-app replay)
    cipher.setAAD(Buffer.from('heuh', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted    += cipher.final('hex');

    // getAuthTag() MUST be called after final()
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} encryptedData - format: iv:authTag:cipherText
 * @returns {string} original plaintext
 */
const decrypt = (encryptedData) => {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
    if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY is missing in .env');

    try {
        // Safe parse: indexOf prevents cipherText from being split if it contains ':'
        const firstColon  = encryptedData.indexOf(':');
        const secondColon = encryptedData.indexOf(':', firstColon + 1);

        const ivHex      = encryptedData.substring(0, firstColon);
        const authTagHex = encryptedData.substring(firstColon + 1, secondColon);
        const cipherText = encryptedData.substring(secondColon + 1);

        const iv       = Buffer.from(ivHex, 'hex');
        const authTag  = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            Buffer.from(ENCRYPTION_KEY, 'hex'),
            iv,
            { authTagLength: TAG_LENGTH }
        );

        // AAD must match exactly what was set during encrypt
        decipher.setAAD(Buffer.from('heuh', 'utf8'));

        // setAuthTag MUST be called before final()
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(cipherText, 'hex', 'utf8');
        decrypted    += decipher.final('utf8'); // throws if authTag mismatch

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        throw new Error('Failed to decrypt data. Verify ENCRYPTION_KEY matches the one used to encrypt.');
    }
};

module.exports = { encrypt, decrypt };
