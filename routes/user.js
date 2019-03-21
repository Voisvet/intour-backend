const db = require('../models');
const helpers = require('../lib/helpers');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

function checkString(string) {
  return typeof(string) == "string"
    && string.trim().length > 0
    ? string.trim() : false;
}

router.post('/new', async (req, res, next) => {
  const firstName = checkString(req.body.first_name);
  const lastName = checkString(req.body.last_name);
  const phone = checkString(req.body.phone);
  const password = checkString(req.body.password);
  const agentId = req.body.agent_id;

  if (firstName && lastName && phone && password) {
    let transaction;

    try {
      transaction = await db.sequelize.transaction();

      let agent = null;
      // Get agent if it is specified
      if (typeof(agentId) == 'number') {
        agent = await db.sequelize.model('Agent')
          .findByPk(agentId, {transaction});
        if (!agent) {
          res.send({
            status: -1,
            errorMessage: 'Agent with specified ID is not found'
          });
          await transaction.rollback();
          return;
        }
      }

      // Create new customer
      const customer = await db.sequelize.model('Customer').create({
        firstName,
        lastName,
        phone
      }, {transaction});

      // Add new customer to agent's list of customers
      if (agent) await agent.addCustomers(customer, {transaction});

      // Check if we have user with the same login in DB
      let user = await db.sequelize.model('User').findOne({
        where: {
          login: phone
        }
      });

      if (user) {
        res.send({
          status: -1,
          errorMessage: 'This phone number is already used'
        });
        await transaction.rollback();
        return;
      }

      // Create new user
      user = await db.sequelize.model('User').create({
        login: phone,
        passwordHash: helpers.hash(password),
        accountType: 'customer'
      }, {transaction});

      // Associate new user with a customer
      await user.setCustomer(customer, {transaction});

      await transaction.commit();

      res.send({
        status: 0,
        errorMessage: '',
        token: jwt.sign({
          userId: user.id,
          customerId: customer.id,
          accountType: user.accountType
        }, config.tokenSecret, {
          expiresIn: '30d'
        })
      });
    } catch (err) {
      if (err && transaction) await transaction.rollback();
      res.status(500);
      res.send({
        status: -1,
        errorMessage: 'Something went wrong when storing data to DB'
      });
    }
  } else {
    res.send({
      status: -1,
      errorMessage: 'Missing required fields'
    });
  }
});

module.exports = router;
