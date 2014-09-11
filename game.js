var voxel = require('voxel')
var player = require('voxel-player')
var painterly = require('painterly-textures')
var createGame = require('voxel-engine')

var container = document.querySelector('#game')
var game = createGame({
    //generate: voxel.generator['Valley'],
    generate: generate_world,

    //chunkDistance: 2,
    //materials: ['#fff', '#000'],
    //materialFlatColor: true,
    //worldOrigin: [0, 0, 0],
    //controls: { discreteFire: true },
                      // startingPosition: [0, 1000, 0]
    texturePath: painterly(__dirname),
    materials: [['grass', 'dirt', 'grass_dirt'], 'bedrock']
  })

window.game = game // for debugging
game.appendTo(container)

var createPlayer = player(game)
var avatar = createPlayer('player.png')
avatar.possess()
avatar.yaw.position.set(2, 14, 4)

function generate_world(x, y, z) {
  //return x*x + y*y + z*z <= 15*15 ? 1 : 0 // Sphere
  if (y == 0 && x > -4 && x < 4 && z > -4 && z < 4)
    return 1
  if (y == -20 && x > -20 && x < 20 && z > -20 && z < 20)
    return 2
  return 0
}
