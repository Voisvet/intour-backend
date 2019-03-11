'use strict';
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: DataTypes.INTEGER,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    phone: DataTypes.STRING,
    agentId: DataTypes.INTEGER
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
