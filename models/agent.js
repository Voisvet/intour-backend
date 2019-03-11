'use strict';
module.exports = (sequelize, DataTypes) => {
  const Agent = sequelize.define('Agent', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING
    },
    email: {
      allowNull: false,
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING
    },
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
