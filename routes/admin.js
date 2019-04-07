const db = require('../models');
const helpers = require('../lib/helpers');
const jwt = require('jsonwebtoken');
const jwtMiddleware = require('express-jwt');
const express = require('express');
const router = express.Router();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

function checkString(string) {
  return typeof(string) == "string"
  && string.trim().length > 0
    ? string.trim() : false;
}

router.get('/token', async (req, res) => {
  const login = checkString(req.query.login);
  const password = checkString(req.query.pass);

  if (login && password) {
    const user = await db.sequelize.model('User').findOne({
      where: {
        login,
        passwordHash: helpers.hash(password)
      }
    });

    if (user && ['agent', 'operator', 'admin'].includes(user.accountType)) {
      res.send({
        status: 0,
        errorMessage: '',
        token: jwt.sign({
          userId: user.id,
          operatorId: user.operatorId,
          agentId: user.agentId,
          accountType: user.accountType
        }, config.tokenSecret, {
          expiresIn: '30d'
        })
      });
    } else {
      res.send({
        status: -1,
        errorMessage: 'Login not found or wrong password'
      })
    }
  } else {
    res.send({
      status: -1,
      errorMessage: 'Missing login or password'
    });
  }
});

router.use(jwtMiddleware({
  secret: config.tokenSecret,
  getToken: (req) => {
    if (req.query.token) {
      return req.query.token;
    }
    return null;
  }
}));

// Check account type and start extract user from database
router.use(async(req, res, next) => {
  if (['agent', 'operator', 'admin'].includes(req.user.accountType)) {
    res.status(401);
    res.send({
      status: -1,
      errorMessage: 'This user cannot use the app'
    });
    return;
  }

  req.user.user = await db.sequelize.model("User")
    .findByPk(req.user.userId, {
      include: [
        {
          model: db.sequelize.model('Agent'),
          as: 'Agent',
          where: {
            id: req.user.agentId
          }
        },
        {
          model: db.sequelize.model('ExcursionOperator'),
          as: 'Operator',
          where: {
            id: req.user.operatorId
          }
        }
      ]
    });

  if (!req.user.user) {
    res.status(401);
    res.send({
      status: -1,
      errorMessage: 'Your account doesn\'t exist'
    });
    return;
  }

  next();
});

module.exports = router;
