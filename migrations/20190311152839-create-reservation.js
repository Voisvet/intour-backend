'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Reservations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      excursionId: {
        references: {
          model: 'Excursions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        type: Sequelize.INTEGER
      },
      reservationDate: {
        allowNull: false,
        defaultValue: Sequelize.NOW,
        type: Sequelize.DATE
      },
      excursionDate: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      excursionTime: {
        allowNull: false,
        type: Sequelize.TIME
      },
      amountOfAdultTickets: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.INTEGER
      },
      amountOfChildTickets: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.INTEGER
      },
      totalCost: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.DECIMAL(2)
      },
      status: {
        allowNull: false,
        defaultValue: 'new',
        type: Sequelize.ENUM('new', 'paid')
      },
      paymentDate: {
        defaultValue: null,
        type: Sequelize.DATE
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
        return queryInterface.addColumn(
          'Receipts',
          'reservationId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Reservations',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        );
      });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Receipts',
      'reservationId'
    )
      .then(() => {
        return queryInterface.dropTable('Reservations', {});
      });
  }
};
