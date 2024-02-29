const message = require('./constants')

const verifyEvents = socket => {
  return ([event, ...args], next) => {
    console.log('Socket id: ', socket.id)
    console.log('Event name: ', event)
    if (
      event === 'game' ||
      event === 're arrange' ||
      event === 'check set sequences' ||
      event === 'sort'
    ) {
      return next()
    }
    const game = socket.game
    if (game) {
      if (game?.getCurrentPlayer().room !== socket.id) {
        console.log('🔴 not a current player')
        socket.emit('message',message.WAIT_FOR_TURN)
        return next(new Error('Wait for your turn to play!'))
      }
      if (event === 'draw' && game?.getCurrentPlayer().hand.length !== 10) {
        console.log('🔴 you have 11 cards in your hand')
        socket.emit('message',message.CLICK_A_CARD_TO_DROP)
        return next(new Error('Click a card in your hand to discard it'))
      }
      if (event === 'drop' && game?.getCurrentPlayer().hand.length !== 11) {
        console.log(game?.getCurrentPlayer().hand.length)
        console.log('🔴 you have 10 cards in your hand')
        socket.emit('message',message.MUST_DRAW_NOW)
        return next(new Error('You MUST draw now, either from the deck or the pile!'))
      }
      if (event === 'finish' && game?.getCurrentPlayer().hand.length !== 11) {
        console.log(game?.getCurrentPlayer().hand.length)
        console.log('🔴 you have 10 cards in your hand')
        socket.emit('message',message.MUST_DRAW_NOW)
        return next(new Error('Unable to finish game now'))
      }
      return next()
    }
    return next()
  }
}


module.exports = verifyEvents