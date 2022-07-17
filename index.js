const express = require('express');
const app = express();
app.use(express.json())

const { io } = require("socket.io-client");
const socket = io("http://localhost:3001");

app.post('/buyers', function(req, res) {
  const buyer = {...req.body};

  socket.emit('create-buyer', buyer, response => {    
    console.log("Created the buyer with socket")
    res.json(buyer);
  })
});

app.post('/bids', function(req, res) {
  const bid = {...req.body};

  socket.emit('create-bid', bid, response => {    
    console.log("Created the bid with socket")
    res.json(bid);
  })
});

app.post('/offer', function(req, res) {
  const offer = {...req.body};

  socket.emit('create-offer', offer, response => {    
    console.log("Created the offer with socket")
    res.json(bid);
  })
});

app.get('buyers/:name', function (req, res) {
  const name = req.params.name
  const buyer = buyers.find(buyer => buyer.name == name)
  res.json(buyer);
}); 

app.get('/buyers', function (req, res) {
  res.json(buyers);
})

app.listen(3000, () => {
  console.log(`Buyers listening on 3000`);
});