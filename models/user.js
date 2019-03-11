'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: DataTypes.INTEGER,
    login: DataTypes.STRING,
    passwordHash: DataTypes.STRING,
    accountType: DataTypes.ENUM('customer', 'agent', 'operator'),
    customerId: DataTypes.INTEGER,
    agentId: DataTypes.INTEGER,
    operatorId: DataTypes.INTEGER
  }, {});
  User.associate = function(models) {
    User.belongsTo(models.Customer);
    User.belongsTo(models.Agent);
    User.belongsTo(models.ExcursionOperator);
  };
  return User;
};
