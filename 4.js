var walk = require('voxel-walk')
var createGame = require('voxel-engine')
var voxelPlayer = require('voxel-player')
var painterly = require('painterly-textures')

var game = createGame({
    generate: generate_world,
    texturePath: painterly(__dirname),
    materials: [['grass', 'dirt', 'grass_dirt'], 'bedrock']
  })

window.game = game // for debugging
game.appendTo(document.body)

var createPlayer = voxelPlayer(game)

var baddie = createPlayer('substack.png')
baddie.position.set(4,1,4)
baddie.rotation.y = Math.PI / 4 // Face the center of the ring

var me = createPlayer('player.png')
me.position.set(-2.5, 1, -2.5)
me.rotation.y = Math.PI * 5/4 // Face the center of the ring
me.possess()

window.me = me
window.bad = baddie

game.on('tick', function() {
  walk.render(me.playerSkin)
  var vx = Math.abs(me.velocity.x)
  var vz = Math.abs(me.velocity.z)
  if (vx > 0.001 || vz > 0.001)
    walk.stopWalking()
  else
    walk.startWalking()
})

window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 'R'.charCodeAt(0))
    me.toggle()
})

function generate_world(x, y, z) {
  if (y == 0 && x > -4 && x < 4 && z > -4 && z < 4)
    return 1
  if (y == -20 && x > -20 && x < 20 && z > -20 && z < 20)
    return 2
  return 0
}
