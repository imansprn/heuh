'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Destination extends Model {
    static associate(models) {
      // Many-to-Many via WebhookMapping
      Destination.belongsToMany(models.WebhookSource, {
        through: models.WebhookMapping,
        foreignKey: 'destinationId',
        otherKey: 'sourceId',
        as: 'sources'
      });
      Destination.hasMany(models.WebhookMapping, {
        foreignKey: 'destinationId',
        as: 'mappings'
      });
    }
  }
  Destination.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    url: DataTypes.TEXT,
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
    modelName: 'Destination',
  });
  return Destination;
};