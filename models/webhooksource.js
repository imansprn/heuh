'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WebhookSource extends Model {
    static associate(models) {
      // Many-to-Many via WebhookMapping
      WebhookSource.belongsToMany(models.Destination, {
        through: models.WebhookMapping,
        foreignKey: 'sourceId',
        otherKey: 'destinationId',
        as: 'destinations'
      });
      WebhookSource.hasMany(models.WebhookMapping, {
        foreignKey: 'sourceId',
        as: 'mappings'
      });
    }
  }
  WebhookSource.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    path: DataTypes.STRING,
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'WebhookSource',
  });
  return WebhookSource;
};