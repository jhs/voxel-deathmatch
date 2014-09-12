var Hapi = require("hapi")
var server = new Hapi.Server(9966, "0.0.0.0")
server.route({ method: 'GET'
             , path: '/{file*}'
             , handler: {directory: {path:__dirname}}
             })

server.start(function() {
  console.log("Hapi server started @", server.info.uri)
})
