var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var canvasWidth = 600, canvasHeight = 400;
var Point2D = /** @class */ (function () {
    function Point2D(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point2D;
}());
var AbstractShape = /** @class */ (function () {
    function AbstractShape() {
        this.id = AbstractShape.counter++;
    }
    AbstractShape.counter = 0;
    return AbstractShape;
}());
var AbstractFactory = /** @class */ (function () {
    function AbstractFactory(shapeManager) {
        this.shapeManager = shapeManager;
    }
    AbstractFactory.prototype.handleMouseDown = function (x, y) {
        this.from = new Point2D(x, y);
    };
    AbstractFactory.prototype.handleMouseUp = function (x, y) {
        // remove the temp line, if there was one
        if (this.tmpShape) {
            this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
        }
        this.shapeManager.addShape(this.createShape(this.from, new Point2D(x, y)));
        this.from = undefined;
    };
    AbstractFactory.prototype.handleMouseMove = function (x, y) {
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
    };
    return AbstractFactory;
}());
// Linie
var LineFactory = /** @class */ (function (_super) {
    __extends(LineFactory, _super);
    function LineFactory(shapeManager) {
        var _this = _super.call(this, shapeManager) || this;
        _this.label = "Linie";
        return _this;
    }
    LineFactory.prototype.createShape = function (from, to) {
        // [rv] order lines by x-coordinate
        if (from.x < to.x) {
            return new Line(from, to);
        }
        else {
            return new Line(to, from);
        }
    };
    return LineFactory;
}(AbstractFactory));
var Circle = /** @class */ (function (_super) {
    __extends(Circle, _super);
    function Circle(center, radius) {
        var _this = _super.call(this) || this;
        _this.center = center;
        _this.radius = radius;
        return _this;
    }
    Circle.prototype.draw = function (ctx, select, strokeColour) {
        ctx.beginPath();
        var oldStroke = ctx.strokeStyle;
        var oldWidth = ctx.lineWidth;
        if (select && strokeColour) {
            if (strokeColour === 500) {
                ctx.strokeStyle = 'hsl(0, 0%, 0%)';
            }
            else {
                ctx.strokeStyle = 'hsl(' + strokeColour + ', 80%, 40%)';
                ctx.shadowBlur = 7;
            }
            ctx.lineWidth = 1;
            ctx.strokeRect(this.center.x + this.radius - 4, this.center.y - 4, 8, 8);
            ctx.strokeRect(this.center.x - this.radius - 4, this.center.y - 4, 8, 8);
            ctx.strokeRect(this.center.x - 4, this.center.y - this.radius - 4, 8, 8);
            ctx.strokeRect(this.center.x - 4, this.center.y + this.radius - 4, 8, 8);
            if (strokeColour === 500) {
                ctx.lineWidth = 3;
            }
        }
        ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    };
    Circle.prototype.move = function (x, y) {
        var pointNearCenter = Math.pow(x - this.center.x, 2) + Math.pow(y - this.center.y, 2);
        var circleArea = Math.pow(this.radius, 2);
        return pointNearCenter <= circleArea;
    };
    return Circle;
}(AbstractShape));
// Kreis
var CircleFactory = /** @class */ (function (_super) {
    __extends(CircleFactory, _super);
    function CircleFactory(shapeManager) {
        var _this = _super.call(this, shapeManager) || this;
        _this.label = "Kreis";
        return _this;
    }
    CircleFactory.prototype.createShape = function (from, to) {
        return new Circle(from, CircleFactory.computeRadius(from, to.x, to.y));
    };
    CircleFactory.computeRadius = function (from, x, y) {
        var xDiff = (from.x - x), yDiff = (from.y - y);
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    };
    return CircleFactory;
}(AbstractFactory));
var Rectangle = /** @class */ (function (_super) {
    __extends(Rectangle, _super);
    function Rectangle(from, to) {
        var _this = _super.call(this) || this;
        _this.from = from;
        _this.to = to;
        return _this;
    }
    Rectangle.prototype.draw = function (ctx, select, strokeColour) {
        ctx.beginPath();
        var oldStroke = ctx.strokeStyle;
        var oldWidth = ctx.lineWidth;
        if (select && strokeColour) {
            if (strokeColour === 500) {
                ctx.strokeStyle = 'hsl(0, 0%, 0%)';
            }
            else {
                ctx.shadowBlur = 7;
                ctx.strokeStyle = 'hsl(' + strokeColour + ', 80%, 40%)';
            }
            ctx.lineWidth = 1;
            ctx.strokeRect(this.from.x - 4, this.from.y - 4, 8, 8);
            ctx.strokeRect(this.from.x - 4, this.to.y - 4, 8, 8);
            ctx.strokeRect(this.to.x - 4, this.from.y - 4, 8, 8);
            ctx.strokeRect(this.to.x - 4, this.to.y - 4, 8, 8);
            if (strokeColour === 500) {
                ctx.lineWidth = 3;
            }
        }
        ctx.strokeRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    };
    Rectangle.prototype.move = function (x, y) {
        return (x >= this.from.x && x <= this.to.x && y >= this.from.y && y <= this.to.y);
    };
    return Rectangle;
}(AbstractShape));
//Rechteck
var RectangleFactory = /** @class */ (function (_super) {
    __extends(RectangleFactory, _super);
    function RectangleFactory(shapeManager) {
        var _this = _super.call(this, shapeManager) || this;
        _this.label = "Rechteck";
        return _this;
    }
    RectangleFactory.prototype.createShape = function (from, to) {
        // [rv] order rectangles by x-coordinate
        if (from.x < to.x || from.y < to.y) {
            return new Rectangle(from, to);
        }
        else {
            return new Rectangle(to, from);
        }
    };
    return RectangleFactory;
}(AbstractFactory));
var Triangle = /** @class */ (function (_super) {
    __extends(Triangle, _super);
    function Triangle(p1, p2, p3) {
        var _this = _super.call(this) || this;
        _this.p1 = p1;
        _this.p2 = p2;
        _this.p3 = p3;
        return _this;
    }
    Triangle.prototype.draw = function (ctx, select, strokeColour) {
        ctx.beginPath();
        var oldStroke = ctx.strokeStyle;
        var oldWidth = ctx.lineWidth;
        if (select && strokeColour) {
            if (strokeColour === 500) {
                ctx.strokeStyle = 'hsl(0, 0%, 0%)';
            }
            else {
                ctx.strokeStyle = 'hsl(' + strokeColour + ', 80%, 40%)';
                ctx.shadowBlur = 7;
            }
            ctx.lineWidth = 1;
            ctx.strokeRect(this.p1.x - 4, this.p1.y - 4, 8, 8);
            ctx.strokeRect(this.p2.x - 4, this.p2.y - 4, 8, 8);
            ctx.strokeRect(this.p3.x - 4, this.p3.y - 4, 8, 8);
            if (strokeColour === 500) {
                ctx.lineWidth = 3;
            }
        }
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.lineTo(this.p3.x, this.p3.y);
        ctx.lineTo(this.p1.x, this.p1.y);
        ctx.stroke();
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    };
    Triangle.prototype.checkSign = function (p1x, p1y, p2, p3) {
        return (p1x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1y - p3.y);
    };
    Triangle.prototype.move = function (x, y) {
        var b1 = this.checkSign(x, y, this.p1, this.p2) < 0.0;
        var b2 = this.checkSign(x, y, this.p2, this.p3) < 0.0;
        var b3 = this.checkSign(x, y, this.p3, this.p1) < 0.0;
        return ((b1 === b2) && (b2 === b3));
    };
    return Triangle;
}(AbstractShape));
//Dreieck
var TriangleFactory = /** @class */ (function () {
    function TriangleFactory(shapeManager) {
        this.shapeManager = shapeManager;
        this.label = "Dreieck";
    }
    TriangleFactory.prototype.handleMouseDown = function (x, y) {
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
    };
    TriangleFactory.prototype.handleMouseUp = function (x, y) {
        // remove the temp line, if there was one
        if (this.tmpLine) {
            this.shapeManager.removeShapeWithId(this.tmpLine.id, false);
            this.tmpLine = undefined;
            this.tmpTo = new Point2D(x, y);
            this.thirdPoint = new Point2D(x, y);
            this.tmpShape = new Triangle(this.from, this.tmpTo, this.thirdPoint);
            this.shapeManager.addShape(this.tmpShape);
        }
    };
    TriangleFactory.prototype.handleMouseMove = function (x, y) {
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
    };
    return TriangleFactory;
}());
// Auswahl
var SelectShape = /** @class */ (function () {
    function SelectShape(shapeManager) {
        this.shapeManager = shapeManager;
        this.label = "Selektion";
    }
    SelectShape.prototype.handleMouseDown = function (x, y) {
    };
    SelectShape.prototype.handleMouseUp = function (x, y) {
        this.shapeManager.selectShapeAt(x, y, true);
    };
    SelectShape.prototype.handleMouseMove = function (x, y) {
        this.shapeManager.selectShapeAt(x, y);
    };
    return SelectShape;
}());
var Line = /** @class */ (function (_super) {
    __extends(Line, _super);
    function Line(from, to) {
        var _this = _super.call(this) || this;
        _this.from = from;
        _this.to = to;
        return _this;
    }
    Line.prototype.draw = function (ctx, select, strokeColour) {
        ctx.beginPath();
        var oldStroke = ctx.strokeStyle;
        var oldWidth = ctx.lineWidth;
        if (select && strokeColour) {
            if (strokeColour === 500) {
                ctx.strokeStyle = 'hsl(0, 0%, 0%)';
            }
            else {
                ctx.strokeStyle = 'hsl(' + strokeColour + ', 80%, 40%)';
                ctx.shadowBlur = 7;
            }
            ctx.lineWidth = 1;
            ctx.strokeRect(this.from.x - 4, this.from.y - 4, 8, 8);
            ctx.strokeRect(this.to.x - 4, this.to.y - 4, 8, 8);
            if (strokeColour === 500) {
                ctx.lineWidth = 3;
            }
        }
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();
        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    };
    Line.prototype.move = function (x, y) {
        // account for tolerance
        var fakeFrom = new Point2D(this.from.x - 10, this.from.y + 10);
        var fakeTo = new Point2D(this.to.x + 10, this.to.y - 10);
        if (this.from.y < this.to.y) {
            fakeFrom = new Point2D(this.from.x - 10, this.from.y - 10);
            fakeTo = new Point2D(this.to.x + 10, this.to.y + 10);
        }
        // check for collision out of bounds
        if (x < fakeFrom.x || x > fakeTo.x)
            return false;
        var numerator = Math.abs((this.to.y - this.from.y) * x - (this.to.x - this.from.x) * y + this.to.x * this.from.y - this.to.y * this.from.x);
        var denominator = Math.sqrt(Math.pow((this.to.y - this.from.y), 2) + Math.pow((this.to.x - this.from.x), 2));
        var absDistance = parseFloat((numerator / denominator).toPrecision(2));
        return absDistance <= 15.0;
    };
    return Line;
}(AbstractShape));
////////////////////
var Shapes = /** @class */ (function () {
    function Shapes() {
    }
    return Shapes;
}());
var ToolArea = /** @class */ (function () {
    function ToolArea(shapesSelector, menue) {
        var _this = this;
        this.selectedShape = undefined;
        var domElms = [];
        shapesSelector.forEach(function (sl) {
            var domSelElement = document.createElement("li");
            domSelElement.innerText = sl.label;
            menue.appendChild(domSelElement);
            domElms.push(domSelElement);
            domSelElement.addEventListener("click", function () {
                selectFactory.call(_this, sl, domSelElement);
            });
        });
        function selectFactory(sl, domElm) {
            // remove class from all elements
            for (var j = 0; j < domElms.length; j++) {
                domElms[j].classList.remove("marked");
            }
            this.selectedShape = sl;
            // add class to the one that is selected currently
            domElm.classList.add("marked");
        }
    }
    ToolArea.prototype.getSelectedShape = function () {
        return this.selectedShape;
    };
    return ToolArea;
}());
var Canvas = /** @class */ (function () {
    function Canvas(canvasDomElement, toolarea) {
        this.shapes = {};
        this.selectedShapes = [];
        this.cntrlIsPressed = false;
        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove", createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown", createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup", createMouseHandler("handleMouseUp"));
        var self = this;
        var delButton = document.querySelector('#delSelect');
        delButton.addEventListener("click", function () {
            self.removeSelectedShapes();
        });
        document.addEventListener("keydown", function (e) {
            if (e.keyCode === 17) {
                self.cntrlIsPressed = true;
            }
            else if (e.keyCode === 46) {
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
        function createMouseHandler(methodName) {
            return function (e) {
                e = e || window.event;
                if ('object' === typeof e) {
                    var btnCode = e.button, x = e.pageX - this.offsetLeft, y = e.pageY - this.offsetTop, ss = toolarea.getSelectedShape();
                    // if left mouse button is pressed,
                    // and if a tool is selected, do something
                    if (e.button === 0 && ss) {
                        var m = ss[methodName];
                        // This in the shapeFactory should be the factory itself.
                        m.call(ss, x, y);
                    }
                }
            };
        }
    }
    Canvas.prototype.draw = function () {
        // TODO: is there a better way to reset the canvas?
        // DONE: use clearRect
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        // not needed?
        // this.ctx.beginPath();
        // this.ctx.stroke();
        // draw shapes
        for (var id in this.shapes) {
            this.shapes[id].draw(this.ctx);
        }
        return this;
    };
    Canvas.prototype.addShape = function (shape, redraw) {
        if (redraw === void 0) { redraw = true; }
        this.shapes[shape.id] = shape;
        return redraw ? this.draw() : this;
    };
    Canvas.prototype.removeShape = function (shape, redraw) {
        if (redraw === void 0) { redraw = true; }
        var id = shape.id;
        delete this.shapes[id];
        return redraw ? this.draw() : this;
    };
    Canvas.prototype.removeShapeWithId = function (id, redraw) {
        if (redraw === void 0) { redraw = true; }
        delete this.shapes[id];
        return redraw ? this.draw() : this;
    };
    Canvas.prototype.removeSelectedShapes = function () {
        for (var i = 0; i < this.selectedShapes.length; i++) {
            this.removeShapeWithId(this.selectedShapes[i]);
        }
        this.selectedShapes = [];
    };
    Canvas.prototype.selectShapeAt = function (x, y, doSelect) {
        if (doSelect === void 0) { doSelect = false; }
        // this.draw would only redraw canvas, but we need to redraw the shape
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        var selectableShapes = [];
        // need the index too, in this case...
        var self = this;
        Object.keys(this.shapes).forEach(function (id, index) {
            // for (let id in this.shapes) {
            if (!self.shapes[id].move(x, y)) {
                self.shapes[id].draw(self.ctx);
            }
            else {
                // @ts-ignore
                selectableShapes.push(id);
                // actually draw the shape
                // (id * 13) % 360 --> account for 360 different colours in 27 steps
                var nextCol = ((index + 1) * 13) % 360;
                self.shapes[id].draw(self.ctx, true, nextCol);
            }
        });
        if (doSelect && selectableShapes.length > 0) {
            if (this.selectedShapes.length === 0) {
                this.selectedShapes.push(selectableShapes[0]);
            }
            else {
                // load last selected element
                var lastSel = this.selectedShapes[this.selectedShapes.length - 1];
                // check for ctrl-key being pressed
                if (!this.cntrlIsPressed) {
                    this.selectedShapes = [];
                }
                // choose next
                var curIn = selectableShapes.lastIndexOf(lastSel);
                // selected shape is not part of selectables push first new
                if (curIn < 0) {
                    this.selectedShapes.push(selectableShapes[0]);
                }
                else {
                    curIn++;
                    if (selectableShapes.length <= curIn) {
                        curIn %= selectableShapes.length;
                    }
                    this.selectedShapes.push(selectableShapes[curIn]);
                }
            }
        }
        // put emphasis on elected elements
        var i = 0;
        for (i; i < this.selectedShapes.length; i++) {
            this.shapes[this.selectedShapes[i]].draw(this.ctx, true, 500);
        }
        ;
        return this;
    };
    return Canvas;
}());
function init() {
    var canvasDomElm = document.getElementById("drawArea");
    var menu = document.getElementsByClassName("tools");
    // Problem here: Factories needs a way to create new Shapes, so they
    // have to call a method of the canvas.
    // The canvas on the other side wants to call the event methods
    // on the toolbar, because the toolbar knows what tool is currently
    // selected.
    // Anyway, we do not want the two to have references on each other
    var canvas;
    var sm = {
        addShape: function (s, rd) {
            return canvas.addShape(s, rd);
        },
        removeShape: function (s, rd) {
            return canvas.removeShape(s, rd);
        },
        removeShapeWithId: function (id, rd) {
            return canvas.removeShapeWithId(id, rd);
        },
        selectShapeAt: function (x, y, rd) {
            return canvas.selectShapeAt(x, y, rd);
        }
    };
    var shapesSelector = [
        new LineFactory(sm),
        new CircleFactory(sm),
        new RectangleFactory(sm),
        new TriangleFactory(sm),
        new SelectShape(sm)
    ];
    var toolArea = new ToolArea(shapesSelector, menu[0]);
    canvas = new Canvas(canvasDomElm, toolArea);
    canvas.draw();
}
