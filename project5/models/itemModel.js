const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  title: { type: String, required: [true, 'Title is required'] },
  condition: { type: String, required: [true, 'Condition is required'] },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be at least 0.01']
  },  
  details: { type: String },
  image: { type: String },
  totalOffers: { type: Number, default: 0 },
  highestOffer: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
