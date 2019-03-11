'use strict';
module.exports = (sequelize, DataTypes) => {
  const Receipt = sequelize.define('Receipt', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    data: {
      type: DataTypes.TEXT
    }
  }, {});
  Receipt.associate = function(models) {
    // associations can be defined here
  };
  return Receipt;
};
