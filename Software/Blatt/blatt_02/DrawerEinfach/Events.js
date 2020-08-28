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
    constructor(shapeId, redraw, fromButton) {
        this.type = "removeShapeWithId";
        this.data = {};
        this.data["redraw"] = redraw;
        this.data["shapeId"] = shapeId;
        this.data["fromButton"] = fromButton;
    }
    info() {
        let infos = {};
        infos["event"] = this.type;
        infos["shapeId"] = this.data.shapeId;
        return infos;
    }
}
class ChooseShapeAtEvent {
    constructor(x, y, selected = false, toSelect) {
        this.type = "chooseShape";
        this.data = {};
        this.data["x"] = x;
        this.data["y"] = y;
        this.data["toSelect"] = toSelect;
        this.data["selected"] = selected;
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

class ChangeColorEvent {
    constructor(selectedShapes, color, background = false) {
        this.type = "changeColor";
        this.data = {};
        this.data["color"] = color;
        this.data["background"] = background;
        this.data["selectedShapes"] = selectedShapes;
    }

    info() {
        let infos = {};
        infos["event"] = this.type;
        infos["data"] = this.data;
        return infos;
    }
}

class ChangeShapeStatusEvent {
    constructor(shapes, x, y, select) {
        this.type = "changeShapeStatus";
        this.data = {};
        this.data["x"] = x;
        this.data["y"] = y;
        this.data["select"] = select;
        this.data["shapes"] = shapes;
    }

    info() {
        let infos = {};
        infos["event"] = this.type;
        infos["data"] = this.data;
        return infos;
    }
}

class ZOderEvent {
    constructor(shapes, plus) {
        this.type = "zOder";
        this.data = {};
        this.data["plus"] = plus;
        this.data["shapes"] = shapes;
    }

    info() {
        let infos = {};
        infos["event"] = this.type;
        infos["data"] = this.data;
        return infos;
    }
}

export {
    ZOderEvent,
    AddShapeEvent,
    SelectShapeEvent,
    ChangeColorEvent,
    UnselectShapeEvent,
    ChooseShapeAtEvent,
    RemoveShapeWithIdEvent,
    ChangeShapeStatusEvent
};
//# sourceMappingURL=Events.js.map