const db = require('../models');
const helpers = require('../lib/helpers');
const validators = require('../lib/validators');
const { validationResult } = require('express-validator/check');
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
      let userName = 'Administrator';
      if (user.accountType === 'agent') {
        const agent = await user.getAgent();
        userName = agent.name;
      } else if (user.accountType === 'operator') {
        const operator = await user.getExcursionOperator();
        userName = operator.name;
      }
      res.send({
        token: jwt.sign({
          userName,
          userId: user.id,
          operatorId: user.operatorId,
          agentId: user.agentId,
          accountType: user.accountType
        }, config.tokenSecret, {
          expiresIn: '30d'
        })
      });
    } else {
      res.status(400).send({errorMessage: 'Login not found or wrong password'});
    }
  } else {
    res.status(400).send({errorMessage: 'Missing login or password'});
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
    res.status(403).send({errorMessage: 'This user cannot use the app'});
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
    res.status(401).send({errorMessage: 'Your account doesn\'t exist'});
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
        excursions
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
    res.status(400).send({errorMessage: 'Missing required fields'});
    return;
  }

  const city = await db.sequelize.model('City').findByPk(cityId);
  if (!city) {
    res.status(400).send({errorMessage: 'Specified city does not exist'});
    return;
  }

  let operator;
  if (operatorId) {
    operator = await db.sequelize.model('ExcursionOperator').findByPk(operatorId);
    if (!operator) {
      res.status(400).send({errorMessage: 'Specified operator does not exist'});
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
      id: excursionInstance.id
    });
  } catch (err) {
    if (err && transaction) await transaction.rollback();
    res.status(500).send({errorMessage: 'Something went wrong... Try again later or contact administrator'});
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
    res.status(400).send({errorMessage: 'Image is not defined in your request'});
  }
});

router.get('/reservations', async (req, res) => {
  try {
    const reservations = await db.sequelize.model('Reservation').findAll();

    res.send({
      reservations
    })
  } catch (err) {
    console.error(err);
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB. Try again later.'});
  }
});

router.get('/agents', async (req, res) => {
  try {
    const agents = await db.sequelize.model('Agent').findAll();

    res.send({
      agents
    })
  } catch (err) {
    console.error(err);
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB. Try again later.'});
  }
});

router.get('/agents/:id/report', async (req, res) => {
  try {
    const agent = await db.sequelize.model('Agent').findByPk(req.params.id);
    const customers = await agent.getCustomers();
    const reservations = [];
    let temp;

    // Can be optimised using promise.all...
    for (let i = 0; i < customers.length; i++) {
      temp = await customers[i].getReservations();
      reservations.push(...temp);
    }

    res.send({
      reservations
    })
  } catch (err) {
    console.error(err);
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB. Try again later.'});
  }
});

router.get('/agents/:id/clients', async (req, res) => {
  try {
    const agent = await db.sequelize.model('Agent').findByPk(req.params.id);
    const customers = await agent.getCustomers();

    res.send({
      clients: customers
    })
  } catch (err) {
    console.error(err);
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB. Try again later.'});
  }
});

router.get('/operators', async (req, res) => {
  try {
    const operators = await db.sequelize.model('ExcursionOperator').findAll();

    res.send({
      operators
    })
  } catch (err) {
    console.error(err);
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB. Try again later.'});
  }
});

router.get('/clients', async (req, res) => {
  try {
    const customers = await db.sequelize.model('Customer').findAll();

    res.send({
      clients: customers
    })
  } catch (err) {
    console.error(err);
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB. Try again later.'});
  }
});

router.get('/operators/:id/report', async (req, res) => {
  try {
    const operator = await db.sequelize.model('ExcursionOperator').findByPk(req.params.id);
    const excursions = await operator.getExcursions();

    const reservations = [];
    let temp;

    // Can be optimised using promise.all...
    for (let i = 0; i < excursions.length; i++) {
      temp = await db.sequelize
        .model('Reservation')
        .findAll({where: {excursionId: excursions[i].id}});
      reservations.push(...temp);
    }

    res.send({
      reservations
    })
  } catch (err) {
    console.error(err);
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB. Try again later.'});
  }
});

router.post('/clients', validators.client, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send({
      errorMessage: 'Обнаружены ошибки при вводе данных',
      validationErrors: errors.array()
    });
    return;
  }


  let transaction;

  try {
    transaction = await db.sequelize.transaction();

    let agent = null;
    // Get agent if it is specified
    if (typeof(req.body.agent_id) == 'number') {
      agent = await db.sequelize.model('Agent')
        .findByPk(req.body.agent_id, {transaction});
      if (!agent) {
        res.status(400).send({errorMessage: 'Agent with specified ID is not found'});
        await transaction.rollback();
        return;
      }
    }

    // Create new customer
    const customer = await db.sequelize.model('Customer').create({
      firstName: req.body.first_name,
      lastName: req.body.last_name,
      phone: req.body.phone
    }, {transaction});

    // Add new customer to agent's list of customers
    if (agent) await agent.addCustomers(customer, {transaction});

    // Check if we have user with the same login in DB
    let user = await db.sequelize.model('User').findOne({
      where: {
        login: req.body.phone
      }
    });

    if (user) {
      res.status(400).send({errorMessage: 'This phone number is already used'});
      await transaction.rollback();
      return;
    }

    // Create new user
    user = await db.sequelize.model('User').create({
      login: req.body.phone,
      passwordHash: helpers.hash(req.body.password),
      accountType: 'customer'
    }, {transaction});

    // Associate new user with a customer
    await user.setCustomer(customer, {transaction});

    await transaction.commit();

    res.send({
      id: customer.id
    });
  } catch (err) {
    if (err && transaction) await transaction.rollback();
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB'});
  }
});

router.post('/operators', validators.agentAndOperator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send({
      errorMessage: 'Обнаружены ошибки при вводе данных',
      validationErrors: errors.array()
    });
    return;
  }

  let transaction;

  try {
    transaction = await db.sequelize.transaction();

    // Create new operator
    const operator = await db.sequelize.model('ExcursionOperator').create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email
    }, {transaction});

    // Check if we have user with the same login in DB
    let user = await db.sequelize.model('User').findOne({
      where: {
        login: req.body.email
      }
    });

    if (user) {
      res.status(400).send({errorMessage: 'This email is already used'});
      await transaction.rollback();
      return;
    }

    // Create new user
    user = await db.sequelize.model('User').create({
      login: req.body.email,
      passwordHash: helpers.hash(req.body.password),
      accountType: 'operator'
    }, {transaction});

    // Associate new user with a customer
    await user.setExcursionOperator(operator, {transaction});

    await transaction.commit();

    res.send({
      id: operator.id
    });
  } catch (err) {
    if (err && transaction) await transaction.rollback();
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB'});
  }

});

router.post('/agents', validators.agentAndOperator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send({
      errorMessage: 'Обнаружены ошибки при вводе данных',
      validationErrors: errors.array()
    });
    return;
  }

  let transaction;

  try {
    transaction = await db.sequelize.transaction();

    // Create new operator
    const agent = await db.sequelize.model('Agent').create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email
    }, {transaction});

    // Check if we have user with the same login in DB
    let user = await db.sequelize.model('User').findOne({
      where: {
        login: req.body.email
      }
    });

    if (user) {
      res.status(400).send({errorMessage: 'This email is already used'});
      await transaction.rollback();
      return;
    }

    // Create new user
    user = await db.sequelize.model('User').create({
      login: req.body.email,
      passwordHash: helpers.hash(req.body.password),
      accountType: 'agent'
    }, {transaction});

    // Associate new user with a customer
    await user.setAgent(agent, {transaction});

    await transaction.commit();

    res.send({
      id: agent.id
    });
  } catch (err) {
    if (err && transaction) await transaction.rollback();
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB'});
  }

});

module.exports = router;
