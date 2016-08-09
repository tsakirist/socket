'use strict';

const sticky = require('sticky-session');
const config = require('./config/config.json');
const redisOptions = {host: config.redisHost, port: config.redisPort};
const server = require('./server/app');
const PORT = config.PORT;

if(!sticky.listen(server, PORT)) {
    const Master = require('./cluster/master');
    const master = new Master();
    master.start();
}
else {
    const Worker = require('./cluster/worker');
    const worker = new Worker(redisOptions);
    worker.start();
}