
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./avalanche-js-contract.cjs.production.min.js')
} else {
  module.exports = require('./avalanche-js-contract.cjs.development.js')
}
