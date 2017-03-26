#!/usr/bin/env node
const EXPORT = `
CREATE TABLE C_EXPORT_PRODUCTS (id NUMBER NOT NULL, name VARCHAR(100) NOT NULL, price NUMBER(10, 2) NOT NULL, description VARCHAR(200) NOT NULL, created_at TIMESTAMP, batchid NUMBER, batchdate TIMESTAMP)
`

const IMPORT = `
CREATE TABLE C_IMPORT_ORDERS (id NUMBER NOT NULL, product NUMBER NOT NULL, quantity NUMBER(10, 2) NOT NULL, packaging VARCHAR(10) NOT NULL, currency VARCHAR(10) NOT NULL, price NUMBER(10, 2) NOT NULL, batchid NUMBER, batchdate TIMESTAMP)
`

// const TRACK = `
// CREATE TABLE C_TRACK (name VARCHAR(100), procedure_after VARCHAR(100), procedure_before VARCHAR(100), tablename VARCHAR(5), batchid NUMBER, updated_at TIMESTAMP)
// `

const SEQUENCE_IMPORT_ORDERS = `CREATE SEQUENCE C_SEQ_I_ORDERS INCREMENT BY 1`
const SEQUENCE_EXPORT_PRODUCT = `CREATE SEQUENCE C_SEQ_E_PRODUCT INCREMENT BY 1`

const TABLES = [EXPORT, IMPORT, SEQUENCE_EXPORT_PRODUCT, SEQUENCE_IMPORT_ORDERS]

require('../oracle.js')()
.then(function(connection) {
  return Promise.all(TABLES.map((sql) => connection.execute(sql)))
  .then(() => {
    console.log('Tables created')
    connection.close()
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
  })
})
