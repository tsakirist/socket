# Socket

Simple chatroom between clients, using **socket.io** and **clustering**.

## Install
Install dependencies.
```
  npm install
```

## Explanation
The master process creates a worker for each CPU core.  
Every worker is a simple http server which is communicating with the clients via *WebSockets*.
