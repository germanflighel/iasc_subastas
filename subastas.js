const express = require('express');
const app = express();
app.use(express.json())

const {getDb, getKey, post} = require('./db')

const { v4 } = require('uuid')

const notifyBuyers = (buyers) => console.log(`Notifying ${buyers}`)

const notifyEndOfAuction = (auction) => console.log(`Fetch the winners and loses and notify them with ${auction}`)

const notifyInterestingAuctions = (buyer, auctions) => console.log(`Notifying ${buyer.name} of ${auctions.map(auction => auction.id)}`)

const { io } = require("socket.io-client");
const socket = io("http://localhost:3001");

const AUCTIONS = 'auctions'
const EXTRA_TIME = 5 * 1000


app.post('/buyers', async function(req, res) {
  const buyer = {...req.body, id: v4()};

  await post('buyers', buyer);

  let auctions = await getDb(AUCTIONS);
  // [{id: {}}]
  auctions = auctions.map(auction => ({...Object.values(auction)[0], id: Object.keys(auction)[0]}))

  const interestingAuctions = auctions.filter(auction => buyer.interests.some(interest => auction.tags.includes(interest)));

  notifyInterestingAuctions(buyer, interestingAuctions)

  res.json(buyer)
});

app.post('/auctions', async function(req, res) {
  const auction = {...req.body, status: 'ONGOING', startTime: Date.now(), id: v4()};
  const endOfAuction = auction.duration * 60 * 1000

  const newAuction = await post(AUCTIONS, {[id]: auction});

  setTimeout(() => { notifyEndOfAuction(auction) }, endOfAuction);

  const buyers = await getDb('buyers')

  const interestedBuyers = buyers.filter(buyer => auction.tags.some(tag => buyer.interests.includes(tag)));

  notifyBuyers(interestedBuyers);

  socket.emit('new-auction', newAuction.id)

  res.json(auction);
});

app.post('/bids', async function(req, res) {
  const bid = {...req.body};

  let auction = await getKey(AUCTIONS, auction.id)
  // {id: {}}
  auction = { ...Object.values(auction)[0], id: Object.keys(auction)[0] }

  if (auction.winningPrice < bid.price) {
    return res.json({'status': 'offer more pls'})
  }

  const updatedAuction = {...auction, winningBid: bid, winningPrice: bid.price}
  
  await post(AUCTIONS, {[auction.id]: updatedAuction});

  const buyers = await getDb('buyers')

  const interestedBuyers = buyers.filter(buyer => auction.tags.some(tag => buyer.interests.includes(tag)));

  notifyBuyers(interestedBuyers);
});

app.post('/auction/:id/cancel', async function(req, res) {
  const auctionId = req.params.id

  const auction = await getKey(AUCTIONS, auctionId)
  
  const updatedAuction = {...auction, status: 'CANCELED'}
  
  await post(AUCTIONS, {[auctionId]: updatedAuction})

  const buyers = await getDb('buyers')

  const interestedBuyers = buyers.filter(buyer => auction.tags.some(tag => buyer.interests.includes(tag)));

  notifyBuyers(interestedBuyers);
});

const scheduleEndOfAuction = (lostAuction) => {
  const newEndTime = (lostAuction.startTime + lostAuction.duration * 60 * 1000) - Date.now()
  setTimeout(() => notifyEndOfAuction(lostAuction), newEndTime + EXTRA_TIME)
}

socket.on("connect", async () => {
  console.log(`Connected to monitor? ${socket.connected}`);

  socket.emit('get-orphan-auctions', "", orphanAuctions => {
    orphanAuctions.forEach(auction => scheduleEndOfAuction(auction))
  })
});

app.listen(3000, () => {
  // Connect with sockets
  console.log(`Subastas listening on 3000`);
});