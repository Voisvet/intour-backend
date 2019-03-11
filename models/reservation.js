'use strict';
module.exports = (sequelize, DataTypes) => {
  const Reservetion = sequelize.define('Reservation', {
    id: DataTypes.INTEGER,
    excursionId: DataTypes.INTEGER,
    reservationDate: DataTypes.DATE,
    excursionDate: DataTypes.DATEONLY,
    excursionTime: DataTypes.TIME,
    amountOfAdultTickets: DataTypes.INTEGER,
    amountOfChildTickets: DataTypes.INTEGER,
    totalCost: DataTypes.DECIMAL(2),
    status: DataTypes.ENUM('new', 'paid'),
    paymentDate: DataTypes.DATE,
    customerId: DataTypes.INTEGER
  }, {});
  Reservetion.associate = function(models) {
    Reservetion.belongsTo(models.Excursion, {
      foreignKey: 'excursionId',
      targetKey: 'id'
    });
    Reservetion.hasOne(models.Receipt, {
      foreignKey: 'reservationId',
      targetKey: 'id',
      as: 'Reservation'
    });
  };
  return Reservetion;
};
