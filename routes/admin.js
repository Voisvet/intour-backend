const db = require('../models');
const helpers = require('../lib/helpers');
const jwt = require('jsonwebtoken');
const jwtMiddleware = require('express-jwt');
const express = require('express');
const router = express.Router();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

function checkString(string) {
  return typeof (string) == "string"
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
router.use(async (req, res, next) => {
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

router.get('/excursions', function (req, res, next) {
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
          duration: +excursion.duration,
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

router.post('/excursions', async function (req, res, next) {
  const type = checkString(req.body.type);
  const title = checkString(req.body.title);
  const description = checkString(req.body.description);
  const startingPoint = checkString(req.body.starting_point);
  const cityId = typeof (req.body.city_id) == 'number'
    && req.body.city_id > 0 ? req.body.city_id : false;
  const duration = typeof (req.body.duration) == 'number'
    && req.body.duration > 0 ? req.body.duration : false;
  const adultTicketCost = typeof (req.body.adult_ticket_cost) == 'number'
    && req.body.adult_ticket_cost > 0 ? req.body.adult_ticket_cost : false;
  const childTicketCost = typeof (req.body.child_ticket_cost) == 'number'
    && req.body.child_ticket_cost > 0 ? req.body.child_ticket_cost : false;
  const operatorId = typeof (req.body.excursion_operator_id) == 'number'
    && req.body.excursion_operator_id > 0 ? req.body.excursion_operator_id : false;
  const services = req.body.services instanceof Array
    && req.body.services.every(service => typeof (service) == 'string') ? req.body.services : false;
  const images = req.body.images instanceof Array && req.body.images.length > 0
    && req.body.images.every(image => typeof (image) == 'string') ? req.body.images : false;
  const schedules = req.body.schedules instanceof Array
    && req.body.schedules.every(schedule =>
      typeof (schedule) == 'object'
      && ('week_day' in schedule && helpers.weekDays.includes(schedule.week_day))
      && ('time' in schedule && typeof(schedule.time) == 'string' && schedule.time.length === 8))
    ? req.body.schedules : false;

  if (!(type && title && description && startingPoint && cityId && duration
        && adultTicketCost && childTicketCost && services && images && schedules)) {
    res.send({
      status: -1,
      errorMessage: 'Missing required fields'
    });
    return;
  }

  const city = await db.sequelize.model('City').findByPk(cityId);
  if (!city) {
    res.send({
      status: -1,
      errorMessage: 'Specified city does not exist'
    });
    return;
  }

  let operator;
  if (operatorId) {
    operator = await db.sequelize.model('ExcursionOperator').findByPk(operatorId);
    if (!operator) {
      res.send({
        status: -1,
        errorMessage: 'Specified operator does not exist'
      });
      return;
    }
  }

  let transaction;
  try {
    transaction = await db.sequelize.transaction();

    const imageInstances = await Promise.all(images.map(image =>
      db.sequelize.model('ExcursionImage').create({link: image}, {transaction})));

    const scheduleInstances = await Promise.all(schedules.map(schedule =>
      db.sequelize.model('ExcursionSchedule').create({
        weekDay: schedule.week_day,
        time: schedule.time
      }, {transaction})));

    const excursionInstance = await db.sequelize.model('Excursion').create({
      type,
      title,
      cityId,
      duration,
      services,
      description,
      starting_point: startingPoint,
      adult_ticket_cost: adultTicketCost,
      child_ticket_cost: childTicketCost
    }, {transaction});

    await excursionInstance.setImages(imageInstances, {transaction});
    await excursionInstance.setSchedule(scheduleInstances, {transaction});

    if (operator) await operator.addExcursion(excursionInstance, {transaction});

    await transaction.commit();

    res.send({
      id: excursionInstance.id,
      status: 0,
      errorMessage: ''
    });
  } catch (err) {
    if (err && transaction) await transaction.rollback();
    res.status(500).send({
      status: -1,
      errorMessage: 'Something went wrong... Try again later or contact administrator'
    });
  }
});

router.post('/image', function(req, res, next) {
  const uploadFile = req.files.image;
  const fileName = '111.jpg';
  if (uploadFile) {

    uploadFile.mv(
      `${__dirname}/public/files/${fileName}`,
      err => {
        if (err) {
          return res.status(500).send(err);
        }

        res.send({
          file: `public/${req.files.file.name}`,
        });
      },
    );
  } else {
    res.send({
      status: -1,
      errorMessage: 'Image is not defined in your request'
    });
  }
});

module.exports = router;
