module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('webhook_sources', 'destination_id', {
            type: Sequelize.UUID,
            references: {
                model: 'destinations',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });
    },
    down: async queryInterface => {
        await queryInterface.removeColumn('webhook_sources', 'destination_id');
    },
};
