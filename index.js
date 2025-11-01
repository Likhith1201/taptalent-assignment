const express = require('express');
const { getQuotes, getAverage, getSlippage } = require('./quoteService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/**
 * 1.a: GET /quotes
 * Returns an array of objects with USD quotes from 2 working sources.
 */
app.get('/quotes', async (req, res) => {
  try {
    const quotes = await getQuotes();
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error.message);
    res.status(500).json({ error: 'Failed to retrieve quotes' });
  }
});

/**
 * 1.b: GET /average
 * Returns an object with the average positions of all the quotes.
 */
app.get('/average', async (req, res) => {
  try {
    const average = await getAverage();
    res.json(average);
  } catch (error) {
    console.error('Error fetching average:', error.message);
    res.status(500).json({ error: 'Failed to retrieve average' });
  }
});

/**
 * 1.c: GET /slippage
 * Returns an array of objects with the slippage percentage.
 */
app.get('/slippage', async (req, res) => {
  try {
    const slippage = await getSlippage();
    res.json(slippage);
  } catch (error) {
    console.error('Error fetching slippage:', error.message);
    res.status(500).json({ error: 'Failed to retrieve slippage' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('--- Available Endpoints ---');
  console.log(`http://localhost:${PORT}/quotes`);
  console.log(`http://localhost:${PORT}/average`);
  console.log(`http://localhost:${PORT}/slippage`);
  console.log('---------------------------');
});

