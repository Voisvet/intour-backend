'use strict';
module.exports = (sequelize, DataTypes) => {
  const Reservetion = sequelize.define('Reservation', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    excursionId: {
      references: {
        model: 'Excursions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      type: DataTypes.INTEGER
    },
    reservationDate: {
      allowNull: false,
      defaultValue: DataTypes.NOW,
      type: DataTypes.DATE
    },
    excursionDate: {
      allowNull: false,
      type: DataTypes.DATEONLY
    },
    excursionTime: {
      allowNull: false,
      type: DataTypes.TIME
    },
    amountOfAdultTickets: {
      allowNull: false,
      defaultValue: 0,
      type: DataTypes.INTEGER
    },
    amountOfChildTickets: {
      allowNull: false,
      defaultValue: 0,
      type: DataTypes.INTEGER
    },
    totalCost: {
      allowNull: false,
      defaultValue: 0,
      type: DataTypes.DECIMAL(2)
    },
    status: {
      allowNull: false,
      defaultValue: 'new',
      type: DataTypes.ENUM('new', 'paid')
    },
    paymentDate: {
      defaultValue: null,
      type: DataTypes.DATE
    },
    customerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
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
