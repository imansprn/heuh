/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('webhook_mappings', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            source_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'webhook_sources',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            destination_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'destinations',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            enabled: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            transform_config: {
                type: Sequelize.JSONB,
                defaultValue: {},
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('webhook_mappings');
    },
};
