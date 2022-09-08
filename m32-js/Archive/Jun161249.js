const osc = require("./osc")

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getChannelStringFromNumber(Channel) {
    if (Channel <= 9) {
        return "0" + Channel.toString()
    } else {
        return Channel.toString()
    }
}

var MessageControlTypes = {
    FaderLevel: {
        RequiredAddressComponents: ["mix", "fader"],
        Arguments: [
            {
                Name: "FaderLevel",
            }
        ],
        encodeMessageData: function (MessageData) {
            var Channel = MessageData.Channel
            var FaderLevel = MessageData.FaderLevel

            //var ChannelString = getChannelStringFromNumber(Channel)
            var FaderLevelString = FaderLevel.toString()

            return {
                address: `/${Channel}/mix/fader`,
                args: [
                    {
                        type: "f",
                        value: FaderLevelString
                    }
                ]
            }
        }
    },
    Muted: {
        RequiredAddressComponents: ["ch", "channel", "mix", "on"],
        Arguments: [
            {
                Name: "Muted",
                normalize: function (Value) {
                    if (Value == 1) {
                        return false
                    } else {
                        return true
                    }
                }
            }
        ],
        encodeMessageData: function (MessageData) {
            var Channel = MessageData.Channel
            var Muted = MessageData.Muted

            var ChannelString = getChannelStringFromNumber(Channel)
            var UnmutedInteger

            if (Muted == true) {
                UnmutedInteger = 0
            } else {
                UnmutedInteger = 1
            }

            return {
                address: `/ch/${ChannelString}/mix/on`,
                args: [
                    {
                        type: "i",
                        value: UnmutedInteger
                    }
                ]
            }
        }
    }
}

class Board {
    //Initially called when class is created
    constructor() {
        this.Connected = false
    }

    //Connects to the board and establishes a local port for communication. Handles the reception of messages from the board.
    connect(BoardIp, BoardPort, MacIp, MacPort) {
        this.BoardIp = BoardIp
        this.BoardPort = BoardPort
        this.MacIp = MacIp
        this.MacPort = MacPort

        console.log(`Setting up board with ${BoardIp} and ${BoardPort}`)

        //Sets up local port
        this.UdpPort = new osc.UDPPort({
            localAddress: MacIp,
            localPort: MacPort,
            metadata: true
        });

        this.UdpPort.open();

        //Sends the info cmd to the board when local port opens
        this.UdpPort.on("ready", function () {
            this.sendInfoCommand()
        }.bind(this))

        //Handles incoming messages from the board.
        this.UdpPort.on("message", async function (oscMsg, timeTag, info) {
            console.log("An OSC message just arrived!", oscMsg);
            console.log("Remote info is: ", info);

            if (oscMsg.address == "/info") {
                console.log("Board info retrieved.")

                this.sendStatusCommand()
            } if (oscMsg.address == "/status") {
                console.log("Board status retrieved. Ready to begin!")

                this.Connected = true

                this.startSubscriptionRenewal()


                this.VirtualBoard = {}

                //Call user specified onConnect function if provided
                if (this.onConnect) {
                    this.onConnect()
                }
            } else {
                //Calls the users function when info is given about controls like faders, mute, etc.

                this._onUpdatedMessage(oscMsg)
            }
        }.bind(this));
    }

    sendInfoCommand() {
        this.UdpPort.send({
            address: "/info"
        }, this.BoardIp, this.BoardPort);
    }

    sendStatusCommand() {
        this.UdpPort.send({
            address: "/status",
            args: []
        }, this.BoardIp, this.BoardPort);
    }

    startSubscriptionRenewal() {
        this.UdpPort.send({
            address: "/xremote"
        }, this.BoardIp, this.BoardPort);

        var UdpPort = this.UdpPort
        var BoardIp = this.BoardIp
        var BoardPort = this.BoardPort

        setInterval(function () {
            console.log("Renewing subscription.")
            UdpPort.send({
                address: "/xremote"
            }, BoardIp, BoardPort)
        }, 10000);
    }

    _onUpdatedMessage(Message) {
        function getSplitMessageAddress(Message) {
            var SplitAddress = Message.address.split("/")
            SplitAddress.shift()
            SplitAddress.shift()
            SplitAddress.shift()

            return SplitAddress
        }

        function getMessageControlType(Message) {
            if (Message.address.includes("info") || Message.address.includes("status")) {
                return
            }

            for (var ControlType in MessageControlTypes) {
                var ControlTypeData = MessageControlTypes[ControlType]
                var RequiredAddressComponents = ControlTypeData.RequiredAddressComponents

                //Table has an extra space at the beginning because of 1st /. This just gets rid of it.
                var SplitAddress = getSplitMessageAddress(Message)

                console.log(`split message address`, SplitAddress)

                var ThisIsNotTheControlType = false

                //Loop through each address component from message (ex. ch, 01, mix, fader) and compare it to sample component to learn the control type of the messsage
                for (var AddressComponent of SplitAddress) {
                    var AddressComponentIndex = SplitAddress.indexOf(AddressComponent)

                    if (RequiredAddressComponents[AddressComponentIndex] == AddressComponent || RequiredAddressComponents[AddressComponentIndex] == "channel" || RequiredAddressComponents[AddressComponentIndex] == undefined) {
                    } else {
                        ThisIsNotTheControlType = true
                    }
                }

                //Return the control type if we know what it is, otherwise keep looping through possible control types
                if (ThisIsNotTheControlType == true) {

                } else {
                    return ControlType
                }
            }
        }

        function getMessageData(Message) {
            var MessageData = {}

            var MessageControlType = getMessageControlType(Message)

            if (MessageControlType == null) { console.log("null control type!"); return }

            var SplitAddress = Message.address.split("/")
            SplitAddress.shift()

            var MessageControlTypeData = MessageControlTypes[MessageControlType]
            var MessageControlTypeArguments = MessageControlTypeData.Arguments

            var Channel = `${SplitAddress[0]}/${SplitAddress[1]}`

            MessageData.ControlType = MessageControlType
            MessageData.Channel = Channel
            MessageData.SplitAddress = SplitAddress

            for (var MessageControlTypeArgumentData of MessageControlTypeArguments) {
                var MessageControlTypeArgumentName = MessageControlTypeArgumentData.Name
                var MessageArgumentData = Message.args[MessageControlTypeArguments.indexOf(MessageControlTypeArgumentData)]


                var MessageControlTypeArgumentType = MessageControlTypeArgumentData.Type
                var MessageArgumentValue

                if (MessageControlTypeArgumentData.normalize) {
                    MessageArgumentValue = MessageControlTypeArgumentData.normalize(MessageArgumentData.value)
                } else {
                    MessageArgumentValue = MessageArgumentData.value
                }

                MessageData[MessageControlTypeArgumentName] = MessageArgumentValue
            }

            return MessageData
        }

        var MessageData = getMessageData(Message)

        console.log(MessageData)

        if (this.onUpdatedMessage && MessageData !== null && MessageData !== undefined) {
            var Channel = MessageData.Channel
            var ControlProperty
            var ControlPropertyValue

            for (var Property in MessageData) {
                if (Property !== "ControlType" && Property !== "Channel" && Property !== "SplitAddress") {
                    ControlProperty = Property
                    ControlPropertyValue = MessageData[ControlProperty]
                }
            }

            if (!(Channel in Object.keys(this.VirtualBoard))) {
                this.VirtualBoard[Channel] = {}
            }

            this.VirtualBoard[Channel][ControlProperty] = ControlPropertyValue

            this.onUpdatedMessage(MessageData)
        }
    }

    encodeMessageData(MessageData) {
        var ControlType = MessageData.ControlType

        var EncodedMessage = MessageControlTypes[ControlType].encodeMessageData(MessageData)

        return EncodedMessage
    }

    sendMessage(MessageData) {
        var EncodedMessage = this.encodeMessageData(MessageData)

        this.UdpPort.send(EncodedMessage, this.BoardIp, this.BoardPort);
    }

    set BoardIp(NewBoardIp) {
        this.setPropertyAndUpdate("BoardIp", NewBoardIp);
    }

    get BoardIp() {
        return this._BoardIp
    }

    set BoardPort(NewBoardIp) {
        this.setPropertyAndUpdate("BoardPort", NewBoardIp);
    }

    get BoardPort() {
        return this._BoardPort
    }

    set Connected(NewBoardIp) {
        this.setPropertyAndUpdate("Connected", NewBoardIp);
    }

    get Connected() {
        return this._Connected
    }

    setPropertyAndUpdate(PropName, PropValue) {
        this["_" + PropName] = PropValue;
    }
}

module.exports = {
    Board: Board
}