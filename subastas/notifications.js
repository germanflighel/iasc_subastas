const {getDb, getKey, post} = require('./db')
const { v4 } = require('uuid')

var AWS = require('aws-sdk');


AWS.config.update({
  region: "us-east-1",
  accessKeyId: "test",
  secretAccessKey: "test",
});

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || 'http://localhost:4566/000000000000/notification-events.fifo'

const AUCTIONS = 'auctions'

var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const sendMessage = (params) => sqs.sendMessage(params, function(err, data) {
  if (err) {
    console.log("Error notifying", err);
  }
});

const notifyBuyers = (subject, buyers, auction) => {
 buyers.forEach(buyer => {
  const MessageBody = JSON.stringify({
    endpoint: buyer.ip + '/notification',
    body: {
      subject,
      auction
    }}
  )
  

  const params = {
    MessageBody,
    MessageDeduplicationId: v4(),
    MessageGroupId: buyer.ip,
    QueueUrl: SQS_QUEUE_URL
  };

  sendMessage(params)
 })
}

const notifyInterestingAuctions = (buyer, interestingAuctions) => {
  const MessageBody = JSON.stringify({
    endpoint: buyer.ip + '/notification',
    body: {
      subject: 'MATCHING_AUCTIONS',
      interestingAuctions
    },
  })

  const params = {
    MessageBody,
    MessageDeduplicationId: v4(),
    MessageGroupId: buyer.ip,
    QueueUrl: SQS_QUEUE_URL
  };

  sendMessage(params)
}

const notifyEndOfAuction = async (_auction) => {
  const auction = await getKey('auctions', _auction.id)

  if (auction.status == 'CANCELED' || auction.status == 'ENDED') return;

  const endedAuction = {...auction, status: 'ENDED'}
  await post(AUCTIONS, {[_auction.id]: endedAuction})

  if (auction.winningBid) {
    const MessageBody = JSON.stringify({
      endpoint: endedAuction.winningBid.buyer.ip + '/notification',
      body: {
        subject: 'WON_AUCTION',
        endedAuction
      },
    })

    const params = {
      MessageBody,
      MessageDeduplicationId: v4(),
      MessageGroupId: auction.winningBid.buyer.ip,
      QueueUrl: SQS_QUEUE_URL
    };

    sendMessage(params)
  }

  const buyers = await getDb('buyers')

  const interestedBuyers = buyers.filter(buyer => auction.tags.some(tag => buyer.interests.includes(tag)));


  interestedBuyers.forEach(buyer => {
    const MessageBody = JSON.stringify({
      endpoint: buyer.ip + '/notification',
      body: {
        subject: 'END_OF_AUCTION',
        endedAuction
      },
    })

    const params = {
      MessageBody,
      MessageDeduplicationId: v4(),
      MessageGroupId: buyer.ip,
      QueueUrl: SQS_QUEUE_URL
    };

    sendMessage(params)
 })
}

module.exports = { notifyBuyers, notifyInterestingAuctions, notifyEndOfAuction }