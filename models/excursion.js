'use strict';
module.exports = (sequelize, DataTypes) => {
  const Excursion = sequelize.define('Excursion', {
    id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    duration: DataTypes.INTEGER,
    services: DataTypes.TEXT,
    description: DataTypes.TEXT,
    starting_point: DataTypes.TEXT,
    adult_ticket_cost: DataTypes.DECIMAL(2),
    child_ticket_cost: DataTypes.DECIMAL(2),
    region: DataTypes.STRING,
    excursionOperatorId: DataTypes.INTEGER
  }, {});
  Excursion.associate = function(models) {
    Excursion.hasMany(models.ExcursionImage, {
      as: 'Images',
      foreignKey: 'excursionId',
      sourceKey: 'id'
    });
    Excursion.hasMany(models.ExcursionSchedule, {
      as: 'Schedule',
      foreignKey: 'excursionId',
      sourceKey: 'id'
    });
  };
  return Excursion;
};
