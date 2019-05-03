const db = require('../models');
const helpers = require('../lib/helpers');
const validators = require('../lib/validators');
const { validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');
const jwtMiddleware = require('express-jwt');
const express = require('express');
const router = express.Router();
const axios = require('axios');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const weekDays = require('../lib/helpers').weekDays;

router.post('/new', validators.client, async (req, res) => {

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
    if (req.body.agent_id) {
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
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB'});
  }
});

router.get('/regions', async (req, res) => {
  try {

    // const excursion = await db.sequelize.model("Excursion").findByPk(excursionId, {
    //   include: [{
    //     model: db.sequelize.model('ExcursionSchedule'),
    //     as: 'Schedule',
    //     where: {
    //       weekDay: weekDays[parsedDate.getDay()],
    //       time: `${parsedDate.getHours()}:${parsedDate.getMinutes()}:00`
    //     }
    //   }]
    // });
    const countries = await db.sequelize.model('Country').findAll({
      include: [{
        model: db.sequelize.model('City'),
        as: 'Cities'
      }]
    });

    const regions = countries.map(country => ({
      name: country.name,
      id: country.id,
      cities: country.Cities.map(city => ({
        name: city.name,
        id: city.id
      }))
    }));

    res.send({
      regions
    })
  } catch (err) {
    res.status(500).send({errorMessage: 'Database is not available now. Try again later.'});
  }
});

router.get('/token', validators.login, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send({
      errorMessage: 'Обнаружены ошибки при вводе данных',
      validationErrors: errors.array()
    });
    return;
  }
  const user = await db.sequelize.model('User').findOne({
    where: {
      login: req.query.login,
      passwordHash: helpers.hash(req.query.pass)
    }
  });

  if (user && user.accountType === 'customer') {
    res.send({
      token: jwt.sign({
        userId: user.id,
        customerId: user.customerId,
        accountType: user.accountType
      }, config.tokenSecret, {
        expiresIn: '30d'
      })
    });
  } else {
    res.status(400).send({errorMessage: 'Login not found or wrong password'});
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
  if (req.user.accountType !== 'customer') {
    res.status(403).send({errorMessage: 'This user cannot use the app'});
    return;
  }

  req.user.user = await db.sequelize.model("User")
    .findByPk(req.user.userId, {
      include: [{
        model: db.sequelize.model('Customer'),
        as: 'Customer',
        where: {
          id: req.user.customerId
        }
      }]
    });

  if (!req.user.user) {
    res.status(401).send({errorMessage: 'Your account doesn\'t exist'});
    return;
  }

  next();
});

// Get list of all reservations
router.post('/reservations', validators.reservation, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send({
      errorMessage: 'Обнаружены ошибки при вводе данных',
      validationErrors: errors.array()
    });
    return;
  }

  const parsedDate = new Date(req.body.date);

  // Check that excursion exists and takes place at specified time
  const excursion = await db.sequelize.model("Excursion").findByPk(req.body.excursion_id, {
    include: [{
      model: db.sequelize.model('ExcursionSchedule'),
      as: 'Schedule',
      where: {
        weekDay: weekDays[parsedDate.getDay()],
        time: `${parsedDate.getHours()}:${parsedDate.getMinutes()}:00`
      }
    }]
  });

  if (!excursion) {
    res.stat(400).send({errorMessage: 'Specified excursion doesn\'t exist or take place at that day and time'});
    return;
  }

  const totalCost = req.body.adult_tickets_amount * excursion.adult_ticket_cost
            + req.body.child_tickets_amount * excursion.child_ticket_cost;

  // Begin transaction for changing data
  let transaction;
  try {
    transaction = await db.sequelize.transaction();

    const reservation = await db.sequelize.model('Reservation').create({
      excursionDate: parsedDate,
      excursionTime: `${parsedDate.getHours()}:${parsedDate.getMinutes()}:00`,
      amountOfAdultTickets: req.body.adult_tickets_amount,
      amountOfChildTickets: req.body.child_tickets_amount,
      totalCost: totalCost
    }, {transaction});

    await reservation.setExcursion(excursion, {transaction});

    await req.user.user.Customer.addReservations(reservation, {transaction});

    // Payment object for Yandex.Kassa
    const payment = {
      amount: {
        value: reservation.totalCost,
        currency: config.yk.currency
      },
      capture: true,
      description: `Оплата заказа №${reservation.id}`,
      metadata: {
        reservationId: reservation.id
      },
      confirmation: {
        type: 'redirect',
        return_url: config['apiServerBaseUrl'] + `/service/returning_url`
      }
    };

    // Create payment
    const response = await axios.post(
      config.yk.kassaApiUrl + '/payments',
      payment,
      {
        auth: {
          username: config.yk.shopId,
          password: config.yk.secretKey
        },
        headers: {
          'Idempotence-Key': reservation.id,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status !== 200) {
      throw {
        name: 'Could not create payment',
        data: response
      }
    }

    reservation.paymentId = response.data.id;
    reservation.paymentStatus = response.data.status;
    reservation.paymentLink = response.data.confirmation.confirmation_url;
    await reservation.save({transaction});

    await transaction.commit();

    res.send({
      total_cost: +totalCost.toFixed(2),
      id: reservation.id,
      payment_link: reservation.paymentLink
    });
  } catch (err) {
    if (err && transaction) await transaction.rollback();
    console.error(err);
    res.status(500).send({errorMessage: 'Something went wrong when storing data to DB. Try again later.'});
  }
});

router.get('/reservations', async (req, res) => {
  const reservations = await req.user.user.Customer.getReservations({
    include: [{
      model: db.sequelize.model('Excursion'),
      as: 'Excursion'
    }]
  });

  res.send({
    reservations: reservations.map(reservation => {
      const splittedTime = reservation.excursionTime.split(":");
      const totalTime = +splittedTime[0] * 60 + +splittedTime[1] + reservation.Excursion.duration;

      const endHours = Math.floor(totalTime / 60);
      const endMinutes = totalTime % 60;

      return {
        id: reservation.id,
        title: reservation.Excursion.title,
        total_cost: +reservation.totalCost,
        date: +new Date(reservation.excursionDate),
        start_time: `${splittedTime[0]}:${splittedTime[1]}`,
        end_time: `${endHours < 10 ? '0' + endHours : endHours}:${endMinutes < 10 ? '0' + endMinutes : endMinutes}`,
        status: reservation.status,
        adult_tickets_amount: reservation.amountOfAdultTickets,
        child_tickets_amount: reservation.amountOfChildTickets
      }
    })
  });
});

router.get('/reservations/:id', validators.id, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.stat(400).send({
      errorMessage: 'Обнаружены ошибки при вводе данных',
      validationErrors: errors.array()
    });
    return;
  }

  const reservation = (await req.user.user.Customer.getReservations({
    where: {id: req.params.id},
    include: [{
      model: db.sequelize.model('Excursion'),
      as: 'Excursion',
      include: [{
        model: db.sequelize.model('ExcursionImage'),
        as: 'Images'
      }]
    }]
  }))[0];

  if(!reservation) {
    res.status(404).send({errorMessage: 'Reservation not found'});
    return;
  }

  const splittedTime = reservation.excursionTime.split(":");
  const endHours = (+splittedTime[0] + Math.floor(reservation.Excursion.duration / 60)) % 24;
  const endMinutes = +splittedTime[1] + reservation.Excursion.duration % 60;

  res.send({
    reservation: {
      id: reservation.id,
      title: reservation.Excursion.title,
      images: reservation.Excursion.Images.map(image => config['imageServerBaseUrl'] + image.link),
      start_time: reservation.excursionTime,
      end_time: `${endHours}:${endMinutes}:00`,
      duration: reservation.Excursion.duration,
      type: reservation.Excursion.type,
      services: reservation.Excursion.services,
      description: reservation.Excursion.description,
      starting_point: reservation.Excursion.starting_point,
      date: +new Date(reservation.excursionDate),
      total_cost: +reservation.totalCost,
      status: reservation.status,
      adult_tickets_amount: +reservation.amountOfAdultTickets,
      child_tickets_amount: +reservation.amountOfChildTickets
    }
  });
});

router.post('/reservations/:id/cancel', validators.id, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send({
      errorMessage: 'Обнаружены ошибки при вводе данных',
      validationErrors: errors.array()
    });
    return;
  }
  const reservation = (await req.user.user.Customer.getReservations({
    where: {id: req.params.id}
  }))[0];

  if (reservation.status !== 'new') {
    res.status(400).send({errorMessage: 'Cannot cancel the excursion'});
  }

  reservation.setDataValue('status', 'cancelled');

  reservation.save();

  res.send({});
});

/*
 * --------------------------------------------------
 * Temporary code
 * --------------------------------------------------
 */

router.get('/reservations/:id/payment_link', validators.id, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send({
      errorMessage: 'Обнаружены ошибки при вводе данных',
      errors: errors.array()
    });
    return;
  }
  const reservation = (await req.user.user.Customer.getReservations({
    where: {id: req.params.id}
  }))[0];

  if (!reservation) {
    res.status(404).send({errorMessage: 'Cannot find reservation'});
  }

  res.send({
    payment_link: reservation.paymentLink
  });
});

module.exports = router;
