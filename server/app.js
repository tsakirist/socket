const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = new require('socket.io')(http);
const path = require('path');
const cluster = require('cluster');
const redis = require('socket.io-redis');
const numWorkers = require('os').cpus().length;
const PORT = 3000;
let clients = {};


//TODO need to check client name cause it appends to the html


if(cluster.isMaster) {
    console.log('Master cluster setting up ' + numWorkers + ' workers...');
    for(let i=0; i<numWorkers; i++) {
        const worker = cluster.fork();
    }
    cluster.on('online', (worker) => {
        console.log('Worker ' + worker.process.pid + ' is online');
        //This way we can send messages from workers to master and vice versa
        //TODO need to check pid of worker and send message to all others referring to active clients
        worker.on('message', (msg) => {
            console.log(`Received message from worker ${worker.process.pid} msg:`, msg);
            worker.send({msgMaster: clients});
        });
    });
    cluster.on('exit', (worker, code, signal) => {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });
}
else {
    process.on('message', (msg) => {
        console.log(`Received msg from master`, msg);
    });

    io.adapter(redis({host: 'localhost', port: 6379}));

    app.use(express.static(path.resolve(__dirname + '/../')));

    app.get('/', (req, res) => {
        res.sendFile(path.resolve(__dirname + '/index.html'));
    });

    io.on('connection', (socket) => {
        console.log('Worker id', process.pid);
        sendActive(socket);
        socket.on('disconnect', () => {
            const username = clients[socket.id];
            if (username) {
                console.log(`Disconnected ${process.pid} ${username}`);
                delete clients[socket.id];
                io.emit('userDc', username);
            }
        });
        socket.on('newMsg', (msg) => {
            console.log(`worker ${process.pid} message: ${msg}`);
            const data = {username: clients[socket.id], msg: msg};
            socket.broadcast.emit('client msg', data);   // Send msg to all clients except sender
        });
        socket.on('newUser', (name) => {
            clients[socket.id] = name;
            //TODO check already existent names in html and do smthing like += for sendActive
            sendActive(io);
            sendNames();
        });
    });

    function sendActive(socket) {
        // Send all the active names to the connected socket
        const names = [];
        for (var x in clients) {
            names.push(clients[x]);
        }
        console.log('Names:',names);
        socket.emit('active', names);
    }

    function sendNames() {
        process.send({msgWorker: clients});
    }

    http.listen(PORT, () => {
        console.log('Listening at:', PORT);
    });
}