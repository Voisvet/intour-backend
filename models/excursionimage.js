'use strict';
module.exports = (sequelize, DataTypes) => {
  const ExcursionImage = sequelize.define('ExcursionImage', {
    id: DataTypes.INTEGER,
    link: DataTypes.STRING,
    excursionId: DataTypes.INTEGER
  }, {});
  ExcursionImage.associate = function(models) {
    // Associations can be defined here
  };
  return ExcursionImage;
};
