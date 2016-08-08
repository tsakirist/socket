'use strict';

const cluster = require('cluster');

class Master {
    
    constructor(numWorkers) {
        this.initWorkers(numWorkers);
    }

    initWorkers(numWorkers) {
        console.log('Master cluster setting up ' + numWorkers + ' workers...');
        for(let i=0; i<numWorkers; i++) {
            cluster.fork();
        }
    }

    start() {
        cluster.on('online', (worker) => {
            console.log('Worker ' + worker.process.pid + ' is online');
            worker.on('message', (name) => {
                console.log(`Received message from worker ${worker.process.pid} msg:`, name);
                for(let wid in cluster.workers) {
                    if(cluster.workers[wid] !== worker) {
                        console.log(`Sending to worker ${cluster.workers[wid].process.pid} name:`,name);
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