const db = require('../models');
const express = require('express');
const router = express.Router();

const weekDays = require('../lib/helpers').weekDays;

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
        status: 0,
        errorMessage: ''
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
      const today = new Date();

      const available_dates = excursion.Schedule.map(entry => {
        let diff = 0;

        const hours = +entry.time.split(':')[0];
        const minutes = +entry.time.split(':')[1];
        const seconds = +entry.time.split(':')[2];

        if (today.getDay() < weekDays.indexOf(entry.weekDay)) {
          diff = weekDays.indexOf(entry.weekDay) - today.getDay();
        } else if (today.getDay() > weekDays.indexOf(entry.weekDay)) {
          diff = 7 - today.getDay() + weekDays.indexOf(entry.weekDay);
        } else {
          if ((hours * 60 + minutes + 30) < (today.getHours() * 60 + today.getMinutes())) {
            diff = 7;
          }
        }
        const newDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + diff,
          hours,
          minutes,
          seconds,
        );
        return +newDate;
      });

      res.send({
        status: 0,
        errorMessage: '',
        excursion: {
          id: excursion.id,
          images: excursion.Images.map(image => image.link),
          description: excursion.description,
          starting_point: excursion.starting_point,
          price_adult: excursion.adult_ticket_cost,
          price_child: excursion.child_ticket_cost,
          available_dates
        }
      })
    });
});

module.exports = router;
