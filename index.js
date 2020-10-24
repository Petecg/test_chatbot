'use strict';
// Imports dependencies and set up http server
const express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  PAGE_ACCESS_TOKEN=process.env.PAGE_ACCESS_TOKEN, //Facebook page access token
  request = require('request'); //Llamada a la librería request para enviar información vía HTTP
// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));
const dotenv=require('dotenv');
dotenv.config();

//Terminación del proceso
process.on('SIGTERM', () => {
  console.log('Proceso terminado')
})

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
  let fbJson=JSON.stringify(req.body);
  console.log(fbJson);
  let body = req.body;
  if (body.object === 'page') { // Checks this is an event from a page subscription
    body.entry.forEach(function(entry) { // Iterates over each entry - there may be multiple if batched
      if(typeof(entry.messaging)!="undefined"){
      // console.log(typeof(entry));
        // Gets the message. entry.messaging is an array, but will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        // console.log(webhook_event);
        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        // console.log('Sender PSID: ' + sender_psid);
        // Check if the event is a message or postback and pass the event to the appropriate handler function
        if (webhook_event.message) {
          handleMessage(sender_psid, webhook_event.message);
        } else if (webhook_event.postback) {
          handlePostback(sender_psid, webhook_event.postback);
        }
      }
      if(typeof(entry.standby)!="undefined"){
        console.log("Se recibio evento STANDBY");
      }
      // if(typeof(entry.standby)!="undefined"){
      //   console.log("Se recibio evento STANDBY");
      // }
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

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
    // Check if the message contains text
    if (received_message.text) {
      // Create the payload for a basic text message
      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": "Bienvenido a la página\nSoy el Foto-bot",
              "subtitle": "¿En qué te puedo ayudar?",
              "image_url": "https://www.pngkit.com/png/detail/955-9556311_camara-de-fotos-caricatura.png",
              "buttons": [
                {
                  "type": "postback",
                  "title": "Información",
                  "payload": "info",
                },
                {
                  "type": "postback",
                  "title": "Contactar a un humano",
                  "payload": "handover",
                }
              ],
            }]
          }
        }
      }
    }
    else if (received_message.attachments) {
    // Gets the URL of the message attachment
      let attachment_url = received_message.attachments[0].payload.url;
      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": "¿Esta es la imagen enviada?",
              "subtitle": "Usa uno de los botones para responder",
              "image_url": attachment_url,
              "buttons": [
                {
                  "type": "postback",
                  "title": "¡SI!",
                  "payload": "yes",
                },
                {
                  "type": "postback",
                  "title": "¡NO!",
                  "payload": "no",
                }
              ],
            }]
          }
        }
      }
    }
  callSendAPI(sender_psid, response); // Sends the response message
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  let payload = received_postback.payload; //Get the payload for the postback
  // Set the response based on the postback payload
  if (payload === 'info') {
    response = { "text": "Una información Lorem Ipsum" }
  } else if (payload === 'handover') {
    response = { "text": "Lo estamos transfiriendo" }
    callHandover(sender_psid);
  }
  callSendAPI(sender_psid, response); // Send the message to acknowledge the postback
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid},
      "message": response}
// Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v8.0/107336410850663/messages",
    "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('Mensaje enviado!')
    } else {
      console.error("Error al enviar el mensaje:" + err);
    }
  });
  // console.log(process.env.PAGE_ACCESS_TOKEN);
  // console.log(JSON.stringify(request_body));
}

function callHandover(sender_psid){
  let handover_req={
    "recipient":{"id":sender_psid},
    "target_app_id":263902037430900,
    "metadata":"Se solicitó atención de una persona"}
  request({
    "uri": "https://graph.facebook.com/v8.0/107336410850663/pass_thread_control",
    "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": handover_req
  }, (err, res, body) => {
    if (!err) {
      console.log('handover ejecutado')
    } else {
      console.error("Error al enviar ejecutar handover:" + err);
    }
  });
}
