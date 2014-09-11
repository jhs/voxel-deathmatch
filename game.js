var createGame = require('voxel-engine')

var container = document.querySelector('#game')
var game = createGame({ startingPosition: [0, 1000, 0]
                      //, texturePath: texturePath
                      , materials: [['grass', 'dirt', 'grass_dirt'], 'bedrock']
                      , generate: generate_world
                      })

window.game = game // for debugging
//game.controls.pitchObject.rotation.x = -1.5 // Look down.
game.appendTo(container)
game.currentMaterial = 1

if(0)
container.addEventListener('click', function() { 
  game.requestPointerLock(container)
})

function generate_world(x, y, z) {
  if (y == 0 && x > -4 && x < 4 && z > -4 && z < 4)
    return 1
  if (y == -20 && x > -20 && x < 20 && z > -20 && z < 20)
    return 2
  return 0
}
