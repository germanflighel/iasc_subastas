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
const PORT = process.env.PORT || 3001

/**
 * We could add an extra event to clean ended auctions
 */

// { socket_id_1: [{id: 1, status: 'STATUS'}] }
const auctions = []

io.on("connection", (socket) => {

  socket.on("new-auction", (auction) => {
    auctions.push({...auction, socketId: socket.id, status: 'ONGOING'})
  })

  /*
   *  This looked like it had a horrible race condition to me. 
   */
  socket.on('get-orphan-auctions', async (_, callback) => {
    await subastasMutex.runExclusive(async () => {
      const orphans = auctions.filter(auction => auction.status == 'ORPHAN')
      if (orphans.length == 0) return
  
      callback(orphans)
      auctions.forEach(auction => {
        if (auction.status == 'ORPHAN') {
          auction.status == 'ONGOING'
          auction.startTime += 5 * 1000
        } 
      })
    })
  })

  socket.on('disconnect', async (reason) => {
    await subastasMutex.runExclusive(async () => {  
      auctions.forEach(auction => {
        if (auction.socketId == socket.id) auction.status = 'ORPHAN'
      })
    })
  })
});

httpServer.listen(PORT, () => console.log("Monitor is up and runnning"));