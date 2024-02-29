const disconnectionHandler = async (io, socket) => {
  const game = socket.game
  console.log(
    `${socket.handshake.query.name} disconnected, Game room:${
      socket.gameId || null
    }, Socket id: ${socket.id}`
  )
  if (!game) return
  const sockets = await io.in(socket.gameId).fetchSockets()
  io.to(socket.gameId).emit('room message', {
    action: 'leave',
    playerCount: sockets.length,
    message: `${socket.name} left the game`,
    id: socket.id,
    name:socket.name,
    userId:socket.userId
  })
  try {
    if(sockets.length === 0){
      return
    }
    await game.leave(socket.id)
    socket.leave(game.gameId)
    
  } catch (error) {
    console.log('🔴', error.message)
    clearInterval(socket?.game?.intervalTimer)
    io.to(game.gameId).emit('game over', {
      message: game.getCurrentPlayer()?.name + ' Own this game',
      name: game.getCurrentPlayer()?.name,
      winner: game.getCurrentPlayer()?.id,
    })
    io.in(game.gameId).disconnectSockets(true)
    await game.saveGame().catch(err=>console.log(err)) // save in database
    console.log("Game over,",socket.gameId);
  } finally {
    socket.leave(socket.gameId)
  }
}

module.exports = disconnectionHandler

