const express = require("express");
const { createServer } = require("http");
const { off } = require("process");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

const buyers = []
const bids = []

io.on("connection", (socket) => {
  console.log(`Somembody connected to me`)

  socket.on('create-buyer', (payload, callback) => {
    buyers.push(payload);
    callback(`Created ${payload.name}`)
  })

  socket.on('create-bid', (payload, callback) => {
    const bid = { ...payload, startTime: new Date(), status: 'ONGOING', id: uuidv4(), bestOffer: null, buyer: null }
    bids.push(bid)
    notifyBuyers(bid)
    callback(`Created bid: `, bid)
  })

  socket.on('create-offer', (payload, callback) => {
    const offer = {...payload}
    
    const bid = bids.find(bid => bid.id = offer.bidId)
    if (offer.amount > bid.bestOffer.amount) {
      bid.bestOffer = offer
      bid.buyer = offer.buyer
      notifyBuyers(bid)
    }
    callback(`Created bid: `, bid)
  })
});

const notifyBuyers = (bid) => console.log(`Publishing bid ${bid} to all buyers`)

httpServer.listen(3001, () => console.log("State node waiting for clients"));