const db = require('../models');
const express = require('express');
const router = express.Router();

weekDays = [
  'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
];

router.get('/excursions', function(req, res, next) {
  const date = new Date(+req.query.date);
  db.sequelize.model('Excursion').findAll({
    where: {
      region: req.query.region,
    },
    include: [{
      model: db.sequelize.model('ExcursionImage'),
      as: 'Images'
    }, {
      model: db.sequelize.model('ExcursionSchedule'),
      as: 'Schedule',
      where: {
        weekDay: weekDays[date.getDay()]
      }
    }]
  })
    .then(result => {
      const excursions = result.map(excursion => {
        return {
          id: excursion.id,
          title: excursion.title,
          price: excursion.adult_ticket_cost,
          start_time: excursion.Schedule[0].time,
          duration: excursion.duration,
          services: excursion.services,
          image: excursion.Images[0].link,
          type: ''
        };
      });
      res.send({
        excursions,
        status_code: 0,
        error: ''
      });
    });
});

router.get('/excursions/:id', function(req, res, next) {
  db.sequelize.model('Excursion').findByPk(req.params.id, {
    include: [{
      model: db.sequelize.model('ExcursionImage'),
      as: 'Images'
    }, {
      model: db.sequelize.model('ExcursionSchedule'),
      as: 'Schedule'
    }]
  })
    .then(excursion => {
      res.send({
        status_code: 0,
        error: '',
        excursion: {
          id: excursion.id,
          images: excursion.Images.map(image => image.link),
          description: excursion.description,
          starting_point: excursion.starting_point,
          available_dates: excursion.Schedule,
          price_adult: excursion.adult_ticket_cost,
          price_child: excursion.child_ticket_cost
        }
      })
    });
});

module.exports = router;
