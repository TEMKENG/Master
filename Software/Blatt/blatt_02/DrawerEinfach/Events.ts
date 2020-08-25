import {Shape} from "./types.js";

export {ShapeEvent, AddShapeEvent, RemoveShapeWithIdEvent, SelectShapeEvent, UnselectShapeEvent, ChooseShapeAtEvent}

interface ShapeEvent {
    type: string;
    data: { [p: string]: any };

    info(): { [p: string]: any }
}

class AddShapeEvent implements ShapeEvent {
    type: string = "addShape";
    data: { [p: string]: any } = {};

    constructor(e: Shape, redraw?: boolean, move?: boolean) {
        this.data["shape"] = e;
        this.data["move"] = move;
        this.data["redraw"] = redraw;
    }

    info(): { [p: string]: any } {
        let infos: { [p: string]: any } = {};
        infos["event"] = this.type;
        infos["shape"] = this.data.shape;
        return infos;
    }
}

class RemoveShapeWithIdEvent implements ShapeEvent {
    type: string = "removeShapeWithId";
    data: { [p: string]: any } = {};

    constructor(shapeId: number, redraw?: boolean, fromButton?: boolean) {
        this.data["redraw"] = redraw;
        this.data["shapeId"] = shapeId;
        this.data["fromButton"] = fromButton;
    }

    info(): { [p: string]: any } {
        let infos: { [p: string]: any } = {};
        infos["event"] = this.type;
        infos["shapeId"] = this.data.shapeId;
        return infos;
    }
}

class ChangeColor implements ShapeEvent {
    type: string = "ChangeColor";
    data: { [p: string]: any } = {};

    constructor() {
    }

    info(): { [p: string]: any } {
        return {};
    }

}

class ChooseShapeAtEvent implements ShapeEvent {
    type: string = "chooseShape";
    data: { [p: string]: any } = {};

    constructor(x: number, y: number, selected: boolean = false, toSelect?: { [p: number]: Shape }) {
        this.data["x"] = x;
        this.data["y"] = y;
        this.data["toSelect"] = toSelect;

        this.data["selected"] = selected;
    }

    info(): { [p: string]: any } {
        let infos: { [p: string]: any } = {};
        infos["event"] = this.type;
        infos["data"] = this.data;
        return infos;
    }

}

class UnselectShapeEvent implements ShapeEvent {
    type: string = "unselectShape";
    data: { [p: string]: any } = {};


    constructor(e: Shape) {
        this.data["shape"] = e;

    }

    info(): { [p: string]: any } {
        let infos: { [p: string]: any } = {};
        infos["event"] = this.type;
        infos["data"] = this.data;
        return infos;
    }

}

class SelectShapeEvent implements ShapeEvent {
    type: string = "selectShape";
    data: { [p: string]: any } = {};


    constructor(e: Shape) {
        this.data["shape"] = e;

    }

    info(): { [p: string]: any } {
        let infos: { [p: string]: any } = {};
        infos["event"] = this.type;
        infos["data"] = this.data;
        return infos;
    }

}

