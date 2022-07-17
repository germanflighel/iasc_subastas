const axios = require('axios');

const url = 'localhost:4000'

const post = (dbName, body) => {
  return axios
    .post(`url/${dbName}`, body)
    .then(res => {
      console.log(`statusCode: ${res.status}`);
      console.log(res);
      return res.data;
    })
    .catch(error => {
      console.error(error);
    });
}

const getKey = (dbName, key) => {
  return axios
    .get(`url/${dbName}?key=${key}`)
    .then(res => {
      console.log(`statusCode: ${res.status}`);
      console.log(res);
      return res.data;
    })
    .catch(error => {
      console.error(error);
    });
}

const getDb = (dbName) => {
  return axios
    .get(`url/${dbName}`)
    .then(res => {
      console.log(`statusCode: ${res.status}`);
      console.log(res);
      return res.data;
    })
    .catch(error => {
      console.error(error);
    });
}


module.exports = { getDb, getKey, post }