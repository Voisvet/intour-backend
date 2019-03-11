'use strict';
module.exports = (sequelize, DataTypes) => {
  const ExcursionSchedule = sequelize.define('ExcursionSchedule', {
    id: DataTypes.INTEGER,
    weekDay: DataTypes.ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'),
    time: DataTypes.TIME,
    excursionId: DataTypes.INTEGER
  }, {});
  ExcursionSchedule.associate = function(models) {
    // Associations can be defined here
  };
  return ExcursionSchedule;
};
