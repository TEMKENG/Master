import  WebSocket from 'ws';
const socket = new WebSocket.Server({ port: 8080 });
// send message from the form
document.forms.publish.onsubmit = function() {
    let outgoingMessage = this.message.value;

    socket.send(outgoingMessage);
    return false;
};
const socket = new WebSocket.Server({ port: 8080 });
// message received - show the message in div#messages
socket.onmessage = function(event) {
    let message = event.data;

    let messageElem = document.createElement('div');
    messageElem.textContent = message;
    document.getElementById('messages').prepend(messageElem);
}