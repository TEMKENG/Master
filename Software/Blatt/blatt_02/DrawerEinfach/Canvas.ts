import {Shape, ShapeManager} from "./types.js";
import {ToolArea} from "./ToolArea.js";
import {setup} from "./script.js";

// export * from "./script.js";

export class Canvas implements ShapeManager {
    private readonly ctx: CanvasRenderingContext2D;
    private shapes: { [p: number]: Shape } = {};
    private width: number;
    private height: number;
    private selectShapes: number[] = [];
    private altIsPressed: boolean = false;
    private strgIsPressed: boolean = false;
    private iterator: number = 1;
    private selectColor = 'yellow';
    private state: number[] = [];
    private events = [];

    // Ziehen verwandter Variablen
    private dragok = false;
    private startX: number;
    private startY: number;
    private offsetX: number;
    private offsetY: number;
    private dragShape: { [p: number]: Shape } = {};
    private auswahl: boolean = false;

    constructor(canvasDomElement: HTMLCanvasElement,
                toolarea: ToolArea) {
        const {width, height} = canvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;
        let self = this;

        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove", createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown", createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup", createMouseHandler("handleMouseUp"));

        // canvasDomElement.addEventListener("mousemove", e => self.myMove(e));
        // canvasDomElement.addEventListener("mousedown", e => self.myDown(e));
        // canvasDomElement.addEventListener("mouseup", e => self.myUp(e));
        // canvasDomElement.addEventListener("mousemove", function () {
        //     console.log("TEMKENG je ne suis plus tres sûr!");
        // });

        const BB = canvasDomElement.getBoundingClientRect();
        this.offsetX = BB.left;
        this.offsetY = BB.top;
        document.addEventListener("keydown", function (e: KeyboardEvent) {
            self.altIsPressed = e.altKey;
            self.strgIsPressed = e.ctrlKey;
            if (e.keyCode === 46) {
                self.removeSelectedShapes();
            }
        });
        document.addEventListener("keyup", function (e: KeyboardEvent) {
            self.altIsPressed = false;
            self.strgIsPressed = false;
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
            console.log("Delete done ");
        };

        z_plus.listener();
        z_minus.listener();
        deleteEntry.listener();


        console.log("Setup", setup);

        function createMouseHandler(methodName: string) {
            return function (e) {
                e = e || window.event;

                if ('object' === typeof e) {
                    const btnCode = e.button,
                        x = e.pageX - this.offsetLeft,
                        y = e.pageY - this.offsetTop,
                        ss = toolarea.getSelectedShape();
                    if (ss)
                        self.auswahl = ss.label === 'Auswahl';
                    // if left mouse button is pressed,
                    // and if a tool is selected, do something
                    if (e.button === 0 && ss) {
                        const m = ss[methodName];
                        // This in the shapeFactory should be the factory itself.
                        m.call(ss, x, y);
                    }
                }
            }
        }

    }

    // handle mousedown events
    myDown(e: MouseEvent) {
        if (this.auswahl) {
            let tmpShape: number[] = [];
            // tell the browser we're handling this mouse event
            e.preventDefault();
            e.stopPropagation();

            // get the current mouse position
            const x = parseInt(String(e.clientX - this.offsetX));
            const y = parseInt(String(e.clientY - this.offsetY));
            // test each selected shape to see if mouse is inside
            this.dragok = false;
            for (let id of this.selectShapes) {
                console.log("down: ", id, typeof id);
                if (this.shapes[id].isInside(x, y)) {
                    // console.log('State: ', this.state, this.shapes, typeof id);
                    this.dragok = true;
                    tmpShape.push(id);
                    this.dragShape[id] = this.shapes[id];
                    this.shapes[id].isDragging = true;
                    // this.shapes[id].draw(this.ctx, true, this.selectColor);

                }

            }
            // save the current mouse position
            this.startX = x;
            this.startY = y;
            // let line = this.dragShape[0];
            // for (let i in line){
            //     if(line.hasOwnProperty(i))
            //         console.log("Line: ", i, line[i]);
            // }
            console.log("myDown: ", this.dragShape, this.auswahl);
        }
    }

// handle mouseup events
    myUp(e: MouseEvent) {
        // tell the browser we're handling this mouse event
        // e.preventDefault();
        // e.stopPropagation();

        // clear all the dragging flags
        this.dragok = false;
        for (let index in this.dragShape) {
            this.dragShape[index].isDragging = false;
            // this.shapes[id].isDragging = true;
        }
        this.dragShape = [];
        console.log("myUp");

    }

// handle mouse moves
    myMove(e: MouseEvent) {
        // if we're dragging anything...
        if (this.dragok && this.auswahl && Object.keys(this.dragShape).length > 0) {

            // tell the browser we're handling this mouse event
            e.preventDefault();
            e.stopPropagation();

            // get the current mouse position
            const mx = parseInt(String(e.clientX - this.offsetX));
            const my = parseInt(String(e.clientY - this.offsetY));

            // calculate the distance the mouse has moved
            // since the last mousemove
            const dx = mx - this.startX;
            const dy = my - this.startY;

            // move each rect that isDragging
            // by the distance the mouse has moved
            // since the last mousemove
            for (let i = 0; i < Object.keys(this.dragShape).length; i++) {
                // const r = rects[i];
                // if (r.isDragging) {
                //     r.x += dx;
                //     r.y += dy;
                // }
            }

            // redraw the scene with the new rect positions
            // draw();

            // reset the starting mouse position for the next mousemove
            this.startX = mx;
            this.startY = my;
            console.log("myMove: ", Object.keys(this.dragShape).length);
        }
    }

    deepCopy(shapes: { [p: number]: Shape }): { [p: number]: Shape } {
        let copy: { [p: number]: Shape } = {};
        for (let id of Object.keys(shapes)) {
            copy[id] = shapes[id];
        }
        return copy;
    }

    bgColor(color?: string) {
        for (let i = 0; i < this.selectShapes.length; i++) {
            let id = this.selectShapes[i];
            this.shapes[id].bgColor = color;
            this.shapes[id].draw(this.ctx, true);
        }
    }

    bdColor(color?: string) {
        for (let i = 0; i < this.selectShapes.length; i++) {
            let id = this.selectShapes[i];
            this.shapes[id].bdColor = color;
            this.shapes[id].draw(this.ctx, true);
        }
    }

    draw(): this {
        // TODO: it there a better way to reset the canvas?
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.beginPath();
        this.ctx.fillStyle = 'lightgrey';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.stroke();

        // draw shapes
        this.ctx.fillStyle = 'black';
        // for (let id in this.shapes) {
        for (let id of this.state) {
            // console.log('Draw: ', typeof id, this.state, this.shapes);
            this.shapes[id].draw(this.ctx);
        }
        return this;
    }


    addShape(shape: Shape, redraw: boolean = true): this {
        this.shapes[shape.id] = shape;
        this.state.push(shape.id);
        let event = {};
        event["event"] = "addShape";
        event["shape"] = shape.object();
        this.events.push(event);
        return redraw ? this.draw() : this;
    }

    removeShape(shape: Shape, redraw: boolean = true): this {
        const id = shape.id;
        delete this.shapes[id];
        let event = {};
        event["event"] = "removeShape";
        event["shapeID"] = shape.id;
        this.state = this.state.filter(item => item != id);
        return redraw ? this.draw() : this;
    }

    removeShapeWithId(id: number, redraw: boolean = true): this {
        delete this.shapes[id];
        this.state = this.state.filter(item => item != id);
        let event = {};
        event["event"] = "removeShapeID";
        event["shapeID"] = id;
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
    chooseShapeAt(x: number, y: number, selected: boolean = false, mode: string) {
        let shapeUnderMouse: number[] = [];

        this.ctx.clearRect(0, 0, this.width, this.height);


        // for of return genauer element of the list
        // for in return str element of the list
        for (let id of this.state) {
            // console.log('State: ', this.state, this.shapes, typeof id);
            if (this.shapes[id].isInside(x, y)) {
                shapeUnderMouse.push(id);
                this.shapes[id].draw(this.ctx, true, this.selectColor);
                // console.log(this.shapes[id])

            } else {
                this.shapes[id].draw(this.ctx);
            }

        }

        if (selected && shapeUnderMouse.length > 0) {
            this.startX = x;
            this.startY = y;
            if (this.strgIsPressed) {
                this.selectShapes = shapeUnderMouse;
                // } else if (this.selectShapes.length === 0) {
                //     this.selectShapes.push(shapeUnderMouse[shapeUnderMouse.length - 1]);
                //
            } else {
                this.selectShapes = [];
                if (this.altIsPressed) {
                    this.iterator = (this.iterator + 1) % (shapeUnderMouse.length + 1) === 0 ? 1 : (this.iterator + 1) % (shapeUnderMouse.length + 1);
                }
                this.selectShapes.push(shapeUnderMouse[shapeUnderMouse.length - this.iterator]);

                // console.log("Line: ", this.events.length, this.selectShapes, "\nEvents", this.events, "\nZustand:", this.shapes, "\nSelectierbar: ", shapeUnderMouse);
                // let key = ['"data', '"id"', '"type"'];
                // let keyD = {};
                // let keys = ['"type"', '"id"', '"data"', '"from"', '"to"', '"zOrder"', '"bgColor"', '"bgColor"', '"fgColor"', '"fgColor"'];
                // let tes = this.shapes[this.selectShapes[0]].toString();
                // console.log('Shapes: ', tes);
                // for (let k of key) {
                //     // console.log('Key: ', k, tes.search(k), tes);
                //     let pos = tes.search(k);
                //     let [left, right] = tes.split(k);
                //     console.log('Key: ', k, tes.search(k), tes, left, right);
                //
                //     tes = right[0];
                //     keyD[k] = left;
                // }
                // console.log("Key D: ", keyD);
            }
        }
        // if (mode === "up") {
        if (mode) {
            console.log("You can have success in all thing that you enterprise");
            // console.log("message:", mode, x, y, selected);
            this.dragok = false;
            for (let id of this.selectShapes) {
                // console.log("down: ", id, typeof id);
                if (this.shapes[id].isInside(x, y)) {
                    // console.log('State: ', this.state, this.shapes, typeof id);
                    this.dragok = true;
                    // tmpShape.push(id);
                    this.dragShape[id] = this.shapes[id];
                    // this.shapes[id].isDragging = true;
                    // this.shapes[id].draw(this.ctx, true, this.selectColor);
                }
            }
            // save the current mouse position
            this.startX = x;
            this.startY = y;
            // let line = this.dragShape[0];
            // for (let i in line){
            //     if(line.hasOwnProperty(i))
            //         console.log("Line: ", i, line[i]);
            // }
            console.log("my ", mode, " ", this.dragShape, this.auswahl);


        }
        for (let i = 0; i < this.selectShapes.length; i++) {
            this.dragok = true;
            // console.log("Selected: ", this.selectShapes, this.shapes);
            this.shapes[this.selectShapes[i]].draw(this.ctx, true, 'red');
        }

        return mode ? this.dragShape : this;
    }
}

