const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = new require('socket.io')(http);
const path = require('path');
const PORT = 3000;
const clients = {};

app.use(express.static(path.resolve(__dirname + '/../')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/index.html'));
});

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        const username = clients[socket.id];
        io.emit('userDc', username);
    });
    socket.on('newMsg', (msg) => {
        console.log('Message:', msg);
        const data = {username: clients[socket.id], msg: msg};
        socket.broadcast.emit('client msg', data);   // Send msg to all clients except sender
    });
    socket.on('newUser', (msg) => {
        clients[socket.id] = msg;
        console.log(clients);
    });
});

http.listen(PORT, () => {
    console.log('Listening at:',PORT);
});