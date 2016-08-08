'use strict';

const cluster = require('cluster');
const numWorkers = require('os').cpus().length;
const config = require('./config/config.json');
const redisOptions = {host: config.redisHost, port: config.redisPort};

if (cluster.isMaster) {
    const Master = require('./cluster/master');
    const master = new Master(numWorkers);
    master.start();
}
else {
    const Worker = require('./cluster/worker');
    const worker = new Worker(redisOptions);
    worker.start();
}
