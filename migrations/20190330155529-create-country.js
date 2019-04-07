'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Countries', {
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
          'Cities',
          'countryId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Countries',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        )
      );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Cities',
      'countryId'
    ).then(() =>
      queryInterface.dropTable('Countries')
    )
  }
};
