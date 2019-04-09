'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      login: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      passwordHash: {
        allowNull: false,
        type: Sequelize.STRING
      },
      accountType: {
        allowNull: false,
        type: Sequelize.ENUM('customer', 'agent', 'operator', 'admin')
      },
      customerId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      agentId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Agents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      operatorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'ExcursionOperators',
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
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Users');
  }
};
