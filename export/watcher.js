const oracle = require('../oracle')
const bluebird = require('bluebird')
const launch = require('./pm2.js')

const MIN_NUM = 1000
const POLLING = 5000
const SCRIPT = `${__dirname}/export_products.js`

function execute() {
  return oracle()
  .then((connection) => {
    return connection.execute('SELECT COUNT(1) as num FROM C_EXPORT_PRODUCTS WHERE batchid IS NULL AND batchdate IS NULL')
    .then((results) => {
      const num = results.rows[0].NUM

      if (num < MIN_NUM) {
        console.log('Nothing to do, %d lines', num)
        return connection.close()
        .then(() => bluebird.delay(POLLING).then(() => execute()))
      }

      console.log('Starting %s, got %d lines', SCRIPT, num)

      return connection.close()
      .then(() => launch(SCRIPT))
      .then(() => {
        return bluebird.delay(POLLING).then(() => execute())
      })
    })
  })
}

execute()
.catch((error) => {
  console.error(error)
  process.exit(1)
})
