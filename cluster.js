const cluster = require('cluster');
const numWorkers = require('os').cpus().length;
const redisHost = 'localhost', redisPort = 6379;

if (cluster.isMaster) {
    const Master = require('./cluster/master');
    const master = new Master(numWorkers);
    master.start();
}
else {
    const Worker = require('./cluster/worker');
    const server = new Worker({host:redisHost, port:redisPort});
    server.start();
}