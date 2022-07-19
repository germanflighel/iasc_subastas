const debug = require("diagnostics")("raft");
var http = require("http");
const url = require("url");
var TCPRaft = require("./tcp_exported_axon");
const fetch = require("node-fetch");

var Log = require("../log");

const state = {};

const port = 8090;
const address = `${process.env.ADDRESS}:${port}`;
const addresses = process.env.ADDRESSES.split(",");
var raft;

// DB web server
const webPort = 8080;

http
  .createServer(function (request, response) {
    response.setHeader("Content-Type", "application/json");

    const parsedUrl = url.parse(request.url, true);
    const schema = parsedUrl.pathname.substring(1);

    if (request.method == "POST") {
      let body = "";

      request.on("data", (chunk) => {
        body += chunk;
      });

      request.on("end", () => {
        if (raft.leader != address) {
          const leaderUrl = getWebAddess(raft.leader) + request.url;
          console.log(leaderUrl);
          redirectCommand(leaderUrl, body)
            .then((_) => {
              response.writeHead(200);
              response.end(JSON.stringify(body));
            })
            .catch((error) => {
              response.writeHead(500);
              response.end(JSON.stringify(error));
            });
        } else {
          raft.command({ [schema]: JSON.parse(body) }).then((_) => {
            response.writeHead(200);
            response.end(JSON.stringify(body));
          });
        }
      });
    } else {
      const schemaData = state[schema] || {};
      const requestedKey = parsedUrl.query.key;
      const requestedState = requestedKey
        ? schemaData[requestedKey]
        : schemaData;

      response.writeHead(200);
      response.end(JSON.stringify(requestedState));
    }
  })
  .listen(webPort);

setTimeout(() => {
  raft = new TCPRaft(address, {
    "election min": 1000,
    "election max": 2000,
    heartbeat: 200,
    Log,
    adapter: require("memdown"),
  });

  raft.on("heartbeat timeout", () => {
    debug("heart beat timeout, starting election");
  });

  raft
    .on("term change", (to, from) => {
      debug("were now running on term %s -- was %s", to, from);
    })
    .on("leader change", function (to, from) {
      debug("we have a new leader to: %s -- was %s", to, from);
    })
    .on("state change", function (to, from) {
      debug("we have a state to: %s -- was %s", to, from);
    });

  raft.on("leader", () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("I am elected as leader");
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
  });

  raft.on("candidate", () => {
    console.log("----------------------------------");
    console.log("I am starting as candidate");
    console.log("----------------------------------");
  });

  raft.on("commit", function (command) {
    console.log("Commiteado", command);
    const schemaKey = Object.keys(command)[0];
    const schema = state[schemaKey] || {};
    Object.keys(command[schemaKey]).forEach((key) => {
      schema[key] = command[schemaKey][key];
    });
    state[schemaKey] = schema;
  });
}, 15000);

setTimeout(() => {
  //
  // Joineamos a los demas nodos
  //
  addresses.forEach((nr) => {
    const address = `${nr}:8090`;
    console.log(address);
    raft.join(address);
  });
}, 30000);

const redirectCommand = (url, data) => {
  return fetch(url, {
    method: "POST",
    body: data,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

const getWebAddess = (address) => {
  const components = address.split(":");
  return (
    "http://" +
    [components[0], components[1], "8080"].join(":").replace("tcp://", "")
  );
};
