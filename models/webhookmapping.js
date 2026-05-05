'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WebhookMapping extends Model {
    static associate(models) {
      WebhookMapping.belongsTo(models.WebhookSource, {
        foreignKey: 'sourceId',
        as: 'source'
      });
      WebhookMapping.belongsTo(models.Destination, {
        foreignKey: 'destinationId',
        as: 'destination'
      });
    }
  }
  WebhookMapping.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sourceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'WebhookSources',
        key: 'id'
      }
    },
    destinationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Destinations',
        key: 'id'
      }
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    transformConfig: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'WebhookMapping',
  });
  return WebhookMapping;
};
