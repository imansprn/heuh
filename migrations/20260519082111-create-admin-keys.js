/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('admin_keys', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            key_hash: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            enabled: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            last_used_at: {
                type: Sequelize.DATE,
                allowNull: true,
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
        await queryInterface.dropTable('admin_keys');
    },
};
