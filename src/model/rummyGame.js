// models/rummyGame.js
const mongoose = require('mongoose');

const rummyGameSchema = new mongoose.Schema({
  pointValue: {
    type: Number,
    required: true,
  },
  minEntry: {
    type: Number,
    required: true,
  },
  maxPlayer: {
    type: Number,
    required: true,
  },
  totalPlayers: {
    type: Number,
    required: true,
  },
  game:{
    type:Object
  },
  // selectedPlayersRange: {
  //   type: Number,
  //   enum: [2, 5], // Only allow 2 and 6 as valid values
  //   required: true,
  // },

  selectedPlayersRange: {
    type: Number,
    required: true,
    validate: {
      validator: function(value) {
        return value >= 2; // Allow selectedPlayersRange to be 2 or more
      },
      message: 'Selected players range must be 2 or more.',
    },
  },
  players: [ {
    type:String,
    //required:true
  }],
});

module.exports = mongoose.model('RummyGame', rummyGameSchema);




// const mongoose = require('mongoose');

// const playerSchema = new mongoose.Schema({
//   userid: {
//     type: String,
//    // required: true,
//   },
//   socketid: {
//     type: String,
//     //required: true,
//   },
// });

// const rummyGameSchema = new mongoose.Schema({
//   pointValue: {
//     type: Number,
//     required: true,
//   },
//   minEntry: {
//     type: Number,
//     required: true,
//   },
//   maxPlayer: {
//     type: Number,
//     required: true,
//   },
//   totalPlayers: {
//     type: Number,
//     required: true,
//   },
//   selectedPlayersRange: {
//     type: Number,
//     required: true,
//     validate: {
//       validator: function(value) {
//         return value >= 2; // Allow selectedPlayersRange to be 2 or more
//       },
//       message: 'Selected players range must be 2 or more.',
//     },
//   },
//   players: [playerSchema], // Embed the playerSchema within the players array
// });

// module.exports = mongoose.model('RummyGame', rummyGameSchema);
