class Point2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    toString() {
        return '{"x": ' + this.x + ', "y": ' + this.y + '}';
    }
}
class AbstractShape {
    // static bdColor: string;
    // static bgColor: string;
    constructor() {
        this.id = AbstractShape.counter++;
        // AbstractShape.bgColor = undefined;
        // AbstractShape.bdColor = undefined;
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
                // console.log("dsd");
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
        this.isDragging = false;
    }
    toString() {
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
        data["zOrder"] = this.zOrder;
        data["bgColor"] = this.bgColor;
        data["fgColor"] = this.bdColor;
        shape["type"] = "Line";
        shape["id"] = this.id;
        shape["data"] = data;
        return shape;
    }
    draw(ctx, select, color = 'red') {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        if (this.bdColor !== undefined) {
            ctx.strokeStyle = this.bdColor;
            // this.bdColor = undefined;
            // console.log("Line stroke bdColor: ", ctx.strokeStyle, oldStroke, this.bgColor);
        }
        else if (this.bgColor !== undefined) {
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
    isInside(x, y) {
        const point = this.from.x <= this.to.x ? [this.from, this.to] : [this.to, this.from];
        const numerator = Math.abs((this.to.y - this.from.y) * x - (this.to.x - this.from.x) * y + this.to.x * this.from.y - this.to.y * this.from.x);
        const denominator = Math.sqrt(Math.pow((this.to.y - this.from.y), 2) + Math.pow((this.to.x - this.from.x), 2));
        return numerator / denominator < 10;
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
        this.isDragging = false;
    }
    object() {
        let center = {};
        let from = {};
        let data = {};
        let shape = {};
        center["x"] = this.center.x;
        center["y"] = this.center.y;
        data["center"] = center;
        data["radius"] = this.radius;
        data["zOrder"] = this.zOrder;
        data["bgColor"] = this.bgColor;
        data["fgColor"] = this.bdColor;
        shape["type"] = "Circle";
        shape["id"] = this.id;
        shape["data"] = data;
        return shape;
    }
    toString() {
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
    draw(ctx, select, color = 'red') {
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
    isInside(x, y) {
        const area1 = Math.pow(x - this.center.x, 2) + Math.pow(y - this.center.y, 2);
        const area2 = Math.pow(this.radius, 2);
        return area1 - area2 <= 0;
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
        this.isDragging = false;
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
        data["zOrder"] = this.zOrder;
        data["bgColor"] = this.bgColor;
        data["fgColor"] = this.bdColor;
        shape["type"] = "Rectangle";
        shape["id"] = this.id;
        shape["data"] = data;
        return shape;
    }
    toString() {
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
    draw(ctx, select, color = 'red') {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        if (this.bdColor !== undefined) {
            ctx.strokeStyle = this.bdColor;
        }
        ctx.strokeRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
        // ctx.stroke();
        if (this.bgColor !== undefined) {
            ctx.fillStyle = this.bgColor;
            // console.log("bgColor: ", this.bgColor);
            ctx.fillRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
            // ctx.fill();
            ctx.stroke();
        }
        // if (this.bdColor !== undefined) {
        //     ctx.strokeStyle = this.bdColor;
        //     // ctx.strokeRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
        //     ctx.stroke();
        // }
        if (select) {
            let points = [new Point2D(this.from.x, this.to.y), new Point2D(this.from.x, this.from.y), new Point2D(this.to.x, this.to.y), new Point2D(this.to.x, this.from.y)];
            selected_draw(ctx, points, color);
        }
        ctx.strokeStyle = oldStroke;
    }
    isInside(x, y) {
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
        this.isDragging = false;
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
        data["zOrder"] = this.zOrder;
        data["bgColor"] = this.bgColor;
        data["fgColor"] = this.bdColor;
        shape["type"] = "Triangle";
        shape["id"] = this.id;
        shape["data"] = data;
        return shape;
    }
    toString() {
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
    draw(ctx, select, color = 'red') {
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
    ABxAC(a, b, c) {
        const ab = new Point2D(b.x - a.x, b.y - a.y);
        const ac = new Point2D(c.x - a.x, c.y - a.y);
        return ab.x * ac.y - ab.y * ac.x;
    }
    isInside(x, y) {
        const p = new Point2D(x, y);
        const a = this.ABxAC(this.p1, this.p2, p) <= 0;
        const b = this.ABxAC(this.p2, this.p3, p) <= 0;
        const c = this.ABxAC(this.p3, this.p1, p) <= 0;
        return a === b && b === c;
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
export class ChooseShape {
    // tmpMovableShape: { [p: number]: Shape } ;
    constructor(shapeManager) {
        this.shapeManager = shapeManager;
        // export class ChooseShape implements ShapeFactory {
        this.label = "Auswahl";
        this.move = false;
        this.movableShape = {};
        this.tmpMovableShape = {};
        // super(shapeManager);
    }
    handleMouseDown(x, y) {
        this.from = new Point2D(x, y);
        // this.shapeManager.chooseShapeAt(x, y, false,);
        this.movableShape = this.shapeManager.chooseShapeAt(x, y, true, "down");
        for (let id of Object.keys(this.movableShape)) {
            // if (this.movableShape.hasOwnProperty(id)) {
            // let id = Number(i);
            this.movableShape[id].isDragging = true;
            let object = this.movableShape[id].object();
            console.log("Result of up id: ", id, typeof id, object.type);
            this.move = true;
            // }
        }
        console.log("Result of down: ", this.movableShape);
    }
    handleMouseUp(x, y) {
        this.shapeManager.chooseShapeAt(x, y, false, "up");
        // for (let id in this.movableShape) {
        //     if (this.movableShape.hasOwnProperty(id)) {
        //         // let id = Number(i);
        //         this.movableShape[id].isDragging = true;
        //         let object = this.movableShape[id].object();
        //         console.log("Result of up id: ", id, typeof id, object.type);
        //     }
        // }
        if (this.move) {
            for (let id of Object.keys(this.tmpMovableShape)) {
                this.shapeManager.removeShapeWithId(+id, false);
            }
            console.log("Tempo shapüe:", this.tmpMovableShape, this.movableShape);
            this.tmpMovableShape = {};
            console.log("Tempo shape:", this.tmpMovableShape, this.movableShape);
            let diff = this.diff(this.from, this.tmpTo);
            for (let id of Object.keys(this.movableShape)) {
                let shape = this.createShape(diff.dx, diff.dy, this.movableShape[id]);
                this.tmpMovableShape[shape.id] = shape;
                this.shapeManager.addShape(shape);
                // this.shapeManager.removeShapeWithId(+id, false);
            }
            // for (let id of Object.keys(this.movableShape)) {
            //     this.shapeManager.removeShapeWithId(+id, true);
            // }
            console.log("TEMP SHAPE: ", this.tmpMovableShape, this.movableShape);
            this.movableShape = this.tmpMovableShape;
            console.log("TEMP SHAPE: ", this.tmpMovableShape, this.movableShape);
        }
        this.move = false;
        this.from = undefined;
        console.log("Resultof up: ", this.movableShape);
    }
    handleMouseMove(x, y) {
        this.tmpTo = new Point2D(x, y);
        this.shapeManager.chooseShapeAt(x, y, false);
        if (this.move) {
            for (let id of Object.keys(this.tmpMovableShape)) {
                this.shapeManager.removeShapeWithId(+id, false);
            }
            console.log("Tempo shapüe:", this.tmpMovableShape, this.movableShape);
            this.tmpMovableShape = {};
            console.log("Tempo shape:", this.tmpMovableShape, this.movableShape);
            let diff = this.diff(this.from, this.tmpTo);
            for (let id of Object.keys(this.movableShape)) {
                let shape = this.createShape(diff.dx, diff.dy, this.movableShape[id]);
                this.tmpMovableShape[shape.id] = shape;
                this.shapeManager.addShape(shape);
                // this.shapeManager.removeShapeWithId(+id, false);
            }
            // for (let id of Object.keys(this.movableShape)) {
            //     this.shapeManager.removeShapeWithId(+id, true);
            // }
            console.log("TEMP SHAPE: ", this.tmpMovableShape, this.movableShape);
            // let tmp = this.movableShape;
            this.movableShape = this.tmpMovableShape;
            console.log("TEMP SHAPE: ", this.tmpMovableShape, this.movableShape);
            // this.tmpMovableShape = {};
        }
        this.from = this.tmpTo;
    }
    createShape(dx, dy, oldShape) {
        let object = oldShape.object();
        let data = object.data;
        let shape = undefined;
        // console.log("Create Shape: ", oldShape);
        if (object.type === "Triangle") {
            console.log("Triangle :");
            let p1 = this.pointUpdate(data.p1, dx, dy);
            let p2 = this.pointUpdate(data.p2, dx, dy);
            let p3 = this.pointUpdate(data.p3, dx, dy);
            shape = new Triangle(p1, p2, p3);
        }
        else if (object.type === "Circle") {
            console.log("Circle :");
            let center = this.pointUpdate(data.center, dx, dy);
            shape = new Circle(center, data.radius);
        }
        else {
            let to = this.pointUpdate(data.to, dx, dy);
            let from = this.pointUpdate(data.from, dx, dy);
            if (object.type === "Line") {
                // console.log("Line :",);
                shape = new Line(from, to);
            }
            else if (object.type === "Rectangle") {
                shape = new Rectangle(from, to);
            }
        }
        // console.log("Data line: ", data);
        this.shapeUpdate(data, shape);
        return shape;
    }
    pointUpdate(point, dx, dy) {
        return new Point2D(point.x + dx, point.y + dy);
    }
    shapeUpdate(oldShapeData, newShape) {
        // console.log("old shape: ", newShape, oldShapeData, "okay");
        newShape.zOrder = oldShapeData.zOrder;
        newShape.bdColor = oldShapeData.fgColor;
        newShape.bgColor = oldShapeData.bgColor;
        newShape.isDragging = oldShapeData.isDragging;
        // console.log("New shape: ", newShape);
    }
    diff(from, to) {
        return { dx: to.x - from.x, dy: to.y - from.y };
    }
}
function selected_draw(ctx, points, color) {
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
//# sourceMappingURL=Shapes.js.map