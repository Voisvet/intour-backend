const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({
    status: 0,
    errorMessage: 'This is an endpoint for mobile app'
  });
});

module.exports = router;
