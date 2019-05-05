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
  const type = typeof(req.body.type) == 'string' && req.body.type === 'notification' ?
    req.body.type : false;
  const paymentId = typeof(req.body.object.id) == 'string' && req.body.object.id.length > 0 ?
    req.body.object.id : false;
  const paymentStatus = typeof(req.body.object.status) == 'string'
    && req.body.object.status.length > 0 ? req.body.object.status : false;
  const reservationId = typeof(req.body.object.metadata.reservationId) == 'string'
    && +req.body.object.metadata.reservationId > 0 ?
    +req.body.object.metadata.reservationId : false;

  if (reservationId && type && paymentId && paymentStatus &&
      typeof(req.body.object.paid) == 'boolean') {

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

    if (response.status !== 200) {
      console.log("**************************************************");
      console.log("NOTIFICATION FROM YANDEX KASSA FAILED");
      console.log("Cannot get payment by request");
      console.log(response.status, response.data);
      console.log("**************************************************");
      console.log(req.body);
      console.log("**************************************************");
      res.status(500).send();
      return;
    }

    if (response.data.status !== paymentStatus ||
        reservation.paymentId !== paymentId) {
      console.log("**************************************************");
      console.log("NOTIFICATION FROM YANDEX KASSA FAILED");
      console.log("Status or ID of payment differs");
      console.log("reservation.paymentId: " + reservation.paymentId);
      console.log("response.data.status: " + response.data.status);
      console.log("**************************************************");
      console.log(req.body);
      console.log("**************************************************");
      res.status(400).send();
      return;
    }

    reservation.paymentStatus = paymentStatus;
    if (req.body.object.paid && reservation.status !== 'paid') {
      reservation.status = 'paid';
      reservation.paymentDate = new Date();
      reservation.paymentLink = '';
    }
    await reservation.save();

    res.status(200).send();
  } else {
    console.log("**************************************************");
    console.log("NOTIFICATION FROM YANDEX KASSA FAILED");
    console.log("Fail fields checking");
    console.log(req.body);
    console.log("**************************************************");

    res.status(400).send();
  }
});

module.exports = router;
