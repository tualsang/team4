const Item = require('../models/itemModel');
const mongoose = require('mongoose');

exports.isGuest = (req, res, next) => {
    if (!req.session.user) {
        return next();
    } else {
        req.flash('error', 'You are already logged in.');
        return res.redirect('/users/profile');
    }
};

exports.isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'You need to log in to perform this action.');
        return res.redirect('/users/login');
    }
};


exports.isAuthor = (req, res, next) => {
    let id = req.params.id;
    Item.findById(id)
        .then(item => {
            if (item) {
                if (item.seller.equals(req.session.user)) {
                    return next();
                } else {
                    req.flash('error', 'You are not authorized to edit or delete this item');
                    return res.redirect('/items');
                }
            } else {
                let err = new Error('Cannot find an item with id ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));
};

exports.validateId = (req, res, next) => {
    const id = req.params.id;
    if (mongoose.Types.ObjectId.isValid(id)) {
        return next();
    } else {
        const err = new Error('Invalid ID format');
        err.status = 400;
        req.flash('error', 'Invalid item ID format.');
        return res.redirect('/items');
    }
};
