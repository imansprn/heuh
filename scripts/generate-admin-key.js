const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { AdminKey } = require('../models');

(async () => {
    try {
        const keyName = process.argv[2] || 'Default Admin Key';

        // 1. Generate a random secure key
        const plainKey = crypto.randomBytes(24).toString('hex');

        // 2. Hash the key
        const saltRounds = 10;
        const hash = await bcrypt.hash(plainKey, saltRounds);

        // 3. Save to database
        const newKey = await AdminKey.create({
            name: keyName,
            keyHash: hash,
            enabled: true,
        });

        // 4. create a new format (santet_v2_{id}.{plainKey})
        const apiKey = `santet${newKey.id}.${plainKey}`;

        console.log('\n--- Admin API Key Generated ---');
        console.log(`Name: ${keyName}`);
        console.log(`ID:   ${newKey.id}`);
        console.log('-------------------------------');
        console.log(`IMPORTANT: Copy and save this key now. It will NOT be shown again!`);
        console.log(`\nYour API Key: ${apiKey}\n`);
        console.log('-------------------------------\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to generate key:', err.message);
        process.exit(1);
    }
})();
