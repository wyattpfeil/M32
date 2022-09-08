const osc = require("./osc")

var udpPort = new osc.UDPPort({
    localAddress: "192.168.1.4",
    localPort: 10023,
    metadata: true
});

// Listen for incoming OSC messages.

udpPort.on("message", async function (oscMsg, timeTag, info) {
    //console.log("arrived!")

    if (oscMsg.address == "/xremote" || oscMsg.address == "/renew" || oscMsg.address.includes("subscribe")) {
        return
    }

    console.log(oscMsg)

    if (oscMsg.address == "/info") {
        udpPort.send({
            address: "/info",
            args: [
                {
                    type: "s",
                    value: "V2.05"
                },
                {
                    type: "s",
                    value: "oscserver"
                },

                {
                    type: "s",
                    value: "M32"
                },

                {
                    type: "s",
                    value: "2.08"
                },

            ]
        }, info.address, info.port);
    } else if (oscMsg.address == "/status") {
        console.log("sending status to " + info.address + " port " + info.port)

        udpPort.send({
            address: "/status",
            args: [
                {
                    type: "s",
                    value: "active"
                },
                {
                    type: "s",
                    value: "192.168.1.4"
                },
                {
                    type: "s",
                    value: "oscserver"
                },

            ]
        }, info.address, info.port);

    } else if (oscMsg.address == "/ch/01/mix/fader") {
        udpPort.send({
            address: "/ch/02/mix/fader",
            args: [
                {
                    type: "f",
                    value: oscMsg.args[0].value
                }
            ]
        }, "192.168.1.4", 10025);
    } else if (oscMsg.address == "/ch/01/mix/on") {
        udpPort.send({
            address: "/ch/02/mix/on",
            args: [
                {
                    type: "i",
                    value: oscMsg.args[0].value
                }
            ]
        }, info.address, info.port);
    }
});

// Open the socket.
udpPort.open();


// When the port is read, send an OSC message to, say, SuperCollider
/*udpPort.on("ready", function () {
    udpPort.send({
        address: "/ch/01/mix/level",
        args: [
            {
                type: "i",
                value: 1
            }
        ]
    }, "192.168.1.4", 54403);
});*/

udpPort.on("ready", function () {
    /*udpPort.send({
        address: "/xinfo",
        args: [
            {
                type: "s",
                value: "V2.05"
            },
            {
                type: "s",
                value: "oscserver"
            },

            {
                type: "s",
                value: "X32C"
            },

            {
                type: "s",
                value: "2.08"
            },

        ]
    }, "192.168.1.4", 61198);*/
});