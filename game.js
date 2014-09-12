module.exports = start_game

var _ = require('underscore')
var walk = require('voxel-walk')
var voxel = require('voxel')
var voxelPlayer = require('voxel-player')
var painterly = require('painterly-textures')
var createGame = require('voxel-engine')

var START = {pos:{x:-2.5, y:1.1, z:-2.5}, y: Math.PI * 5/4 }

var container = document.querySelector('#game')
var game = createGame({
    //generate: voxel.generator['Valley'],
    generate: generate_world,

    //chunkDistance: 2,
    //materials: ['#fff', '#000'],
    //materialFlatColor: true,
    //worldOrigin: [0, 0, 0],
    controls: { discreteFire: true },
                      // startingPosition: [0, 1000, 0]
    texturePath: painterly(__dirname),
    materials: [['grass', 'dirt', 'grass_dirt'], 'bedrock']
  })

window.game = game // for debugging

check_ready()
function check_ready() {
  if (document.readyState == 'complete') {
    console.log('Ready!')
    //fix_dimensions()
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

game.on('fire', function(target, state) {
  console.log('Fire!')
  var hit = game.raycastVoxels()
  if (hit) {
    console.log('Placed a bomb')
    var vec = {x:hit.position[0], y:hit.position[1], z:hit.position[2]}
    place_bomb(vec)
  }
})

function place_bomb(position) {
  var THREE = game.THREE
  var geometry = new THREE.SphereGeometry( 0.1, 10, 10 )
  var material = new THREE.MeshPhongMaterial( { color: 0x000000, shading: THREE.FlatShading } )
  var mesh = new THREE.Mesh( geometry, material )
  mesh.position.copy(position)
  game.scene.add(mesh)
  game.setTimeout(function() { explode_bomb(mesh) }, 2000)
}

function explode_bomb(bomb) {
  console.log('BOOM!')
  window.bomb = bomb // XXX
  game.scene.remove(bomb)
  push(me)
  //push(baddie)

  function push(target) {
    // Use an inverse-cubed effect, at distance 2 you feel nothing, at distance 0 you feel a lot.
    var range = distance(bomb.position, target.position)
    var mag = 1 / (range * range * range)
    console.log('Effect: ' + mag )

    if (mag < 0.125)
      return // No magnitude.
    if (mag > 1)
      mag = 1

    // Scale the effect for a particular velocity.
    mag *= 0.1
    console.log('Magnitude: ' + mag)

    target.velocity.z += mag
    //target.subjectTo({x:0, y:0.00009, z:0})
  }
}

window.distance = distance
function distance(a, b) {
  var x = a.x - b.x
  var y = a.y - b.y
  var z = a.z - b.z

  return Math.sqrt(x*x + y*y + z*z)
}

window.walk = walk
window.me = me
window.s = baddie

game.on('tick', _.throttle(rescue_me, 1000))
var rescuing = false
function rescue_me() {
  if (rescuing)
    return
  if (me.position.y > -18)
    return

  console.log('Rescue me')
  rescuing = true
  setTimeout(teleport, 2000)
  function teleport() {
    rescuing = false
    me.position.copy(START.pos)
    me.rotation.y = START.y
    me.velocity.x = me.velocity.y = me.velocity.z = 0
    me.velocity.y = 0.05
  }
}

if(0)
game.on('tick', function() { walk_tick(me) })
//game.on('tick', function() { walk_tick(baddie) })

function walk_tick(target) {
  walk.render(target.playerSkin)
  var vx = Math.abs(target.velocity.x)
  var vz = Math.abs(target.velocity.z)
  if (vx > 0.001 || vz > 0.001) walk.stopWalking()
  else walk.startWalking()
}

var key = { p:'P'.charCodeAt(0) }
window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === key.p)
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

var bedrock_size = 40
var platform_radius = 5
function generate_world(x, y, z) {
  //if (y == -20 && x > -bedrock_size && x < bedrock_size && z > -bedrock_size && z < bedrock_size)
  if (y == -20 && x > -20 && x < 20 && z > -20 && z < 20)
  //if (y == -bedrock_size)
    return 2

  //if (y == 0 && x*x + z*z < platform_radius*platform_radius)
  if (y == 0 && x > -4 && x < 4 && z > -4 && z < 4)
    return 1

  return 0
}

function start_game() {
  console.log('Start game')
  game.appendTo(container)
}
