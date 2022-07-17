const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Mutex = require('async-mutex').Mutex;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

const subastasMutex = new Mutex()


// { socket_id_1: [{id: 1, status: 'STATUS'}] }
const auctions = []

io.on("connection", (socket) => {
  
  console.log(`Somembody connected to me with id: ${socket.id}, address: ${socket.handshake.address}`)

  socket.on('new-auction', (id) => {
    console.log(`${socket.id} has a new auction with id: ${id}`)
    auctions.push({socketId: socket.id, id, status: 'ONGOING'})
  })

  /*
   *  This looks likes it has a horrible race condition to me. 
   */
  socket.on('get-orphan-auctions', async (_, callback) => {
    await subastasMutex.runExclusive(async () => {
      const orphans = auctions.filter(auction => auction.status == 'ORPHAN')
      if (orphans.length == 0) return
  
      callback(orphans)
      auctions.forEach(auction => {
        if (auction.status == 'ORPHAN') {
          auction.status == 'ONGOING'
        } 
      })
    })
  })

  socket.on('disconnect', (reason) => {
    console.log(`${socket.id} disconnected, its auctions have to be set as orphans and be reclaimed`)
    auctions[socket.id].forEach(auction => auction.status = 'ORPHAN')
  })
});

httpServer.listen(3001, () => console.log("Monitor is up and runnning"));