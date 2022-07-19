const debug = require("diagnostics")("raft"),
  argv = require("argh").argv,
  LifeRaft = require("../");

let msg;

if (argv.queue) msg = require(argv.queue);
else msg = require("axon");

//
// We're going to create own custom Raft instance which is powered by axon for
// communication purposes. But you can also use things like HTTP, OMQ etc.
//
class TCPRaft extends LifeRaft {
  /**
   * Initialized, start connecting all the things.
   *
   * @param {Object} options Options.
   * @api private
   */
  initialize(options) {
    debug("initializing reply socket on port %s", this.address);

    const socket = (this.socket = msg.socket("rep"));

    socket.bind(this.address);
    socket.on("message", (data, fn) => {
      this.emit("data", data, fn);
    });

    socket.on("error", () => {
      debug("failed to initialize on port: ", this.address);
    });
  }

  /**
   * The message to write.
   *
   * @param {Object} packet The packet to write to the connection.
   * @param {Function} fn Completion callback.
   * @api private
   */
  write(packet, fn) {
    if (!this.socket) {
      this.socket = msg.socket("req");

      this.socket.connect(this.address);
      this.socket.on("error", function err() {
        // console.error("failed to write to: ", this.address);
      });
    }

    debug("writing packet to socket on port %s", this.address);
    this.socket.send(packet, (data) => {
      fn(undefined, data);
    });
  }
}
module.exports = TCPRaft;
