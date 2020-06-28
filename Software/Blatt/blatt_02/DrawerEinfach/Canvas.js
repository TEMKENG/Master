import { setup } from "./script.js";
// export * from "./script.js";
export class Canvas {
    constructor(canvasDomElement, toolarea) {
        this.shapes = {};
        this.selectShapes = [];
        this.altIsPressed = false;
        this.strgIsPressed = false;
        this.iterator = 1;
        this.selectColor = 'yellow';
        this.state = [];
        this.events = [];
        // Ziehen verwandter Variablen
        this.auswahl = false;
        const { width, height } = canvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;
        let self = this;
        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove", createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown", createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup", createMouseHandler("handleMouseUp"));
        let clearBtn = document.getElementById("clearButton");
        clearBtn.addEventListener("click", function () {
            self.state = [];
            self.shapes = {};
            self.selectShapes = [];
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
            self.removeSelectedShapes();
            // console.log("Delete done ");
        };
        z_plus.listener();
        z_minus.listener();
        deleteEntry.listener();
        console.log("Setup", setup);
        function createMouseHandler(methodName) {
            return function (e) {
                e = e || window.event;
                if ('object' === typeof e) {
                    const btnCode = e.button, x = e.pageX - this.offsetLeft, y = e.pageY - this.offsetTop, ss = toolarea.getSelectedShape();
                    if (e.button === 0 && ss) {
                        self.auswahl = ss.label === 'Auswahl';
                        const m = ss[methodName];
                        // This in the shapeFactory should be the factory itself.
                        m.call(ss, x, y);
                    }
                }
            };
        }
        function addShapeEvent(shapeId, shapeDate) {
            const event = new CustomEvent("addShape", {
                detail: {
                    name: "addShape",
                    shapeId: shapeId,
                    shapeDate: shapeDate
                }
            });
            canvasDomElement.dispatchEvent(event);
        }
        function removeShapeWithIdEvent(shapeId) {
            const event = new CustomEvent("removeShapeWithId", {
                detail: {
                    name: "RemoveShapeWithId",
                    shapeId: shapeId
                }
            });
            canvasDomElement.dispatchEvent(event);
        }
        function selectShapeEvent(shapeId, clientId) {
            const event = new CustomEvent("selectShape", {
                detail: {
                    name: "SelectShape",
                    shapeId: shapeId,
                    clientId: clientId
                }
            });
            canvasDomElement.dispatchEvent(event);
        }
        function unselectShape(shapeId, clientId) {
            const event = new CustomEvent("unselectShape", {
                detail: {
                    name: "UnselectShape",
                    shapeId: shapeId,
                    clientId: clientId
                }
            });
            canvasDomElement.dispatchEvent(event);
        }
        canvasDomElement.addEventListener("removeShapeWithId", function (e) {
            self.removeShapeWithId(e.detail.shapeId);
        });
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
            this.shapes[id].draw(this.ctx);
        }
        return this;
    }
    addShape(shape, redraw = true) {
        this.shapes[shape.id] = shape;
        this.state.push(shape.id);
        // let event = {};
        // event["event"] = "addShape";
        // event["shape"] = shape.object();
        // this.events.push(event);
        return redraw ? this.draw() : this;
    }
    removeShape(shape, redraw = true) {
        const id = shape.id;
        delete this.shapes[id];
        // let event = {};
        // event["event"] = "removeShape";
        // event["shapeID"] = shape.id;
        this.state = this.state.filter(item => item != id);
        return redraw ? this.draw() : this;
    }
    removeShapeWithId(id, redraw = true) {
        delete this.shapes[id];
        this.state = this.state.filter(item => item != id);
        // let event = {};
        // event["event"] = "removeShapeID";
        // event["shapeID"] = id;
        // console.log("removeShapeWithId: ", id);
        return redraw ? this.draw() : this;
    }
    removeSelectedShapes() {
        // console.log("hallo fromm remoi", this.selectShapes);
        for (let index = 0; index < this.selectShapes.length; index++) {
            this.removeShapeWithId(this.selectShapes[index]);
        }
        this.selectShapes = [];
    }
    // chooseShapeAt(x: number, y: number, selected: boolean = false, mode?:string): this {
    chooseShapeAt(x, y, selected = false, toSelect) {
        // this.selectShapes = [];
        let shapeUnderMouse = [];
        let dragShape = {};
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (toSelect) {
            let i = 0;
            this.selectShapes = [];
            for (let id of Object.keys(this.shapes)) {
                if (this.shapes[id] === toSelect[id]) {
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
        }
        else {
            for (let id of this.state) {
                if (this.shapes[id].isInside(x, y)) {
                    shapeUnderMouse.push(id);
                    this.shapes[id].draw(this.ctx, true, this.selectColor);
                }
                else {
                    this.shapes[id].draw(this.ctx);
                }
            }
            if (selected && shapeUnderMouse.length > 0) {
                if (this.strgIsPressed) {
                    this.selectShapes = shapeUnderMouse;
                }
                else {
                    this.selectShapes = [];
                    let oldIterator = this.iterator;
                    if (this.altIsPressed) {
                        console.log("altIsPressed");
                        this.iterator = (this.iterator + 1) % (shapeUnderMouse.length + 1) === 0 ? 1 : (this.iterator + 1) % (shapeUnderMouse.length + 1);
                    }
                    this.selectShapes.push(shapeUnderMouse[shapeUnderMouse.length - this.iterator]);
                }
            }
            for (let i = 0; i < this.selectShapes.length; i++) {
                let id = this.selectShapes[i];
                dragShape[id] = this.shapes[id];
                this.shapes[id].draw(this.ctx, true, 'red');
            }
        }
        return dragShape;
    }
}
//# sourceMappingURL=Canvas.js.map