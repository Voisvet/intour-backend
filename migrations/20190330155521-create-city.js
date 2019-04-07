'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Cities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
      .then(() =>
        queryInterface.addColumn(
          'Excursions',
          'cityId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Cities',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        )
      )
      .then(() =>
        queryInterface.removeColumn(
          'Excursions',
          'region'
        )
      );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Excursions',
      'region',
      {
        type: Sequelize.STRING,
        allowNull: false
      })
      .then(() =>
        queryInterface.removeColumn(
          'Excursions',
          'cityId'
        )
      )
      .then(() =>
        queryInterface.dropTable('Cities')
    );
  }
};
