'use strict';

class Master {

    constructor() {
        this.cluster = require('cluster');
    }

    start() {
        this.cluster.on('online', (worker) => {
            console.log('Worker ' + worker.process.pid + ' is online');
            worker.on('message', (name) => {
                for(let wid in this.cluster.workers) {
                    if(this.cluster.workers[wid] !== worker) {
                        this.cluster.workers[wid].send(name);
                    }
                }
            });
        });
        this.cluster.on('exit', (worker, code, signal) => {
            console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
            console.log('Starting a new worker');
            this.cluster.fork();
        });
    }
}

module.exports = Master;