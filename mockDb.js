const axios = require('axios');

const url = 'localhost:4000'

const post = (dbName, body) => {
  return new Promise((res, rej) =>  res(body))
}

const getKey = (dbName, key) => {
  return new Promise((res, rej) =>  res({id: {tags: ["cars", "bikes"]}}))
}

const getDb = (dbName) => {
  return new Promise((res, rej) =>  res([{id: {tags: ["cars", "bikes"]}}]))
}


module.exports = { getDb, getKey, post }