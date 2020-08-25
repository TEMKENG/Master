console.log("CANVAS Class");
import {setup} from "./script.js";
import {createShape, getCookie} from "./Utils.js";
import {AddShapeEvent, ChooseShapeAtEvent, RemoveShapeWithIdEvent} from "./Events.js";
// let ws = new WebSocket('ws://localhost:8080');
let ws = new WebSocket('ws://localhost:8888');

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
        const {width, height} = canvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;
        this.eventTextField = document.getElementById("event");
        // console.log("Textfield: ", this.eventTextField, typeof this.eventTextField);
        let self = this;
        let event = {};
        event["clientId"] = getCookie();
        const canvasId = window.location.pathname.replace("/canvas/", "").replace("/", "");
        event["canvasId"] = canvasId;
        console.log(event);
        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove", createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown", createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup", createMouseHandler("handleMouseUp"));
        let clearBtn = document.getElementById("clearButton");
        let loadButton = document.getElementById("loadButton");
        document.getElementById("helloI").innerHTML = "Client:  " + getCookie() + " <br>  Canvas: " + canvasId;
        this.textAreaEvent = document.getElementById("events");
        loadButton.addEventListener("click", () => {
            self.load();
            console.log("Events loaded ");
        });
        clearBtn.addEventListener("click", function () {
            self.clear();
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
            self.removeSelectedShapes(true);
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
                        } else {
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
        for (let id of Object.keys(this.shapes)) {
            if (this.shapes[id].selected) {
                this.shapes[id].draw(this.ctx, true, 'red');
            } else {
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
    removeShapeWithId(id, redraw = true) {
        delete this.shapes[id];
        this.state = this.state.filter(item => item != id);
        if (this.auswahl && this.delectClicked) {
            this.delectClicked = false;
        }
        return redraw ? this.draw() : this;
    }

    removeSelectedShapes(fromButton) {
        let tmpBool = this.delectClicked;
        let shapeLength = this.selectShapes.length - 1;
        for (let index = 0; index <= shapeLength; index++) {
            this.delectClicked = tmpBool;
            let removeEvent = new RemoveShapeWithIdEvent(this.selectShapes[index], index === shapeLength, fromButton);
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
        for (let id of this.state) {
            this.shapes[id].selected = false;
            if (this.shapes[id].isInside(x, y)) {
                shapeUnderMouse.push(id);
                this.shapes[id].draw(this.ctx, true, this.selectColor);
            } else {
                this.shapes[id].draw(this.ctx);
            }
        }
        if (toSelect) {
            this.lastShapes = toSelect;
            dragShape = this.selectShape(toSelect, x, y);
        } else {
            if (selected && shapeUnderMouse.length > 0) {
                let oldSelectShape = this.selectShapes;
                if (this.strgIsPressed) {
                    let tmpLength = this.selectShapes.length;
                    for (let i = shapeUnderMouse.length; i > 0; i--) {
                        let id = shapeUnderMouse[i - 1];
                        if (this.selectShapes.indexOf(id) < 0) {
                            this.selectShapes.push(id);
                            dragShape[id] = this.shapes[id];
                            this.eventTextField.value = "Select Shape with ID: " + id;
                            break;
                        }
                    }
                    if (this.selectShapes.length == tmpLength) {
                        for (let i = shapeUnderMouse.length - 1; i > -1; i--) {
                            let id = shapeUnderMouse[i];
                            this.selectShapes = this.selectShapes.filter(item => item !== id);
                            this.eventTextField.value = "Deselect Shape with ID: " + id;
                        }
                    }
                } else {
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
                    } else {
                        this.deselect = !this.deselect;
                        selectOrDeselect = this.deselect === false ? 'UnselectShape' : 'SelectShape';
                    }
                    let tmpSelectShapes = this.selectShapes;
                    if (selectOrDeselect === "UnselectShape") {
                        this.selectShapes = [];
                    }
                    this.eventTextField.value = selectOrDeselect + "  id:" + tmpSelectShapes.toString();
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
            // this.addMoveEvent(this.oldSelected, this.lastShapes);
            this.eventTextField.value = "Move finish";
        } else if (this.moveChecker && oldMover === false) {
            this.eventTextField.value = "Move begin";
        } else if (this.moveChecker && oldMover) {
            this.eventTextField.value = "Moving ID: " + Canvas.ids(this.oldSelected) + " to ID: " + Canvas.ids(this.lastShapes);
        } else {
            this.oldSelected = dragShape;
        }
        return dragShape;
    }

    selectShape(toSelectShapes, x, y) {
        let i = 0;
        this.selectShapes = [];
        let dragShape = {};
        for (let id of Object.keys(this.shapes)) {
            if (this.shapes[id] === toSelectShapes[id]) {
                this.selectShapes[i] = Number(id);
                dragShape[id] = this.shapes[id];
                this.shapes[id].draw(this.ctx, true, 'red');
                i++;
            } else if (this.shapes[id].isInside(x, y)) {
                this.shapes[id].draw(this.ctx, true, this.selectColor);
            } else {
                this.shapes[id].draw(this.ctx);
            }
        }
        return dragShape;
    }

    apply(e) {
        this.addEvents(e);
        if (e.type == "addShape") {
            return this.addShape(e.data.shape, e.data.redraw);
        } else if (e.type == "removeShapeWithId") {
            return this.removeShapeWithId(e.data.shapeId, e.data.redraw);
        } else if (e.type === "chooseShape") {
            return this.chooseShapeAt(e.data.x, e.data.y, e.data.selected, e.data.toSelect);
        } else if (e.type === "unselectShape") {
        } else if (e.type === "selectShape") {
        }
        return undefined;
    }

    addEvents(event) {
        let len = this.events.length;
        let object;
        // let event = {};
        // event["type"] = event_.type;
        // event["data"] = event_.data;
        if (event.type === "removeShapeWithId") {
            // console.log("RSWID: ", event);
            if (this.auswahl && this.delectClicked) {
                this.events.push(event);
            }
        } else if (event.type === "chooseShape") {
            if (event.data.selected === true) {
                this.events.push(event);
            }
        } else if (len > 0) {
            object = event.data.shape.object();
            let lastEvent = this.events[len - 1];
            let lastObjectData = undefined;
            if (event.type !== lastEvent.type || lastEvent.data.shape.object().type !== object.type || lastEvent.type === "removeShapeWithId") {
                this.events.push(event);
            } else {
                lastObjectData = lastEvent.data.shape.object().data;
                if (object.type === "Line" || object.type === "Rectangle") {
                    if (lastObjectData.from.equal(object.data.from)) {
                        this.events[len - 1] = event;
                    } else {
                        this.events.push(event);
                    }
                } else if (object.type === "Triangle") {
                    if (lastObjectData.p1.equal(object.data.p1)) {
                        this.events[len - 1] = event;
                    } else {
                        this.events.push(event);
                    }
                } else if (object.type === "Circle") {
                    if (lastObjectData.center.equal(object.data.center)) {
                        this.events[len - 1] = event;
                    } else {
                        this.events.push(event);
                    }
                }
            }
        } else {
            this.events.push(event);
        }
        this.textAreaEvent.value = JSON.stringify(this.events);
        if (event.type === "removeShapeWithId") {
            this.eventTextField.value = "Remove Shape with  ID:" + event.data.shapeId;
        } else if (event.type === "chooseShape") {
            // this.eventTextField.value = "Remove Shape with  ID:" + event.data.shapeId;
        } else {
            object = event.data.shape.object();
            this.eventTextField.value = event.type + "  " + object.type + "  with ID:" + object.id;
        }
    }

    /**
     * The function writes the IDs of a dictionary into a string
     * @param a is a dictionary.
     */
    static ids(a) {
        let str = "";
        for (let id in a) {
            if (a.hasOwnProperty(id)) {
                str += id + " ";
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
            this.addEvents(removeEvent);
            this.addEvents(addEvent);
            index += 1;
        }
    }

    addEvent(e) {
        this.events.push(e);
        this.eventTextField.value = e.type;
        this.textAreaEvent.value = JSON.stringify(this.events);
    }

    /**
     * The function converts a dictionary <code>e</code> into a ShapeEvent and executes it.
     * @param e is an event in a dictionary
     * @param apply
     */
    createEvent(e, apply = true) {
        let event;
        switch (e.type) {
            case "addShape":
                event = new AddShapeEvent(createShape(e.data.shape, e.clientId), e.data.redraw, e.move);
                break;
            case "removeShapeWithId":
                event = new RemoveShapeWithIdEvent(e.data.shapeId, e.data.redraw, e.data.fromButton);
                break;
            case "chooseShape":
                event = new ChooseShapeAtEvent(e.data.x, e.data.y, e.data.selected, e.data.toSelect);
                break;
            default:
                console.log("This event is not yet handled");
        }
        if (apply) {
            this.apply(event);
        }
        return event;
    }

    /**
     * Here all events from the TextArea are loaded.
     */
    load() {
        // console.log("Load all events")
        let events = JSON.parse(this.textAreaEvent.value);
        this.clear();
        events.forEach(e => {
            if (e.type === "removeShapeWithId") {
                this.auswahl = this.delectClicked = true;
            }
            this.createEvent(e);
        });
    }

    /**
     * Reinitialization of the canvas
     */
    clear() {
        this.state = [];
        this.shapes = {};
        this.events = [];
        this.selectShapes = [];
        this.textAreaEvent.value = "";
        this.eventTextField.value = "";
        this.draw();
    }
}

/**
 * Creates a new ShapeEvent from a dictionary.
 * @param e is an dictionary.
 * @param clientId
 */
// function createShape(e: { [p: string]: any }, clientId?): Shape {
//     function dict_to_point(e: { [p: string]: number }) {
//         return new Point2D(e.x, e.y);
//     }
//
//     let shape: Shape;
//     switch (e.label) {
//         case "Line":
//             shape = new Line(dict_to_point(e.from), dict_to_point(e.to), e.id);
//             break;
//         case "Rectangle":
//             shape = new Rectangle(dict_to_point(e.from), dict_to_point(e.to), e.id);
//             break;
//         case "Circle":
//             shape = new Circle(dict_to_point(e.center), e.radius, e.id);
//             break;
//         default:
//             shape = new Triangle(dict_to_point(e.p1), dict_to_point(e.p2), dict_to_point(e.p2), e.id);
//     }
//     shape.zOrder = e.zOrder;
//     shape.bdColor = e.bdColor;
//     shape.bgColor = e.bgColor;
//     shape.clientId = clientId;
//     shape.selected = e.selected;
//
//     return shape;
// }
//# sourceMappingURL=Canvas.js.map