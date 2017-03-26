#!/usr/bin/env node
const faker = require('faker')
const eol = require('os').EOL
const format = require('date-fns/format')
const addMinutes = require('date-fns/add_minutes')
const fs = require('fs')
const minimist = require('minimist')
const argv = minimist(process.argv.slice(2))
const {from, fromPromise} = require('most')
const {create} = require('@most/create')
const csvWriter = require('csv-write-stream')

const DATA_PATH = `${__dirname}/../data/import`

try {
  fs.mkdirSync(DATA_PATH)
} catch(e) {}

require('../utils/help.js')({
  description: `Creates JSON files with data. Data structure matches C_IMPORT_ORDERS.`,
  usage: `create_import_orders.js [number of files] [number of lines]`,
  example: `create_import_orders.js 3 77`
})

if (argv._[0] === undefined && argv._[1] === undefined) {
  throw new Error('Missing arguments')
}

const numFiles = argv._[0] !== undefined ? argv._[0] : 3
const numData = argv._[1] !== undefined ? argv._[1] : 77
const total = numFiles * numData

console.log('Creating %d files containing each %d data (total %d lines)', numFiles, numData, total)

let i = 0
let j = 0

from(new Array(numFiles).fill(0))
.chain(() => {
  let data = numData
  return create((add, end, error) => {
    const date = addMinutes(new Date(), numFiles - --j)
    const filename = `${DATA_PATH}/orders-${format(date, 'MM-DD-YYYY-HH-mm-ss')}.csv`
    const writer = csvWriter({sendHeaders: false})
    writer.pipe(fs.createWriteStream(filename))

    while(data--) {
      add(++i)
      writer.write({
        id: faker.random.number(),
        product: faker.random.number(),
        quantity: faker.finance.amount(),
        packaging: faker.random.arrayElement(['kg', 'l', 'g', 'item']),
        currency: faker.finance.currencyCode(),
        price: faker.commerce.price()
      })
    }

    writer.end()
    writer.on('finish', function() {
      end()
    })
  })
})
.observe((e) => {})
.then(() => {
  console.log('Done.')
})

