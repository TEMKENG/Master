
const canvasWidth = 700, canvasHeight = 500;
const Selected = 'Selected';
const SelectedColor = 'rgb(33, 230, 89)';
const Hover = 'Hover';
const HoverColor = 'rgb(16, 114, 44)';
interface ShapeFactory {
    label: string;
    handleMouseDown(x: number, y: number);
    handleMouseUp(x: number, y: number);
    handleMouseMove(x: number, y: number);
}
interface Shape {
    readonly id: number;
    draw(ctx: CanvasRenderingContext2D, select?: boolean, strokeColour?: string);
    checkCollision(x: number, y: number);
}
class Point2D {
    constructor(readonly x: number, readonly y: number) { }
}
class AbstractShape {
    private static counter: number = 0;
    readonly id: number;
    constructor() {
        this.id = AbstractShape.counter++;
    }
}
abstract class AbstractFactory<T extends Shape> {
    private from: Point2D;
    private tmpTo: Point2D;
    private tmpShape: T;

    constructor(readonly shapeManager: ShapeManager) { }

    abstract createShape(from: Point2D, to: Point2D): T;

    handleMouseDown(x: number, y: number) {
        this.from = new Point2D(x, y);
    }

    handleMouseUp(x: number, y: number) {
        // remove the temp line, if there was one
        if (this.tmpShape) {
            this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
        }
        this.shapeManager.addShape(this.createShape(this.from, new Point2D(x, y)));
        this.from = undefined;

    }

    handleMouseMove(x: number, y: number) {
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

class SelectShape implements ShapeFactory {
    public label: string = "Auswahl";

    constructor(readonly shapeManager: ShapeManager) {
    }

    handleMouseDown(x: number, y: number) {
        ;
    }

    handleMouseUp(x: number, y: number) {
        this.shapeManager.selectShapeAt(x, y, true);
    }
    handleMouseMove(x: number, y: number) {
        this.shapeManager.selectShapeAt(x, y);
    }
}




class Line extends AbstractShape implements Shape {
    public label: string = "Linie";
    constructor(readonly from: Point2D, readonly to: Point2D) {
        super();
    }

    draw(ctx: CanvasRenderingContext2D, select?: boolean, strokeColour?: string) {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        const oldWidth = ctx.lineWidth;
        if (select && strokeColour) {
            if (strokeColour === Selected) {
                ctx.strokeStyle = SelectedColor;
            } else {
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
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }

    checkCollision(x: number, y: number) {
        // account for tolerance
        let fakeFrom: Point2D = new Point2D(this.from.x - 10, this.from.y + 10);
        let fakeTo: Point2D = new Point2D(this.to.x + 10, this.to.y - 10);
        if (this.from.y < this.to.y) {
            fakeFrom = new Point2D(this.from.x - 10, this.from.y - 10);
            fakeTo = new Point2D(this.to.x + 10, this.to.y + 10);
        }

        // check for collision out of bounds
        if (x < fakeFrom.x || x > fakeTo.x) return false;

        const numerator: number = Math.abs((this.to.y - this.from.y) * x - (this.to.x - this.from.x) * y + this.to.x * this.from.y - this.to.y * this.from.x);
        const denominator: number = Math.sqrt(Math.pow((this.to.y - this.from.y), 2) + Math.pow((this.to.x - this.from.x), 2));
        const absDistance: number = parseFloat((numerator / denominator).toPrecision(2));
        return absDistance <= 15.0;
    }

}


class LineFactory extends AbstractFactory<Line> implements ShapeFactory {

    public label: string = "Linie";

    constructor(shapeManager: ShapeManager) {
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Line {
        // [rv] order lines by x-coordinate
        if (from.x < to.x) {
            return new Line(from, to);
        } else {
            return new Line(to, from);
        }
    }

}





class Circle extends AbstractShape implements Shape {
    public label: string = "Kreis";
    constructor(readonly center: Point2D, readonly radius: number) {
        super();
    }
    draw(ctx: CanvasRenderingContext2D, select?: boolean, strokeColour?: string) {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        const oldWidth = ctx.lineWidth;
        if (select && strokeColour) {
            if (strokeColour === Selected) {
                ctx.strokeStyle = SelectedColor;
            } else {
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
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }

    checkCollision(x: number, y: number) {
        const pointNearCenter = Math.pow(x - this.center.x, 2) + Math.pow(y - this.center.y, 2)
        const circleArea = Math.pow(this.radius, 2);
        return pointNearCenter <= circleArea;
    }
}


class CircleFactory extends AbstractFactory<Circle> implements ShapeFactory {
    public label: string = "Kreis";

    constructor(shapeManager: ShapeManager) {
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Circle {
        return new Circle(from, CircleFactory.computeRadius(from, to.x, to.y));
    }

    private static computeRadius(from: Point2D, x: number, y: number): number {
        const xDiff = (from.x - x),
            yDiff = (from.y - y);
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }
}






class Rectangle extends AbstractShape implements Shape {
    public label: string = "Rechteck";
    constructor(readonly from: Point2D, readonly to: Point2D) {
        super();
    }

    draw(ctx: CanvasRenderingContext2D, select?: boolean, strokeColour?: string) {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        const oldWidth = ctx.lineWidth;
        if (select && strokeColour) {
            if (strokeColour === Selected) {
                ctx.strokeStyle = SelectedColor;
            } else {
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
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;

    }

    checkCollision(x: number, y: number) {
        return (x >= this.from.x && x <= this.to.x && y >= this.from.y && y <= this.to.y);
    }

}

class RectangleFactory extends AbstractFactory<Rectangle> implements ShapeFactory {
    public label: string = "Rechteck";
    constructor(shapeManager: ShapeManager) {
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Rectangle {

        // [rv] order rectangles by x-coordinate
        if (from.x < to.x || from.y < to.y) {
            return new Rectangle(from, to);
        } else {
            return new Rectangle(to, from);
        }
    }
}



class Triangle extends AbstractShape implements Shape {
    public label: string = "Dreieck";
    constructor(readonly p1: Point2D, readonly p2: Point2D, readonly p3: Point2D) {
        super();
    }
    draw(ctx: CanvasRenderingContext2D, select?: boolean, strokeColour?: string) {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        const oldWidth = ctx.lineWidth;
        if (select && strokeColour) {
            if (strokeColour === Selected) {
                ctx.strokeStyle = SelectedColor;
            } else {
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
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }

    checkSign(p1x, p1y, p2, p3) {
        return (p1x - p3.x + 10) * (p2.y - p3.y + 10) - (p2.x - p3.x + 10) * (p1y - p3.y + 10);
    }

    checkCollision(x: number, y: number) {
        const b1 = this.checkSign(x, y, this.p1, this.p2) < 0;
        const b2 = this.checkSign(x, y, this.p2, this.p3) < 0;
        const b3 = this.checkSign(x, y, this.p3, this.p1) < 0;

        return ((b1 === b2) && (b2 === b3));
    }
}



class TriangleFactory implements ShapeFactory {
    public label: string = "Dreieck";

    private from: Point2D;
    private tmpTo: Point2D;
    private tmpLine: Line;
    private thirdPoint: Point2D;
    private tmpShape: Triangle;

    constructor(readonly shapeManager: ShapeManager) { }

    handleMouseDown(x: number, y: number) {
        if (this.tmpShape) {
            this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
            this.shapeManager.addShape(
                new Triangle(this.from, this.tmpTo, new Point2D(x, y)));
            this.from = undefined;
            this.tmpTo = undefined;
            this.tmpLine = undefined;
            this.thirdPoint = undefined;
            this.tmpShape = undefined;
        } else {
            this.from = new Point2D(x, y);
        }
    }

    handleMouseUp(x: number, y: number) {
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

    handleMouseMove(x: number, y: number) {
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
        } else { // no second point fixed, update tmp line
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



////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////



class Shapes {
}

class ToolArea {
    private selectedShape: ShapeFactory = undefined;
    constructor(shapesSelector: ShapeFactory[], menue: Element) {
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

        function selectFactory(sl: ShapeFactory, domElm: HTMLElement) {
            // remove class from all elements
            for (let j = 0; j < domElms.length; j++) {
                domElms[j].classList.remove("marked");
            }
            this.selectedShape = sl;
            // add class to the one that is selected currently
            domElm.classList.add("marked");
        }
    }

    getSelectedShape(): ShapeFactory {
        return this.selectedShape;
    }

}

interface ShapeManager {
    addShape(shape: Shape, redraw?: boolean): this;
    removeShape(shape: Shape, redraw?: boolean): this;
    removeShapeWithId(id: number, redraw?: boolean): this;
    selectShapeAt(x: number, y: number, doSelect?: boolean): this;
}
class Canvas implements ShapeManager {
    private ctx: CanvasRenderingContext2D;
    private shapes: { [p: number]: Shape } = {};
    private selectedShapes: number[] = [];
    private cntrlIsPressed: boolean = false;

    constructor(canvasDomElement: HTMLCanvasElement, toolarea: ToolArea) {
        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove", createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown", createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup", createMouseHandler("handleMouseUp"));

        let self = this;
        const delButton = <HTMLElement>document.querySelector('#delSelect');
        delButton.addEventListener("click", function () {
            self.removeSelectedShapes();
        });

        document.addEventListener("keydown", function (e) {
            if (e.keyCode === 17) {
                self.cntrlIsPressed = true;
            } else if (e.keyCode === 46) {
                self.removeSelectedShapes();
            }
        });
        document.addEventListener("keyup", function (e) {
            self.cntrlIsPressed = false;
        });

        this.ctx.lineWidth = 2;
        // this.ctx.fillStyle = 'red';
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
        this.ctx.shadowBlur = 0;


        function createMouseHandler(methodName: string) {
            return function (e: any) {
                e = e || window.event;

                if ('object' === typeof e) {
                    const btnCode = e.button,
                        x = e.pageX - this.offsetLeft,
                        y = e.pageY - this.offsetTop,
                        ss = toolarea.getSelectedShape();
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

    draw(): this {
        // TODO: is there a better way to reset the canvas?
        // DONE: use clearRect
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // not needed?
        // this.ctx.beginPath();
        // this.ctx.stroke();

        // draw shapes

        for (let id in this.shapes) {
            this.shapes[id].draw(this.ctx);
        }

        return this;
    }

    addShape(shape: Shape, redraw: boolean = true): this {
        this.shapes[shape.id] = shape;
        return redraw ? this.draw() : this;
    }

    removeShape(shape: Shape, redraw: boolean = true): this {
        const id = shape.id;
        delete this.shapes[id];
        return redraw ? this.draw() : this;
    }

    removeShapeWithId(id: number, redraw: boolean = true): this {
        delete this.shapes[id];
        return redraw ? this.draw() : this;
    }

    removeSelectedShapes() {
        for (let i = 0; i < this.selectedShapes.length; i++) {
            this.removeShapeWithId(this.selectedShapes[i]);
        }
        this.selectedShapes = [];
    }

    selectShapeAt(x: number, y: number, doSelect: boolean = false): this {
        // this.draw would only redraw canvas, but we need to redraw the shape
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        let selectableShapes: number[] = [];

        // need the index too, in this case...
        const self = this;
        Object.keys(this.shapes).forEach(function (id, index) {
            if (self.shapes[id].checkCollision(x, y)) {
                selectableShapes.push(+id);

                const nextCol = ((index + 1) * 13) % 60;
                self.shapes[id].draw(self.ctx, true, nextCol);

            } else {
                self.shapes[id].draw(self.ctx);
            }
        });


        if (doSelect && selectableShapes.length > 0) {

            if (this.selectedShapes.length === 0) {
                this.selectedShapes.push(selectableShapes[0]);
            } else {
                // load last selected element
                const lastSel: number = this.selectedShapes[this.selectedShapes.length - 1];

                // check for ctrl-key being pressed
                if (!this.cntrlIsPressed) {
                    this.selectedShapes = [];
                }

                // choose next
                let curIn: number = selectableShapes.lastIndexOf(lastSel);
                // selected shape is not part of selectables push first new
                if (curIn < 0) {
                    this.selectedShapes.push(selectableShapes[0]);
                } else {
                    curIn++;
                    if (selectableShapes.length <= curIn) {
                        curIn %= selectableShapes.length;
                    }
                    this.selectedShapes.push(selectableShapes[curIn]);
                }
            }

        }

        // put emphasis on elected elements
        let i = 0;
        for (i; i < this.selectedShapes.length; i++) {
            this.shapes[this.selectedShapes[i]].draw(this.ctx, true, Selected);
        };

        return this;
    }
}

function init() {
    const canvasDomElm = document.getElementById("drawArea") as HTMLCanvasElement;
    const menu = document.getElementsByClassName("tools");
    // Problem here: Factories needs a way to create new Shapes, so they
    // have to call a method of the canvas.
    // The canvas on the other side wants to call the event methods
    // on the toolbar, because the toolbar knows what tool is currently
    // selected.
    // Anyway, we do not want the two to have references on each other
    let canvas: Canvas;
    const sm: ShapeManager = {
        addShape(s, rd) {
            return canvas.addShape(s, rd);
        },
        removeShape(s, rd) {
            return canvas.removeShape(s, rd);
        },
        removeShapeWithId(id, rd) {
            return canvas.removeShapeWithId(id, rd);
        },
        selectShapeAt(x, y, rd) {
            return canvas.selectShapeAt(x, y, rd);
        }
    };
    const shapesSelector: ShapeFactory[] = [
        new LineFactory(sm),
        new CircleFactory(sm),
        new RectangleFactory(sm),
        new TriangleFactory(sm),
        new SelectShape(sm)
    ];
    const toolArea = new ToolArea(shapesSelector, menu[0]);
    canvas = new Canvas(canvasDomElm, toolArea);
    canvas.draw();
}
