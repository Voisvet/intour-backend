// Dependencies
const crypto = require('crypto');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

// Container for library
const helpers = {};


// Create a SHA256 hash
helpers.hash = function(str) {
  if (typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashSecret)
      .update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

module.exports = helpers;
