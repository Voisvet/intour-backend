'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'Reservations',
        'paymentId',
        {
          type: Sequelize.STRING
        }
      ),
      queryInterface.addColumn(
        'Reservations',
        'paymentStatus',
        {
          type: Sequelize.ENUM('pending', 'waiting_for_capture', 'succeeded', 'canceled')
        }
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        'Reservations',
        'paymentId'
      ),
      queryInterface.removeColumn(
        'Reservations',
        'paymentStatus'
      )
    ]);
  }
};
