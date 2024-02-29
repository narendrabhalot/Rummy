const { checkSetSequencesHandler } = require('./checkSetSequence.handler')

const sortHandler = (socket, io, cards) => {
    try {
        console.log('drawing card from deck')
        const game = socket.game
        const gameId = game.gameId
        const sortedCards = game.autoSort(socket.id,cards)
        socket.emit('hand', sortedCards)
        checkSetSequencesHandler(socket,sortedCards)
    } catch (error) {
        console.log('draw event - ', error.message)
    }
}
module.exports = {sortHandler}