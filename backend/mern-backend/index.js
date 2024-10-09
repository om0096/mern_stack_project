const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connecting to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

// Fetches product data and inserts it into the database
app.get('/initialize', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const products = response.data;

    if (!Array.isArray(products)) {
      throw new Error('Invalid data format received from the API');
    }

    await Product.insertMany(products);
    res.send('Data fetched and saved successfully');
  } catch (error) {
    console.error('Error during initialization:', error.message);
    res.status(500).send(`Error fetching data: ${error.message}`);
  }
});

// Fetch transactions API with search, pagination, and month filtering
// Allows users to search by title, description, price, and filter by month
app.get('/transactions', async (req, res) => {
  try {
    const { page = 1, perPage = 10, search = '', month = 'March' } = req.query; // Default month is March

    const monthMap = {
      'January': 1,
      'February': 2,
      'March': 3,
      'April': 4,
      'May': 5,
      'June': 6,
      'July': 7,
      'August': 8,
      'September': 9,
      'October': 10,
      'November': 11,
      'December': 12
    };

    const monthNumber = monthMap[month];
    
    if (!monthNumber) {
      return res.status(400).send("Invalid month provided.");
    }

    const searchNumber = parseFloat(search);

    const searchQuery = {
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] },
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        ...(isNaN(searchNumber) ? [] : [{ price: searchNumber }])
      ]
    };

    const transactions = await Product.find(searchQuery)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));

    // Send the fetched transactions
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Error fetching transactions: ' + error.message);
  }
});

// Statistics API to fetch total sales, sold, and unsold items for a given month and search term
app.get('/statistics', async (req, res) => {
  try {
    const { month, search } = req.query;

    const monthMap = {
      'January': 1,
      'February': 2,
      'March': 3,
      'April': 4,
      'May': 5,
      'June': 6,
      'July': 7,
      'August': 8,
      'September': 9,
      'October': 10,
      'November': 11,
      'December': 12
    };

    const monthNumber = monthMap[month];
    if (!monthNumber) {
      return res.status(400).send("Invalid month provided.");
    }

    const searchNumber = parseFloat(search);

    const sales = await Product.find({
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] },
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        ...(isNaN(searchNumber) ? [] : [{ price: searchNumber }])
      ]
    });

    const totalSales = sales.reduce((sum, sale) => sum + sale.price, 0);
    const soldItems = sales.filter(sale => sale.sold).length;
    const unsoldItems = sales.filter(sale => !sale.sold).length;

    res.json({ totalSales, soldItems, unsoldItems });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send('Error fetching statistics: ' + error.message);
  }
});

// Bar chart
app.get('/barchart', async (req, res) => {
  try {
    const { month, search } = req.query;

    const monthNumber = new Date(`${month} 1`).getMonth() + 1;
    const searchNumber = parseFloat(search);

    const products = await Product.find({
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] },
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        ...(isNaN(searchNumber) ? [] : [{ price: searchNumber }])
      ]
    });

    const priceRanges = {
      '0-100': 0,
      '101-200': 0,
      '201-300': 0,
      '301-400': 0,
      '401-500': 0,
      '501-600': 0,
      '601-700': 0,
      '701-800': 0,
      '801-900': 0,
      '901-above': 0,
    };

    products.forEach(product => {
      if (product.price <= 100) priceRanges['0-100']++;
      else if (product.price <= 200) priceRanges['101-200']++;
      else if (product.price <= 300) priceRanges['201-300']++;
      else if (product.price <= 400) priceRanges['301-400']++;
      else if (product.price <= 500) priceRanges['401-500']++;
      else if (product.price <= 600) priceRanges['501-600']++;
      else if (product.price <= 700) priceRanges['601-700']++;
      else if (product.price <= 800) priceRanges['701-800']++;
      else if (product.price <= 900) priceRanges['801-900']++;
      else priceRanges['901-above']++;
    });

    res.json(priceRanges);
  } catch (error) {
    console.error('Error fetching bar chart data:', error);
    res.status(500).send('Error fetching bar chart data');
  }
});

// Pie chart
app.get('/piechart', async (req, res) => {
  try {
    const { month, search } = req.query;

    const monthNumber = new Date(`${month} 1`).getMonth() + 1;
    const searchNumber = parseFloat(search);
    const products = await Product.find({
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] },
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        ...(isNaN(searchNumber) ? [] : [{ price: searchNumber }])
      ]
    });

    const categories = {};
    products.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching pie chart data:', error);
    res.status(500).send('Error fetching pie chart data');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
