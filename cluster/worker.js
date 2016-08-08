'use strict';

const redis = require('socket.io-redis');

class Worker {

    constructor(redisOptions) {
        this._http = require('../server/app');
        this._io = new require('socket.io')(this._http);
        this.clients = {};
        this.users = [];
        this._redisHost = redisOptions.host;
        this._redisPort = redisOptions.port;
    }

    start() {
        process.on('message', (msg) => {
            console.log(`Worker ${process.pid} , received msg from master`, msg);
            switch (msg.action) {
                case 'insert':
                    this.users.push(msg.data);
                    break;
                case 'remove':
                    this.removeUser(msg.data);
                    break;
            }
        });

        this._io.adapter(redis({host: this._redisHost, port: this._redisPort}));
        // Forcing the use of websocket as transport, the sticky-session problem is solved.(The problem was the failure of handshake at start)
        this._io.set('transports',['websocket']);
        // Apparently the above command isn't needed, only need to change it from the client.
        this._io.on('connection', (socket) => {
            console.log('Connected Worker id', process.pid);
            this.sendActiveUsers(socket);
            socket.on('disconnect', () => {
                const username = this.clients[socket.id];
                if (username) {
                    console.log(`Disconnected ${process.pid} ${username}`);
                    delete this.clients[socket.id];
                    this.removeUser(username);
                    this._io.emit('userDc', username);
                    this.sendRemovedUserToMaster(username);
                }
            });
            socket.on('newMsg', (msg) => {
                const data = {username: this.clients[socket.id], msg: msg};
                this._io.emit('clientMsg', data);
            });
            socket.on('newUser', (name) => {
                this.clients[socket.id] = name;
                this.sendActiveUser(this._io, name);
                this.sendNewUserToMaster(name);
                this.users.push(name);
            });
        });
    }

    sendActiveUser(socket, name) {
        socket.emit('active', name);
    }

    sendActiveUsers(socket) {
        if(this.users.length) {
            socket.emit('active', this.users);
        }
    }

     sendNewUserToMaster(name) {
         process.send({action: 'insert', data: name});
    }

     sendRemovedUserToMaster(name) {
         process.send({action: 'remove', data: name});
    }

    removeUser(name) {
       if(this.users.indexOf(name) != -1) {
            this.users.splice(this.users.indexOf(name), 1);
        }
    }
}

module.exports = Worker;