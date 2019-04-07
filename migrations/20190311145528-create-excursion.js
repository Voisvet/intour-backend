'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Excursions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING
      },
      duration: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      services: {
        allowNull: false,
        type: Sequelize.TEXT,
        get() {
          return this.getDataValue('services').split(';')
        },
        set(val) {
          this.setDataValue('services', val.join(';'));
        }
      },
      description: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      starting_point: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      adult_ticket_cost: {
        allowNull: false,
        type: Sequelize.DECIMAL(6,2)
      },
      child_ticket_cost: {
        allowNull: false,
        type: Sequelize.DECIMAL(6,2)
      },
      region: {
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
        return queryInterface.addColumn(
          'ExcursionImages',
          'excursionId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Excursions',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        );
      })
      .then(() => {
        return queryInterface.addColumn(
          'ExcursionSchedules',
          'excursionId',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Excursions',
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
      'ExcursionSchedules',
      'excursionId'
    ).then(() => {
      return queryInterface.removeColumn(
        'ExcursionImages',
        'excursionId'
      )
    }).then(() => {
      return queryInterface.dropTable('Excursions', {});
    });
  }
};
