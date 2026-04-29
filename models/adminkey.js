'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdminKey extends Model {
    static associate(models) {
      // No specific associations needed for now
    }
  }
  AdminKey.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    keyHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AdminKey',
  });
  return AdminKey;
};
