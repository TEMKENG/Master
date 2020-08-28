console.log("CANVAS Class")
import {ws} from "./init.js";
import {setup} from "./script.js";
import {ToolArea} from "./ToolArea.js";
import {createShape, getCookie, wSend} from "./Utils.js";
import {Shape, ShapeManagerEventBased} from "./types.js";
import {Circle, Line, Rectangle, Triangle} from "./Shapes.js";
import {
    AddShapeEvent,
    ChooseShapeAtEvent,
    RemoveShapeWithIdEvent,
    ShapeEvent,
    ChangeColorEvent,
    ChangeShapeStatusEvent, ZOderEvent
} from "./Events.js";

export class Canvas implements ShapeManagerEventBased {
    private canvasId: string;
    private readonly ctx: CanvasRenderingContext2D;
    private events = [];
    private width: number;
    private height: number;
    private selectShapes: number[] = [];
    private altIsPressed: boolean = false;
    private strgIsPressed: boolean = false;
    private iterator: number = 1;
    private selectColor = 'yellow';
    private state: number[] = [];
    private delectClicked = false;
    private shapes: { [p: number]: Shape } = {};

    private deselect: boolean = false;
    private moveChecker: boolean = false;
    private lastShapes: { [p: number]: Shape } = {};
    private oldSelected: { [p: number]: Shape } = {};

    // Ziehen verwandter Variablen
    private auswahl: boolean = false;
    private eventTextField: HTMLInputElement;
    private textAreaEvent: HTMLTextAreaElement;

    constructor(canvasDomElement: HTMLCanvasElement,
                toolarea: ToolArea) {
        const {width, height} = canvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;
        this.eventTextField = document.getElementById("event") as HTMLInputElement;
        let self = this;
        let event = {};
        event["clientId"] = getCookie();
        this.canvasId = window.location.pathname.split("/")[2];
        event["canvasId"] = this.canvasId;
        console.log(event)

        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove", createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown", createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup", createMouseHandler("handleMouseUp"));

        let clearBtn = document.getElementById("clearButton") as HTMLButtonElement;
        let loadButton = document.getElementById("loadButton") as HTMLButtonElement;
        document.getElementById("helloI").innerHTML = "Client:  " + getCookie() + " <br>  Canvas: " + this.canvasId;

        this.textAreaEvent = document.getElementById("events") as HTMLTextAreaElement;
        loadButton.addEventListener("click", () => {
            self.load();
            console.log("Events loaded ");
        });
        clearBtn.addEventListener("click", function () {
            self.clear();
        });

        document.addEventListener("keydown", function (e: KeyboardEvent) {
            self.strgIsPressed = e.ctrlKey;
            self.altIsPressed = e.altKey;
            if (e.keyCode === 46) {
                self.removeSelectedShapes();
            }
        });
        document.addEventListener("keyup", function (e: KeyboardEvent) {
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
                // self.color(self.selectShapes, entry.entry.value, true);
                let event = new ChangeColorEvent(self.selectShapes, entry.entry.value, true);
                event["clientId"] = getCookie();
                event["canvasId"] = self.canvasId;
                wSend(ws, "saveEvent", JSON.stringify(event));
            };
            entry.listener();
        });

        setup.menuEntries['Randfarbe'].forEach(entry => {
            entry.function = function () {
                let event = new ChangeColorEvent(self.selectShapes, entry.entry.value, false);
                event["clientId"] = getCookie();
                event["canvasId"] = self.canvasId;
                wSend(ws, "saveEvent", JSON.stringify(event));
            };
            entry.listener();
        });

        let [z_minus, z_plus] = setup.menuEntries['Z'];
        let deleteEntry = setup.menuEntries['Delete'];

        z_plus.function = function () {
            let zOderEvent = new ZOderEvent(self.selectShapes, true);
            zOderEvent["clientId"] = getCookie();
            zOderEvent["canvasId"] = self.canvasId;
            wSend(ws, "saveEvent", JSON.stringify(zOderEvent));
            // console.log('Z_ORDER_PLUS');
        };
        z_minus.function = function () {
            let zOderEvent = new ZOderEvent(self.selectShapes, false);
            zOderEvent["clientId"] = getCookie();
            zOderEvent["canvasId"] = self.canvasId;
            wSend(ws, "saveEvent", JSON.stringify(zOderEvent));
            // console.log('Z_ORDER_MINUS: ');
        };
        deleteEntry.function = function () {
            self.delectClicked = true;
            self.removeSelectedShapes(true);
            console.log("delete entry")
        };

        z_plus.listener();
        z_minus.listener();
        deleteEntry.listener();


        // console.log("Setup", setup);

        function createMouseHandler(methodName: string) {
            return function (e) {
                e = e || window.event;

                if ('object' === typeof e) {
                    const btnCode = e.button,
                        x = e.pageX - this.offsetLeft,
                        y = e.pageY - this.offsetTop,
                        ss = toolarea.getSelectedShape();
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
            }
        }
    }

    color(selectedShapes: number[], color: string, background: boolean) {
        for (let i = 0; i < selectedShapes.length; i++) {
            let id = selectedShapes [i];
            if (background) {
                this.shapes[id].bgColor = color;
            } else {
                this.shapes[id].bdColor = color;
            }
            this.shapes[id].draw(this.ctx);
        }
    }

    changeShapeStatus(shapes: number[], x: number, y: number, select: boolean) {
        this.makeSelectableShape(x, y);
        // console.log("Shapes debut: ", shapes, this.shapes);
        for (let id of shapes) {
            // if (this.shapes[id].selected === true) {
            //     // if (select !== true) {
            //     this.shapes[id].selected = false;
            //     // this.shapes[id].draw(this.ctx, true, this.selectColor);
            //     this.shapes[id].draw(this.ctx);
            //     this.selectShapes = this.selectShapes.filter(item => item != id);
            //     this.eventTextField.value = "Deselect Shape with ID: " + id;
            // } else {
            //     this.shapes[id].selected = true;
            //     if (this.selectShapes.indexOf(id) < 0) {
            //         this.selectShapes.push(id);
            //     }
            //     this.shapes[id].draw(this.ctx, true, "red");
            //     this.eventTextField.value = "Select Shape with ID: " + id;
            // }

            // console.log(shapes);
            this.shapes[id].selected = true;
            if (this.selectShapes.indexOf(id) < 0) {
                this.selectShapes.push(id);
            }
            this.shapes[id].draw(this.ctx, true, "red");
            this.eventTextField.value = "Select Shape with ID: " + id;
        }
        // console.log("Shapes fin: ", shapes, this.shapes);

    }

    zOder(shapes: number[], plus: boolean) {
        for (let i = 0; i < shapes.length; i++) {
            let id = shapes[i];
            let index = this.state.indexOf(id);
            if (plus === true) {
                if (index !== this.state.length - 1) {
                    let next = this.state[index];
                    this.state[index] = this.state[index + 1];
                    this.state[index + 1] = next;
                }
            } else {
                if (index !== 0) {
                    let next = this.state[index];
                    this.state[index] = this.state[index - 1];
                    this.state[index - 1] = next;
                }
            }
        }

        // let copy = this.deepCopy(this.shapes);
        let copy = this.shapes;
        this.shapes = {};
        for (let id of this.state) {
            this.shapes[id] = copy[id];
        }
        // console.log('Z_Minus: ', this.state, this.shapes, copy);
    }

    draw(): this {
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


    private addShape(shape: Shape, redraw: boolean = true): this {
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

    private removeShapeWithId(id: number, redraw: boolean = true): this {
        delete this.shapes[id];

        this.state = this.state.filter(item => item != id);
        this.selectShapes = this.selectShapes.filter(item => item != id);

        if (this.auswahl && this.delectClicked) {
            this.delectClicked = false;
        }

        return redraw ? this.draw() : this;
    }

    removeSelectedShapes(fromButton?: boolean) {
        let tmpBool = this.delectClicked;
        let shapeLength = this.selectShapes.length - 1;
        for (let index = 0; index <= shapeLength; index++) {
            let id: number = this.selectShapes[index];
            this.delectClicked = tmpBool;
            let removeEvent = new RemoveShapeWithIdEvent(id, index === shapeLength, fromButton);
            removeEvent["clientId"] = getCookie();
            removeEvent["canvasId"] = this.canvasId;
            wSend(ws, "saveEvent", JSON.stringify(removeEvent));
            delete this.shapes[id];
            this.state = this.state.filter(item => item != id);
            this.selectShapes = this.selectShapes.filter(item => item != id);

            // this.apply(removeEvent);
            // this.removeShapeWithId(this.selectShapes[index]);
        }
        this.selectShapes = [];
    }

    private selectShape(toSelectShapes: { [p: number]: Shape }, x, y): { [p: number]: Shape } {
        let i = 0;
        this.selectShapes = [];
        let dragShape: { [p: number]: Shape } = {};
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

    private makeSelectableShape(x: number, y: number): number[] {
        let shapeUnderMouse: number[] = [];
        for (let id of this.state) {
            this.shapes[id].selected = false;
            if (this.shapes[id].isInside(x, y)) {
                shapeUnderMouse.push(id);
                this.shapes[id].draw(this.ctx, true, this.selectColor);
            } else {
                this.shapes[id].draw(this.ctx);
            }
        }
        return shapeUnderMouse;
    }

    // chooseShapeAt(x: number, y: number, selected: boolean = false, mode?:string): this {
    private chooseShapeAt(x: number, y: number, selected: boolean = false, toSelect?: { [p: number]: Shape }) {

        let shapeUnderMouse: number[];
        let oldMover: boolean = this.moveChecker;
        let dragShape: { [p: number]: Shape } = {};

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.moveChecker = !!toSelect;

        // make shapes selectable
        shapeUnderMouse = this.makeSelectableShape(x, y);
        if (toSelect) {
            this.lastShapes = toSelect;
            dragShape = this.selectShape(toSelect, x, y);
        } else {

            if (selected && shapeUnderMouse.length > 0) {
                let oldSelectShape: number[] = this.selectShapes;
                if (this.strgIsPressed) {
                    let tmpLength = this.selectShapes.length;
                    for (let i = shapeUnderMouse.length; i > 0; i--) {
                        let id = shapeUnderMouse[i - 1];
                        if (this.selectShapes.indexOf(id) < 0) {
                            this.selectShapes.push(id);
                            dragShape[id] = this.shapes[id];
                            this.eventTextField.value = "Select Shape with ID: " + id;
                            // let changeStatusEvent = new ChangeShapeStatusEvent([id], x, y, true);
                            // changeStatusEvent["clientId"] = getCookie();
                            // changeStatusEvent["canvasId"] = this.canvasId;
                            // wSend(ws, "saveEvent", JSON.stringify(changeStatusEvent));
                            break;
                        }
                    }
                    if (this.selectShapes.length == tmpLength) {
                        for (let i = shapeUnderMouse.length - 1; i > -1; i--) {
                            let id = shapeUnderMouse[i];
                            this.selectShapes = this.selectShapes.filter(item => item !== id);
                            this.eventTextField.value = "Deselect Shape with ID: " + id;

                            // let changeStatusEvent = new ChangeShapeStatusEvent([id], x, y, false);
                            // changeStatusEvent["clientId"] = getCookie();
                            // changeStatusEvent["canvasId"] = this.canvasId;
                            // wSend(ws, "saveEvent", JSON.stringify(changeStatusEvent));
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


                    let selectOrDeselect: string;
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

                    let changeStatusEvent = new ChangeShapeStatusEvent(this.selectShapes, x, y, selectOrDeselect === "SelectShape");
                    changeStatusEvent["clientId"] = getCookie();
                    changeStatusEvent["canvasId"] = this.canvasId;
                    wSend(ws, "saveEvent", JSON.stringify(changeStatusEvent));
                }
            }
            for (let i = 0; i < this.selectShapes.length; i++) {
                let id = this.selectShapes[i];
                this.shapes[id].selected = true;
                dragShape[id] = this.shapes[id];
                this.shapes[id].draw(this.ctx, true, 'red');
            }
            if (this.selectShapes.length > 0) {
                let changeStatusEvent = new ChangeShapeStatusEvent(this.selectShapes, x, y, true);
                changeStatusEvent["clientId"] = getCookie();
                changeStatusEvent["canvasId"] = this.canvasId;
                wSend(ws, "saveEvent", JSON.stringify(changeStatusEvent));
            }
        }

        if (this.moveChecker === false && oldMover) {
            this.eventTextField.value = "Move finish";
            console.log("Move finish ");
            console.log(this.oldSelected, this.lastShapes);
            this.addMoveEvent(this.oldSelected, this.lastShapes);
        } else if (this.moveChecker && oldMover === false) {
            this.eventTextField.value = "Move begin";
            console.log("Move Begin");
        } else if (this.moveChecker && oldMover) {
            this.eventTextField.value = "Moving ID: " + Canvas.ids(this.oldSelected) + " to ID: " + Canvas.ids(this.lastShapes);
        } else {
            this.oldSelected = dragShape;

        }
        return dragShape;
    }


    apply(e: ShapeEvent) {
        this.addEvents(e);
        if (e.type == "addShape") {
            return this.addShape(e.data.shape, e.data.redraw);
        } else if (e.type == "removeShapeWithId") {
            return this.removeShapeWithId(e.data.shapeId, e.data.redraw);
        } else if (e.type === "chooseShape") {
            return this.chooseShapeAt(e.data.x, e.data.y, e.data.selected, e.data.toSelect);
        } else if (e.type === "unselectShape") {

        } else if (e.type === "selectShape") {

        } else if (e.type === "changeColor") {
            return this.color(e.data.selectedShapes, e.data.color, e.data.background);
        } else if (e.type === "changeShapeStatus") {
            return this.changeShapeStatus(e.data.shapes, e.data.x, e.data.y, e.data.select);
        } else if (e.type === "zOder") {
            return this.zOder(e.data.shapes, e.data.plus);
        }
        return undefined;
    }

    addEvents(event: ShapeEvent) {
        let len = this.events.length;
        let object;
        if (event.type === "removeShapeWithId") {
            if (this.auswahl && this.delectClicked) {
                this.events.push(event);
            }
        } else if (event.type === "changeColor" || event.type === "zOder") {
            this.events.push(event);
        } else if (event.type === "changeShapeStatus") {
            const tmp = this.events;
            this.events = [];
            for (let ev of tmp) {
                if (ev.type !== "changeShapeStatus") {
                    this.events.push(ev);
                }
                // console.log("L a vie ");
            }
            this.events.push(event);
        } else if (event.type === "chooseShape") {

            if (event.data.selected === true) {
                this.events.push(event);
            }
        } else if (len > 0) {
            object = event.data.shape.object();
            let lastEvent = this.events[len - 1];
            let lastObjectData = undefined;

            if (event.type !== lastEvent.type || lastEvent.data.shape.object().type !== object.type || lastEvent.type === "removeShapeWithId" || lastEvent.type === "zOder") {
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
        } else if (event.type === "changeColor" || event.type === "changeShapeStatus" || event.type === "zOder") {
            this.eventTextField.value = event.type;
        } else {
            object = event.data.shape.object();
            this.eventTextField.value = event.type + "  " + object.type + "  with ID:" + object.id;
        }
    }

    /**
     * The function writes the IDs of a dictionary into a string
     * @param a is a dictionary.
     */
    private static ids(a): string {
        let str: string = "";
        for (let id in a) {
            if (a.hasOwnProperty(id)) {
                str += id + " ";
            }
        }
        return str;
    }

    private addMoveEvent(a: { [p: number]: Shape }, b: { [p: number]: Shape }) {
        let aKeys = Object.keys(a);
        let bKeys = Object.keys(b);
        let length = aKeys.length - 1;
        let index = 0;
        for (let i = 0; i <= length; i++) {
            let bShape = b[bKeys[i]];
            bShape.selected = true;
            let removeEvent = new RemoveShapeWithIdEvent(+aKeys[i], true, true);
            let addEvent = new AddShapeEvent(bShape, length === index);
            addEvent["clientId"] = removeEvent["clientId"] = getCookie();
            addEvent["canvasId"] = removeEvent["canvasId"] = this.canvasId;
            wSend(ws, "saveEvent", JSON.stringify(removeEvent));
            wSend(ws, "saveEvent", JSON.stringify(addEvent));

            // this.addEvents(removeEvent);
            // this.addEvents(addEvent);
            index += 1;
        }
    }

    addEvent(e: ShapeEvent) {
        this.events.push(e);
        this.eventTextField.value = e.type;
        this.textAreaEvent.value = JSON.stringify(this.events);
    }


    /**
     * The function converts a dictionary <code>e</code> into a ShapeEvent and executes it.
     * @param e is an event in a dictionary
     * @param apply
     */
    createEvent(e: { [p: string]: any }, apply: boolean = true) {
        let event: ShapeEvent;
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
                console.log("This event is not yet handled")
        }

        if (apply) {
            this.apply(event);
        }
        return event

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
        this.deselect = false;
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