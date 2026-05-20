/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableName = 'webhook_sources';
        const table = await queryInterface.describeTable(tableName);

        if (!table.path) {
            await queryInterface.addColumn(tableName, 'path', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        if (!table.enabled) {
            await queryInterface.addColumn(tableName, 'enabled', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            });
        }

        if (!table.config) {
            await queryInterface.addColumn(tableName, 'config', {
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: {},
            });
        }

        if (table.is_active) {
            await queryInterface.sequelize.query(`
                UPDATE ${tableName}
                SET enabled = COALESCE(is_active, enabled, TRUE)
            `);
        }

        if (table.secret) {
            await queryInterface.sequelize.query(`
                UPDATE ${tableName}
                SET config = COALESCE(config, '{}'::jsonb) || jsonb_build_object('secret', secret)
                WHERE secret IS NOT NULL
                  AND (config IS NULL OR config->>'secret' IS NULL)
            `);
        }
    },

    async down(queryInterface) {
        const tableName = 'webhook_sources';
        const table = await queryInterface.describeTable(tableName);

        if (table.config) {
            await queryInterface.removeColumn(tableName, 'config');
        }
        if (table.enabled) {
            await queryInterface.removeColumn(tableName, 'enabled');
        }
        if (table.path) {
            await queryInterface.removeColumn(tableName, 'path');
        }
    },
};
