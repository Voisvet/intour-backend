'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Hotels', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      cityId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Cities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
          'Reservations',
          'hotelId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Hotels',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        ));
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Reservations',
      'hotelId'
    ).then(() =>
      queryInterface.dropTable('Hotels')
    );
  }
};
