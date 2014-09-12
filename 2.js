var createGame = require('voxel-engine')
var voxelPlayer = require('voxel-player')
var painterly = require('painterly-textures')

var game = createGame({
    generate: generate_world,
    texturePath: painterly(__dirname),
    //materials: [['grass', 'dirt', 'grass_dirt'], 'bedrock']
  })

window.game = game // for debugging
game.appendTo(document.body)

var createPlayer = voxelPlayer(game)

var me = createPlayer('player.png')
me.position.set(-2.5, 25, -2.5)
me.rotation.y = Math.PI * 5/4 // Face the center of the ring
me.possess()

window.me = me

function generate_world(x, y, z) {
  if (x*x + y*y + z*z < 20*20)
    return 1
  else
    return 0

  if (y == 0 && x > -4 && x < 4 && z > -4 && z < 4)
    return 1
  if (y == -20 && x > -20 && x < 20 && z > -20 && z < 20)
    return 2
  return 0
}
