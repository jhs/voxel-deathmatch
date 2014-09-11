var walk = require('voxel-walk')
var voxel = require('voxel')
var voxelPlayer = require('voxel-player')
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

var createPlayer = voxelPlayer(game)

var baddie = createPlayer('substack.png')
baddie.position.set(4,1,4)

var me = createPlayer('player.png')
me.position.set(-2.5, 1, -2.5)
me.possess()

window.A = {me:me, s:baddie}
window.walk = walk

game.on('tick', function() {
  var target = me
  walk.render(target.playerSkin)
  var vx = Math.abs(target.velocity.x)
  var vz = Math.abs(target.velocity.z)
  if (vx > 0.001 || vz > 0.001) walk.stopWalking()
  else walk.startWalking()
})

window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 'R'.charCodeAt(0))
    me.toggle()
})

function generate_world(x, y, z) {
  //return x*x + y*y + z*z <= 15*15 ? 1 : 0 // Sphere
  if (y == 0 && x > -4 && x < 4 && z > -4 && z < 4)
    return 1
  if (y == -20 && x > -20 && x < 20 && z > -20 && z < 20)
    return 2
  return 0
}
