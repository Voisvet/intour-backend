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
      res.send(excursions);
    });
});

module.exports = router;
