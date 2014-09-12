var game = require('./game.js')

var url = 'ws://' + window.location.hostname + ':9977'
console.log('Connect: ' + url)
var ws = new WebSocket(url)
ws.onopen = function() {
  console.log('Connect!')
  ws.onmessage = on_message
}

function on_message(msg) {
  try { msg = JSON.parse(msg.data) }
  catch (er) { return }

  console.log('message:')
  console.log(msg)

  if(msg.start)
    game(msg.start)
}
