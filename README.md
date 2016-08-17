Socket
==========

Simple chatroom between clients, using **socket.io** , **clustering** and **redis-server**.

## Branches
  * Master: Uses **_WebSockets_** as main transport, no **xhr polling, etc**.
  * Sticky: Uses **_sticky-session_** to balance request according to their **IP address**.

## Install
Install dependencies.
```
  npm install
  sudo apt-get install redis-server
```

## Explanation
The master process creates a worker for each CPU core.  
Every worker is a simple http server which is communicating with the clients via *WebSockets*.
