'use strict';
module.exports = (sequelize, DataTypes) => {
  const Excursion = sequelize.define('Excursion', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING
    },
    duration: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    services: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    description: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    starting_point: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    adult_ticket_cost: {
      allowNull: false,
      type: DataTypes.DECIMAL(2)
    },
    child_ticket_cost: {
      allowNull: false,
      type: DataTypes.DECIMAL(2)
    },
    region: {
      allowNull: false,
      type: DataTypes.STRING
    },
    excursionOperatorId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'ExcursionOperators',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
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
