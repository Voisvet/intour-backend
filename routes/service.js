const db = require('../models');
const helpers = require('../lib/helpers');
const express = require('express');
const router = express.Router();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

router.get('/returning_url', (req, res) => {
    res.send('<html><body>You can return into app</body></html>');
});

module.exports = router;
