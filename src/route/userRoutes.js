const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.post('/createplayer', userController.createUser);
router.get('/', userController.listUsers);
router.get('/getuser/:id', userController.readUser);
router.put('/updateuser/:id', userController.updateUser);
router.delete('/deleteuser/:id', userController.deleteUser);
//router.post('/uploadImage/:userId', userController.uploadImage)

module.exports = router;
