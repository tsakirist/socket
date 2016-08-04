const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = new require('socket.io')(http);
const path = require('path');
const cluster = require('cluster');
const redis = require('socket.io-redis');
const numWorkers = require('os').cpus().length;
const PORT = 3000,
    redisHost = 'localhost',
    redisPort = 6379;
let clients = {};
//let clients = [];

//TODO need to check client name cause it appends to the html


if(cluster.isMaster) {

    console.log('Master cluster setting up ' + numWorkers + ' workers...');
    for(let i=0; i<numWorkers; i++) {
        const worker = cluster.fork();
    }

    cluster.on('online', (worker) => {
        console.log('Worker ' + worker.process.pid + ' is online');
        //TODO need to check pid of worker and send message to all others referring to active clients
        worker.on('message', (msg) => {
            console.log(`Received message from worker ${worker.process.pid} msg:`, msg);
            //worker.send({msgMaster: clients});
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

    io.adapter(redis({host: redisHost, port: redisPort}));

    app.use(express.static(path.resolve(__dirname + '/../')));

    app.get('/', (req, res) => {
        res.sendFile(path.resolve(__dirname + '/index.html'));
    });

    io.on('connection', (socket) => {
        console.log('Connected Worker id', process.pid);
        //sendActive(socket);

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
            socket.broadcast.emit('clientMsg', data); // Send message to everyone besides myself
        });
        socket.on('newUser', (name) => {
            clients[socket.id] = name;
            console.log(`Worker ${process.pid} updated clients name`, name);
            sendActive(socket, name);
            sendNames();
        });
    });

    function sendActive(socket, name) {
        console.log('Sending ', name);
        socket.broadcast.emit('active', name);
    }

    function sendNames() {
        process.send({msgWorker: clients});
    }

    http.listen(PORT, () => {
        console.log('Listening at:', PORT);
    });
}