const fs = require('fs')
const path = require('path')

module.exports = function archive(files, FROM_BASE, TO_BASE) {
  FROM_BASE = path.resolve(FROM_BASE)
  TO_BASE = path.resolve(TO_BASE)
  return Promise.all(files.map((file) => {
    return new Promise((resolve, reject) => {
      fs.rename(file, file.replace(FROM_BASE, TO_BASE), function(err) {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
  }))
}

