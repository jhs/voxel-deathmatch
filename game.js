module.exports.connected = connected
module.exports.reconnected = reconnected
module.exports.start = start_game
module.exports.end = end_game

// Copyright 2014 Cloudant Inc., an IBM Company
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

var _ = require('underscore')
var THREE = require('voxel-engine/node_modules/three')
var walk = require('voxel-walk')
var voxel = require('voxel')
var voxelView = require('voxel-engine/node_modules/voxel-view')
var voxelPlayer = require('voxel-player')
var painterly = require('painterly-textures')
var createGame = require('voxel-engine')

var explode_animation = require('./explode.js')

var GAME_ID = window.location.search.match(/\?id=(\w+)/)
if (GAME_ID)
  GAME_ID = GAME_ID[1]
console.log('Game ID: ' + GAME_ID)

var SOCK = null
var ME = null
var BADDIE = null
var baddie, me // player objects
var START = { A: {pos:{x:-2.5, y:1.01, z:-2.5}, y:Math.PI * 5/4}
            , B: {pos:{x:4   , y:1.01, z:4   }, y:Math.PI / 4  }
            }

var container = document.querySelector('#game')
var sky = 0xbedded
var gameView = new voxelView(THREE, {width:768, height:500, skyColor:sky})
var game = createGame({
    view: gameView,
    generate: generate_world,
    container: container,
    statsDisabled: true,
    controls: { discreteFire: true },
    texturePath: painterly(__dirname),
    materials: [['grass', 'dirt', 'grass_dirt'], 'bedrock']
  })

var createPlayer = voxelPlayer(game)
window.game = game // for debugging
game.appendTo(container)


var rockets = 0
game.on('fire', function(target, state) {
  if (rockets >= 2)
    return console.log('Click')

  console.log('Fire!')
  rockets += 1

  var position = game.cameraPosition()
  var trajectory = game.cameraVector()

  if (SOCK)
    SOCK.write({rocket: {position:position, trajectory:trajectory}})

  launch_rocket(position, trajectory, true)
})

function launch_rocket(position, trajectory, is_mine) {
  if (window.D)
    debugger
  var move_scale = 0.18
  var fuse_ms = 1500
  //fuse_ms = 60 * 1000 // XXX

  position = new THREE.Vector3(position[0], position[1], position[2])
  trajectory = new THREE.Vector3(trajectory[0], trajectory[1], trajectory[2])
  trajectory.multiplyScalar(move_scale)

  var geometry = new THREE.SphereGeometry( 0.05, 10, 10 )
  var material = new THREE.MeshBasicMaterial({color: 0x808080, shading:THREE.NoShading})
  var mesh = new THREE.Mesh( geometry, material )
  mesh.position.copy(position)
  game.scene.add(mesh)


  var end_interval = game.setInterval(move, 50)
  function move() {
    mesh.position.x += trajectory.x
    mesh.position.y += trajectory.y
    mesh.position.z += trajectory.z
  }

  game.setTimeout(function() { explode(mesh, end_interval, is_mine) }, fuse_ms)
}

function explode(rocket, end_interval, is_mine) {
  console.log('BOOM!')
  end_interval()
  game.scene.remove(rocket)
  explode_animation(game, rocket.position)

  if (is_mine)
    rockets -= 1

  push(me)

  function push(target) {
    // Use an inverse-cubed effect, at distance 2 you feel nothing, at distance 0 you feel a lot.
    var range = distance(rocket.position, target.position)
    var mag = 1 / (range * range * range)

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

function distance(a, b) {
  var x = a.x - b.x
  var y = a.y - b.y
  var z = a.z - b.z

  return Math.sqrt(x*x + y*y + z*z)
}

var my_handle = null
game.on('tick', _.throttle(send_handle, 1000))
function send_handle() {
  var handle = document.querySelector('#name').value
  if (handle && handle != my_handle) {
    my_handle = handle
    if (SOCK)
      SOCK.write({handle:handle})
  }
}

game.on('tick', _.throttle(send_position, 100))
var last_sent_pos = null
function send_position() {
  if (!me)
    return

  var pos = {position:me.position, rotation:me.rotation, head:me.avatar.head.rotation}

  var msg = JSON.stringify(pos)
  if(last_sent_pos == msg)
    return //console.log('Skip dupe position update')

  SOCK.write(pos)
  last_sent_pos = msg
}

game.on('tick', _.throttle(rescue_me, 1000))
var rescuing = false
function rescue_me() {
  if (rescuing)
    return
  if (me.position.y > -18)
    return

  console.log('Rescue me')
  if (SOCK)
    SOCK.write({rescue:true})

  rescuing = true
  setTimeout(teleport, 2000)
  function teleport() {
    rescuing = false
    var pos = new THREE.Vector3(randReal(-2.5, 2.5), 1.01, randReal(-2.5, 2.5))
    me.position.copy(pos)
    me.rotation.y = randReal(0, 2*Math.PI)
    me.velocity.x = me.velocity.y = me.velocity.z = 0
    //me.velocity.y = 0.05
  }
}

//game.on('tick', function() { walk_tick(me) })

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
})

var bedrock_size = 40
var platform_radius = 5
function generate_world(x, y, z) {
  // Perimeter walls
  if (y < -15 && y > -20) {
    if ((z == 40 || z == -40) && (x >= -40 && x <= 40))
      return 2
    if ((x == 40 || x == -40) && (z >= -40 && z <= 40))
      return 2
  }

  // Bedrock
  if (y == -20 && x >= -40 && x <= 40 && z >= -40 && z <= 40)
    return 2

  // Platform
  if (y == 0 && x > -4 && x < 4 && z > -4 && z < 4)
    return 1

  return 0
}

function on_msg(msg) {
  if (window.debug_msg)
    console.log(msg)

  if(msg.name)
    start_game(msg.name, msg.id)

  else if(msg.baddie)
    set_baddie(msg.baddie)

  else if(msg.rocket)
    launch_rocket(msg.rocket.position, msg.rocket.trajectory, false)

  else if (msg.baddie_handle)
    document.querySelector('#baddie_handle').innerHTML = msg.baddie_handle

  else if (msg.scores)
    show_scores(msg.scores)
}

function show_scores(scores) {
  if (! Array.isArray(scores))
    scores = Object.keys(scores).map(function(name) { return {name:name, points:scores[name]} })

  var html = []
  for (var i = 0; i < scores.length; i++) {
    html.push(scores[i].points + ' ' + scores[i].name + '<br>')
  }

  document.querySelector('#scores').innerHTML = html.join('')
}

function connected(sock) {
  console.log('Game connected')
  sock.on('data', on_msg)
  SOCK = sock

  sock.write({id:GAME_ID})
}

function reconnected() {
  console.log('Reconnected; send game ID: ' + GAME_ID)
  SOCK.write({id:GAME_ID})
}

var is_game_started = false
function end_game(reason) {
  game.destroy()

  var message = document.createElement('h2')
  message.textContent = 'The game has ended'
  if (reason)
    message.textContent += ': ' + reason

  while (container && container.hasChildNodes())
    container.removeChild(container.lastChild)
  container.appendChild(message)
}

function start_game(name, game_id) {
  console.log('Start game: ' + name)

  if (game_id)
    GAME_ID = game_id

  if (is_game_started)
    return console.log('Already started')
  else
    is_game_started = true

  if (name == 'A') {
    ME = 'A'
    BADDIE = 'B'
    baddie = createPlayer('substack.png')
    me = createPlayer('player.png')
  } else {
    ME = 'B'
    BADDIE = 'A'
    baddie = createPlayer('player.png')
    me = createPlayer('substack.png')
  }

  baddie.position.copy(START[BADDIE].pos)
  baddie.rotation.y = START[BADDIE].y

  me.position.copy(START[ME].pos)
  me.rotation.y = START[ME].y
  me.possess()

  window.me = me
  window.baddie = baddie
}

function set_baddie(update) {
  baddie.position.copy(update.position)
  baddie.rotation.copy(update.rotation)
  baddie.avatar.head.rotation.copy(update.head)
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randReal(min, max) {
  return Math.random() * (max - min) + min
}
