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

var game = require('./game.js')

var primus = Primus.connect({reconnect: {retries:0}})
primus.on('error', function(er) { console.log('Primus error: ' + er.message) })

primus.on('end', function() {
  console.log('Primus connection ended; you need to reload now')
  primus.end()
  game.end('Disconnected from server')
})

primus.on('open', function() {
  game.connected(primus)
})

primus.on('reconnected', game.reconnected)

//game.start('A')

window.primus = primus // for debugging
