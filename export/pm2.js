const pm2 = require('pm2')

let connected = false

function connect() {
  return new Promise((resolve, reject) => {
    pm2.connect(function(err) {
      if (err) {
        return reject(err)
      }

      resolve()
    })
  })
}

function start(script) {
  return new Promise((resolve, reject) => {
    let id

    pm2.launchBus((err, bus) => {
      if (err) {
        return reject(err)
      }

      bus.on('process:event', (packet) => {
        if (id === packet.process.pm_id && packet.event === 'exit')  {
          bus.close()
          console.log('%s exited', SCRIPT)
          resolve()
        }
      })

      pm2.start(script, {autorestart: false}, (err, process) => {
        if (err) {
          return reject(err)
        }

        id = process[0].pm_id
      })
    })
  })
}

function launch(script) {
  if (connected) {
    return start(script)
  }

  return connect()
  .then(() => {
    connected = true
    return start(script)
  })
}

module.exports = launch
