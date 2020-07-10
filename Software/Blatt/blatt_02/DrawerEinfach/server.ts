import path from "path";
import express from 'express';
import SocketIO from 'socket.io';
import  WebSocket from 'ws';
import * as http from "http";

// let io = require('socket.io');
const app = express();
const port = process.env.PORT || 8888;
let __dirname = path.resolve(path.dirname(''));
app.use(express.static(path.join(__dirname, '')));
app.use(express.urlencoded({extended: false}));





// // define a route handler for the default home page
// app.get("/", (req, res) => {
//     res.sendFile('index.html');
// });
//
// app.post('/submit', function (req, res) {
//     console.log(req.body)
// });
//
// // start the Express server
// app.listen(port, () => {
//     console.log(`server at http://localhost:${port}`, wss, http);
// });


//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {

    //connection is up, let's add a simple simple event
    ws.on('message', (message: string) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);
        ws.send(`Hello, you sent -> ${message}`);
    });

    //send immediatly a feedback to the incoming connection
    ws.send('Hi there, I am a WebSocket server '+ ws.readyState);
});

//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port http://localhost:${server.address().port} :)`);
});