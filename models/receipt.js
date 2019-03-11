'use strict';
module.exports = (sequelize, DataTypes) => {
  const Receipt = sequelize.define('Receipt', {
    data: DataTypes.TEXT
  }, {});
  Receipt.associate = function(models) {
    // associations can be defined here
  };
  return Receipt;
};