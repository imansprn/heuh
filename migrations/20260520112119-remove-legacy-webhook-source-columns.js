/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const tableName = 'webhook_sources';
        const table = await queryInterface.describeTable(tableName);

        if (table.secret) {
            await queryInterface.removeColumn(tableName, 'secret');
        }

        if (table.is_active) {
            await queryInterface.removeColumn(tableName, 'is_active');
        }
    },

    async down(queryInterface, Sequelize) {
        const tableName = 'webhook_sources';
        const table = await queryInterface.describeTable(tableName);

        if (!table.secret) {
            await queryInterface.addColumn(tableName, 'secret', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        if (!table.is_active) {
            await queryInterface.addColumn(tableName, 'is_active', {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            });
        }
    },
};
