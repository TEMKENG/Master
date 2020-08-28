console.log("Server Seite");
import path from "path";
import WebSocket from 'ws';
import * as http from "http";
import express from 'express';
import { createShape, wGetContent, wGetRun, wSend } from "./Utils.js";
import { AddShapeEvent, ChangeColorEvent, ChangeShapeStatusEvent, ChooseShapeAtEvent, RemoveShapeWithIdEvent, ZOderEvent } from "./Events.js";
const app = express();
//initialize a simple http server
const PORT = process.env.PORT || 8888;
let __dirname = path.resolve(path.dirname(''));
//initialize the WebSocket server instance
const server = http.createServer(app);
// const wss = new WebSocket.Server({port: 8080});
const wss = new WebSocket.Server({ server: server });
let canvasList = [];
let clientIds = [];
let clientId = "";
app.use(express.json());
app.use('/', express.static(__dirname));
app.use('/canvas/:id', express.static(__dirname));
// app.use('/static', express.static('public'));
// app.use('/canvas/:id', express.static('public'));
// app.use(express.urlencoded({extended: false}));
// app.use(express.static(__dirname));
app.get('/', function (req, res) {
    // res.render('home.html');
    res.sendFile(path.join(__dirname + '/home.html'));
    console.log(">Open a new home page!!!!");
});
app.get('/canvas/:id', function (req, res) {
    canvasList = canvasList.map(elt => {
        if (elt["canvasId"] === req.params.id) {
            if (!elt["connected_clients"].includes(clientId)) {
                elt["connected_clients"].push(clientId);
            }
        }
        return elt;
    });
    // res.render('index_index.html'); // need ejs, swig jade, etc
    // res.sendFile(path.join(__dirname + '/index_index.html'));
    res.sendFile(path.join(__dirname + '/home.html'));
});
const newClientId = () => {
    console.log("new client: ", clientIds);
    do {
        clientId = (Math.floor((Math.random() + 1) * 0xffffffffff)).toString();
    } while (clientIds.includes(clientId));
    clientIds.push(clientId);
};
wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        wGetRun("unregisterForCanvas", message, function () {
            console.log("unregisterForCanvas");
            const canvasId = wGetContent(message)["canvasId"];
            const clientId = wGetContent(message)["clientId"];
            canvasList = canvasList.map(canvas => {
                if (canvas.canvasId === canvasId) {
                    let connected_clients = canvas["connected_clients"];
                    canvas["connected_clients"] = canvas["connected_clients"].filter(client => client !== clientId);
                    console.log("Die verbundenen Kunden!!!");
                    console.log(connected_clients);
                    console.log(canvas["connected_clients"]);
                    console.log(wGetContent(message));
                }
                return canvas;
            });
            console.log("unregisterForCanvas");
            // console.log(canvasList);
        });
        wGetRun("registerForCanvas", message, function () {
            console.log("registerForCanvas");
            const canvasId = wGetContent(message)["canvasId"];
            const clientId = wGetContent(message)["clientId"];
            canvasList = canvasList.map(canvas => {
                if (canvas["canvasId"] == canvasId) {
                    let connected_clients = canvas["connected_clients"];
                    if (connected_clients.indexOf(clientId) < 0) {
                        canvas["connected_clients"].push(clientId);
                    }
                }
                return canvas;
            });
            console.log(canvasList);
            console.log(wGetContent(message));
            console.log("registerForCanvas");
        });
        wGetRun("newClient", message, () => {
            const clientIdGet = wGetContent(message)["clientId"];
            if (!!clientIdGet === false || clientIdGet === "") {
                newClientId();
                console.log("[+] Client " + clientId + " generated !");
                wSend(ws, 'savedClient', JSON.stringify({ clientId }));
            }
            else {
                if (!clientIds.includes(clientIdGet)) {
                    clientIds.push(clientIdGet);
                    clientId = clientIdGet;
                }
            }
            let canvasId = wGetContent(message)["canvasId"];
            if (!!canvasId) {
                canvasList = canvasList.map(canvas => {
                    if (canvas["canvasId"] == canvasId) {
                        let connected_clients = canvas["connected_clients"];
                        if (connected_clients.indexOf(clientId) < 0) {
                            canvas["connected_clients"].push(clientId);
                        }
                    }
                    return canvas;
                });
            }
            console.log("[+] Clients: ", clientIds);
        });
        wGetRun("newCanvas", message, () => {
            canvasList.push({
                "canvasId": wGetContent(message)["canvasId"],
                "createBy": wGetContent(message)["createBy"],
                "connected_clients": [],
                "shape_events": []
            });
            console.log("[+] canvasList: ", canvasList);
        });
        wGetRun("getCanvasList", message, () => {
            wSend(ws, 'CanvasList', JSON.stringify({ canvasList }));
        });
        wGetRun("saveEvent", message, () => {
            let canvasId = wGetContent(message)["canvasId"];
            canvasList = canvasList.map(canvas => {
                if (canvas["canvasId"] == canvasId) {
                    let eventList = canvas["shape_events"];
                    let event = wGetContent(message);
                    canvas["shape_events"] = reduceEventListSize(event, eventList);
                    // canvas["shape_events"] = [wGetContent(message)]
                }
                return canvas;
            });
        });
        wGetRun("refreshShape", message, () => {
            let canvasId = wGetContent(message)["canvasId"];
            let canvasEvents;
            for (let canvas of canvasList) {
                if (canvas["canvasId"] === canvasId) {
                    canvasEvents = canvas["shape_events"];
                }
            }
            if (!!canvasEvents) {
                wSend(ws, 'drawShape', JSON.stringify(canvasEvents));
            }
        });
    });
});
function createEvent(e) {
    let event;
    switch (e.type) {
        case "addShape":
            event = new AddShapeEvent(createShape(e.data.shape), e.data.redraw, e.move);
            break;
        case "removeShapeWithId":
            event = new RemoveShapeWithIdEvent(e.data.shapeId, e.data.redraw, e.data.fromButton);
            break;
        case "chooseShape":
            event = new ChooseShapeAtEvent(e.data.x, e.data.y, e.data.selected, e.data.toSelect);
            break;
        case "changeColor":
            event = new ChangeColorEvent(e.data.selectedShapes, e.data.color, e.data.background);
            break;
        case "changeShapeStatus":
            event = new ChangeShapeStatusEvent(e.data.shapes, e.data.x, e.data.y, e.data.select);
            break;
        case "zOder":
            event = new ZOderEvent(e.data.shapes, e.data.plus);
            break;
        default:
            console.log("This event is not yet handled");
    }
    event["clientId"] = e.clientId;
    event["canvasId"] = e.canvasId;
    return event;
}
function reduceEventListSize(eventE, events) {
    let len = events.length;
    let lastEvent;
    let event = createEvent(eventE);
    let shapeEvents = [];
    for (let ev of events) {
        if (ev.type === eventE.type && ev.type === "changeShapeStatus") {
            // console.log(JSON.stringify(event), "okay");
        }
        else {
            shapeEvents.push(createEvent(ev));
        }
        // shapeEvents.push(createEvent(ev));
    }
    let object;
    if (event.type === "removeShapeWithId") {
        if (event.data.fromButton === true) {
            shapeEvents.push(event);
        }
    }
    else if (event.type === "chooseShape") {
        if (event.data.selected === true) {
            shapeEvents.push(event);
        }
    }
    else if (event.type === "changeColor" || event.type === "changeShapeStatus" || event.type === "zOder") {
        shapeEvents.push(event);
    }
    else if (len > 0) {
        object = event.data.shape.object();
        let lastEvent = shapeEvents[len - 1];
        let lastObjectData = undefined;
        const checker = event.type !== lastEvent.type || lastEvent.data.shape.object().type !== object.type || lastEvent.type === "removeShapeWithId" || lastEvent.type === "zOder";
        if (checker) {
            shapeEvents.push(event);
        }
        else {
            lastObjectData = lastEvent.data.shape.object().data;
            if (object.type === "Line" || object.type === "Rectangle") {
                if (lastObjectData.from.equal(object.data.from)) {
                    shapeEvents[len - 1] = event;
                }
                else {
                    shapeEvents.push(event);
                }
            }
            else if (object.type === "Triangle") {
                if (lastObjectData.p1.equal(object.data.p1)) {
                    shapeEvents[len - 1] = event;
                }
                else {
                    shapeEvents.push(event);
                }
            }
            else if (object.type === "Circle") {
                if (lastObjectData.center.equal(object.data.center)) {
                    shapeEvents[len - 1] = event;
                }
                else {
                    shapeEvents.push(event);
                }
            }
        }
    }
    else {
        shapeEvents.push(event);
    }
    return JSON.parse(JSON.stringify(shapeEvents));
}
//start the Express server
server.listen(PORT, () => {
    // console.log("okay ", wss);
    // console.log("okay ", server);
    console.log(`Server started on port http://localhost:${PORT}/home.html `);
    console.log(`Server started on port http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map