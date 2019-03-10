var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({
    status: 0,
    message: 'This is an endpoint for mobile app'
  });
});

module.exports = router;
