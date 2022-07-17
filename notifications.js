const {getDb, getKey} = require('./db')
const { v4 } = require('uuid')

var AWS = require('aws-sdk');


var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const sendMessage = (params) => sqs.sendMessage(params, function(err, data) {
  if (err) {
    console.log("Error notifying", err);
  }
});

const notifyBuyers = (subject, buyers, auction) => {
 buyers.forEach(buyer => {
  const MessageBody = {
    endpoint: buyer.ip + '/notification',
    body: {
      subject,
      auction
    },
  }

  const params = {
    MessageBody,
    MessageDeduplicationId: v4(),
    MessageGroupId: buyer.ip,
    QueueUrl: "SQS_QUEUE_URL"
  };

  sendMessage(params)
 })
}

const notifyInterestingAuctions = (buyer, interestingAuctions) => {
  const MessageBody = {
    endpoint: buyer.ip + '/notification',
    body: {
      subject: 'MATCHING_AUCTIONS',
      interestingAuctions
    },
  }

  const params = {
    MessageBody,
    MessageDeduplicationId: v4(),
    MessageGroupId: buyer.ip,
    QueueUrl: "SQS_QUEUE_URL"
  };

  sendMessage(params)
}

const notifyEndOfAuction = async (_auction) => {
  const auction = await getKey('auctions', _auction.id)

  if (auction.status == 'CANCELED') return;

  const MessageBody = {
    endpoint: auction.winningBid.buyer.ip + '/notification',
    body: {
      subject: 'WON_AUCTION',
      auction
    },
  }

  const params = {
    MessageBody,
    MessageDeduplicationId: v4(),
    MessageGroupId: auction.winningBid.buyer.ip.ip,
    QueueUrl: "SQS_QUEUE_URL"
  };

  sendMessage(params)

  const buyers = await getDb('buyers')

  const interestedBuyers = buyers.filter(buyer => auction.tags.some(tag => buyer.interests.includes(tag)));


  interestedBuyers.forEach(buyer => {
    const MessageBody = {
      endpoint: buyer.ip + '/notification',
      body: {
        subject: 'END_OF_AUCTION',
        auction
      },
    }

    const params = {
      MessageBody,
      MessageDeduplicationId: v4(),
      MessageGroupId: buyer.ip,
      QueueUrl: "SQS_QUEUE_URL"
    };

    sendMessage(params)
 })
}

module.exports = { notifyBuyers, notifyInterestingAuctions, notifyEndOfAuction }