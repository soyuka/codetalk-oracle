const pump = require('pump')
const csvWriter = require('csv-write-stream')
const oracle = require('../oracle')
const fs = require('fs')

const DATA_PATH = `${__dirname}/../data/export`
const format = require('date-fns/format')
const now = new Date()
let num = 0

try {
  fs.mkdirSync(DATA_PATH)
} catch(e) {}

console.time('foo')

oracle()
.then(function(connection) {
  connection.execute('UPDATE C_EXPORT_PRODUCTS SET batchid = -1 WHERE batchid IS NULL AND batchdate IS NULL')
  .then((rows) => {
    num = rows.rowsAffected
    if (num === 0) {
      console.log('No data')
      return connection.close()
      .then(() => process.exit(0))
    }

    return connection.commit()
  })
  .then(() => {
    const readable = connection.queryStream('SELECT * FROM C_EXPORT_PRODUCTS WHERE batchid = -1 AND batchdate IS NULL')
    const dest = `${DATA_PATH}/product-${format(now, 'MM-DD-YYYY-HH-mm-ss')}.csv`

    console.log(`Exporting %d lines to ${dest}`, num)

    return new Promise((resolve, reject) => {
      pump(readable, csvWriter(), fs.createWriteStream(dest), (err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
  })
  .then(() => {
    return connection.execute('UPDATE C_EXPORT_PRODUCTS SET batchid = C_SEQ_E_PRODUCT.nextVal, batchdate = :batchdate WHERE batchid = -1 AND batchdate IS NULL', [now])
  })
  .then(() => {
    return connection.commit()
  })
  .then(() => {
  console.timeEnd('foo')
    return connection.close()
  })
  .catch((err) => {
    console.error(err)
  })
})
