#!/usr/bin/env node
const EXPORT = `
DROP TABLE C_EXPORT_PRODUCTS
`

const IMPORT = `
DROP TABLE C_IMPORT_ORDERS
`

// const TRACK = `
// DROP TABLE C_TRACK
//`

const SEQUENCE_IMPORT_ORDERS = `DROP SEQUENCE C_SEQ_I_ORDERS`
const SEQUENCE_EXPORT_PRODUCT = `DROP SEQUENCE C_SEQ_E_PRODUCT`

const TABLES = [EXPORT, IMPORT, SEQUENCE_EXPORT_PRODUCT, SEQUENCE_IMPORT_ORDERS]

require('../oracle.js')()
.then(function(connection) {
  return Promise.all(TABLES.map((sql) => connection.execute(sql)))
  .then(() => {
    console.log('Tables droppped')
    connection.close()
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
  })
})

