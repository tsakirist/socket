const cluster = require('cluster');
const redis = require('socket.io-redis');
const numWorkers = require('os').cpus().length;
const redisHost = 'localhost', redisPort = 6379;
let clients = {};

if(cluster.isMaster) {
    console.log('Master cluster setting up ' + numWorkers + ' workers...');
    for(let i=0; i<numWorkers; i++) {
        const worker = cluster.fork();
    }
    cluster.on('online', (worker) => {
        console.log('Worker ' + worker.process.pid + ' is online');
        worker.on('message', (name) => {
            console.log(`Received message from worker ${worker.process.pid} msg:`, name);
            for(let wid in cluster.workers) {
                if(cluster.workers.hasOwnProperty(wid) && cluster.workers[wid] !== worker) {
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
else {
    const http = require('../server/app');
    const io = new require('socket.io')(http);
    let users = [];

    process.on('message', (msg) => {
        console.log(`Worker ${process.pid} , received msg from master`, msg);
        console.log('NewUser:', msg.newUser);
        users.push(msg.newUser);
    });

    io.adapter(redis({host: redisHost, port: redisPort}));
    io.on('connection', (socket) => {
        console.log('Connected Worker id', process.pid);
        //sendActive(socket);
        sendUsers(socket);
        socket.on('disconnect', () => {
            //TODO need to check users buffer (MAYBE)
            const username = clients[socket.id];
            console.log(`Username: ${username} disconnected`);
            if (username) {
                console.log(`Disconnected ${process.pid} ${username}`);
                delete clients[socket.id];
                console.log(username);
                console.log(users);
                if (users.indexOf(username) != -1) {
                    users.splice(users.indexOf(username, 1));
                }
                console.log(users);
                io.emit('userDc', username);
            }
        });
        socket.on('newMsg', (msg) => {
            console.log(`worker ${process.pid} message: ${msg}`);
            const data = {username: clients[socket.id], msg: msg};
            // socket.broadcast.emit('clientMsg', data); // Send message to everyone besides myself
            io.emit('clientMsg', data);
        });
        socket.on('newUser', (name) => {
            clients[socket.id] = name;
            console.log(`Worker ${process.pid} updated clients name`, name);
            sendActive(io, name);
            sendNameToMaster(name);
            // Add every new name to worker users array
            users.push(name);
        });
    });

    function sendActive(socket, name) {
        console.log('Sending ', name);
        socket.emit('active', name);
    }

    function sendUsers(socket) {
        if(users.length) {
            console.log('Sending users already', users);
            socket.emit('active', users);
        }
    }

    function sendNameToMaster(name) {
        process.send({newUser: name});
    }
}