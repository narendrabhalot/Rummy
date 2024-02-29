const {timeOutInSecond} = require('../constants')
const { getSetSequenceStatus } = require('../setSequenceStatus')
const dropHandler = async (io, socket, index,event='drop') => {
  const game = socket.game
  if (!game) return
  try {
    const winResult = dropCard(io, socket,event)(index)
    if(winResult){
      io.to(game.gameId).emit('game over', {
        message: game.getCurrentPlayer()?.name + ' Own this game',
        name: game.getCurrentPlayer()?.name,
        winner: game.getCurrentPlayer()?.id,
      })
      const sockets = await io.in(socket.gameId).fetchSockets()
      sockets.forEach(socket => {
        delete socket.game
      })
      console.log("disconnecting players from id :",game.gameId);
      io.in(game.gameId).disconnectSockets(true)
      await game.saveGame() // save in database
    }
  } catch (error) {
    console.log(error.message)
  }
}

function dropCard(io, socket,event='drop') {
  return function (index) {
    console.log('dropping card...')
    const game = socket.game
    const gameId = game.gameId
    if (index===undefined) {
      console.log('auto dropping last card ')
    }
    game.intervalTimer.refresh()
    game.dropFromGroup(index)
    const currentPlayer = socket.game.getCurrentPlayer()
    io.to(currentPlayer.id).emit('hand', currentPlayer.handView)
    io.to(currentPlayer.id).emit('check set sequences', getSetSequenceStatus(currentPlayer.handView))
    if (event==='finish' && game.hasWon()) {
      clearInterval(game.intervalTimer)
      return true
    }
    io.to(currentPlayer.id).emit('turn', {
      timeOut: 0,
    })
    io.to(game.gameId).emit('down', game.deck.length)
    io.to(game.gameId).emit('up', game.droppedDeck[game.droppedDeck.length - 1])
    game.switchTurn()
    const nextPlayer = socket.game.getCurrentPlayer()
    io.to(nextPlayer.id).emit('turn', {
      timeOut: timeOutInSecond,
    })
    io.to(game.gameId).emit('turn message', {
      id: nextPlayer.id,
      userId:nextPlayer.userId,
      name: nextPlayer.name,
      message: `${nextPlayer.name}'s turn`,
    })
    console.log('on drop event end: ')
    return false
  }
}

module.exports = {dropHandler,dropCard}
