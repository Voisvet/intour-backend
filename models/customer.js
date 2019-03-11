'use strict';
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    firstName: {
      allowNull: false,
      type: DataTypes.STRING
    },
    lastName: {
      allowNull: false,
      type: DataTypes.STRING
    },
    phone: {
      allowNull: false,
      type: DataTypes.STRING
    },
    agentId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Agents',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {});
  Customer.associate = function(models) {
    Customer.hasMany(models.Reservation, {
      as: 'Reservations',
      foreignKey: 'customerId',
      targetKey: 'id'
    });
  };
  return Customer;
};
