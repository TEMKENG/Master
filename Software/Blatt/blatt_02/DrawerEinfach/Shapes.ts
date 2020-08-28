console.log("Shapes Class");
import {Shape, ShapeFactory, ShapeManager} from "./types.js";

class Point2D {
    constructor(readonly x: number, readonly y: number) {
    }

    toString(): string {
        return '{"x": ' + this.x + ', "y": ' + this.y + '}';
    }

    equal(otherPoint: Point2D) {
        return this.toString() === otherPoint.toString();
    }
}

class AbstractShape {
    private static counter: number = 0;
    readonly id: number;

    constructor(id?: number) {
        this.id = id != undefined ? id : AbstractShape.counter++;
    }
}

abstract class AbstractFactory<T extends Shape> {
    private from: Point2D;
    private tmpTo: Point2D;
    private tmpShape: T;

    constructor(readonly shapeManager: ShapeManager) {
    }

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
                // console.log("dsd");
                this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
            }
            // adds a new temp line
            this.tmpShape = this.createShape(this.from, new Point2D(x, y));
            this.shapeManager.addShape(this.tmpShape);
        }
    }

}

class Line extends AbstractShape implements Shape {
    label = "Line";
    zOrder: number;
    bdColor: string;
    bgColor: string;
    clientId: number;
    selected: boolean;

    constructor(readonly from: Point2D, readonly to: Point2D, id?: number, clientId?: number) {
        super(id);
        this.selected = false;
        this.clientId = clientId;

    }


    toString(): string {
        let data = '{"from": ' + this.from.toString() + "," +
            '"to": ' + this.to.toString() + "," +
            '"zOrder": ' + this.zOrder + "," +
            '"bgColor": ' + this.bgColor + "," +
            '"fgColor": ' + this.bdColor + "}";
        return '{"type": "Line",' +
            '"id": ' + this.id + ',' +
            '"data": ' + data + '}';
    }

    object() {
        let to = {};
        let from = {};
        let data = {};
        let shape = {};
        to["x"] = this.to.x;
        to["y"] = this.to.y;
        from["x"] = this.from.x;
        from["y"] = this.from.y;
        data["from"] = from;
        data["to"] = to;

        data["to"] = this.to;
        data["from"] = this.from;
        data["zOrder"] = this.zOrder;
        data["bgColor"] = this.bgColor;
        data["fgColor"] = this.bdColor;

        shape["type"] = "Line";
        shape["id"] = this.id;
        shape["data"] = data;
        return shape;
    }

    draw(ctx: CanvasRenderingContext2D, select: boolean, color: string = 'red') {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        if (this.bdColor !== undefined) {
            ctx.strokeStyle = this.bdColor;
            // this.bdColor = undefined;
            // console.log("Line stroke bdColor: ", ctx.strokeStyle, oldStroke, this.bgColor);

        } else if (this.bgColor !== undefined) {
            ctx.strokeStyle = this.bgColor;
            // this.bgColor = undefined;

            // console.log("Line stroke: ", ctx.strokeStyle, oldStroke, this.bdColor);
        }
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();
        if (select) {
            let points = [new Point2D(this.from.x, this.from.y), new Point2D(this.to.x, this.to.y)];
            selected_draw(ctx, points, color);
        }
        ctx.strokeStyle = oldStroke;
    }

    isInside(x: number, y: number): boolean {
        const point = this.from.x <= this.to.x ? [this.from, this.to] : [this.to, this.from];
        const numerator: number = Math.abs((this.to.y - this.from.y) * x - (this.to.x - this.from.x) * y + this.to.x * this.from.y - this.to.y * this.from.x);
        const denominator: number = Math.sqrt(Math.pow((this.to.y - this.from.y), 2) + Math.pow((this.to.x - this.from.x), 2));
        return numerator / denominator < 10;

    }


}

export class LineFactory extends AbstractFactory<Line> implements ShapeFactory {

    public label: string = "Linie";

    constructor(shapeManager: ShapeManager) {
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Line {
        return new Line(from, to);
    }

}

class Circle extends AbstractShape implements Shape {
    zOrder: number;
    bdColor: string;
    bgColor: string;
    label = "Circle";
    clientId: number;
    selected: boolean;

    constructor(readonly center: Point2D, readonly radius: number, id?: number, clientId?: number) {
        super(id);
        this.selected = false;
        this.clientId = clientId;
    }

    object() {
        let center = {};
        let data = {};
        let shape = {};

        center["x"] = this.center.x;
        center["y"] = this.center.y;
        data["center"] = center;

        data["center"] = this.center;
        data["radius"] = this.radius;
        data["zOrder"] = this.zOrder;
        data["bgColor"] = this.bgColor;
        data["fgColor"] = this.bdColor;

        shape["type"] = "Circle";
        shape["id"] = this.id;
        shape["data"] = data;

        return shape;
    }

    toString(): string {
        let data = '{"center": ' + this.center.toString() + ",\n";
        data += '"radius": ' + this.radius + ",\n";
        data += '"zOrder": ' + this.zOrder + ",\n";
        data += '"bgColor": ' + this.bgColor + ",\n";
        data += '"fgColor": ' + this.bdColor + "\n}";
        let str = '{"type": "Circle",\n';
        str += '"id": ' + this.id + ',\n';
        str += '"data": ' + data + '\n}\n';
        return str;
    }

    draw(ctx: CanvasRenderingContext2D, select?: boolean, color: string = 'red') {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;

        ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        if (this.bgColor !== undefined) {
            ctx.fillStyle = this.bgColor;
            ctx.fill();
        }

        if (this.bdColor !== undefined) {
            ctx.strokeStyle = this.bdColor;
            // ctx.stroke();
        }
        ctx.stroke();
        if (select) {
            let points = [new Point2D(this.center.x - this.radius, this.center.y + 3), new Point2D(this.center.x + this.radius, this.center.y + 3)];
            selected_draw(ctx, points, color);
        }
        ctx.strokeStyle = oldStroke;
    }

    isInside(x: number, y: number): boolean {
        const area1 = Math.pow(x - this.center.x, 2) + Math.pow(y - this.center.y, 2);
        const area2 = Math.pow(this.radius, 2);
        return area1 - area2 <= 0;
    }

}

export class CircleFactory extends AbstractFactory<Circle> implements ShapeFactory {
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
    zOrder: number;
    bdColor: string;
    bgColor: string;
    clientId: number;
    selected: boolean;
    label = "Rectangle";

    constructor(readonly from: Point2D, readonly to: Point2D, id?: number, clientId?: number) {
        super(id);
        this.selected = false;
        this.clientId = clientId;

    }

    object() {
        let to = {};
        let from = {};
        let data = {};
        let shape = {};
        to["x"] = this.to.x;
        to["y"] = this.to.y;
        from["x"] = this.from.x;
        from["y"] = this.from.y;
        data["to"] = to;
        data["from"] = from;
        data["to"] = this.to;
        data["from"] = this.from;
        data["zOrder"] = this.zOrder;
        data["bgColor"] = this.bgColor;
        data["fgColor"] = this.bdColor;

        shape["type"] = "Rectangle";
        shape["id"] = this.id;
        shape["data"] = data;
        return shape;
    }

    toString(): string {
        let data = '{"from": ' + this.from.toString() + ",\n";
        data += '"to": ' + this.to.toString() + ",\n";
        data += '"zOrder": ' + this.zOrder + ",\n";
        data += '"bgColor": ' + this.bgColor + ",\n";
        data += '"fgColor": ' + this.bdColor + "\n}";
        let str = '{"type": "Rectangle",\n';
        str += '"id": ' + this.id + ',\n';
        str += '"data": ' + data + '\n}\n';
        return str;
    }

    draw(ctx: CanvasRenderingContext2D, select: boolean, color: string = 'red') {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        if (this.bdColor !== undefined) {
            ctx.strokeStyle = this.bdColor;
        }
        ctx.strokeRect(this.from.x, this.from.y,
            this.to.x - this.from.x, this.to.y - this.from.y);
        // ctx.stroke();
        if (this.bgColor !== undefined) {
            ctx.fillStyle = this.bgColor;
            // console.log("bgColor: ", this.bgColor);
            ctx.fillRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
            // ctx.fill();
            ctx.stroke();
        }
        if (select) {
            let points = [new Point2D(this.from.x, this.to.y), new Point2D(this.from.x, this.from.y), new Point2D(this.to.x, this.to.y), new Point2D(this.to.x, this.from.y)];
            selected_draw(ctx, points, color);
        }
        ctx.strokeStyle = oldStroke;


    }

    isInside(x: number, y: number): boolean {
        function minMax(a: number, b: number) {
            return a < b ? [a, b] : [b, a];
        }

        let [minX, maxX] = minMax(this.from.x, this.to.x);
        let [minY, maxY] = minMax(this.from.y, this.to.y);

        return (x >= minX && x <= maxX && y >= minY && y <= maxY);
    }
}

export class RectangleFactory extends AbstractFactory<Rectangle> implements ShapeFactory {
    public label: string = "Rechteck";

    constructor(shapeManager: ShapeManager) {
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Rectangle {
        return new Rectangle(from, to);
    }
}

class Triangle extends AbstractShape implements Shape {
    zOrder: number;
    bdColor: string;
    bgColor: string;
    clientId: number;
    selected: boolean;
    label = "Triangle";

    constructor(readonly p1: Point2D, readonly p2: Point2D, readonly p3: Point2D, id?: number, clientId?: number) {
        super(id);
        this.selected = false;
        this.clientId = clientId;
    }

    object() {
        let p1 = {};
        let p2 = {};
        let p3 = {};
        let data = {};
        let shape = {};
        p1["x"] = this.p1.x;
        p1["y"] = this.p1.y;
        p2["x"] = this.p2.x;
        p2["y"] = this.p2.y;
        p3["x"] = this.p3.x;
        p3["y"] = this.p3.y;

        data["p1"] = p1;
        data["p2"] = p2;
        data["p3"] = p3;

        data["p1"] = this.p1;
        data["p2"] = this.p2;
        data["p3"] = this.p3;


        data["zOrder"] = this.zOrder;
        data["bgColor"] = this.bgColor;
        data["fgColor"] = this.bdColor;

        shape["type"] = "Triangle";
        shape["id"] = this.id;
        shape["data"] = data;
        return shape;
    }

    toString(): string {
        let data = '{"p1": ' + this.p1.toString() + ",";
        data += '"p2": ' + this.p2.toString() + ",\n";
        data += '"p3": ' + this.p3.toString() + ",\n";
        data += '"zOrder": ' + this.zOrder + ",\n";
        data += '"bgColor": ' + this.bgColor + ",\n";
        data += '"fgColor": ' + this.bdColor + "\n}";
        let str = '{"type": "Triangle",\n';
        str += '"id": ' + this.id + ',\n';
        str += '"data": ' + data + '\n}\n';
        return str;
    }

    draw(ctx: CanvasRenderingContext2D, select: boolean, color: string = 'red') {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;

        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.lineTo(this.p3.x, this.p3.y);
        ctx.lineTo(this.p1.x, this.p1.y);

        if (this.bgColor !== undefined) {
            ctx.fillStyle = this.bgColor;
            ctx.fill();
        }

        if (this.bdColor !== undefined) {
            ctx.strokeStyle = this.bdColor;
            // ctx.stroke();
        }
        ctx.stroke();
        if (select) {
            let points = [new Point2D(this.p1.x, this.p1.y), new Point2D(this.p2.x, this.p2.y), new Point2D(this.p3.x, this.p3.y)];
            selected_draw(ctx, points, color);
        }
        ctx.strokeStyle = oldStroke;
    }

    ABxAC(a: Point2D, b: Point2D, c: Point2D): number {
        const ab = new Point2D(b.x - a.x, b.y - a.y);
        const ac = new Point2D(c.x - a.x, c.y - a.y);
        return ab.x * ac.y - ab.y * ac.x;
    }

    isInside(x: number, y: number): boolean {
        const p = new Point2D(x, y);
        const a = this.ABxAC(this.p1, this.p2, p) <= 0;
        const b = this.ABxAC(this.p2, this.p3, p) <= 0;
        const c = this.ABxAC(this.p3, this.p1, p) <= 0;

        return a === b && b === c;
    }
}

export class TriangleFactory implements ShapeFactory {
    public label: string = "Dreieck";

    private from: Point2D;
    private tmpTo: Point2D;
    private tmpLine: Line;
    private thirdPoint: Point2D;
    private tmpShape: Triangle;

    constructor(readonly shapeManager: ShapeManager) {
    }

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

export class ChooseShape implements ShapeFactory {
    move: boolean = false;
    private from: Point2D;
    private tmpTo: Point2D;
    public label: string = "Auswahl";
    movableShape: { [p: number]: Shape } = {};
    tmpMovableShape: { [p: number]: Shape } = {};

    constructor(readonly shapeManager: ShapeManager) {
    }

    handleMouseDown(x: number, y: number) {
        this.from = new Point2D(x, y);
        this.movableShape = this.shapeManager.chooseShapeAt(x, y, true);
        this.move = Object.keys(this.movableShape).length > 0;
        // console.log("Result of down: ", this.movableShape);
    }

    handleMouseUp(x: number, y: number) {
        this.movableShape = this.shapeManager.chooseShapeAt(x, y);
        this.move = undefined;
        this.from = undefined;
        // console.log("Resultof up: ", this.movableShape);
    }

    handleMouseMove(x: number, y: number) {
        this.tmpTo = new Point2D(x, y);
        if (this.move === true) {
            let diff = this.distance(this.from, this.tmpTo);
            for (let id of Object.keys(this.movableShape)) {
                let shape = this.createShape(diff.dx, diff.dy, this.movableShape[id]);
                // let shape = this.createShape(diff.dx, diff.dy, this.movableShape[id], +id);
                this.tmpMovableShape[shape.id] = shape;
                this.shapeManager.removeShapeWithId(+id, false, true);
                this.shapeManager.addShape(shape, false, true);
            }
            this.shapeManager.chooseShapeAt(x, y, true, this.tmpMovableShape);
            this.movableShape = this.tmpMovableShape;
            this.tmpMovableShape = {};

        } else {
            this.movableShape = this.shapeManager.chooseShapeAt(x, y);
        }
        this.from = this.tmpTo;
    }

    createShape(dx: number, dy: number, oldShape: Shape, ID?: number): Shape {
        let object = oldShape.object();
        let data = object.data;
        let shape: Shape;
        if (object.type === "Triangle") {
            let p1 = this.pointUpdate(data.p1, dx, dy);
            let p2 = this.pointUpdate(data.p2, dx, dy);
            let p3 = this.pointUpdate(data.p3, dx, dy);
            shape = new Triangle(p1, p2, p3, ID);
        } else if (object.type === "Circle") {
            let center = this.pointUpdate(data.center, dx, dy);
            shape = new Circle(center, data.radius, ID);
        } else {
            let to = this.pointUpdate(data.to, dx, dy);
            let from = this.pointUpdate(data.from, dx, dy);
            if (object.type === "Line") {
                shape = new Line(from, to, ID);
            } else if (object.type === "Rectangle") {
                shape = new Rectangle(from, to, ID);
            }
        }
        this.shapeUpdate(data, shape);
        return shape;
    }

    pointUpdate(point: Point2D, dx: number, dy: number): Point2D {
        return new Point2D(point.x + dx, point.y + dy);
    }

    shapeUpdate(oldShapeData: { [p: string]: any }, newShape: Shape) {
        newShape.zOrder = oldShapeData.zOrder;
        newShape.bdColor = oldShapeData.fgColor;
        newShape.bgColor = oldShapeData.bgColor;
        newShape.selected = true;
    }

    distance(from: Point2D, to: Point2D) {
        return {dx: to.x - from.x, dy: to.y - from.y};
    }

}

function selected_draw(ctx: CanvasRenderingContext2D, points: Point2D[], color: string) {
    const oldStroke = ctx.strokeStyle;
    const oldFillStroke = ctx.fillStyle;
    for (let i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.fillRect(points[i].x - 3, points[i].y - 3, 6, 6);
        ctx.stroke();
    }
    ctx.fillStyle = oldFillStroke;
    ctx.strokeStyle = oldStroke;

}


export {Point2D, Line, Triangle, Circle, Rectangle}
