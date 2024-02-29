const { Server } = require('socket.io')
const { Player, RummyGame } = require('./game')
const verifyEvents = require('./verifyEvents')
const disconnectionHandler = require('./handlers/disconnection.handler')
const { dropHandler } = require('./handlers/drop.handler')
const connectionHandler = require('./handlers/connection.handler')
const maxPlayers = 5
const { timeOutInSecond } = require('./constants')
const { sortHandler } = require('./handlers/sort.handler')
const { getSetSequenceStatus } = require('./setSequenceStatus')
const drawHandler = require('./handlers/draw.handler')
const waitingCountDownInSecond = 20
const startCountDownInSecond = 5
const turnTimer = timeOutInSecond * 1000
const timer = new Map()

function initializeSocket(server) {
  console.log('🟢 Socket server initialized...!')
  const io = new Server(server, { cors: true })
  io.on('connection', socket => {
    connectionHandler(socket)
    socket.use(verifyEvents(socket))

    socket.on('game', async gameId => {
      try {
        if (!gameId) return
        if (socket.gameId) {
          return socket.emit('message', 'already in game')
        }
        socket.join(gameId)
        startGame(io, socket, gameId, game => {
          if (game.getCurrentPlayer()?.hand.length === 11) {
            console.log('Auto dropping card...')
            return dropHandler(io, socket)
          } else {
            game.switchTurn()
          }
          console.info('🟡', 'Current Player changed automatically:')
          let info = {
            gameId,
            id: game.getCurrentPlayer().id,
            player: game.getCurrentPlayer().name,
            totalCards: game.getCurrentPlayer().hand.length,
          }
          console.info(info)
          io.to(game.getCurrentPlayer().room).emit('turn', {
            timeOut: timeOutInSecond,
          })
          io.to(game.gameId).emit('turn message', {
            id: game.getCurrentPlayer().id,
            userId: game.getCurrentPlayer().userId,
            name: game.getCurrentPlayer().name,
            message: `${game.getCurrentPlayer().name}'s turn`,
          })
        })
      } catch (error) {
        console.log('game event - ', error.message)
      }
    })
    socket.on('leave', async gameId => {
      socket.leave(gameId)
      const sockets = await io.in(gameId).fetchSockets()
      io.to.to(gameId).emit('room message', {
        action: 'leave',
        playerCount: sockets.length,
        message: `${socket.name} left the game`,
        id: socket.id,
        name: socket.name,
        userId: socket.userId
      })
      socket.gameId = null
    })
    socket.on('draw', position => {
      try {
        drawHandler(socket, io, position)
      } catch (error) {
        console.log('draw event - ', error.message)
      }
    })
    socket.on('drop', async index => {
      try {
        await dropHandler(io, socket, index)
      } catch (error) {
        console.log(error.message)
      }
    })

    socket.on('re arrange', cards => {
      try {
        const user = socket.id
        const game = socket.game
        // if (cards.length < 10 || !game) return
        game?.reArrangeCards(user, cards)
        socket.emit('check set sequences', getSetSequenceStatus(cards))
        socket.emit('hand', cards)
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('check set sequences', cards => {
      // if (cards.length !== 10) return
      try {
        const game = socket.game
        if (!game) {
          socket.emit('check set sequences', getSetSequenceStatus(cards))
          return
        }
        const result = game.checkSetSequences(cards)
        console.log(result)
        socket.emit('check set sequences', [...result])
      } catch (error) {
        console.log(error)
      }
    })
    socket.on('sort', cards => {
      try {
        if (!cards) return
        sortHandler(socket, io, cards)
      } catch (e) {
        console.log(e)
      }
    })

    socket.on('finish', async (index) => {
      try {
        const game = socket.game
        dropHandler(io, socket, index, 'finish')
      } catch (error) {
        console.log(error)
      } finally {
        socket.disconnect()
      }
    })

    socket.on('disconnect', async () => {
      try {
        disconnectionHandler(io, socket)
      } catch (error) {
        console.log(error.message)
      }
    })
  })
}

const startGame = async (io, socket, gameId, onGameStartCb) => {
  const sockets = await io.in(gameId).fetchSockets()
  console.log(sockets[0]?.game?.status)
  if (sockets[0]?.game?.status === 'started' || sockets.length > maxPlayers)
    return socket.leave(gameId)
  console.log(gameId, ' : Total player joined ', sockets.length)
  socket.emit('message', 'Joined the game')
  io.to(gameId).emit('room message', {
    action: 'join',
    playerCount: sockets.length,
    message: `${socket.name} join the game`,
    id: socket.id,
    name: socket.name,
    userId: socket.userId
  })
  socket.gameId = gameId
  if (!timer.has(gameId)) {
    let timer = startTick(io, gameId, waitingCountDownInSecond, () => {
      try {
        createGame(io, gameId, onGameStartCb)
      } catch (error) {
        console.log(error.message)
        io.in(gameId).disconnectSockets(true)
      }
    })
  }
  if (sockets.length !== maxPlayers) return
  clearInterval(timer.get(gameId))
  startTick(io, gameId, startCountDownInSecond, () => {
    try {
      createGame(io, gameId, onGameStartCb)
    } catch (error) {
      console.log(error.message)
      io.in(gameId).disconnectSockets(true)
    }
  })
}
async function createGame(io, gameId, onGameStartCb) {
  try {
    const sockets = await io.in(gameId).fetchSockets()
    const players = sockets.map(soc => {
      const id = soc.id
      const name = soc.name
      const userId = soc.userId
      return new Player(name, id, userId)
    })
    const game = new RummyGame(players, gameId)
    sockets.map(soc => {
      soc.gameId = gameId
      soc.game = game
    })
    console.info('🟡', 'Player created')
    console.log('✅ Game started :', gameId)
    game.players.map(player => {
      io.to(player.id).emit('hand', player.handView)
    })
    emitCommonGameEvents(io, game)
    game.intervalTimer = setInterval(() => {
      onGameStartCb(game)
    }, turnTimer)
  } catch (error) {
    console.log(error)
  }
}
function startTick(io, room, time = 30, callback) {
  let startTimer = setInterval(() => {
    io.to(room).emit('count down', time)
    if (time <= 0) {
      clearInterval(startTimer)
      timer.delete(room)
      callback(io, room)
      return
    }
    time--
  }, 1000)
  timer.set(room, startTimer)
  return timer
}

function emitCommonGameEvents(io, game) {
  const currentPlayer = game.getCurrentPlayer()
  io.to(game.gameId).emit('down', game.deck.length)
  io.to(game.gameId).emit('up', game.droppedDeck[game.droppedDeck.length - 1])
  io.to(game.getCurrentPlayer().id).emit('turn', { timeOut: timeOutInSecond })
  io.to(game.gameId).emit('turn message', {
    id: currentPlayer.id,
    userId: currentPlayer.userId,
    name: currentPlayer.name,
    message: `${currentPlayer.name}'s turn`,
  })
}
module.exports = initializeSocket
