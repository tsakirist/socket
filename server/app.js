const express = require('express');
const app = express();
const http = require('http').Server(app);
const router = require('../router/router');
const PORT = require('../config/config.json').PORT;

app.use(router);

http.listen(PORT, () => {
    console.log('Listening at:', PORT);
});

module.exports = http;