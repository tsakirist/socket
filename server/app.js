'use strict';
const express = require('express');
const app = express();
const http = require('http').Server(app);
const router = require('../router/router');

app.use(router);

module.exports = http;