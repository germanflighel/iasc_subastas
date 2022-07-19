const axios = require('axios');

const url = process.env.DB_URL || 'http://host.docker.internal:8080'

const post = (dbName, body) => {
  return axios
    .post(`${url}/${dbName}`, body)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      console.error(error);
    });
}

const getKey = (dbName, key) => {
  return axios
    .get(`${url}/${dbName}?key=${key}`)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      console.error(error);
    });
}

const getDb = (dbName) => {
  return axios
    .get(`${url}/${dbName}`)
    .then(res => {
      const keys = Object.keys(res.data)
      const result = keys.map(key => {
        return {id: key, ...res.data[key]}
      })
      return result;
    })
    .catch(error => {
      console.error(error);
    });
}


module.exports = { getDb, getKey, post }