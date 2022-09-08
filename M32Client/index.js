var ServerSocket = io("https://m32middleman.luasploit.repl.co/server");

var ChannelSelection = document.querySelector("#channel-selection")
var PropertyInput = document.querySelector("#property-input")
var ValueInput = document.querySelector("#value-input")
var SendButton = document.querySelector("#send-button")

SendButton.onclick = function () {
  console.log("Clicked")
  console.log(ChannelSelection.value)
  console.log(PropertyInput.value)

  var Message = {
    [ChannelSelection.value]: {
      [PropertyInput.value]: ValueInput.value
    }
  }

  console.log(Message)
  ServerSocket.emit("sendDataToServer", Message)
}

ServerSocket.on("connect", async () => {
  console.log(ServerSocket.id); // x8WIv7-mJelg7on_ALbx

  ServerSocket.emit("requestVirtualBoard")
});

ServerSocket.on("dataFromServer", function (Data) {
  console.log("Got data from server!!")
  console.log(Data)
});