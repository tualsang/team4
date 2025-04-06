const express = require('express');
const userController = require('../controllers/userController');
const { isLoggedIn, isGuest } = require('../middlewares/auth');
const router = express.Router();

router.get('/new', isGuest, userController.new);
router.post('/', isGuest, userController.create);
router.get('/login', isGuest, userController.getUserLogin);
router.post('/login', isGuest, userController.login);
router.get('/profile', isLoggedIn, userController.profile);
router.get('/logout', isLoggedIn, userController.logout);
router.post('/cart/:id/add', isLoggedIn, userController.addToCart);
router.post('/cart/:id/remove', isLoggedIn, userController.removeFromCart);
router.post('/cart/purchase', isLoggedIn, userController.purchaseItems);
router.get('/cart', isLoggedIn, userController.viewCart);

module.exports = router;
