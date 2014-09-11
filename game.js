var createGame = require('voxel-engine')
var painterly = require('painterly-textures')

var container = document.querySelector('#game')
var game = createGame({ generate: generate_world
                      // startingPosition: [0, 1000, 0]
                      //, texturePath: painterly(__dirname)
                      //, materials: [['grass', 'dirt', 'grass_dirt'], 'bedrock']
                      })

window.game = game // for debugging
//game.controls.pitchObject.rotation.x = -1.5 // Look down.
//game.appendTo(container)
//game.appendTo(document.body)
game.currentMaterial = 1

if(0)
container.addEventListener('click', function() { 
  game.requestPointerLock(container)
})

function generate_world(x, y, z) {
  return y === 1 ? 1 : 0;

  return x*x + y*y + z*z <= 15*15 ? 1 : 0 // Sphere

  //console.log('generate_world ' + JSON.stringify([x,y,z]))
  if (y == 0 && x > -4 && x < 4 && z > -4 && z < 4)
    return 1
  if (y == -20 && x > -20 && x < 20 && z > -20 && z < 20)
    return 2
  return 0
}
