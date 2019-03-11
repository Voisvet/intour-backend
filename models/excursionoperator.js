'use strict';
module.exports = (sequelize, DataTypes) => {
  const ExcursionOperator = sequelize.define('ExcursionOperator', {
    id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING
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
