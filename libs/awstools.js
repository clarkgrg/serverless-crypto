const AWS = require('aws-sdk');
const moment = require('moment');

// Initialize AWS
AWS.config.update({
  region: process.env.region
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const writeDB = async (cryptoPrice) => {
  const cryptoSymbol = `${cryptoPrice.data.base}-${cryptoPrice.data.currency}`
  const cryptoDate = moment().toISOString();
  const amount = parseFloat(cryptoPrice.data.amount);

  const params = {
    TableName: process.env.tableName,
    Item: {
      cryptoSymbol: cryptoSymbol,
      cryptoDate: cryptoDate,
      amount: amount
    }
  };  
  console.log(params.Item);

  try {
    return await dynamoDb.put(params).promise();
  } catch (err) {
    console.log("ERROR: " + err);
    return (err);
  }
}

const readDB = async (cryptoSymbol) => {
  const cryptoDate = moment().toISOString();

  const params = {
    TableName: process.env.tableName,
    KeyConditionExpression: "cryptoSymbol = :cryptoSymbol and cryptoDate <= :cryptoDate",
    ExpressionAttributeValues: {
      ":cryptoSymbol": cryptoSymbol,
      ":cryptoDate": cryptoDate
    },
    Limit: 1,
    ScanIndexForward: false
  };

  try {
    return await dynamoDb.query(params).promise();
  } catch (err) {
    console.log("ERROR: " + err);
    return err;
  }
};

module.exports = {
  writeDB, 
  readDB
};