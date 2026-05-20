/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const sourceTable = await queryInterface.describeTable('webhook_sources');
        const mappingTable = await queryInterface.describeTable('webhook_mappings');

        if (sourceTable.destination_id) {
            await queryInterface.removeColumn('webhook_sources', 'destination_id');
        }
        if (sourceTable.path) {
            await queryInterface.removeColumn('webhook_sources', 'path');
        }
        if (mappingTable.transform_config) {
            await queryInterface.removeColumn('webhook_mappings', 'transform_config');
        }
    },

    async down(queryInterface, Sequelize) {
        const sourceTable = await queryInterface.describeTable('webhook_sources');
        const mappingTable = await queryInterface.describeTable('webhook_mappings');

        if (!sourceTable.destination_id) {
            await queryInterface.addColumn('webhook_sources', 'destination_id', {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'destinations', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            });
        }
        if (!sourceTable.path) {
            await queryInterface.addColumn('webhook_sources', 'path', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
        if (!mappingTable.transform_config) {
            await queryInterface.addColumn('webhook_mappings', 'transform_config', {
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: {},
            });
        }
    },
};
