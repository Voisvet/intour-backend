'use strict';
module.exports = (sequelize, DataTypes) => {
  const City = sequelize.define('City', {
    name: DataTypes.STRING,
    countryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Counties',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {});
  City.associate = function(models) {
    City.belongsTo(models.Country, {
      foreignKey: 'countryId',
      targetKey: 'id'
    });
    City.hasMany(models.Excursion, {
      as: 'Excursions',
      foreignKey: 'cityId',
      sourceKey: 'id'
    });
  };
  return City;
};
