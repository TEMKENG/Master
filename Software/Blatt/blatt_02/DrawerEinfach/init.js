console.log("INIT");
import { Canvas } from "./Canvas.js";
// import {clientIds} from "./server.js";
import { ToolArea } from "./ToolArea.js";
import { getCookie, wGetContent, wGetRun, wSend } from "./Utils.js";
import { AddShapeEvent, RemoveShapeWithIdEvent, ChooseShapeAtEvent } from "./Events.js";
import { CircleFactory, LineFactory, RectangleFactory, TriangleFactory, ChooseShape } from "./Shapes.js";
// let ws = new WebSocket('ws://localhost:8080');
let ws = new WebSocket('ws://localhost:8888');
let canvas;
const menu = document.getElementsByClassName("tools");
const canvasDomElm = document.getElementById("drawArea");
function init() {
    // Problem here: Factories needs a way to create new Shapes, so they
    // have to call a method of the canvas.
    // The canvas on the other side wants to call the event methods
    // on the toolbar, because the toolbar knows what tool is currently
    // selected.
    // Anyway, we do not want the two to have references on each other
    let event = undefined;
    const sm = {
        addShape(s, rd, mv) {
            // console.log("Addshape:", s);
            s.clientId = +getCookie();
            event = new AddShapeEvent(s, rd, mv);
            event["clientId"] = getCookie();
            event["canvasId"] = window.location.pathname.split("/")[2];
            if (mv) {
                wSend(ws, "saveEvent", JSON.stringify(event));
            }
            else {
                wSend(ws, "saveEvent", JSON.stringify(event));
            }
            return canvas.apply(event);
        },
        removeShape(s, rd) {
            s.clientId = +getCookie();
            event = new RemoveShapeWithIdEvent(s.id, rd);
            event["clientId"] = getCookie();
            event["canvasId"] = window.location.pathname.split("/")[2];
            wSend(ws, "saveEvent", JSON.stringify(event));
            return canvas.apply(event);
        },
        removeShapeWithId(id, rd, fr) {
            event = new RemoveShapeWithIdEvent(id, rd, fr);
            event["clientId"] = getCookie();
            event["canvasId"] = window.location.pathname.split("/")[2];
            if (fr === true) {
                // console.log("ohh les problemes hein!!!", event);
                wSend(ws, "saveEvent", JSON.stringify(event));
            }
            return canvas.apply(event);
        },
        chooseShapeAt(x, y, selected, toSelect) {
            event = new ChooseShapeAtEvent(x, y, selected, toSelect);
            event["clientId"] = getCookie();
            event["canvasId"] = window.location.pathname.split("/")[2];
            if (selected === true) {
                wSend(ws, "saveEvent", JSON.stringify(event));
                // console.log(event)
            }
            return canvas.apply(event);
        }
    };
    const shapesSelector = [
        new LineFactory(sm),
        new CircleFactory(sm),
        new RectangleFactory(sm),
        new TriangleFactory(sm),
        new ChooseShape(sm)
    ];
    const toolArea = new ToolArea(shapesSelector, menu[0]);
    canvas = new Canvas(canvasDomElm, toolArea);
    canvas.draw();
}
// event emmited when receiving message
ws.onmessage = (ev) => {
    wGetRun("drawShape", ev.data, () => {
        let shapeEvents = wGetContent(ev.data);
        if (shapeEvents.length > 0) {
            canvas.clear();
            for (let event of shapeEvents) {
                canvas.createEvent(event);
            }
        }
    });
};
// init();
ws.onopen = () => {
    // it's only when a valid clientId i set up that the
    init();
    setInterval(() => {
        const canvasId = window.location.pathname.split("/")[2];
        wSend(ws, "refreshShape", JSON.stringify({ "canvasId": canvasId }));
    }, 1500);
    // newClient();
    console.log("Le cookie :" + getCookie());
    // console.log("Les clients:" + clientIds);
};
// const newClient = () => {
//     wSend(ws, "newClient", JSON.stringify({
//             "clientId": getCookie()
//         })
//     );
// };
//# sourceMappingURL=init.js.map