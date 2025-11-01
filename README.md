Taptalent - Currency Exchange API

This is a Node.js backend server that scrapes currency exchange data for ARS (Argentine Peso) from public sources.

It exposes three endpoints:

/quotes: Shows the latest "Dólar Blue" buy/sell prices from 2 sources.

/average: Calculates the average buy/sell price from all sources.

/slippage: Calculates the percentage difference of each source from the average.

Tech Stack

Node.js

Express.js (for the server)

Puppeteer (for web scraping)

In-Memory Cache (to meet the 60-second "fresh data" requirement)

How to Run Locally

Prerequisites

Node.js (which includes npm)

1. Clone the Repository

git clone [https://github.com/Likhith1201/taptalent-assignment.git](https://github.com/Likhith1201/taptalent-assignment.git)


2. Enter the Project Folder

cd taptalent-assignment


3. Install Dependencies

This is a critical step. It will download express, puppeteer, and the Chromium browser that Puppeteer needs. This may take a few minutes.

npm install


4. Run the Server

node index.js


You should see the following output in your terminal:

Server is running on http://localhost:3000
--- Available Endpoints ---
http://localhost:3000/quotes
http://localhost:3000/average
http://localhost:3000/slippage
---------------------------


5. Test the Endpoints

Open these URLs in your browser:

Quotes: http://localhost:3000/quotes

Average: http://localhost:3000/average

Slippage: http://localhost:3000/slippage

Note: The very first request you make (e.g., to /quotes) will take 30-60 seconds to respond. This is normal. The server is running the web scrapers in real-time. Subsequent requests will be instant, as they will use the 60-second cache.

Public URL (Live on Render)

This project is deployed and live on Render.com.

URL: https://taptalent-assignment.onrender.com

Live Endpoints:

https://taptalent-assignment.onrender.com/quotes

https://taptalent-assignment.onrender.com/average

https://taptalent-assignment.onrender.com/slippage

Note: The free Render server "spins down" after 15 minutes. The first request will be slow (30-90 seconds) as the server wakes up and runs the scrapers.