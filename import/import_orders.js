const combine = require('combined-stream')
const pump = require('pump')
const glob = require('glob')
const oracle = require('../oracle')
const fs = require('fs')
const csvReader = require('csv-parser')
const archive = require('../utils/archive.js')

const DATA_PATH = `${__dirname}/../data/import`
const ARCHIVE_PATH = `${__dirname}/../data/archive`

try {
  fs.mkdirSync(ARCHIVE_PATH)
} catch(e) {}

const dataPromises = []
const batchInserts = 100

let dataCount = 0

function sanitize(obj) {
  obj.id = parseInt(obj.id)
  obj.quantity = parseFloat(obj.quantity)
  obj.price = parseFloat(obj.price)
  obj.product = parseInt(obj.product)
  return obj
}

function inject(connection, data) {
  const sql = `
    INSERT INTO C_IMPORT_ORDERS (id, product, quantity, packaging, currency, price, batchid, batchdate)
    VALUES (:id, :product, :quantity, :packaging, :currency, :price, C_SEQ_I_ORDERS.currVal, sysdate)
  `

  const binded = sanitize(data)
  return connection.execute(sql, binded)
  .then(e => {
    ++dataCount

    if (dataCount % batchInserts === 0) {
      return connection.commit()
    }

    return Promise.resolve()
  })
}


console.time('insert')
oracle()
.then(function(connection) {
  let filesToProcess = []

  return new Promise((resolve, reject) => {
    glob(`${DATA_PATH}/orders-*.csv`, (err, files) => {
      if (err) {
        return reject(err)
      }

      resolve(files)
    })
  })
  .then((files) => {
    if (files.length === 0) {
      console.log('No data')
      return connection.close()
      .then(() => process.exit(0))
    }

    filesToProcess = files
    return connection.execute('SELECT C_SEQ_I_ORDERS.nextVal FROM DUAL')
  })
  .then(() => {
    const stream = combine.create()
    filesToProcess.sort().map(e => {
      stream.append(fs.createReadStream(e))
    })

    return new Promise((resolve, reject) => {
      stream.pipe(csvReader({headers: [
        'id', 'product', 'quantity', 'packaging', 'currency', 'price'
      ]}))
      .on('data', function(d) {
        dataPromises.push(inject(connection, d))
      })
      .on('end', function() {
        resolve(dataPromises)
      })
    })
  })
  .then(dataPromises => {
    return Promise.all(dataPromises)
  })
  .then(() => {
    return connection.commit()
  })
  .then(() => {
    console.log('Inserted %d data', dataCount)
    console.timeEnd('insert')
    return connection.close()
  })
  .then(() => {
    return archive(filesToProcess, DATA_PATH, ARCHIVE_PATH)
  })
})
.catch((err) => {
  console.error(err)
})

