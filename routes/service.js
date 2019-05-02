const db = require('../models');
const helpers = require('../lib/helpers');
const express = require('express');
const router = express.Router();
const axios = require('axios');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

router.get('/returning_url', (req, res) => {
    res.send('<html><body>You can return into app</body></html>');
});

router.post('/yk_notification', async (req, res) => {
  console.log('[SERV] Got notification from YK');
  console.log(req.body);

  const type = typeof(req.body.type) == 'string' && req.body.type === 'notification' ?
    req.body.type : false;
  const paymentId = typeof(req.body.object.id) == 'string' && req.body.object.id.length > 0 ?
    req.body.object.id : false;
  const paymentStatus = typeof(req.body.object.status) == 'string' && req.body.object.status > 0 ?
    req.body.object.status : false;
  const reservationId = typeof(req.body.object.metadata.reservationId) == 'number'
    && req.body.object.metadata.reservationId > 0 ?
    req.body.object.metadata.reservationId : false;

  console.log('type', type);
  console.log('paymentId', paymentId);
  console.log('paymentStatus', paymentStatus);
  console.log('reservationId', reservationId);


  if (reservationId && type && paymentId && paymentStatus &&
      typeof(req.body.object.paid) =='boolean') {

    console.log('[SERV] Passed all checks');
    const reservation = await db.sequelize.model('Reservation').findByPk(reservationId);
    const response = await axios.get(
      config.yk.kassaApiUrl + '/payments/' + paymentId,
      {
        auth: {
          username: config.yk.shopId,
          password: config.yk.secretKey
        }
      }
    );

    console.log('[SERV] Requested payment from server');
    console.log(response);

    if (response.status !== 200) {
      res.status(500).send();
      return;
    }

    if (response.data.status !== paymentStatus ||
        reservation.paymentId !== paymentId) {
      res.status(400).send();
      return;
    }

    reservation.paymentStatus = paymentStatus;
    if (req.body.object.paid && reservation.status !== 'paid') {
      reservation.status = 'paid';
      reservation.paymentDate = new Date();
    }
    await reservation.save();

    console.log('[SERV] Reservation updated');

    res.status(200).send();
  } else {
    console.log('[SERV] Request is not valid');
    res.status(400).send();
  }
});

module.exports = router;
