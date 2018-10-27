const PORT = process.env.PORT || 9090
const server = require('http').createServer()
const io = require('socket.io')(server)
const geoip = require('geoip-lite')

server.listen(PORT)

let allClients = []
let chatConvo = []

io.sockets.on('connection', socket => {
  // ENTER
  console.log('connection')
  // TODO: validate client ip
  let clientIp = socket.handshake.headers['x-forwarded-for']
  let clientGeo = geoip.lookup(clientIp)

  if (!clientGeo) {
    clientGeo = {
      range: null,
      country: null,
      region: null,
      city: null,
      ll: null,
      metro: null,
      zip: null
    }
  }

  let user = {
    ip: clientIp,
    id: socket.id,
    geo: clientGeo,
    time: new Date()
  }

  // Add new client to top of array
  allClients.unshift(user)

  io.emit('enter', {user: user, list: allClients, convo: chatConvo})
  // END: ENTER

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log('disconnection')
    let removedUser = allClients.find(c => c.id === socket.id)
    allClients = allClients.filter(c => c.id !== socket.id)
    io.emit('leave', {user: removedUser, list: allClients})
  })
  // END: DISCONNECT

  // CHAT
  socket.on('chat', data => {
    console.log('chat')
    if (data.msg !== '***') {
      chatConvo.unshift({
        msg: data.msg,
        time: Date.now(),
        id: socket.id
      })
      chatConvo = chatConvo.slice(0, 20)
    }
    io.emit('chat', {
      convo: chatConvo,
      list: allClients
    })
  })
  // END: CHAT
})
