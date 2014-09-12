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
  ws.on('connection', function(sock) {
    console.log('Connect!')
    sock.on('message', function(message) {
      console.log('Received: %j', message)
    })

    sock.send(JSON.stringify('A random number: ' + Math.random()))
  })
})

function log_req(req) {
  console.log(req.url.path)
}
