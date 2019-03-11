'use strict';
module.exports = (sequelize, DataTypes) => {
  const Agent = sequelize.define('Agent', {
    id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING
  }, {});
  Agent.associate = function(models) {
    Agent.hasMany(models.Customer, {
      as: 'Customers',
      foreignKey: 'agentId',
      targetKey: 'id'
    });
  };
  return Agent;
};
