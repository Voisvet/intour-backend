'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Agents', {
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
    }).then(() => {
      queryInterface.addColumn(
        'Customers',
        'agentId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'Agents',
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
      'Customers',
      'agentId'
    )
      .then(() => {
        return queryInterface.dropTable('Agents');
      });
  }
};
