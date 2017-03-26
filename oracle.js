const oracle = require('oracledb')
const config = require('./config.json')

oracle.outFormat = oracle.OBJECT

module.exports = function() {
  return oracle.getConnection(config)
}
