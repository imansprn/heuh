/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('destinations', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            name: {
                type: Sequelize.STRING,
            },
            type: {
                type: Sequelize.STRING,
            },
            url: {
                type: Sequelize.TEXT,
            },
            enabled: {
                type: Sequelize.BOOLEAN,
            },
            config: {
                type: Sequelize.JSONB,
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
        await queryInterface.dropTable('destinations');
    },
};
