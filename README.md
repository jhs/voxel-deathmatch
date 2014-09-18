# Voxel Deathmatch

This is a "King of the Mountain" game demonstrating Voxel.js.

Unlike most voxel- packages, this is not a Voxel.js plugin. It is a standalone application: a web server that runs a simple proof of concept multiplayer game.

## Playing

Run it via npm:

    $ npm start

    > voxeljs-demo@0.1.0 start /Users/jhs/src/voxel-deathmatch
    > node server.js

    Hapi server started @ http://0.0.0.0:9966

The application is now on a web server at port 9966.

## API

The whole point of this project is in fact to have a simple API to demonstrate how to store scores in a database.

~~~ js
var start_server = require('voxel-deathmatch')

var scores = {'Alice':5, 'Bob':3}
var engine = start_server(scores) // scores is an optional parameter

engine.on('point', function(name) {
  console.log('%s got a point!', name)
})
~~~
