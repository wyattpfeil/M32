const osc = require("./osc")

var BoardIp = "192.168.1.4"
var BoardPort = 10024

var MacIp = "192.168.1.4"
var MacPort = 10023


UdpPort = new osc.UDPPort({
    localAddress: MacIp,
    localPort: MacPort,
    metadata: true
});

UdpPort.open();


UdpPort.on("ready", function () {
    UdpPort.send({
        address: "/info"
    }, BoardIp, BoardPort);
})

UdpPort.on("message", async function (oscMsg, timeTag, info) {
    console.log("An OSC message just arrived!", oscMsg);
    console.log("Remote info is: ", info);

    if (oscMsg.address == "/info") {

    }
})