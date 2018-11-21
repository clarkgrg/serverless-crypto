'use strict';

let Client = require('coinbase').Client;
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const { writeDB, readDB } = require('./libs/awstools');

let client = new Client({
  'apiKey': 'API KEY',
  'apiSecret': 'API SECRET'  
});

// Get Spot price from Coinbase
function spotPrice(currencyPair) {
  return new Promise(function (resolve, reject) {
    client.getSpotPrice({
      'currencyPair': currencyPair
    }, function (err, price) {
      if (err) reject(err)
      else resolve(price);
    });
  });
}

const symbols = [
  'BTC-USD',
  'ETH-USD',
  'LTC-USD',
  'BCH-USD',
  'BTC-EUR'
];

// ETLCrypto - Get crypto data
module.exports.etlcrypto = async (event, context) => { 

  try {
    // Get crypto prices
    const priceArray = symbols.map(async symbol => {
      return await spotPrice(symbol);
    });
    const priceResponses = await Promise.all(priceArray);

    // Write them to DB
    const dbArray = priceResponses.map(async prices => {
      return await writeDB(prices);
    });
    const dbResponses = await Promise.all(dbArray);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Got Prices'
      }),
    };
  
  } catch(err) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: err
      }),
    };  
  }
}

// SMSCrypto - Respond to SMS Request
module.exports.smscrypto = async (event, context) => {
  let body = "I do not understand!\nText me the word PRICES";

  if (event && event.body && event.body.Body) {
    if (event.body.Body.toLowerCase().includes("prices")) {

      try {
        body = "Crypto Prices\n";

        // Get crypto prices from DB
        const priceArray = symbols.map(async symbol => {
          return await readDB(symbol);
        });
        const priceResponses = await Promise.all(priceArray);

        // Build response text
        priceResponses.forEach(price => {
          price.Items.forEach(crypto => {
            body = body + `${crypto.cryptoSymbol}: ${crypto.amount}` + "\n";
          });
        });
        
      } catch(err) {
        console.log(err);
        body = "The system is down right now";
      }
    }
  }

  console.log(body);

  // Put response in Twilio format
  const response = new MessagingResponse();
  response.message(body);

  return(response.toString());
};
