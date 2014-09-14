module.exports = ExplodeAnimation

// From http://codepen.io/Xanmia/pen/Doljl

var movementSpeed = 0.025;
var teardown_ms = 400
var totalObjects = 250;
var objectSize = 0.2;
var colors = [0xff0000, 0xffa500, 0xffff00, 0x000000]

function ExplodeAnimation(game, position) {
  // Each particle set has one color, so we make as many as are in the "colors" list.
  var parts = []
  for (var i = 0; i < colors.length; i++)
    parts.push(make_particles(game, position, colors[i]))

  var exploded_at = new Date
  var end = game.setInterval(update, 10)
  function update() {
    var now = new Date
    var duration = now - exploded_at
    if (duration > teardown_ms) {
      for (var i = 0; i < parts.length; i++)
        game.scene.remove(parts[i])
      return end()
    }

    for (var i = 0; i < parts.length; i++)
      tick(parts[i])
  }
}

function make_particles(game, position, color) {
  console.log('make particles: ' + color)
  var THREE = game.THREE
  var geometry = new THREE.Geometry()
  var dirs = []

  for (i = 0; i < totalObjects; i++) {
    var vertex = new THREE.Vector3()
    vertex.x = position.x
    vertex.y = position.y
    vertex.z = position.z

    geometry.vertices.push(vertex)
    dirs.push({ x: (Math.random() * movementSpeed)-(movementSpeed/2)
              , y: (Math.random() * movementSpeed)-(movementSpeed/2)
              , z: (Math.random() * movementSpeed)-(movementSpeed/2)
              })
  }

  var material = new THREE.ParticleBasicMaterial({size:objectSize, color:color})
  var particles = new THREE.ParticleSystem( geometry, material )
  particles.move_dirs = dirs

  game.scene.add(particles)
  return particles
}

function tick(particles) {
  var dirs = particles.move_dirs
  for (var i = 0; i < totalObjects; i++) {
    var particle = particles.geometry.vertices[i]
    particle.y += dirs[i].y;
    particle.x += dirs[i].x;
    particle.z += dirs[i].z;
  }

  particles.geometry.verticesNeedUpdate = true
}
