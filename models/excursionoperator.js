'use strict';
module.exports = (sequelize, DataTypes) => {
  const ExcursionOperator = sequelize.define('ExcursionOperator', {
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
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {});
  ExcursionOperator.associate = function(models) {
    ExcursionOperator.hasMany(models.Excursion, {
      as: 'Excursions',
      foreignKey: 'excursionOperatorId',
      targetKey: 'id'
    });
  };
  return ExcursionOperator;
};
