const { getSetSequenceStatus } = require('../setSequenceStatus')

const drawHandler = (socket, io, position) => {
  try {
    console.log('drawing card from deck')
    const game = socket.game
    const gameId = game.gameId
    game.drawCard(position)
    socket.emit('hand', game.getCurrentPlayer().handView)
    const status = getSetSequenceStatus(game.getCurrentPlayer().handView)
    socket.emit('check set sequences', status)
    io.to(gameId).emit('down', game.deck.length)
    io.to(gameId).emit('up', game.droppedDeck[game.droppedDeck.length - 1])
  } catch (error) {
    console.log('draw event - ', error.message)
  }
}

module.exports = drawHandler