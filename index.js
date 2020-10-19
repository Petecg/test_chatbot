'use strict';
// Imports dependencies and set up http server
const express = require('express'),
const bodyParser = require('body-parser'),
const app = express().use(bodyParser.json()); // creates express http server
// Sets server port and logs message on success
const app.listen(process.env.PORT || 5000;, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => { 
  let body = req.body;
  if (body.object === 'page') { // Checks this is an event from a page subscription
    body.entry.forEach(function(entry) { // Iterates over each entry - there may be multiple if batched
      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
    });    
    res.status(200).send('EVENT_RECEIVED'); // Returns a '200 OK' response to all requests
  }
  else {    
    res.sendStatus(404); // Returns a '404 Not Found' if event is not from a page subscription
  }
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
  let VERIFY_TOKEN = "test_chat"; // Your verify token. Should be a random string.
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];    
  if (mode && token) { // Checks if a token and mode is in the query string of the request    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) { // Checks the mode and token sent is correct
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);    
    }
	else {      
      res.sendStatus(403); // Responds with '403 Forbidden' if verify tokens do not match
    }
  }
});