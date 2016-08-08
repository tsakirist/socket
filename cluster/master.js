'use strict';
const cluster = require('cluster');

class Master {

    start() {
        cluster.on('online', (worker) => {
            console.log('Worker ' + worker.process.pid + ' is online');
            worker.on('message', (name) => {
                for(let wid in cluster.workers) {
                    if(cluster.workers.hasOwnProperty(wid) && cluster.workers[wid] !== worker) {
                        cluster.workers[wid].send(name);
                    }
                }
            });
        });
        cluster.on('exit', (worker, code, signal) => {
            console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
            console.log('Starting a new worker');
            cluster.fork();
        });
    }
}

module.exports = Master;