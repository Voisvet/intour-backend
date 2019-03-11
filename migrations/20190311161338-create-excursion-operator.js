'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ExcursionOperators', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING
      },
      phone: {
        allowNull: false,
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
      .then(() => {
        queryInterface.addColumn(
          'Excursions',
          'excursionOperatorId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'ExcursionOperators',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        )
      });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Excursions',
      'excursionOperatorId'
    ).then(() => {
      return queryInterface.dropTable('ExcursionOperators');
    })
  }
};
