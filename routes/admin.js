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
  if (!['agent', 'operator', 'admin'].includes(req.user.accountType)) {
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
          as: 'Agent'
        },
        {
          model: db.sequelize.model('ExcursionOperator'),
          as: 'ExcursionOperator'
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

router.get('/excursions', function(req, res, next) {
  const date = new Date(+req.query.date);
  db.sequelize.model('Excursion').findAll({
    include: [{
      model: db.sequelize.model('ExcursionImage'),
      as: 'Images'
    }, {
      model: db.sequelize.model('ExcursionSchedule'),
      as: 'Schedule'
    }]
  })
    .then(result => {
      const excursions = result.map(excursion => {
        return {
          id: excursion.id,
          title: excursion.title,
          duration: excursion.duration,
          services: excursion.services,
          images: excursion.Images.map(image => image.link),
          type: excursion.type,
          description: excursion.description,
          starting_point: excursion.starting_point,
          schedules: excursion.Schedule.map(schedule => ({
            weekDay: schedule.weekDay,
            time: schedule.time
          })),
          city_id: excursion.cityId,
          adult_ticket_cost: excursion.adult_ticket_cost,
          child_ticket_cost: excursion.child_ticket_cost,
          excursion_operator_id: excursion.excursionOperatorId
        };
      });

      res.send({
        excursions,
        status: 0,
        errorMessage: ''
      });
    });
});

module.exports = router;
