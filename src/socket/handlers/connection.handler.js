const connectionHandler = socket => {
  const id = socket.id
  socket.name = socket.handshake.query.name || 'Anonymous-' + id.slice(0, 4)
  const userId = socket.handshake.query.id
  socket.userId = userId
  const message ='✅ ' +socket.name +' connected with socket id : ' +id +' and userId : ' +userId
  console.log(message)
}


module.exports = connectionHandler