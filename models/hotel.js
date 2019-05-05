'use strict';
module.exports = (sequelize, DataTypes) => {
  const Hotel = sequelize.define('Hotel', {
    name: DataTypes.STRING,
    cityId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Cities',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
  }, {});
  Hotel.associate = function(models) {
    Hotel.belongsTo(models.City, {
      foreignKey: 'cityId',
      targetKey: 'id'
    });
    Hotel.hasMany(models.Reservation, {
      as: 'Reservations',
      foreignKey: 'hotelId',
      sourceKey: 'id'
    });
  };
  return Hotel;
};
