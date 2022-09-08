const m32 = require("../m32-js/index.js")
const { io } = require("socket.io-client");

/*
const m32 = require("m32-js")


var BoardIp = "169.254.248.78"
var BoardPort = 10023

var MacIp = "169.254.173.105"
var MacPort = 10024
*/

var BoardIp = "192.168.1.4"
var BoardPort = 10025

var MacIp = "192.168.1.4"
var MacPort = 10024

var Board = new m32.Board()

var ServerSocket


async function setupSocket() {
    ServerSocket = io("https://m32middleman.luasploit.repl.co/client");

    ServerSocket.on("connect", async () => {
        console.log(ServerSocket.id); // x8WIv7-mJelg7on_ALbx

        console.log("Connected to Middleman")
    });

    ServerSocket.on("dataFromClient", function (Data) {
        console.log("Got data from client!!")
        console.log(Data)

        Board.sendMessage(Data)
    })

    ServerSocket.on("requestVirtualBoard", function (Data) {
        console.log("SENDING VIRTUAL BOARD TO CLIENT")
        ServerSocket.emit("sendDataToClient", Board.VirtualBoard)
    })
}

Board.onConnect = function () {
    console.log("CONNECTED!")
    Board.sendMessage({ "ch/02": { "FaderLevel": 0.1 } })
    Board.sendMessage({ "ch/03": { "FaderLevel": 0.2 } })
    Board.sendMessage({ "ch/04": { "FaderLevel": 0.3 } })


    if (ServerSocket == null) {
        setupSocket()
    }
}

Board.onUpdatedMessage = function (MessageData) {
    console.log(`Board sent update!`, MessageData)

    console.log("SENDING MESSAGE TO CLIENT", MessageData)

    ServerSocket.emit("sendDataToClient", MessageData)
}

Board.connect(BoardIp, BoardPort, MacIp, MacPort)