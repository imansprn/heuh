/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('webhook_sources', {
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
            secret: {
                type: Sequelize.STRING,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
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
        await queryInterface.dropTable('webhook_sources');
    },
};
