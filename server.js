var Hapi = require("hapi")
var Primus = require('primus')
var Cloudant = require('cloudant')

var server = new Hapi.Server(9966, "0.0.0.0", {debug:{request:['info']}})
server.route({ method: 'GET'
             , path: '/{file*}'
             , handler: {directory: {path:__dirname}}
             })

var DB
var scores = {}
Cloudant({account:'jhs', password:process.env.pw}, function(er, cloudant) {
  if (er)
    throw er

  console.log('Connected to cloudant')
  DB = cloudant.use('deathmatch')
  DB.list(function(er, docs) {
    console.log('Docs:')
    console.log(docs)
  })

  server.start(function() {
    console.log("Hapi server started @", server.info.uri)

    var primus = new Primus(server.listener, {transformer:'websockets'})
    primus.on('connection', connection)
  })
})

function log_req(req) {
  console.log(req.url.path)
}

var players = {}
var odd_player = null // The waiting player for a pairing.
function connection(sock) {
  var remote = sock.address.ip + ':' + sock.address.port + '/' + sock.address.secure
  console.log('Connection: %s', remote)

  sock.on('data', get_id)
  function get_id(msg) {
    if (!('id' in msg))
      return console.log('Bad message from %s: %j', remote, msg)

    var id = msg.id || (Math.random() + '').replace(/^0\./, '')
    console.log('Remote %s claims id: %s', remote, id)

    var player
    if (players[id]) {
      console.log('Player reconnected: %s', id)
      player = players[id]
    } else {
      var name = odd_player ? 'B' : 'A'
      player = {name:name, id:id}
    }

    players[id] = player
    sock.player = player
    player.sock = sock
    sock.write({name:player.name, id:player.id})
    console.log('Player %s: %s', player.name, player.id)

    sock.removeListener('data', get_id)
    sock.on('data', function(msg) {
      on_msg(player, msg)
    })

    // For debugging
    if (process.env.solo)
      odd_player = false

    if (player.peer)
      return console.log('Player already has a peer: %s', player.id)

    else if (odd_player) {
      connect(player, odd_player)
      odd_player = null
    } else {
      odd_player = player
      console.log('Wait for next player')
    }
  }
}

function on_msg(player, msg) {
  //console.log('Message from %s %s: %j', player.id, player.name, msg)

  if (msg.position && msg.rotation && msg.head) {
    player.position = msg.position
    player.rotation = msg.rotation
    player.head = msg.head

    if (player.peer)
      player.peer.sock.write({baddie:msg})
  }

  else if (msg.rocket && player.peer)
    player.peer.sock.write(msg)

  else if (msg.rescue && player.peer && player.peer.handle) {
    var winner = player.peer.handle
    scores[winner] = 1 + (scores[winner] || 0)
    player.sock.write({scores:scores})
    player.peer.sock.write({scores:scores})

    DB.get(winner, function(er, doc) {
      if (er)
        doc = {}

      doc.points = 1 + (doc.points || 0)
      DB.insert(doc, winner, function(er, body) {
        if (er)
          console.log('Error storing winner '
                       + winner + ': ' + er.message)
        console.log('Stored ' + winner
                    + ' ' + JSON.stringify(body))
      })
    })
  }

  else if (msg.handle) {
    player.handle = msg.handle
    if (player.peer)
      player.peer.sock.write({baddie_handle: msg.handle})
  }
}

function connect(A, B) {
  A.peer = B
  B.peer = A

  console.log('Connected: %s and %s', A.id, B.id)
}

function start_game(A, B) {
  console.log('Start game!')
  throw new Error('Start game not impelment')
  send(A, {'start': 'A'})
  send(B, {'start': 'B'})

  A.player = 'A'
  A.peer = B
  B.player = 'B'
  B.peer = A

  A.on('message', function(msg) { on_msg(A, msg) })
  B.on('message', function(msg) { on_msg(B, msg) })

  function on_msg(sock, msg) {
    msg = JSON.parse(msg)
    console.log('%s: %j', sock.player, msg)

    if(msg.position)
      send(sock.peer, {baddie:msg})
  }
}
