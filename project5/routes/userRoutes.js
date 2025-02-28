const express = require('express');
const userController = require('../controllers/userController');
const { isGuest, isLoggedIn } = require('../middlewares/auth');
const User = require('../models/userModel');
const router = express.Router();

router.get('/new', isGuest, userController.new);

router.post('/', isGuest, userController.create);

router.get('/login', isGuest, userController.getUserLogin);

router.post('/login', isGuest, userController.login);

router.get('/profile', isLoggedIn, userController.profile);

router.get('/logout', isLoggedIn, userController.logout);


module.exports = router;