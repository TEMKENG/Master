export { AddShapeEvent, RemoveShapeWithIdEvent, SelectShapeEvent, UnselectShapeEvent, ChooseShapeAtEvent };
class AddShapeEvent {
    constructor(e, redraw, move) {
        this.type = "addShape";
        this.data = {};
        this.data["shape"] = e;
        this.data["move"] = move;
        this.data["redraw"] = redraw;
    }
    info() {
        let infos = {};
        infos["event"] = this.type;
        infos["shape"] = this.data.shape;
        return infos;
    }
}
class RemoveShapeWithIdEvent {
    constructor(shapeId, redraw) {
        this.type = "removeShapeWithId";
        this.data = {};
        this.data["shapeId"] = shapeId;
        this.data["redraw"] = redraw;
    }
    info() {
        let infos = {};
        infos["event"] = this.type;
        infos["shapeId"] = this.data.shapeId;
        return infos;
    }
}
class ChooseShapeAtEvent {
    constructor(x, y, selected = false, toSelect, clientId) {
        this.type = "chooseShape";
        this.data = {};
        this.data["x"] = x;
        this.data["y"] = y;
        this.data["clientId"] = clientId;
        this.data["selected"] = selected;
        this.data["toSelect"] = toSelect;
    }
    info() {
        let infos = {};
        infos["event"] = this.type;
        infos["data"] = this.data;
        return infos;
    }
}
class UnselectShapeEvent {
    constructor(e) {
        this.type = "unselectShape";
        this.data = {};
        this.data["shape"] = e;
    }
    info() {
        let infos = {};
        infos["event"] = this.type;
        infos["data"] = this.data;
        return infos;
    }
}
class SelectShapeEvent {
    constructor(e) {
        this.type = "selectShape";
        this.data = {};
        this.data["shape"] = e;
    }
    info() {
        let infos = {};
        infos["event"] = this.type;
        infos["data"] = this.data;
        return infos;
    }
}
//# sourceMappingURL=Events.js.map