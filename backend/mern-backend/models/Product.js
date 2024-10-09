// Defines a schema for products and creates a Product model to interact with the database.

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  dateOfSale: Date,
  category: String,
  sold: Boolean
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
