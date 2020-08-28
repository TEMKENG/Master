console.log("HOME");
import { getCookie, setCookie, wGetContent, wGetRun, wSend } from './Utils.js';
let ws = new WebSocket('ws://localhost:8888');
// event emmited when connected
ws.onopen = () => {
    console.log('websocket is connected ...');
    // checkCookie();
    // sending a send event to websocket server
    setInterval(() => {
        wSend(ws, 'getCanvasList');
    }, 1500);
    newClient();
    document.getElementById("hello").innerHTML = "Herzliches Willkommen in Draw-APP <br>" + "Client:  " + getCookie();
};
// event emmited when receiving message
ws.onmessage = (ev) => {
    wGetRun("CanvasList", ev.data, () => {
        let canvasList = wGetContent(ev.data)["canvasList"];
        let htmlContent = "<ul>";
        for (const canvas of canvasList) {
            // htmlContent += "<li><a title='Create By " + canvas["createBy"]
            //     + "' href='/canvas/" + canvas["canvasId"] + "'  onclick='registerForCanvas()'>Canvas-"
            //     + canvas["canvasId"] + "</a></li>"
            htmlContent += htmlContent += "<li><a class='link' title='Create By " + canvas["clientId"]
                + "' href='javascript:;' onclick='launch(\"/canvas/" + canvas["canvasId"] + "\")'>Canvas-"
                + canvas["canvasId"] + "</a></li>";
        }
        htmlContent += "</ul>";
        document.getElementById("canvas_list").innerHTML = htmlContent;
    });
    wGetRun("savedClient", ev.data, () => {
        let clientId = wGetContent(ev.data)["clientId"];
        console.log("Save client: ", clientId);
        setCookie(clientId, 360);
        document.getElementById("hello").innerHTML = "Herzliches Willkommen in Draw-APP <br>" + "Client:  " + getCookie();
    });
};
document.getElementById("new_canvas").onclick = () => {
    let canvasId = Math.floor((1 + Math.random()) * 0xffffffffffff);
    let canvasObject = {
        "canvasId": canvasId.toString(),
        "createBy": getCookie(),
        "connected_clients": []
    };
    wSend(ws, "newCanvas", JSON.stringify(canvasObject));
};
window.onunload = function () {
    wSend(ws, "unregisterForCanvas", JSON.stringify({ "sms": "L argent c est bien mais les femmes c est mieux!!!" }));
};
const newClient = () => {
    wSend(ws, "newClient", JSON.stringify({
        "clientId": getCookie()
    }));
};
//# sourceMappingURL=home.js.map