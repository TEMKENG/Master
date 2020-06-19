import { MenuApi } from './api.js';
const Selected = 'Selected';
//const SelectedColor = 'rgb(33, 230, 89)';
const SelectedColor = '#8b008b';
const Hover = 'Hover';
//const HoverColor = 'rgb(16, 114, 44)';
const HoverColor = '#ff8c00';
class Point2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class AbstractShape {
    constructor() {
        this.id = AbstractShape.counter++;
    }
}
AbstractShape.counter = 0;
class AbstractFactory {
    constructor(shapeManager) {
        this.shapeManager = shapeManager;
    }
    handleMouseDown(x, y) {
        this.from = new Point2D(x, y);
    }
    handleMouseUp(x, y) {
        // remove the temp line, if there was one
        if (this.tmpShape) {
            this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
        }
        this.shapeManager.addShape(this.createShape(this.from, new Point2D(x, y)));
        this.from = undefined;
    }
    handleMouseMove(x, y) {
        // show temp circle only, if the start point is defined;
        if (!this.from) {
            return;
        }
        if (!this.tmpTo || (this.tmpTo.x !== x || this.tmpTo.y !== y)) {
            this.tmpTo = new Point2D(x, y);
            if (this.tmpShape) {
                // remove the old temp line, if there was one
                this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
            }
            // adds a new temp line
            this.tmpShape = this.createShape(this.from, new Point2D(x, y));
            this.shapeManager.addShape(this.tmpShape);
        }
    }
}
export class Line extends AbstractShape {
    constructor(from, to) {
        super();
        this.from = from;
        this.to = to;
    }
    draw(ctx, select, selectedFarbe) {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        const oldWidth = ctx.lineWidth;
        if (select && selectedFarbe) {
            if (selectedFarbe === Selected) {
                ctx.strokeStyle = SelectedColor;
            }
            else {
                ctx.strokeStyle = HoverColor;
                ctx.shadowBlur = 2;
            }
            ctx.lineWidth = 1;
            ctx.fillStyle = SelectedColor;
            ctx.fillRect(this.from.x - 4, this.from.y - 4, 8, 8);
            ctx.fillRect(this.to.x - 4, this.to.y - 4, 8, 8);
        }
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();
        if (this.backgroundColor !== undefined) {
            ctx.strokeStyle = this.backgroundColor;
            ctx.stroke();
        }
        if (this.borderColor !== undefined) {
            ctx.strokeStyle = this.borderColor;
            ctx.stroke();
        }
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }
    collider(x, y) {
        //Berücksichtigung der Tolerance
        let dudFrom = new Point2D(this.from.x - 10, this.from.y + 10);
        let dudTo = new Point2D(this.to.x + 10, this.to.y - 10);
        if (this.from.y < this.to.y) {
            dudFrom = new Point2D(this.from.x - 10, this.from.y - 10);
            dudTo = new Point2D(this.to.x + 10, this.to.y + 10);
        }
        //Prüfung auf Kollision außerhalb der Grenzen
        if (x < dudFrom.x || x > dudTo.x)
            return false;
        const zaehler = Math.abs((this.to.y - this.from.y) * x - (this.to.x - this.from.x) * y + this.to.x * this.from.y - this.to.y * this.from.x);
        const nenner = Math.sqrt(Math.pow((this.to.y - this.from.y), 2) + Math.pow((this.to.x - this.from.x), 2));
        const dist = parseFloat((zaehler / nenner).toPrecision(2));
        return dist <= 15.0;
    }
}
export class LineFactory extends AbstractFactory {
    constructor(shapeManager) {
        super(shapeManager);
        this.label = "Linie";
    }
    createShape(from, to) {
        return new Line(from, to);
    }
}
class Circle extends AbstractShape {
    constructor(center, radius) {
        super();
        this.center = center;
        this.radius = radius;
    }
    draw(ctx, select, selectedFarbe) {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        const oldWidth = ctx.lineWidth;
        if (select && selectedFarbe) {
            if (selectedFarbe === Selected) {
                ctx.strokeStyle = SelectedColor;
            }
            else {
                ctx.strokeStyle = HoverColor;
                ctx.shadowBlur = 2;
            }
            ctx.lineWidth = 1;
            ctx.fillStyle = SelectedColor;
            ctx.fillRect(this.center.x + this.radius - 4, this.center.y - 4, 8, 8);
            ctx.fillRect(this.center.x - this.radius - 4, this.center.y - 4, 8, 8);
            ctx.fillRect(this.center.x - 4, this.center.y - this.radius - 4, 8, 8);
            ctx.fillRect(this.center.x - 4, this.center.y + this.radius - 4, 8, 8);
        }
        ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
        if (this.backgroundColor !== undefined) {
            ctx.fillStyle = this.backgroundColor;
            ctx.fill();
        }
        if (this.borderColor !== undefined) {
            ctx.strokeStyle = this.borderColor;
            ctx.stroke();
        }
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }
    collider(x, y) {
        const pointNearCenter = Math.pow(x - this.center.x, 2) + Math.pow(y - this.center.y, 2);
        const circleArea = Math.pow(this.radius, 2);
        return pointNearCenter <= circleArea;
    }
}
export class CircleFactory extends AbstractFactory {
    constructor(shapeManager) {
        super(shapeManager);
        this.label = "Kreis";
    }
    createShape(from, to) {
        return new Circle(from, CircleFactory.computeRadius(from, to.x, to.y));
    }
    static computeRadius(from, x, y) {
        const xDiff = (from.x - x), yDiff = (from.y - y);
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }
}
class Rectangle extends AbstractShape {
    constructor(from, to) {
        super();
        this.from = from;
        this.to = to;
    }
    draw(ctx, select, selectedFarbe) {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        const oldWidth = ctx.lineWidth;
        if (select && selectedFarbe) {
            if (selectedFarbe === Selected) {
                ctx.strokeStyle = SelectedColor;
            }
            else {
                ctx.strokeStyle = HoverColor;
                ctx.shadowBlur = 2;
            }
            ctx.lineWidth = 1;
            ctx.fillStyle = SelectedColor;
            ctx.fillRect(this.from.x - 4, this.from.y - 4, 8, 8);
            ctx.fillRect(this.from.x - 4, this.to.y - 4, 8, 8);
            ctx.fillRect(this.to.x - 4, this.from.y - 4, 8, 8);
            ctx.fillRect(this.to.x - 4, this.to.y - 4, 8, 8);
        }
        ctx.strokeRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
        ctx.stroke();
        if (this.backgroundColor !== undefined) {
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
        }
        if (this.borderColor !== undefined) {
            ctx.strokeStyle = this.borderColor;
            ctx.strokeRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
            ctx.stroke();
        }
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }
    collider(x, y) {
        return (x >= this.from.x && x <= this.to.x && y >= this.from.y && y <= this.to.y);
    }
}
export class RectangleFactory extends AbstractFactory {
    constructor(shapeManager) {
        super(shapeManager);
        this.label = "Rechteck";
    }
    createShape(from, to) {
        return new Rectangle(from, to);
    }
}
class Triangle extends AbstractShape {
    constructor(p1, p2, p3) {
        super();
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }
    calculateSign(p1x, p1y, p2, p3) {
        return (p1x - p3.x + 10) * (p2.y - p3.y + 10) - (p2.x - p3.x + 10) * (p1y - p3.y + 10);
    }
    draw(ctx, select, selectedFarbe) {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        const oldWidth = ctx.lineWidth;
        if (select && selectedFarbe) {
            if (selectedFarbe === Selected) {
                ctx.strokeStyle = SelectedColor;
            }
            else {
                ctx.strokeStyle = HoverColor;
                ctx.shadowBlur = 2;
            }
            ctx.lineWidth = 1;
            ctx.fillStyle = SelectedColor;
            ctx.fillRect(this.p1.x - 4, this.p1.y - 4, 8, 8);
            ctx.fillRect(this.p2.x - 4, this.p2.y - 4, 8, 8);
            ctx.fillRect(this.p3.x - 4, this.p3.y - 4, 8, 8);
        }
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.lineTo(this.p3.x, this.p3.y);
        ctx.lineTo(this.p1.x, this.p1.y);
        ctx.stroke();
        if (this.backgroundColor !== undefined) {
            ctx.fillStyle = this.backgroundColor;
            ctx.fill();
        }
        if (this.borderColor !== undefined) {
            ctx.strokeStyle = this.borderColor;
            ctx.stroke();
        }
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }
    collider(x, y) {
        const b1 = this.calculateSign(x, y, this.p1, this.p2) < 0;
        const b2 = this.calculateSign(x, y, this.p2, this.p3) < 0;
        const b3 = this.calculateSign(x, y, this.p3, this.p1) < 0;
        return ((b1 === b2) && (b2 === b3));
    }
}
export class TriangleFactory {
    constructor(shapeManager) {
        this.shapeManager = shapeManager;
        this.label = "Dreieck";
    }
    handleMouseDown(x, y) {
        if (this.tmpShape) {
            this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
            this.shapeManager.addShape(new Triangle(this.from, this.tmpTo, new Point2D(x, y)));
            this.from = undefined;
            this.tmpTo = undefined;
            this.tmpLine = undefined;
            this.thirdPoint = undefined;
            this.tmpShape = undefined;
        }
        else {
            this.from = new Point2D(x, y);
        }
    }
    handleMouseUp(x, y) {
        // remove the temp line, if there was one
        if (this.tmpLine) {
            this.shapeManager.removeShapeWithId(this.tmpLine.id, false);
            this.tmpLine = undefined;
            this.tmpTo = new Point2D(x, y);
            this.thirdPoint = new Point2D(x, y);
            this.tmpShape = new Triangle(this.from, this.tmpTo, this.thirdPoint);
            this.shapeManager.addShape(this.tmpShape);
        }
    }
    handleMouseMove(x, y) {
        // show temp circle only, if the start point is defined;
        if (!this.from) {
            return;
        }
        if (this.tmpShape) { // second point already defined, update temp triangle
            if (!this.thirdPoint || (this.thirdPoint.x !== x || this.thirdPoint.y !== y)) {
                this.thirdPoint = new Point2D(x, y);
                if (this.tmpShape) {
                    // remove the old temp line, if there was one
                    this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
                }
                // adds a new temp triangle
                this.tmpShape = new Triangle(this.from, this.tmpTo, this.thirdPoint);
                this.shapeManager.addShape(this.tmpShape);
            }
        }
        else { // no second point fixed, update tmp line
            if (!this.tmpTo || (this.tmpTo.x !== x || this.tmpTo.y !== y)) {
                this.tmpTo = new Point2D(x, y);
                if (this.tmpLine) {
                    // remove the old temp line, if there was one
                    this.shapeManager.removeShapeWithId(this.tmpLine.id, false);
                }
                // adds a new temp line
                this.tmpLine = new Line(this.from, this.tmpTo);
                this.shapeManager.addShape(this.tmpLine);
            }
        }
    }
}
export class SelectionFactory {
    constructor(shapeManager) {
        this.shapeManager = shapeManager;
        this.label = "Selection";
    }
    handleMouseDown(x, y) {
    }
    handleMouseUp(x, y) {
        this.shapeManager.selectShapeFor(x, y, true);
    }
    handleMouseMove(x, y) {
        this.shapeManager.selectShapeFor(x, y);
    }
}
class ToolArea {
    constructor(shapesSelector, menue) {
        this.selectedShape = undefined;
        const domElms = [];
        shapesSelector.forEach(sl => {
            const domSelElement = document.createElement("li");
            domSelElement.innerText = sl.label;
            menue.appendChild(domSelElement);
            domElms.push(domSelElement);
            domSelElement.addEventListener("click", () => {
                selectFactory.call(this, sl, domSelElement);
            });
        });
        function selectFactory(sl, domElm) {
            // remove class from all elements
            for (let j = 0; j < domElms.length; j++) {
                domElms[j].classList.remove("marked");
            }
            this.selectedShape = sl;
            // add class to the one that is selected currently
            domElm.classList.add("marked");
        }
    }
    getSelectedShape() {
        return this.selectedShape;
    }
}
export class Canvas {
    constructor(canvasDomElement, toolarea) {
        this.shapes = {};
        this.ismarked = false;
        this.iterated = false;
        //private fillcolor:string;
        this.allSelectedShapes = [];
        let self = this;
        const { width, height } = canvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;
        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove", createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown", createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup", createMouseHandler("handleMouseUp"));
        canvasDomElement.addEventListener("contextmenu", function (event) {
            let x = event.clientX;
            let y = event.clientY;
            event.preventDefault();
            setInterval(function () {
                var radiosHinter = document.getElementsByName("Hintergrundfarbe");
                var radiosRand = document.getElementsByName("Randfarbe");
                radiosHinter.forEach(radio => radio.onclick = function () {
                    self.fillBackColorSelectedShapes(radio.className);
                });
                radiosRand.forEach(radio => radio.onclick = function () {
                    self.fillRandColorSelectedShapes(radio.className);
                });
            }, 3);
            menu.show(x, y);
        });
        canvasDomElement.addEventListener("click", function (event) {
            let x = event.clientX;
            let y = event.clientY;
            event.preventDefault();
            menu.hide();
        });
        document.addEventListener("keydown", function (e) {
            if (e.keyCode === 17) {
                self.ismarked = true;
            }
            else if (e.keyCode === 18) {
                self.iterated = true;
            }
        });
        document.addEventListener("keyup", function (e) {
            self.ismarked = false;
            self.iterated = false;
        });
        function createMouseHandler(methodName) {
            return function (e) {
                e = e || window.event;
                if ('object' === typeof e) {
                    const btnCode = e.button, x = e.pageX - this.offsetLeft, y = e.pageY - this.offsetTop, ss = toolarea.getSelectedShape();
                    // if left mouse button is pressed,
                    // and if a tool is selected, do something
                    if (e.button === 0 && ss) {
                        const m = ss[methodName];
                        // This in the shapeFactory should be the factory itself.
                        m.call(ss, x, y);
                    }
                }
            };
        }
        function setupContextMenu(self) {
            const menu = new MenuApi();
            const menuItem1 = MenuApi.createRadioOption("Hintergrundfarbe", { "red": "#ff0000", "yellow": "#ffff00", "green": "#008000" }, "red");
            const menuItem3 = MenuApi.createRadioOption("Randfarbe", { "bleu": "#0000ff", "black": "#000000", "transparent": undefined });
            /**
             * Verschiebung der Shape nach vorn.
             */
            const menuItem4 = MenuApi.createItem("+ Z-Order ", (m) => {
                self.setZOrder();
                menu.hide(); // Here , we just want to hide the menu
            });
            /**
             * Verschiebung der Shape nach hinten.
             */
            const menuItem5 = MenuApi.createItem("- Z-Order ", (m) => {
                self.setZOrder();
                menu.hide(); // Here , we just want to hide the menu
            });
            const menuItem = MenuApi.createSeparator();
            /**
             * Delete Shapes
             */
            const menuItem2 = MenuApi.createItem("Delete ", (m) => {
                self.removeSelectedShapes();
                menu.hide(); // Here , we just want to hide the menu
            });
            menu.addItems(menuItem1);
            menu.addItem(menuItem);
            menu.addItems(menuItem3);
            menu.addItem(menuItem);
            menu.addItems(menuItem4);
            menu.addItem(menuItem);
            menu.addItems(menuItem5);
            menu.addItem(menuItem);
            menu.addItems(menuItem2);
            return menu;
        }
        const menu = setupContextMenu(this);
    }
    draw() {
        // TODO: it there a better way to reset the canvas?
        this.ctx.beginPath();
        this.ctx.fillStyle = 'lightgrey';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.stroke();
        // draw shapes
        this.ctx.fillStyle = 'black';
        for (let id in this.shapes) {
            this.shapes[id].draw(this.ctx);
        }
        return this;
    }
    selectShapeFor(x, y, setSelect = false) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        let allSelectedShapes = [];
        const self = this;
        Object.keys(this.shapes).forEach(function (id, pos) {
            if (self.shapes[id].collider(x, y)) {
                allSelectedShapes.push(+id);
                const nextCollider = ((pos + 1) * 13) % 60;
                self.shapes[id].draw(self.ctx, true, nextCollider);
            }
            else {
                self.shapes[id].draw(self.ctx);
            }
        });
        if (setSelect && allSelectedShapes.length > 0) {
            if (this.allSelectedShapes.length === 0) {
                this.allSelectedShapes.push(allSelectedShapes[allSelectedShapes.length - 1]);
            }
            else {
                // load last selected element
                const lastSel = this.allSelectedShapes[this.allSelectedShapes.length - 1];
                // check for ctrl-key being pressed
                if (this.iterated) {
                    if (!this.ismarked) {
                        this.allSelectedShapes = [];
                    }
                    // choose next
                    let curIn = allSelectedShapes.lastIndexOf(lastSel);
                    console.log(curIn);
                    // selected shape is not part of selectables push first new
                    if (curIn < 0) {
                        this.allSelectedShapes.push(allSelectedShapes[allSelectedShapes.length - 1]);
                    }
                    else {
                        curIn += 2;
                        if (allSelectedShapes.length <= curIn) {
                            curIn %= allSelectedShapes.length;
                        }
                        this.allSelectedShapes.push(allSelectedShapes[curIn]);
                    }
                }
                else {
                    if (!this.ismarked) {
                        this.allSelectedShapes = [];
                        this.allSelectedShapes.push(allSelectedShapes[allSelectedShapes.length - 1]);
                    }
                    else {
                        this.allSelectedShapes.push(allSelectedShapes[allSelectedShapes.length - 1]);
                    }
                }
            }
        }
        // liegt den Schwerpunkt auf gewählte Elemente
        let j = 0;
        for (j; j < this.allSelectedShapes.length; j++) {
            this.shapes[this.allSelectedShapes[j]].draw(this.ctx, true, Selected);
        }
        ;
        return this;
    }
    addShape(shape, redraw = true) {
        this.shapes[shape.id] = shape;
        return redraw ? this.draw() : this;
    }
    removeSelectedShapes() {
        for (let i = 0; i < this.allSelectedShapes.length; i++) {
            this.removeShapeWithId(this.allSelectedShapes[i]);
        }
        this.allSelectedShapes = [];
    }
    removeShape(shape, redraw = true) {
        const id = shape.id;
        delete this.shapes[id];
        return redraw ? this.draw() : this;
    }
    removeShapeWithId(id, redraw = true) {
        delete this.shapes[id];
        return redraw ? this.draw() : this;
    }
    fillBackColorSelectedShapes(backgroundColor) {
        for (let i = 0; i < this.allSelectedShapes.length; i++) {
            let id = this.allSelectedShapes[i];
            this.shapes[id].backgroundColor = backgroundColor;
            this.shapes[id].draw(this.ctx, true, Selected);
        }
    }
    fillRandColorSelectedShapes(borderColor) {
        for (let i = 0; i < this.allSelectedShapes.length; i++) {
            let id = this.allSelectedShapes[i];
            this.shapes[id].borderColor = borderColor;
            this.shapes[id].draw(this.ctx, true, Selected);
        }
    }
    setZOrder() {
    }
}
function init() {
    const canvasDomElm = document.getElementById("drawArea");
    const menu = document.getElementsByClassName("tools");
    // Problem here: Factories needs a way to create new Shapes, so they
    // have to call a method of the canvas.
    // The canvas on the other side wants to call the event methods
    // on the toolbar, because the toolbar knows what tool is currently
    // selected.
    // Anyway, we do not want the two to have references on each other
    let canvas;
    const sm = {
        addShape(s, rd) {
            return canvas.addShape(s, rd);
        },
        removeShape(s, rd) {
            return canvas.removeShape(s, rd);
        },
        removeShapeWithId(id, rd) {
            return canvas.removeShapeWithId(id, rd);
        },
        selectShapeFor(x, y, rd) {
            return canvas.selectShapeFor(x, y, rd);
        }
    };
    const shapesSelector = [
        new LineFactory(sm),
        new CircleFactory(sm),
        new RectangleFactory(sm),
        new TriangleFactory(sm),
        new SelectionFactory(sm)
    ];
    const toolArea = new ToolArea(shapesSelector, menu[0]);
    canvas = new Canvas(canvasDomElm, toolArea);
    canvas.draw();
}
init();
//# sourceMappingURL=drawer.js.map