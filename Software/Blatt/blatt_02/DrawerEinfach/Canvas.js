import { setup } from "./script.js";
import { AddShapeEvent, RemoveShapeWithIdEvent, SelectShapeEvent, UnselectShapeEvent } from "./Events.js";
// export * from "./script.js";
export class Canvas {
    constructor(canvasDomElement, toolarea) {
        this.events = [];
        this.selectShapes = [];
        this.altIsPressed = false;
        this.strgIsPressed = false;
        this.iterator = 1;
        this.selectColor = 'yellow';
        this.state = [];
        this.delectClicked = false;
        this.shapes = {};
        this.deselect = false;
        this.moveChecker = false;
        this.lastShapes = {};
        this.oldSelected = {};
        // Ziehen verwandter Variablen
        this.auswahl = false;
        const { width, height } = canvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;
        this.eventTextField = document.getElementById("event");
        console.log("Textfield: ", this.eventTextField, typeof this.eventTextField);
        let self = this;
        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove", createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown", createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup", createMouseHandler("handleMouseUp"));
        let clearBtn = document.getElementById("clearButton");
        this.textAreaEvent = document.getElementById("events");
        clearBtn.addEventListener("click", function () {
            self.state = [];
            self.shapes = {};
            self.events = [];
            self.selectShapes = [];
            self.textAreaEvent.value = "";
            self.eventTextField.value = "";
            self.ctx.clearRect(0, 0, self.width, self.height);
        });
        document.addEventListener("keydown", function (e) {
            self.strgIsPressed = e.ctrlKey;
            self.altIsPressed = e.altKey;
            if (e.keyCode === 46) {
                self.removeSelectedShapes();
            }
        });
        document.addEventListener("keyup", function (e) {
            self.strgIsPressed = false;
            self.altIsPressed = false;
            self.iterator = 1;
        });
        document.addEventListener('contextmenu', ev => {
            ev.preventDefault();
            setup.menu.show(ev.clientX, ev.clientY);
        }, false);
        setup.menuEntries['Hintergrund'].forEach(entry => {
            entry.function = function () {
                self.bgColor(entry.entry.value);
            };
            entry.listener();
        });
        setup.menuEntries['Randfarbe'].forEach(entry => {
            entry.function = function () {
                self.bdColor(entry.entry.value);
            };
            entry.listener();
        });
        let [z_minus, z_plus] = setup.menuEntries['Z'];
        let deleteEntry = setup.menuEntries['Delete'];
        z_plus.function = function () {
            let len = self.selectShapes.length;
            for (let i = 0; i < self.selectShapes.length; i++) {
                let id = self.selectShapes[i];
                let index = self.state.indexOf(id);
                if (index !== self.state.length - 1) {
                    let next = self.state[index];
                    self.state[index] = self.state[index + 1];
                    self.state[index + 1] = next;
                }
            }
            let copy = self.deepCopy(self.shapes);
            self.shapes = {};
            for (let id of self.state) {
                self.shapes[id] = copy[id];
            }
            console.log('Z_PlUS: ', self.state, self.shapes, copy);
        };
        z_minus.function = function () {
            for (let i = 0; i < self.selectShapes.length; i++) {
                let id = self.selectShapes[i];
                let index = self.state.indexOf(id);
                if (index !== 0) {
                    let next = self.state[index];
                    self.state[index] = self.state[index - 1];
                    self.state[index - 1] = next;
                }
            }
            let copy = self.deepCopy(self.shapes);
            self.shapes = {};
            for (let id of self.state) {
                self.shapes[id] = copy[id];
            }
            console.log('Z_Minus: ', self.state, self.shapes, copy);
        };
        deleteEntry.function = function () {
            self.delectClicked = true;
            self.removeSelectedShapes();
            console.log("delete entry");
        };
        z_plus.listener();
        z_minus.listener();
        deleteEntry.listener();
        // console.log("Setup", setup);
        function createMouseHandler(methodName) {
            return function (e) {
                e = e || window.event;
                if ('object' === typeof e) {
                    const btnCode = e.button, x = e.pageX - this.offsetLeft, y = e.pageY - this.offsetTop, ss = toolarea.getSelectedShape();
                    if (e.button === 0 && ss) {
                        if (ss.label === 'Auswahl') {
                            self.auswahl = true;
                        }
                        else {
                            self.auswahl = false;
                            self.deselect = false;
                        }
                        const m = ss[methodName];
                        // This in the shapeFactory should be the factory itself.
                        m.call(ss, x, y);
                    }
                }
            };
        }
    }
    deepCopy(shapes) {
        let copy = {};
        for (let id of Object.keys(shapes)) {
            copy[id] = shapes[id];
        }
        return copy;
    }
    bgColor(color) {
        for (let i = 0; i < this.selectShapes.length; i++) {
            let id = this.selectShapes[i];
            this.shapes[id].bgColor = color;
            this.shapes[id].draw(this.ctx, true);
        }
    }
    bdColor(color) {
        for (let i = 0; i < this.selectShapes.length; i++) {
            let id = this.selectShapes[i];
            this.shapes[id].bdColor = color;
            this.shapes[id].draw(this.ctx, true);
        }
    }
    draw() {
        // TODO: it there a better way to reset the canvas?
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.beginPath();
        this.ctx.fillStyle = 'lightgrey';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.stroke();
        // draw shapes
        this.ctx.fillStyle = 'black';
        if (this.auswahl !== true) {
            this.selectShapes = [];
        }
        // for (let id in this.shapes) {
        for (let id of Object.keys(this.shapes)) {
            let tmpShape = this.shapes[id];
            if (tmpShape.selected) {
                this.shapes[id].draw(this.ctx, true, 'red');
            }
            else {
                this.shapes[id].draw(this.ctx);
            }
        }
        return this;
    }
    addShape(shape, redraw = true) {
        this.shapes[shape.id] = shape;
        this.state.push(shape.id);
        return redraw ? this.draw() : this;
    }
    // private removeShape(shape: Shape, redraw: boolean = true): this {
    //     const id = shape.id;
    //     delete this.shapes[id];
    //     // let event = {};
    //     // event["event"] = "removeShape";
    //     // event["shapeID"] = shape.id;
    //     this.state = this.state.filter(item => item != id);
    //     this.eventTextField.setAttribute("value", "removeShape");
    //     return redraw ? this.draw() : this;
    // }
    removeShapeWithId(id, redraw = true, e) {
        delete this.shapes[id];
        this.state = this.state.filter(item => item != id);
        if (this.auswahl && this.delectClicked) {
            this.addEvent(e);
            this.delectClicked = false;
        }
        return redraw ? this.draw() : this;
    }
    removeSelectedShapes() {
        let tmpBool = this.delectClicked;
        let shapeLength = this.selectShapes.length - 1;
        for (let index = 0; index <= shapeLength; index++) {
            this.delectClicked = tmpBool;
            let removeEvent = new RemoveShapeWithIdEvent(this.selectShapes[index], index === shapeLength);
            this.apply(removeEvent);
            // this.removeShapeWithId(this.selectShapes[index]);
        }
        this.selectShapes = [];
    }
    // chooseShapeAt(x: number, y: number, selected: boolean = false, mode?:string): this {
    chooseShapeAt(x, y, selected = false, toSelect) {
        let shapeUnderMouse = [];
        let oldMover = this.moveChecker;
        let dragShape = {};
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.moveChecker = !!toSelect;
        if (toSelect) {
            this.lastShapes = toSelect;
            dragShape = this.selectShape(toSelect, x, y);
        }
        else {
            for (let id of this.state) {
                this.shapes[id].selected = false;
                if (this.shapes[id].isInside(x, y)) {
                    shapeUnderMouse.push(id);
                    this.shapes[id].draw(this.ctx, true, this.selectColor);
                }
                else {
                    this.shapes[id].draw(this.ctx);
                }
            }
            if (selected && shapeUnderMouse.length > 0) {
                let oldSelectShape = this.selectShapes;
                if (this.strgIsPressed) {
                    let tmpLength = this.selectShapes.length;
                    for (let i = shapeUnderMouse.length; i > 0; i--) {
                        let id = shapeUnderMouse[i - 1];
                        if (this.selectShapes.indexOf(id) < 0) {
                            this.selectShapes.push(id);
                            this.shapes[id].selected = true;
                            dragShape[id] = this.shapes[id];
                            let selectEvent = new SelectShapeEvent(this.shapes[id]);
                            this.addEvent(selectEvent);
                            break;
                        }
                    }
                    if (this.selectShapes.length == tmpLength) {
                        for (let i = shapeUnderMouse.length - 1; i > -1; i--) {
                            let id = shapeUnderMouse[i];
                            this.shapes[id].selected = false;
                            this.selectShapes = this.selectShapes.filter(item => item !== id);
                            let unselectEvent = new UnselectShapeEvent(this.shapes[id]);
                            this.addEvent(unselectEvent);
                        }
                    }
                }
                else {
                    dragShape = {};
                    this.selectShapes = [];
                    if (this.altIsPressed) {
                        console.log("altIsPressed");
                        this.iterator = (this.iterator + 1) % (shapeUnderMouse.length + 1) === 0 ? 1 : (this.iterator + 1) % (shapeUnderMouse.length + 1);
                    }
                    let id = shapeUnderMouse[shapeUnderMouse.length - this.iterator];
                    this.selectShapes.push(id);
                    dragShape[id] = this.shapes[id];
                }
                if (!this.strgIsPressed && !this.altIsPressed) {
                    let selectOrDeselect;
                    if (oldSelectShape.toString() !== '' && oldSelectShape.toString() !== this.selectShapes.toString()) {
                        this.deselect = true;
                        selectOrDeselect = "SelectShape";
                    }
                    else {
                        this.deselect = !this.deselect;
                        if (this.deselect === false) {
                            selectOrDeselect = "UnselectShape";
                        }
                        else {
                            selectOrDeselect = "SelectShape";
                        }
                    }
                    let event = {};
                    event["type"] = selectOrDeselect;
                    event["data"] = dragShape;
                    // this.events.push(event);
                    if (selectOrDeselect === "UnselectShape") {
                        this.eventTextField.setAttribute("value", event["type"] + "  id:" + this.selectShapes.toString());
                        this.selectShapes = [];
                    }
                    else {
                        this.eventTextField.value = (event["type"] + "  id:" + this.selectShapes.toString());
                    }
                }
            }
            for (let i = 0; i < this.selectShapes.length; i++) {
                let id = this.selectShapes[i];
                this.shapes[id].selected = true;
                dragShape[id] = this.shapes[id];
                this.shapes[id].draw(this.ctx, true, 'red');
            }
        }
        if (this.moveChecker === false && oldMover) {
            this.addMoveEvent(this.oldSelected, this.lastShapes);
            console.log("move finish", this.selectShapes, this.shapes, this.oldSelected, dragShape);
        }
        else if (this.moveChecker && oldMover === false) {
            console.log("Move begin", this.selectShapes, this.oldSelected);
        }
        else if (this.moveChecker && oldMover) {
            console.log("Moving");
        }
        else {
            this.oldSelected = dragShape;
        }
        return dragShape;
    }
    selectShape(toSelectShapes, x, y) {
        let i = 0;
        let dragShape = {};
        this.selectShapes = [];
        for (let id of Object.keys(this.shapes)) {
            if (this.shapes[id] === toSelectShapes[id]) {
                this.selectShapes[i] = Number(id);
                dragShape[id] = this.shapes[id];
                this.shapes[id].draw(this.ctx, true, 'red');
                i++;
            }
            else if (this.shapes[id].isInside(x, y)) {
                this.shapes[id].draw(this.ctx, true, this.selectColor);
            }
            else {
                this.shapes[id].draw(this.ctx);
            }
        }
        return dragShape;
    }
    apply(e) {
        if (e.type == "addShape") {
            return this.addShape(e.data.shape, e.data.redraw);
        }
        else if (e.type == "removeShapeWithId") {
            return this.removeShapeWithId(e.data.shapeId, e.data.redraw, e);
        }
        else if (e.type === "chooseShape") {
            return this.chooseShapeAt(e.data.x, e.data.y, e.data.selected, e.data.toSelect);
        }
        else if (e.type === "unselectShape") {
        }
        else if (e.type === "selectShape") {
        }
        return undefined;
    }
    addEvent(event) {
        let len = this.events.length;
        let object;
        if (event.type === "removeShapeWithId") {
            this.events.push(event);
        }
        else if (len > 0) {
            object = event.data.shape.object();
            let lastEvent = this.events[len - 1];
            let lastObjectData = undefined;
            if (event.type !== lastEvent.type || lastEvent.data.shape.object().type !== object.type || lastEvent.type === "removeShapeWithId") {
                this.events.push(event);
            }
            else {
                lastObjectData = lastEvent.data.shape.object().data;
                if (object.type === "Line" || object.type === "Rectangle") {
                    if (lastObjectData.from.equal(object.data.from)) {
                        this.events[len - 1] = event;
                    }
                    else {
                        this.events.push(event);
                    }
                }
                else if (object.type === "Triangle") {
                    if (lastObjectData.p1.equal(object.data.p1)) {
                        this.events[len - 1] = event;
                    }
                    else {
                        this.events.push(event);
                    }
                }
                else if (object.type === "Circle") {
                    if (lastObjectData.center.equal(object.data.center)) {
                        this.events[len - 1] = event;
                    }
                    else {
                        this.events.push(event);
                    }
                }
            }
        }
        else {
            this.events.push(event);
        }
        this.textAreaEvent.value = JSON.stringify(this.events);
        if (event.type === "removeShapeWithId") {
            this.eventTextField.value = "Remove Shape with  ID:" + event.data.shapeId;
        }
        else {
            object = event.data.shape.object();
            this.eventTextField.value = event.type + "  " + object.type + "  with ID:" + object.id;
        }
    }
    /**
     * Der Funktion schreibt die IDs ein Wörterbuch in eine Zeichenkette
     * @param a ist ein Wörterbuch.
     */
    static ids(a) {
        let str = "";
        for (let id in a) {
            if (a.hasOwnProperty(id)) {
                str += id + " ";
                console.log(id, typeof id);
            }
        }
        return str;
    }
    addMoveEvent(a, b) {
        let aKeys = Object.keys(a);
        let bKeys = Object.keys(b);
        let length = aKeys.length - 1;
        let index = 0;
        for (let i = 0; i <= length; i++) {
            let bShape = b[bKeys[i]];
            bShape.selected = true;
            let removeEvent = new RemoveShapeWithIdEvent(+aKeys[i]);
            let addEvent = new AddShapeEvent(bShape, length === index);
            this.addEvent(removeEvent);
            this.addEvent(addEvent);
            index += 1;
        }
    }
}
//# sourceMappingURL=Canvas.js.map