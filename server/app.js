const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = new require('socket.io')(http);
const path = require('path');
const PORT = 3000;

app.use(express.static(path.resolve(__dirname + '/../')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected.');
    socket.on('disconnect', () => {
        console.log('User disconnected.');
    });
    socket.on('chat msg', (msg) => {
        console.log('Message:', msg);
        socket.broadcast.emit('client msg', msg);   // Send msg to all clients except sender
    });
});

http.listen(PORT, () => {
    console.log('Listening at:',PORT);
});