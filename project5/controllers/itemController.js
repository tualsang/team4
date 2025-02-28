const Item = require('../models/itemModel');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

exports.getItems = (req, res, next) => {
  const { keyword } = req.query;
  let query = {};
  if (keyword) {
    query = {
      title: { $regex: keyword, $options: 'i' }
    };
  }

  Item.find(query)
    .populate('seller', 'firstName lastName')
    .sort({ price: 1 })
    .then(items => {
      res.render('gpu/items', { items, searchKeyword: keyword });
    })
    .catch(err => next(err));
};

exports.getItem = (req, res, next) => {
  const id = req.params.id;

  Item.findById(id)
    .populate('seller', 'firstName lastName')
    .then(item => {
      if (item) {
        res.render('gpu/item', { item });
      } else {
        const err = new Error(`Cannot find an item with id ${id}`);
        err.status = 404;
        next(err);
      }
    })
    .catch(err => next(err));
};

exports.createItemForm = (req, res) => {
  res.render('gpu/new');
};

exports.createItem = [
  upload.single('image'),
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .escape(),
  body('condition')
    .trim()
    .notEmpty().withMessage('Condition is required')
    .isIn(['New', 'Used', 'Refurbished','Like New', 'For Parts']).withMessage('Invalid condition')
    .escape(),
    body('price')
    .trim()
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0.01 }).withMessage('Price must be at least 0.01'),  
  body('details')
    .trim()
    .escape(),
  (req, res, next) => {
    console.log('createItem function called');
    const errors = validationResult(req);
    let itemData = req.body;
    itemData.seller = req.session.user;
    if (req.file) {
      itemData.image = '/uploads/' + req.file.filename;
    }
    if (!errors.isEmpty()) {
      res.render('gpu/new', { errors: errors.mapped(), item: itemData });
    } else {
      let item = new Item(itemData);
      item.save()
        .then(() => {
          req.flash('success', 'Item created successfully.');
          res.redirect('/items');
        })
        .catch(err => {
          if (err.name === 'ValidationError') {
            err.status = 400;
            res.render('gpu/new', { errors: err.errors, item: itemData });
          } else {
            next(err);
          }
        });
    }
  }
];

exports.editItem = (req, res, next) => {
  const id = req.params.id;

  Item.findById(id)
    .then(item => {
      if (item) {
        res.render('gpu/edit', { item });
      } else {
        const err = new Error(`Cannot find an item with id ${id}`);
        err.status = 404;
        next(err);
      }
    })
    .catch(err => next(err));
};

exports.updateItem = [
  upload.single('image'),
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .escape(),
  body('condition')
    .trim()
    .notEmpty().withMessage('Condition is required')
    .isIn(['New', 'Used', 'Refurbished']).withMessage('Invalid condition')
    .escape(),
  body('price')
    .trim()
    .notEmpty().withMessage('Price is required')
    .isCurrency().withMessage('Please enter a valid price'),
  body('details')
    .optional()
    .trim()
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    const id = req.params.id;
    const itemData = req.body;
    if (req.file) {
      itemData.image = '/uploads/' + req.file.filename;
    }

    if (!errors.isEmpty()) {
      res.render('gpu/edit', { errors: errors.mapped(), item: { _id: id, ...itemData } });
    } else {
      Item.findByIdAndUpdate(id, itemData, { new: true, runValidators: true })
        .then(item => {
          if (item) {
            req.flash('success', 'Item updated successfully.');
            res.redirect(`/items/${id}`);
          } else {
            const err = new Error(`Cannot find an item with id ${id}`);
            err.status = 404;
            next(err);
          }
        })
        .catch(err => {
          if (err.name === 'ValidationError') {
            res.render('gpu/edit', { errors: err.errors, item: { _id: id, ...itemData } });
          } else {
            next(err);
          }
        });
    }
  }
];

exports.deleteItem = (req, res, next) => {
  const id = req.params.id;

  Item.findByIdAndDelete(id)
    .then(item => {
      if (item) {
        Offer.deleteMany({ item: id })
          .then(() => {
            req.flash('success', 'Item deleted successfully.');
            res.redirect('/items');
          })
          .catch(err => next(err));
      } else {
        const err = new Error(`Cannot find an item with id ${id}`);
        err.status = 404;
        next(err);
      }
    })
    .catch(err => next(err));
};
