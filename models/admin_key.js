const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AdminKey extends Model {
        static associate() {
            // No specific associations needed for now
        }
    }
    AdminKey.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            keyHash: {
                type: DataTypes.STRING,
                field: 'key_hash',
                allowNull: false,
                unique: true,
            },
            enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            lastUsedAt: {
                type: DataTypes.DATE,
                field: 'last_used_at',
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'AdminKey',
            tableName: 'admin_keys',
            underscored: true,
        }
    );
    return AdminKey;
};
