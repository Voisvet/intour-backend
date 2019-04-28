const db = require('../models');
const helpers = require('../lib/helpers');
const jwt = require('jsonwebtoken');
const jwtMiddleware = require('express-jwt');
const express = require('express');
const router = express.Router();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const weekDays = require('../lib/helpers').weekDays;

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
      status: 0,
      errorMessage: '',
      regions
    })
  } catch (err) {
    res.status(500).send({
      status: -1,
      errorMessage: 'Database is not available now. Try again later.'
    })
  }
});

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

    if (user && user.accountType === 'customer') {
      res.send({
        status: 0,
        errorMessage: '',
        token: jwt.sign({
          userId: user.id,
          customerId: user.customerId,
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
  if (req.user.accountType !== 'customer') {
    res.status(401);
    res.send({
      status: -1,
      errorMessage: 'This user cannot use the app'
    });
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
    res.status(401);
    res.send({
      status: -1,
      errorMessage: 'Your account doesn\'t exist'
    });
    return;
  }

  next();
});

// Get list of all reservations
router.post('/reservations', async (req, res) => {
  const excursionId = (typeof(req.body.excursion_id) == 'number'
    && req.body.excursion_id >= 0) ? req.body.excursion_id: false;
  const date = (typeof(req.body.date) == 'number'
    && req.body.date>= 0) ? req.body.date: false;
  const amountOfAdultTickets = (typeof(req.body.adult_tickets_amount) == 'number'
    && req.body.adult_tickets_amount >= 0) ? req.body.adult_tickets_amount : false;
  const amountOfChildTickets = (typeof(req.body.child_tickets_amount) == 'number'
    && req.body.child_tickets_amount >= 0) ? req.body.child_tickets_amount : false;

  // Check required fields
  if (excursionId && date && typeof(amountOfAdultTickets) == 'number' && typeof(amountOfChildTickets) == 'number') {
    const parsedDate = new Date(date);

    // Check that excursion exists and takes place at specified time
    const excursion = await db.sequelize.model("Excursion").findByPk(excursionId, {
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
      res.send({
        status: -1,
        errorMessage: 'Specified excursion doesn\'t exist or take place at that day and time'
      });
      return;
    }

    const totalCost = amountOfAdultTickets * excursion.adult_ticket_cost
              + amountOfChildTickets * excursion.child_ticket_cost;

    // Begin transaction for changing data
    let transaction;
    try {
      transaction = await db.sequelize.transaction();

      const reservation = await db.sequelize.model('Reservation').create({
        excursionDate: parsedDate,
        excursionTime: `${parsedDate.getHours()}:${parsedDate.getMinutes()}:00`,
        amountOfAdultTickets,
        amountOfChildTickets,
        totalCost: totalCost
      }, {transaction});

      await reservation.setExcursion(excursion, {transaction});

      await req.user.user.Customer.addReservations(reservation, {transaction});

      await transaction.commit();

      res.send({
        status: 0,
        errorMessage: '',
        total_cost: +totalCost.toFixed(2),
        id: reservation.id
      });
    } catch (err) {
      if (err && transaction) await transaction.rollback();
      res.status(500);
      res.send({
        status: -1,
        errorMessage: 'Something went wrong when storing data to DB. Try again later.'
      });
    }
  } else {
    res.send({
      status: -1,
      errorMessage: 'Missing required data'
    });
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
    status: 0,
    errorMessage: '',
    reservations: reservations.map(reservation => {
      const splittedTime = reservation.excursionTime.split(":");
      const endHours = (+splittedTime[0] + Math.floor(reservation.Excursion.duration / 60)) % 24;
      const endMinutes = +splittedTime[1] + reservation.Excursion.duration % 60;

      return {
        id: reservation.id,
        title: reservation.Excursion.title,
        total_cost: +reservation.totalCost,
        date: +new Date(reservation.excursionDate),
        start_time: reservation.excursionTime,
        end_time: `${endHours}:${endMinutes}:00`,
        status: reservation.status,
        adult_tickets_amount: reservation.amountOfAdultTickets,
        child_tickets_amount: reservation.amountOfChildTickets
      }
    })
  });
});

router.get('/reservations/:id', async (req, res) => {
  const id = (typeof(+req.params.id) == 'number'
    && +req.params.id >= 0) ? +req.params.id: false;

  if (id) {
    const reservation = (await req.user.user.Customer.getReservations({
      where: {id},
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
      res.status(404);
      res.send({
        status: -1,
        errorMessage: 'Reservation not found'
      });
      return;
    }

    const splittedTime = reservation.excursionTime.split(":");
    const endHours = (+splittedTime[0] + Math.floor(reservation.Excursion.duration / 60)) % 24;
    const endMinutes = +splittedTime[1] + reservation.Excursion.duration % 60;

    res.send({
      status: 0,
      errorMessage: '',
      reservation: {
        id: reservation.id,
        title: reservation.Excursion.title,
        images: reservation.Excursion.Images.map(image => image.link),
        start_time: reservation.excursionTime,
        end_time: `${endHours}:${endMinutes}:00`,
        duration: reservation.Excursion.duration,
        type: reservation.Excursion.type,
        services: reservation.Excursion.services,
        description: reservation.Excursion.description,
        starting_point: reservation.Excursion.starting_point,
        date: reservation.excursionDate,
        total_cost: reservation.totalCost,
        status: reservation.status,
        adult_tickets_amount: reservation.amountOfAdultTickets,
        child_tickets_amount: reservation.amountOfChildTickets
      }
    });
  } else {
    res.send({
      status: -1,
      errorMessage: 'ID must be a number'
    });
  }
});

router.post('/reservations/:id/cancel', async (req, res) => {
  const id = (typeof(+req.params.id) == 'number'
    && +req.params.id >= 0) ? +req.params.id: false;

  if (id) {
    const reservation = (await req.user.user.Customer.getReservations({
      where: {id}
    }))[0];

    if (reservation.status !== 'new') {
      res.send({
        status: -1,
        errorMessage: 'Cannot cancel the excursion'
      });
    }

    reservation.setDataValue('status', 'cancelled');

    reservation.save();

    res.send({
      status: 0,
      errorMessage: ''
    });
  } else {
    res.send({
      status: -1,
      errorMessage: 'ID must be a number'
    });
  }

});

module.exports = router;
