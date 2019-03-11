'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    login: {
      allowNull: false,
      type: DataTypes.STRING
    },
    passwordHash: {
      allowNull: false,
      type: DataTypes.STRING
    },
    accountType: {
      allowNull: false,
      type: DataTypes.ENUM('customer', 'agent', 'operator')
    },
    customerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    agentId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Agents',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    operatorId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'ExcursionOperators',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {});
  User.associate = function(models) {
    User.belongsTo(models.Customer);
    User.belongsTo(models.Agent);
    User.belongsTo(models.ExcursionOperator);
  };
  return User;
};
