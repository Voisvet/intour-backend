const path = require('path');
const spawn = require('child-process-promise').spawn;

const spawnOptions = { stdio: 'inherit' };

const env_mode = process.env.ENV || 'development';

(async () => {
  try {
    // Migrate the DB
    await spawn('./node_modules/.bin/sequelize', ['db:migrate', `--env=${env_mode}`, '--config=./config/dbConfig.json'], spawnOptions);
    console.log('*************************');
    console.log('Migration successfulnpm a');
  } catch (err) {
    // Oh no!
    console.log('*************************');
    console.log('Migration failed. Error:', err.message);
    process.exit(1);
  }

  process.exit(0);
})();
