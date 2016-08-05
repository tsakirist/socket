class Worker {
    constructor() {
        this.http = require('../server/app');
        this.io = new require('socket.io')(this.http);
        this.clients = {};
        this.users = [];
    }

    start() {
        process.on('message', (msg) => {
            console.log(`Worker ${process.pid} , received msg from master`, msg);
            if(msg.newUser) {
                this.users.push(msg.newUser);
            }
            else {
                removeUser(msg.removedUser);
            }
        });

        this.io.adapter(redis({host: redisHost, port: redisPort}));
        // Forcing the use of websocket as transport, the sticky-session problem is solved.(The problem was the failure of handshake at start)
        this.io.set('transports',['websocket']);
        // Apparently the above command isn't needed, only need to change it from the client.
        this.io.on('connection', (socket) => {
            console.log('Connected Worker id', process.pid);
            this.sendActiveUsers(socket);
            socket.on('disconnect', () => {
                const username = this.clients[socket.id];
                console.log(`Username: ${username} disconnected`);
                if (username) {
                    console.log(`Disconnected ${process.pid} ${username}`);
                    delete this.clients[socket.id];
                    this.removeUser(username);
                    this.io.emit('userDc', username);
                    this.sendRemovedUserToMaster(username);
                }
            });
            socket.on('newMsg', (msg) => {
                console.log(`worker ${process.pid} message: ${msg}`);
                const data = {username: this.clients[socket.id], msg: msg};
                // socket.broadcast.emit('clientMsg', data); // Send message to everyone besides myself
                this.io.emit('clientMsg', data);
            });
            socket.on('newUser', (name) => {
                this.clients[socket.id] = name;
                console.log(`Worker ${process.pid} updated clients name`, name);
                this.sendActiveUser(io, name);
                this.sendNewUserToMaster(name);
                // Add every new name to worker {users} array
                this.users.push(name);
            });
        });
    }

    static sendActiveUser(socket, name) {
        console.log('Sending ', name);
        socket.emit('active', name);
    }

    static sendActiveUsers(socket) {
        if(this.users.length) {
            console.log('Sending users already', this.users);
            socket.emit('active', this.users);
        }
    }

    static sendNewUserToMaster(name) {
        process.send({newUser: name});
    }

    static sendRemovedUserToMaster(name) {
        process.send({removedUser: name});
    }

    removeUser(name) {
       if(this.users.indexOf(name) != -1) {
            console.log(this.users);
            this.users.splice(this.users.indexOf(name, 1));
            console.log(this.users);
        }
    }
}