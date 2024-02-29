// controllers/rummyController.js
const rummyGameModel = require('../model/rummyGame');
const io = require('socket.io');

// exports.createGames = async (req, res) => {
//   try {
//     const { selectedPlayerCount } = req.body;

//     // Validate selectedPlayerCount
//     if (selectedPlayerCount !== "2" && selectedPlayerCount !== "5") {
//       res.status(400).json({ message: 'Invalid selectedPlayerCount' });
//       return;
//     }

//     // Query the database to find games with matching selectedPlayersRange
//     const games = await rummyGameModel.find({ selectedPlayersRange: selectedPlayerCount });
//     //console.log(games)

//     // If no games match, return an empty array
//     if (!games || games.length === 0) {
//       res.json({ games: [] });
//       return;
//     }

//     res.json({ games });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

exports.createGames = async (req, res) => {
  try {
    const { selectedPlayerCount } = req.body;

    // Validate selectedPlayerCount
    const validPlayerCounts = ["2", "3", "4", "5", "6"];
    if (!validPlayerCounts.includes(selectedPlayerCount)) {
      res.status(400).json({ message: 'Invalid selectedPlayerCount' });
      return;
    }

    // Query the database to find games with matching selectedPlayersRange
    const games = await rummyGameModel.find({ selectedPlayersRange: selectedPlayerCount });
    
    // If no games match, return an empty array
    if (!games || games.length === 0) {
      res.json({ games: [] });
      return;
    }

    res.json({ games });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};




exports.createRummyGame = async (req, res) => {
  try {
    const { pointValue, minEntry, maxPlayer, totalPlayers, selectedPlayersRange, players } = req.body;

    console.log('Received data:', req.body); // Log received data

    // Your additional logic to validate selectedPlayersRange here
    if (selectedPlayersRange < 2) {
      console.log('Validation failed:', selectedPlayersRange); // Log selectedPlayersRange when validation fails
      return res.status(400).json({ error: 'Selected players range must be 2 or more.' });
    }

    // Create an array of combined userid and socketid strings
    const combinedPlayers = players.map(player => `${player.userid}:${player.socketid}`);

    console.log('Combined Players:', combinedPlayers);

    // Create a new game
    const newGame = new rummyGameModel({
      pointValue,
      minEntry,
      maxPlayer,
      totalPlayers,
      selectedPlayersRange,
      players: combinedPlayers, // Set the players array with combined strings
    });

    // Save the game to the database
    await newGame.save();

    res.status(201).json({ message: 'Rummy game created successfully', game: newGame });
  } catch (err) {
    console.error('Error:', err); // Log any caught error
    res.status(500).json({ error: 'Internal server error' });
  }
};

  exports.getRummyGameById = async (req, res) => {
    try {
      const gameId = req.params.id; // Assuming the ID is in the URL parameter
  
      // Find the game by its ID
      const game = await rummyGameModel.findById(gameId);
  
      if (!game) {
        // If the game with the given ID is not found, return a 404 response
        res.status(404).json({ message: 'Game not found' });
        return;
      }
  
      // If the game is found, return it in the response
      res.status(200).json({ game });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };



exports.joinGame = async (req, res) => {
  try {
    const { gameId, playerId } = req.body;

    const game = await rummyGameModel.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.players.length >= game.selectedPlayersRange.max) {
      return res.status(400).json({ message: 'Game is full' });
    }

    game.players.push(playerId);

    await game.save();
    res.status(200).json({ message: 'Player joined the game' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Controller function for leaving the game with confirmation
exports.leaveGame = async (req, res) => {
  try {
    const { gameId, playerId } = req.body; // Assuming both game ID and user ID are passed in the request body

    // Find the game by its ID
    const game = await rummyGameModel.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if the player is in the game
    const playerIndex = game.players.indexOf(playerId);
    if (playerIndex === -1) {
      return res.status(404).json({ message: 'Player not found in the game' });
    }

    // Remove the player from the game
    game.players.splice(playerIndex, 1);

    // Update the game in the database
    await game.save();

    res.status(200).json({ message: 'Player left the game' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



