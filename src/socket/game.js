const rummyGame = require('../model/rummyGame')
const { rank, getSetSequenceStatus } = require('./setSequenceStatus')
const { sortBySuitAndValue } = require('./smartSort')
class RummyGame {
  constructor(players = [Player], gameId, cardPerPlayer = 10) {
    if (players.length < 2) {
      throw new Error('Rummy game requires at least 2 players')
    }
    this.gameId = gameId
    this.cardPerPlayer = cardPerPlayer
    this.players = players
    this.deck = []
    this.droppedDeck = []
    this._currentPlayerIndex = 0
    this.currentPlayer = players[this._currentPlayerIndex]
    this.inActivePlayers = []
    this.intervalTimer = null
    this.status = 'started'
    this.initializeDeck()
    this.shuffleDeck()
    this.dealInitialCards()
  }

  initializeDeck() {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades']
    const ranks = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
      'A',
    ]

    for (let suit of suits) {
      for (let rank of ranks) {
        this.deck.push({ value: rank, suit })
      }
    }
    const totalPlayer = this.players.length
    if (totalPlayer == 3 || totalPlayer == 4) {
      this.deck.push(...this.deck)
    } else if (totalPlayer >= 5) {
      this.deck.push(...this.deck, ...this.deck)
    }
    this.deck.push({ value: 'Joker', suit: 'Joker' })
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]
    }
  }

  dealInitialCards() {
    for (let i = 0; i < this.cardPerPlayer; i++) {
      this.players.forEach((player, i) => {
        this.players[i].receiveCard(this.deck.pop())
      })
    }
    this.droppedDeck.push(this.deck.pop())
  }

  getCurrentPlayer() {
    return this.players[this._currentPlayerIndex]
  }

  set currentPlayerIndex(index) {
    if (index >= 0 && index < this.players.length) {
      this._currentPlayerIndex = index
      this.currentPlayer = this.players[this._currentPlayerIndex]
    } else {
      throw new Error('Invalid player index')
    }
  }

  switchTurn() {
    let currentIndex = (this._currentPlayerIndex + 1) % this.players.length
    let counter = 0
    while (this.players[currentIndex] === null && counter < this.players.length) {
      currentIndex = (currentIndex + 1) % this.players.length
      counter++
    }
    console.log("Current index", currentIndex)
    this.currentPlayerIndex = currentIndex
  }
  async leave(socketId) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i] === null) continue
      if (this.players[i].id === socketId) {
        this.inActivePlayers.push(this.players[i])
        this.players[i] = null
        break
      }
    }
    if ((this.players.length - this.inActivePlayers.length) < 2) {
      this.status = 'terminated'
      this.switchTurn()
      throw Error('Game terminated due to insufficient player')
    } else {
      const game = await rummyGame.findById(this.gameId)
      if (!game) return
      game.game = { players: JSON.parse(JSON.stringify(this.inActivePlayers)) }
      try {
        await game.save()
      } catch (error) {
        console.log(error)
      }
    }
  }
  drawCard(position) {
    const currentPlayer = this.getCurrentPlayer()
    if (this.getCurrentPlayer().hand.length > this.cardPerPlayer) {
      throw new Error(
        'Player should have exactly at least' +
        this.cardPerPlayer +
        ' cards to draw'
      )
    }
    let drawnCard
    if (this.deck.length == 0) {
      drawnCard = this.droppedDeck.pop()
    } else if (this.droppedDeck.length == 0) {
      drawnCard = this.deck.pop()
    } else if (position === 'up') {
      drawnCard = this.droppedDeck.pop()
    } else {
      drawnCard = this.deck.pop()
    }

    currentPlayer.handView[currentPlayer.handView.length - 1].push(drawnCard)
    this.getCurrentPlayer()._handView = currentPlayer.handView
    return drawnCard
  }

  dropCard(index) {
    console.log("dropp event call")
    const hand = this.getCurrentPlayer().hand
    if (hand.length <= this.cardPerPlayer) {
      const message = `Player should have exactly ${this.cardPerPlayer + 1
        } cards to drop`
      throw new Error(message)
    }
    else if (index === undefined || typeof index === 'string') {
      this.droppedDeck.push(hand.pop())
    }
    else if (index < 0 || index > this.cardPerPlayer) {
      this.droppedDeck.push(hand.pop())
      console.log('Last card dropped due to invalid index')
    } else {
      const card = hand[index]
      hand.splice(index, 1)
      this.droppedDeck.push(card)
    }
    if (this.deck.length === 0) {
      const lastCard = this.droppedDeck.pop()
      this.deck = [...this.droppedDeck]
      this.droppedDeck = [lastCard]
      this.shuffleDeck()
    }
  }
  dropFromGroup(index) {
    const hand = this.getCurrentPlayer().hand
    const handView = this.getCurrentPlayer().handView
    if (hand.length <= this.cardPerPlayer) {
      const message = `Player should have exactly ${this.cardPerPlayer + 1
        } cards to drop`
      throw new Error(message)
    }
    let count = 0
    let droppedCard
    if (index === undefined) {
      droppedCard = handView[handView.length - 1].pop()
    } else {
      for (const group of handView) {
        count += group.length
        if (count > index) {
          const removeIndex = Math.abs(count - group.length - index)
          droppedCard = group.splice(removeIndex, 1)[0]
          break
        }
      }
    }

    this.droppedDeck.push(droppedCard)
    this.getCurrentPlayer()._handView = handView.filter(group => group.length !== 0)
    if (this.deck.length === 0) {
      const lastCard = this.droppedDeck.pop()
      this.deck = [...this.droppedDeck]
      this.droppedDeck = [lastCard]
      this.shuffleDeck()
    }
    return droppedCard
  }
  hasWon() {
    const handView = this.getCurrentPlayer().handView
    const result = getSetSequenceStatus(handView)
    if (result.includes('invalid')) return false
    if (!result.includes('pure sequence')) return false
    return true
  }
  reArrangeCards(userId, cards) {
    const player = this.players.filter(player => player?.id == userId)
    if (player.length === 1) {
      player[0].reArrangeCards(cards)
    }
  }
  autoSort(userId, cards) {
    const player = this.players.filter(player => player?.id == userId)
    if (player.length !== 1) {
      return
    }
    return player[0].autoSort(cards)
  }
  checkSetSequences(cards) {
    return getSetSequenceStatus(cards)
  }
  async saveGame() {
    try {
      let gamePlayers = this.players.filter(player => player !== null)
      gamePlayers = JSON.parse(JSON.stringify(gamePlayers))
      const currentPlayer = this.getCurrentPlayer()
      const gameData = {
        players: [...gamePlayers, ...this.inActivePlayers],
        winner: currentPlayer.userId,
        socketId: currentPlayer.id,
      }
      gameData.players.forEach(player => {
        if (player?.userId === currentPlayer.userId) {
          player.isWinner = true
        } else {
          player.isWinner = false
        }
      })
      console.log(gameData)
      const game = await rummyGame.findById(this.gameId)
      if (!game) {
        console.log('game not found id:', this.gameId)
        return
      }
      game.game = gameData
      await game.save()
      this.status = 'saved'
    } catch (error) {
      console.log(error)
    }
  }
}

class Player {
  constructor(name, id, userId = null) {
    this.name = name
    this.hand = []
    this.handView = [[]]
    this.id = id
    this.room = id
    this.userId = userId
    // this.score = 0
  }
  set _hand(cards) {
    this.hand = cards
  }
  set _handView(cards) {
    this.handView = cards
    this.hand = cards.flat(1)
    //calculate score
  }
  receiveCard(card) {
    this.hand.push(card)
    this.handView[0].push(card)
  }
  reArrangeCards(cards) {
    // this.hand.splice(0, this.hand.length)
    // this.hand.push(...cards)
    this._handView = cards
  }
  autoSort(cards) {
    const sortResult = sortBySuitAndValue(this.hand)
    // this.hand.splice(0, this.hand.length)
    // this.hand.push(...sortResult)
    this._handView = sortResult
    return sortResult
  }
}

module.exports = { Player, RummyGame }
