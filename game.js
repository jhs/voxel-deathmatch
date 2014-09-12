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

check_ready()
function check_ready() {
  if (document.readyState == 'complete') {
    console.log('Ready!')
    fix_dimensions()
  } else
    setTimeout(check_ready, 50)
}

var createPlayer = voxelPlayer(game)

var baddie = createPlayer('substack.png')
baddie.position.set(4,1,4)
baddie.rotation.y = Math.PI / 4 // Face the center of the ring

var me = createPlayer('player.png')
me.position.set(-2.5, 1, -2.5)
me.rotation.y = Math.PI * 5/4 // Face the center of the ring
me.possess()

window.walk = walk
window.me = me
window.s = baddie

game.on('tick', function() { walk_tick(me) })
game.on('tick', function() { walk_tick(baddie) })

function walk_tick(target) {
  walk.render(target.playerSkin)
  var vx = Math.abs(target.velocity.x)
  var vz = Math.abs(target.velocity.z)
  if (vx > 0.001 || vz > 0.001) walk.stopWalking()
  else walk.startWalking()
}

window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 'R'.charCodeAt(0))
    me.toggle()

//  else if (ev.keyCode === 'G'.charCodeAt(0)) {
//    console.log('move!')
//    var magnitude = 0.5
//    var dx = -Math.sin(baddie.rotation.y) * magnitude
//    var dz = -Math.cos(baddie.rotation.y) * magnitude
//    baddie.move(dx, 0, dz)
//  }
//
//  else if (ev.keyCode === 'T'.charCodeAt(0))
//    baddie.rotation.y += Math.PI / 8
//  else if (ev.keyCode === 'Y'.charCodeAt(0))
//    baddie.rotation.y -= Math.PI / 8
})

function generate_world(x, y, z) {
  //return x*x + y*y + z*z <= 15*15 ? 1 : 0 // Sphere
  if (y == 0 && x > -4 && x < 4 && z > -4 && z < 4)
    return 1
  if (y == -20 && x > -20 && x < 20 && z > -20 && z < 20)
    return 2
  return 0
}
