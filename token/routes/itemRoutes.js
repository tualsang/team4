const express = require('express');
const itemController = require('../controllers/itemController');
const { isLoggedIn, isAuthor, validateId } = require('../middlewares/auth');
const router = express.Router();

router.get('/new', isLoggedIn, itemController.createItemForm);
router.get('/:id/edit', validateId, isLoggedIn, isAuthor, itemController.editItem);
router.put('/:id', validateId, isLoggedIn, isAuthor, itemController.updateItem);
router.delete('/:id', validateId, isLoggedIn, isAuthor, itemController.deleteItem);
router.get('/:id', validateId, itemController.getItem);
router.post('/', isLoggedIn, itemController.createItem); 
router.get('/', itemController.getItems);

module.exports = router;
