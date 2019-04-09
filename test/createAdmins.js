const db = require('../models');
const helpers = require('../lib/helpers');

Excursion = db.sequelize.model('Excursion');
ExcursionImage = db.sequelize.model('ExcursionImage');
ExcursionSchedule = db.sequelize.model('ExcursionSchedule');
Country = db.sequelize.model('Country');
City = db.sequelize.model('City');

storage = {};

async function fillInData() {
  let transaction;

  try {
    transaction = await db.sequelize.transaction();

    // Create new user
    const user = await db.sequelize.model('User').create({
      login: 'admin',
      passwordHash: helpers.hash('admin'),
      accountType: 'admin'
    }, {transaction});

    await transaction.commit();
  } catch (err) {
    if (err && transaction) await transaction.rollback();
    console.log(err);
  }
}

fillInData().catch(err => console.log(err));
