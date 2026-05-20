const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class WebhookMapping extends Model {
        static associate(models) {
            WebhookMapping.belongsTo(models.WebhookSource, {
                foreignKey: 'sourceId',
                as: 'source',
            });
            WebhookMapping.belongsTo(models.Destination, {
                foreignKey: 'destinationId',
                as: 'destination',
            });
        }
    }
    WebhookMapping.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            sourceId: {
                type: DataTypes.UUID,
                field: 'source_id',
                allowNull: false,
                references: {
                    model: 'webhook_sources',
                    key: 'id',
                },
            },
            destinationId: {
                type: DataTypes.UUID,
                field: 'destination_id',
                allowNull: false,
                references: {
                    model: 'destinations',
                    key: 'id',
                },
            },
            enabled: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            sequelize,
            modelName: 'WebhookMapping',
            tableName: 'webhook_mappings',
            underscored: true,
        }
    );
    return WebhookMapping;
};
