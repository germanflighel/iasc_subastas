const debug = require("diagnostics")("raft"),
  LifeRaft = require("../"),
  net = require("net");

//
// Create a custom Raft instance which uses a plain TCP server and client to
// communicate back and forth.
//
class TCPRaft extends LifeRaft {
  /**
   * Initialized, start connecting all the things.
   *
   * @param {Object} options Options.
   * @api private
   */
  initialize(options) {
    // var raft = this;

    const server = net
      .createServer((socket) => {
        socket.on("data", (buff) => {
          var data = JSON.parse(buff.toString());

          // debug(this.address + ":packet#data", data);
          this.emit("data", data, (data) => {
            debug(this.address + ":packet#reply", data);
            socket.write(JSON.stringify(data));
            socket.end();
          });
        });
      })
      .listen(this.address);

    this.once("end", function enc() {
      server.close();
    });
  }

  /**
   * The message to write.
   *
   * @TODO implement indefinitely sending of packets.
   * @param {Object} packet The packet to write to the connection.
   * @param {Function} fn Completion callback.
   * @api private
   */
  write(packet, fn) {
    const socket = net.connect(this.address);

    // debug(this.address + ":packet#write", packet);
    socket.on("error", fn);
    socket.on("data", (buff) => {
      let data;

      try {
        data = JSON.parse(buff.toString());
      } catch (e) {
        return fn(e);
      }

      debug(this.address + ":packet#callback", packet);
      fn(undefined, data);
    });

    socket.setNoDelay(true);
    socket.write(JSON.stringify(packet));
  }
}

module.exports = TCPRaft;
