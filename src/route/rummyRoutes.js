// routes/rummyRoutes.js
const express = require('express');
const router = express.Router();
const rummyController = require('../controller/rummyController');

router.post('/create-game', rummyController.createGames);

router.post('/rumming', rummyController.createRummyGame);

router.get('/games/:id', rummyController.getRummyGameById);

router.post('/join', rummyController.joinGame);

router.post('/leave-game', rummyController.leaveGame);



module.exports = router;
