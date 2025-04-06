const User = require('../models/userModel');
const Item = require('../models/itemModel');
const { body, validationResult } = require('express-validator');

exports.new = (req, res) => {
    if (req.session.user) {
        req.flash('error', 'You are already logged in.');
        return res.redirect('/users/profile');
    }
    return res.render('./user/new');
};

exports.create = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .escape(),
    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .escape(),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8, max: 64 }).withMessage('Password must be between 8 and 64 characters'),
    (req, res, next) => {
        const errors = validationResult(req);

        if (req.session.user) {
            req.flash('error', 'You are already logged in');
            return res.redirect('/users/profile');
        }

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg).join(' '));
            return res.redirect('/users/new');
        }

        let user = new User(req.body);
        user.save()
            .then(user => {
                req.flash('success', 'Your account has been created. Please log in.');
                res.redirect('/users/login');
            })
            .catch(err => {
                console.error("Signup error:", err);

                if (err.name === 'ValidationError') {
                    req.flash('error', 'All fields are required and must be valid.');
                    return res.redirect('/users/new');
                }

                if (err.code === 11000) {
                    req.flash('error', 'That email is already in use. Please use a different email.');
                    return res.redirect('/users/new');
                }

                next(err);
            });
    }
];

exports.getUserLogin = (req, res, next) => {
    if (req.session.user) {
        req.flash('error', 'You are already logged in.');
        return res.redirect('/users/profile');
    }
    return res.render('./user/login');
};

exports.login = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required'),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg).join(' '));
            return res.redirect('/users/login');
        }

        let email = req.body.email;
        let password = req.body.password;
        User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'Incorrect email address.');
                    return res.redirect('/users/login');
                }
                user.comparePassword(password)
                    .then(result => {
                        if (result) {
                            req.session.user = user._id;
                            req.flash('success', 'You have logged in.');
                            res.redirect('/users/profile');
                        } else {
                            req.flash('error', 'Incorrect password.');
                            res.redirect('/users/login');
                        }
                    })
                    .catch(err => next(err));
            })
            .catch(err => next(err));
    }
];

exports.profile = (req, res, next) => {
    const userId = req.session.user;

    Promise.all([
        User.findById(userId),
        Item.find({ seller: userId }),
    ])
        .then(([user, items]) => {
            if (user) {
                res.render('./user/profile', { user, items });
            } else {
                const err = new Error('User not found');
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));
};

exports.logout = (req, res, next) => {
    req.flash('success', 'You have logged out');
    req.session.destroy(err => {
        if (err) {
            return next(err);
        } else {
            res.redirect('/');
        }
    });
};

exports.addToCart = async (req, res, next) => {
    try {
      const userId = req.session.user;
      const itemId = req.params.id;
  
      const user = await User.findById(userId);
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/login');
      }
  
      // Check if item is already in the cart
      if (!user.cart.some(cartItem => cartItem.item.toString() === itemId)) {
        user.cart.push({ item: itemId });
        await user.save();
        req.flash('success', 'Item added to cart');
      } else {
        req.flash('error', 'Item is already in your cart');
      }
  
      res.redirect('/users/cart');
    } catch (err) {
      next(err);
    }
  };
  
  exports.removeFromCart = async (req, res, next) => {
    try {
      const userId = req.session.user;
      const itemId = req.params.id;
  
      const user = await User.findById(userId);
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/login');
      }
  
      user.cart = user.cart.filter(cartItem => cartItem.item.toString() !== itemId);
      await user.save();
      req.flash('success', 'Item removed from cart');
      res.redirect('/users/cart');
    } catch (err) {
      next(err);
    }
  };
  
  exports.purchaseItems = async (req, res, next) => {
    try {
      const userId = req.session.user;
      const user = await User.findById(userId).populate('cart.item');
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/login');
      }
  
      if (user.cart.length === 0) {
        req.flash('error', 'Your cart is empty');
        return res.redirect('/users/cart');
      }
  
      // Calculate total price
      const totalPrice = user.cart.reduce((acc, cartItem) => {
        return acc + cartItem.item.price;
      }, 0);
  
      // Clear the cart (simulate purchase)
      user.cart = [];
      await user.save();
  
      // Flash success message with total price
      req.flash('success', `Your items have been purchased! Total: $${totalPrice}`);
      res.redirect('/users/cart');
    } catch (err) {
      next(err);
    }
  };
  
  exports.viewCart = async (req, res, next) => {
    try {
      const userId = req.session.user;
      const user = await User.findById(userId).populate('cart.item');
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/login');
      }
  
      // Calculate total price
      const totalPrice = user.cart.reduce((acc, cartItem) => {
        return acc + (cartItem.item.price || 0);
      }, 0);
  
      res.render('user/cart', { cartItems: user.cart.map(c => c.item), totalPrice: totalPrice });
    } catch (err) {
      next(err);
    }
  };
  