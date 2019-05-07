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

helpers.computeEndTime = (startTime, duration) => {
  const splittedTime = startTime.split(":");
  const totalTime = +splittedTime[0] * 60 + +splittedTime[1] + duration;

  const endHours = Math.floor(totalTime / 60);
  const endMinutes = totalTime % 60;

  return `${endHours < 10 ? '0' + endHours : endHours}:${endMinutes < 10 ? '0' + endMinutes : endMinutes}`
};

helpers.weekDays = [
  'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
];

module.exports = helpers;
