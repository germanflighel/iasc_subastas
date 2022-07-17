const { Consumer } = require("sqs-consumer");
const AWS = require("aws-sdk");
const axios = require("axios").default;

AWS.config.update({
  region: "us-east-1",
  accessKeyId: "test",
  secretAccessKey: "test",
});

const app = Consumer.create({
  queueUrl: "http://localhost:4566/000000000000/notification-events.fifo",
  handleMessage: async (message) => {
    const payload = JSON.parse(message.Body) || {};
    const { endpoint, body } = payload;
    console.log("Received", payload);

    if ([endpoint, body].some((value) => !value)) {
      throw new Error("Invalid notification payload");
    }

    try {
      const response = await axios.post(endpoint, body);
      console.log(response);
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  sqs: new AWS.SQS(),
});

app.on("error", (err) => {
  console.error(err.message);
});

app.on("processing_error", (err) => {
  console.error(err.message);
});

app.on("timeout_error", (err) => {
  console.error(err.message);
});

app.start();
