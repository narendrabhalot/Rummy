const socketIO = require('socket.io');
const pokerFunctions = require('../utils/pokerUtil');

// Function to handle socket connections
function handleSocket(server) {
    const io = socketIO(server);

    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('joinRoom', (roomName) => {
            socket.join(roomName);
            console.log(`User joined room: ${roomName}`);
        });

        socket.on('initializeGame', (roomName) => {
            const gameData = pokerFunctions.initializeGame();
            io.to(roomName).emit('gameInitialized', gameData);
        });

        socket.on('shuffleDeck', (roomName) => {
            const deck = pokerFunctions.createDeck();
            pokerFunctions.shuffle(deck);
            io.to(roomName).emit('deckShuffled', deck);
        });

        socket.on('dealCardsToPlayers', (roomName, players, numCards) => {
            const deck = pokerFunctions.createDeck();
            pokerFunctions.dealCards(deck, players, numCards);
            io.to(roomName).emit('cardsDealtToPlayers', players);
        });

        socket.on('resetPlayersHands', (roomName, players) => {
            pokerFunctions.resetHands(players);
            io.to(roomName).emit('playersHandsReset', players);
        });

        socket.on('evaluateHand', (roomName, hand) => {
            const handResult = pokerFunctions.evaluateHand(hand);
            io.to(roomName).emit('handEvaluated', handResult);
        });

        socket.on('determineWinner', (roomName, players) => {
            const winner = pokerFunctions.determineWinner(players);
            io.to(roomName).emit('winnerDetermined', winner);
        });

        socket.on('dealCommunityCards', (roomName, deck, communityCards, numCards) => {
            pokerFunctions.dealCommunityCards(deck, communityCards, numCards);
            io.to(roomName).emit('communityCardsDealt', communityCards);
        });

        socket.on('dealCommunityRounds', (roomName, deck, communityCards, flopCount, turnCount, riverCount) => {
            pokerFunctions.dealCommunityRounds(deck, communityCards, flopCount, turnCount, riverCount);
            io.to(roomName).emit('communityRoundsDealt', communityCards);
        });

        socket.on('placeBet', (roomName, player, amount) => {
            pokerFunctions.placeBet(player, amount);
            io.to(roomName).emit('betPlaced', player);
        });

        socket.on('validateBet', (roomName, player, amount) => {
            const isValid = pokerFunctions.validateBet(player, amount);
            io.to(roomName).emit('betValidated', isValid);
        });

        socket.on('adjustPot', (roomName, pot, amount) => {
            const updatedPot = pokerFunctions.adjustPot(pot, amount);
            io.to(roomName).emit('potAdjusted', updatedPot);
        });

        socket.on('handleBettingRound', (roomName, players, pot, currentBet) => {
            const updatedPot = pokerFunctions.handleBettingRound(players, pot, currentBet);
            io.to(roomName).emit('bettingRoundHandled', updatedPot);
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
}

module.exports = handleSocket;
