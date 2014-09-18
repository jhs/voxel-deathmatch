module.exports = start_server

// Copyright 2014 Cloudant Inc., an IBM Company
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

var Hapi = require("hapi")
var Primus = require('primus')
var EventEmitter = require('events').EventEmitter

function start_server(scores) {
  scores = scores || {}
  var events = new EventEmitter
  var players = {}
  var odd_player = null // The waiting player for a pairing.

  var server = new Hapi.Server(9966, "0.0.0.0", {debug:{request:['info']}})
  server.route({ method: 'GET'
               , path: '/{file*}'
               , handler: {directory: {path:__dirname}}
               })

  server.start(function() {
    console.log("Hapi server started @", server.info.uri)

    var primus = new Primus(server.listener, {transformer:'websockets'})
    primus.on('connection', connection)
  })

  return events

  function connection(sock) {
    var remote = sock.address.ip + ':' + sock.address.port + '/' + sock.address.secure
    console.log('Connection: %s', remote)

    sock.on('end', function() {
      if (sock.player && sock.player.name)
        console.log('Disconnected: %s', sock.player.name)
      if (sock.player && sock.player.peer && sock.player.peer.sock)
        sock.player.peer.sock.end()
    })

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
      events.emit('point', winner)

      scores[winner] = 1 + (scores[winner] || 0)
      player.sock.write({scores:scores})
      player.peer.sock.write({scores:scores})
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

    A.sock.write({scores:scores})
    B.sock.write({scores:scores})

    console.log('Connected: %s and %s', A.id, B.id)
  }
} // start_server

if (require.main === module)
  start_server()
