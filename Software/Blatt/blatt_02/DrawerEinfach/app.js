import express from 'express'
const app = express();

class MessageServive {
    constructor() {
        this.messages = []
    }

    async find() {
        return this.messages
    }

    async create(data) {
        const message = {
            id: this.messages.length,
            text: data.text,
        };
        this.messages.push(message);
        return message;
    }
}

app.use("message", new MessageServive());
app.service("messages").on('create', (message) => {
    console.log('A new messsage has been created', message);
});

const main = async () => {
    await app.service('messages').create({
        text: 'Hello from featers'
    });
    await app.service('messages').create({
        text: "Temkeng is my name"
    });
    const messages = await app.service('messages').find();
    console.log("all messages: ", message)
};
main();