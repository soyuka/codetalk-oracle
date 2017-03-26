#!/usr/bin/env node
const oracle = require('../oracle')
const minimist = require('minimist')
const {from, fromPromise} = require('most')
const faker = require('faker')

const batchInserts = 100
const argv = minimist(process.argv.slice(2))

require('../utils/help.js')({
  description: `Adds random data to C_EXPORT_PRODUCTS`,
  usage: `create_export_products.js [number of lines]`,
  example: `create_export_products.js 10000`
})

const num = argv._[0] !== undefined ? +argv._[0] : 1000

console.log('Creating %d data in C_EXPORT_PRODUCTS', num)

oracle()
.then(function(connection) {
  let i = 0

  from(new Array(num).fill(0))
  .chain(() => {
    return fromPromise(
      connection.execute(
        `INSERT INTO C_EXPORT_PRODUCTS VALUES(:id, :name, :price, :description, sysdate, null, null)`,
        [faker.random.number(), faker.commerce.product(), faker.commerce.price(), faker.commerce.productName()])
      .then(() => {
        if (i % batchInserts === 0) {
          return connection.commit()
        }

        return Promise.resolve()
      })
    )
  })
  .observe(() => {
    ++i
  })
  .then(() => {
    return connection.commit()
  })
  .then(() => {
    console.log('Done.')
    return connection.close()
  })
  .catch((e) => {
    console.error(e)
  })
})
