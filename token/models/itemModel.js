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
  category: {
    type: String,
    enum: ['Electronics', 'Books', 'Clothing', 'Home', 'Food', 'Other'],
    required: [true, 'Category is required']},

  details: { type: String },
  image: { type: String },
  active: { type: Boolean, default: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
