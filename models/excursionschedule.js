'use strict';
module.exports = (sequelize, DataTypes) => {
  const ExcursionSchedule = sequelize.define('ExcursionSchedule', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    weekDay: {
      allowNull: false,
      type: DataTypes.ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')
    },
    time: {
      allowNull: false,
      type: DataTypes.TIME
    },
    excursionId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Excursions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {});
  ExcursionSchedule.associate = function(models) {
    // Associations can be defined here
  };
  return ExcursionSchedule;
};
