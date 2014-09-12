var WS = require('ws')
var Hapi = require("hapi")

var server = new Hapi.Server(9966, "0.0.0.0", {debug:{request:['info']}})
server.route({ method: 'GET'
             , path: '/{file*}'
             , handler: {directory: {path:__dirname}}
             })

server.on('request', log_req)

server.start(function() {
  console.log("Hapi server started @", server.info.uri)

  //var ws = new WS.Server({server: server.listener})
  var ws = new WS.Server({port: 9977})
  ws.on('connection', connection)
})

function log_req(req) {
  console.log(req.url.path)
}

var players = []
var A = null
var B = null
function connection(sock) {
  console.log('Connection!')

  players.push(sock)
  if (players.length == 1)
    console.log('Wait for second player')
  if (players.length == 2) {
    start_game(players[0], players[1])
    players = []
  }
}

function start_game(A, B) {
  console.log('Start game!')
  send(A, {'start': 'A'})
  send(B, {'start': 'B'})

  A.on('message', function(msg) {
    msg = JSON.parse(msg)
    console.log('A: %j', msg)
    if(msg.pos)
      send(B, {baddie:msg.pos})
  })

  B.on('message', function(msg) {
    msg = JSON.parse(msg)
    console.log('B: %j', msg)
    if(msg.pos)
      send(A, {baddie:msg.pos})
  })
}

function send(sock, msg) {
  sock.send(JSON.stringify(msg))
}
