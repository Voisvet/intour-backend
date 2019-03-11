'use strict';
module.exports = (sequelize, DataTypes) => {
  const ExcursionImage = sequelize.define('ExcursionImage', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    link: {
      allowNull: false,
      type: DataTypes.STRING
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
  ExcursionImage.associate = function(models) {
    // Associations can be defined here
  };
  return ExcursionImage;
};
