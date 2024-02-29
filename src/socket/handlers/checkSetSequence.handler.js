const { getSetSequenceStatus } = require('../setSequenceStatus')

const checkSetSequencesHandler = (socket, cards) => {
  const game = socket.game
  if (!game) {
    socket.emit('check set sequences', getSetSequenceStatus(cards))
    return
  }
  const result = game.checkSetSequences(cards)
  console.log(result)
  socket.emit('check set sequences', [...result])
}


module.exports = {checkSetSequencesHandler}