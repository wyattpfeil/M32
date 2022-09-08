const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});


io.of("/server").on("connection", (Socket) => {
    var SocketId = Socket.id
    console.log(`Client socket ${SocketId} connected!`)

    Socket.on("sendDataToServer", async function (Data) {
        console.log(`Client ${SocketId} wants to send data to m32:`, Data)

        io.of("/client").emit("dataFromClient", Data)
    })

    Socket.on("requestVirtualBoard", async function (Data) {
        console.log(`Client ${SocketId} is requesting the virtual board.`)

        io.of("/client").emit("requestVirtualBoard")
    })
});

io.of("/client").on("connection", (Socket) => {
    var SocketId = Socket.id
    console.log(`Server socket ${SocketId} connected!`)

    Socket.on("sendDataToClient", async function (Data) {
        console.log(`Server ${SocketId} wants to send data to client:`, Data)

        io.of("/server").emit("dataFromServer", Data)
    })
});


app.get("/", async function (req, res) {
    res.json("Alive!")
})

httpServer.listen(3000);