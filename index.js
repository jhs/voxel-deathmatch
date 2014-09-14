var game = require('./game.js')

var primus = Primus.connect()
primus.on('error', function(er) { console.log('Primus error: ' + er.message) })
primus.on('end', function() { console.log('Primus connection ended') })

primus.on('open', function() {
  game.connected(primus)
})

primus.on('reconnected', game.reconnected)

//game.start('A')

//window.primus = primus // for debugging
