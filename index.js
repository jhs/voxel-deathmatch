var game = require('./game.js')

var primus = Primus.connect()
primus.on('data', on_message)
primus.on('open', function() { console.log('Connected to server') })
primus.on('error', function(er) { console.log('Primus error: ' + er.message) })
primus.on('end', function() { console.log('Primus connection ended') })

function on_message(msg) {
  console.log(msg)

  if(msg.start)
    game(ws, msg.start)

  else if(msg.baddie)
    game.baddie(msg.baddie)
}

window.primus = primus // for debugging
