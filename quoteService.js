const puppeteer = require('puppeteer');

// Caching Logic
const cache = { data: null, timestamp: 0 };
const CACHE_DURATION = 60 * 1000; // 60 seconds
const BROWSER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Selectors for cronista.com
const CRONISTA_BUY_SELECTOR = '.buy .val'; 
const CRONISTA_SELL_SELECTOR = '.sell .val'; 

/**
 * Helper function to parse Argentine currency strings
 */
function parsePrice(priceString) {
  if (!priceString || typeof priceString !== 'string') return NaN;
  const cleanedString = priceString
    .replace('$', '').replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  return parseFloat(cleanedString);
}

// 1. Scraper Functions ---

async function fetchDolarHoy() {
  const url = 'https://www.dolarhoy.com/';
  let browser = null;
  try {
    browser = await puppeteer.launch({ args: BROWSER_ARGS });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.val', { timeout: 10000 });

    const prices = await page.evaluate(() => {
      const priceElements = document.querySelectorAll('.val');
      if (priceElements && priceElements.length >= 2) {
        return {
          buyPriceStr: priceElements[0].innerText,
          sellPriceStr: priceElements[1].innerText
        };
      } else {
        return null;
      }
    });

    await browser.close();
    if (!prices) throw new Error('Could not find price elements on DolarHoy.');

    const buy_price = parsePrice(prices.buyPriceStr);
    const sell_price = parsePrice(prices.sellPriceStr);

    if (isNaN(buy_price) || isNaN(sell_price)) {
      throw new Error(`Could not parse prices from DolarHoy. Got: "${prices.buyPriceStr}", "${prices.sellPriceStr}"`);
    }

    return { buy_price, sell_price, source: url };
  } catch (error) {
    console.error(`Error scraping ${url}: ${error.message}`);
    if (browser) await browser.close();
    return null;
  }
}

async function fetchCronista() {
  const url = 'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB';
  let browser = null;
  try {
    browser = await puppeteer.launch({ args: BROWSER_ARGS });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.waitForSelector(CRONISTA_BUY_SELECTOR, { timeout: 10000 });
    await page.waitForSelector(CRONISTA_SELL_SELECTOR, { timeout: 10000 });

    const prices = await page.evaluate((buySel, sellSel) => {
      const buyEl = document.querySelector(buySel);
      const sellEl = document.querySelector(sellSel);
      return {
        buyPriceStr: buyEl ? buyEl.innerText : null,
        sellPriceStr: sellEl ? sellEl.innerText : null
      };
    }, CRONISTA_BUY_SELECTOR, CRONISTA_SELL_SELECTOR);

    await browser.close();

    const buy_price = parsePrice(prices.buyPriceStr);
    const sell_price = parsePrice(prices.sellPriceStr);

    if (isNaN(buy_price) || isNaN(sell_price)) {
      throw new Error(`Could not parse prices from Cronista. Got: "${prices.buyPriceStr}", "${prices.sellPriceStr}"`);
    }

    return { buy_price, sell_price, source: url };
  } catch (error) {
    console.error(`Error scraping ${url}: ${error.message}`);
    if (browser) await browser.close();
    return null;
  }
}

//  2. Main Service Functions ---

async function getQuotes() {
  const now = Date.now();
  if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
    console.log('Returning data from cache');
    return cache.data;
  }
  console.log('Fetching fresh data');
  const results = await Promise.all([
    fetchDolarHoy(),
    fetchCronista(),
  ]);
  const successfulQuotes = results.filter(quote => quote !== null);
  cache.data = successfulQuotes;
  cache.timestamp = now;
  return successfulQuotes;
}

async function getAverage() {
  const quotes = await getQuotes(); 
  if (!quotes || quotes.length === 0) {
    throw new Error('No quotes available to calculate average');
  }
  let totalBuy = 0, totalSell = 0, successfulQuotesCount = 0;
  for (const quote of quotes) {
    if (quote.buy_price && quote.sell_price) {
      totalBuy += quote.buy_price;
      totalSell += quote.sell_price;
      successfulQuotesCount++;
    }
  }
  if (successfulQuotesCount === 0) {
     throw new Error('No valid quotes available to calculate average');
  }
  return {
    average_buy_price: totalBuy / successfulQuotesCount,
    average_sell_price: totalSell / successfulQuotesCount,
  };
}

async function getSlippage() {
  const quotes = await getQuotes();
  const average = await getAverage();
  if (!quotes || quotes.length === 0) {
    throw new Error('No quotes available to calculate slippage');
  }
  return quotes.map(quote => {
    if (!quote.buy_price || !quote.sell_price) {
      return {
        buy_price_slippage: null,
        sell_price_slippage: null,
        source: quote.source,
        error: "Could not retrieve valid price from this source."
      };
    }
    const buy_price_slippage = (quote.buy_price - average.average_buy_price) / average.average_buy_price;
    const sell_price_slippage = (quote.sell_price - average.average_buy_price) / average.average_buy_price;
    return {
      buy_price_slippage: buy_price_slippage,
      sell_price_slippage: sell_price_slippage,
      source: quote.source,
    };
  });
}

module.exports = {
  getQuotes,
  getAverage,
  getSlippage,
};
