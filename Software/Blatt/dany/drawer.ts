import {MenuApi, MenuItem} from './api.js';

const Selected = 'Selected';
//const SelectedColor = 'rgb(33, 230, 89)';
const SelectedColor = '#8b008b';
const Hover = 'Hover';
//const HoverColor = 'rgb(16, 114, 44)';
const HoverColor = '#ff8c00';

interface Shape {
    readonly id: number;
    backgroundColor: string;
    borderColor:string;
    draw(ctx: CanvasRenderingContext2D, select?:boolean, selectedFarbe?:string);
    collider(x: number, y: number); // check, ob eine shape in collision steht.
}

interface ShapeManager {
    addShape(shape: Shape, redraw?: boolean): this;
    removeShape(shape: Shape, redraw?: boolean): this;
    removeShapeWithId(id: number, redraw?: boolean): this;
    selectShapeFor(x: number, y: number, setSelect?: boolean): this;
}

interface ShapeFactory {
    label: string;
    handleMouseDown(x: number, y: number);
    handleMouseUp(x: number, y: number);
    handleMouseMove(x: number, y: number);
}



class Point2D {
    constructor(readonly x: number, readonly y: number) {}
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

    constructor(readonly shapeManager: ShapeManager) {}

    abstract createShape(from: Point2D, to: Point2D): T;

    handleMouseDown(x: number, y: number) {
        this.from = new Point2D(x, y);
    }

    handleMouseUp(x: number, y: number) {
        // remove the temp line, if there was one
        if (this.tmpShape) {
            this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
        }
        this.shapeManager.addShape(this.createShape(this.from, new Point2D(x,y)));
        this.from = undefined;

    }

    handleMouseMove(x: number, y: number) {
        // show temp circle only, if the start point is defined;
        if (!this.from) {
            return;
        }
        if (!this.tmpTo || (this.tmpTo.x !== x || this.tmpTo.y !== y)) {
            this.tmpTo = new Point2D(x,y);
            if (this.tmpShape) {
                // remove the old temp line, if there was one
                this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
            }
            // adds a new temp line
            this.tmpShape = this.createShape(this.from, new Point2D(x,y));
            this.shapeManager.addShape(this.tmpShape);
        }
    }

}

export class Line extends AbstractShape implements Shape {
    backgroundColor: string;
    borderColor: string;
    constructor(readonly from: Point2D, readonly to: Point2D){
        super();
    }

    draw(ctx: CanvasRenderingContext2D, select?: boolean, selectedFarbe?: string)  {
        ctx.beginPath();
        const oldStroke = ctx.strokeStyle;
        const oldWidth = ctx.lineWidth;
        if(select && selectedFarbe) {
            if(selectedFarbe === Selected) {
                ctx.strokeStyle = SelectedColor;
            } else {
                ctx.strokeStyle = HoverColor;
                ctx.shadowBlur = 2;
            }
            ctx.lineWidth = 1;
            ctx.fillStyle = SelectedColor;
            ctx.fillRect(this.from.x - 4, this.from.y - 4 ,8, 8);
            ctx.fillRect(this.to.x - 4, this.to.y - 4 ,8, 8);
        }
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();

        if(this.backgroundColor !== undefined){
            ctx.strokeStyle = this.backgroundColor;
            ctx.stroke();
        }
        if(this.borderColor !== undefined ){
            ctx.strokeStyle = this.borderColor;
            ctx.stroke();
        }

        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }
    collider(x: number, y: number) {

        //Berücksichtigung der Tolerance
        let dudFrom: Point2D = new Point2D(this.from.x - 10, this.from.y + 10);
        let dudTo: Point2D = new Point2D(this.to.x + 10, this.to.y - 10);
        if (this.from.y < this.to.y) {
            dudFrom = new Point2D(this.from.x - 10, this.from.y - 10);
            dudTo = new Point2D(this.to.x + 10, this.to.y + 10);
        }

        //Prüfung auf Kollision außerhalb der Grenzen
        if(x < dudFrom.x || x > dudTo.x) return false;

        const zaehler: number = Math.abs((this.to.y - this.from.y) * x  -  (this.to.x - this.from.x) * y  +  this.to.x*this.from.y - this.to.y *this.from.x);
        const nenner: number = Math.sqrt( Math.pow((this.to.y - this.from.y), 2) +  Math.pow((this.to.x - this.from.x), 2) );
        const dist: number = parseFloat(( zaehler / nenner).toPrecision(2));
        return dist <= 15.0;

    }






}
export class LineFactory extends  AbstractFactory<Line> implements ShapeFactory {

    public label: string = "Linie";

    constructor(shapeManager: ShapeManager){
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Line {
        return new Line(from, to);
    }

}
class Circle extends AbstractShape implements Shape {
    backgroundColor:string;
    borderColor: string;
    constructor(readonly center: Point2D, readonly radius: number){
        super();
    }
    draw(ctx: CanvasRenderingContext2D,select?: boolean, selectedFarbe?: string) {
        ctx.beginPath();

        const oldStroke = ctx.strokeStyle;
        const oldWidth  = ctx.lineWidth;
        if(select && selectedFarbe) {
            if(selectedFarbe === Selected) {
                ctx.strokeStyle = SelectedColor;
            } else {
                ctx.strokeStyle = HoverColor;
                ctx.shadowBlur = 2;
            }
            ctx.lineWidth = 1;
            ctx.fillStyle = SelectedColor;
            ctx.fillRect(this.center.x + this.radius - 4, this.center.y - 4 ,8, 8);
            ctx.fillRect(this.center.x - this.radius - 4, this.center.y - 4 ,8, 8);
            ctx.fillRect(this.center.x - 4, this.center.y - this.radius - 4 ,8, 8);
            ctx.fillRect(this.center.x - 4, this.center.y + this.radius - 4 ,8, 8);


        }
        ctx.arc(this.center.x,this.center.y,this.radius,0,2*Math.PI);
        ctx.stroke();
        if(this.backgroundColor !== undefined){
            ctx.fillStyle = this.backgroundColor;
            ctx.fill();
        }
        if(this.borderColor !== undefined ){
            ctx.strokeStyle = this.borderColor;
            ctx.stroke();
        }

        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }
    collider(x: number, y: number) {
        const pointNearCenter = Math.pow(x - this.center.x, 2) + Math.pow(y - this.center.y, 2);
        const circleArea = Math.pow(this.radius,2);
        return pointNearCenter <= circleArea;
    }
}
export class CircleFactory extends AbstractFactory<Circle> implements ShapeFactory {
    public label: string = "Kreis";

    constructor(shapeManager: ShapeManager){
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
    backgroundColor:string;
    borderColor: string;
    constructor(readonly from: Point2D, readonly to: Point2D) {
        super();
    }

    draw(ctx: CanvasRenderingContext2D, select?:boolean, selectedFarbe?: string) {
        ctx.beginPath();

        const oldStroke = ctx.strokeStyle;
        const oldWidth  = ctx.lineWidth;
        if(select && selectedFarbe) {
            if(selectedFarbe === Selected) {
                ctx.strokeStyle = SelectedColor;
            } else {
                ctx.strokeStyle = HoverColor;
                ctx.shadowBlur = 2;
            }
            ctx.lineWidth = 1;
            ctx.fillStyle = SelectedColor;
            ctx.fillRect(this.from.x - 4, this.from.y - 4 ,8, 8);
            ctx.fillRect(this.from.x - 4, this.to.y - 4 ,8, 8);
            ctx.fillRect(this.to.x - 4, this.from.y - 4 ,8, 8);
            ctx.fillRect(this.to.x - 4, this.to.y - 4 ,8, 8);
        }

        ctx.strokeRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
        ctx.stroke();
        if(this.backgroundColor !== undefined ){
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
        }

        if(this.borderColor !== undefined ){
            ctx.strokeStyle = this.borderColor;
            ctx.strokeRect(this.from.x, this.from.y, this.to.x - this.from.x, this.to.y - this.from.y);
            ctx.stroke();
        }

        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }
    collider(x: number, y: number) {
        return (x >= this.from.x && x <= this.to.x && y >= this.from.y && y <= this.to.y);
    }
}
export class RectangleFactory extends AbstractFactory<Rectangle> implements ShapeFactory{
    public label: string = "Rechteck";
    constructor(shapeManager: ShapeManager){
        super(shapeManager);
    }

    createShape(from: Point2D, to: Point2D): Rectangle {
        return new Rectangle(from, to);
    }
}
class Triangle extends AbstractShape implements Shape {
    backgroundColor:string;
    borderColor: string;

    constructor(readonly p1: Point2D, readonly p2: Point2D, readonly p3: Point2D) {
        super();
    }
    calculateSign (p1x, p1y, p2, p3) {
        return (p1x - p3.x + 10) * (p2.y - p3.y + 10) - (p2.x - p3.x + 10) * (p1y - p3.y + 10);
    }
    draw(ctx: CanvasRenderingContext2D, select?:boolean, selectedFarbe?:string) {
        ctx.beginPath();

        const oldStroke = ctx.strokeStyle;
        const oldWidth  = ctx.lineWidth;
        if(select && selectedFarbe) {
            if(selectedFarbe === Selected) {
                ctx.strokeStyle = SelectedColor;
            } else {
                ctx.strokeStyle = HoverColor;
                ctx.shadowBlur = 2;
            }
            ctx.lineWidth = 1;
            ctx.fillStyle = SelectedColor;
            ctx.fillRect(this.p1.x - 4, this.p1.y - 4 ,8, 8);
            ctx.fillRect(this.p2.x - 4, this.p2.y - 4 ,8, 8);
            ctx.fillRect(this.p3.x - 4, this.p3.y - 4 ,8, 8);
        }

        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.lineTo(this.p3.x, this.p3.y);
        ctx.lineTo(this.p1.x, this.p1.y);
        ctx.stroke();

        if(this.backgroundColor !== undefined ){
            ctx.fillStyle = this.backgroundColor;
            ctx.fill();
        }

        if(this.borderColor !== undefined ){
            ctx.strokeStyle = this.borderColor;
            ctx.stroke();
        }

        ctx.strokeStyle = oldStroke;
        ctx.lineWidth = oldWidth;
        ctx.shadowBlur = 0;
    }
    collider(x: number, y: number) {
        const b1 = this.calculateSign(x, y, this.p1, this.p2) < 0;
        const b2 = this.calculateSign(x, y, this.p2, this.p3) < 0;
        const b3 = this.calculateSign(x, y, this.p3, this.p1) < 0;

        return ((b1 === b2) && (b2 === b3));
    }
}
export class TriangleFactory implements ShapeFactory{
    public label: string = "Dreieck";

    private from: Point2D;
    private tmpTo: Point2D;
    private tmpLine: Line;
    private thirdPoint: Point2D;
    private tmpShape: Triangle;

    constructor(readonly shapeManager: ShapeManager) {}

    handleMouseDown(x: number, y: number) {
        if (this.tmpShape) {
            this.shapeManager.removeShapeWithId(this.tmpShape.id, false);
            this.shapeManager.addShape(
                new Triangle(this.from, this.tmpTo, new Point2D(x,y)));
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
            this.tmpTo = new Point2D(x,y);
            this.thirdPoint = new Point2D(x,y);
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
                this.thirdPoint = new Point2D(x,y);
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
                this.tmpTo = new Point2D(x,y);
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
export class SelectionFactory implements ShapeFactory{
    public label: string = "Selection";

    constructor(readonly shapeManager: ShapeManager) {
    }

    handleMouseDown(x: number, y: number) {
    }

    handleMouseUp(x: number, y: number) {
        this.shapeManager.selectShapeFor(x, y, true);
    }
    handleMouseMove(x: number, y: number) {
        this.shapeManager.selectShapeFor(x, y);
    }
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

export class Canvas implements ShapeManager {
    private ctx: CanvasRenderingContext2D;
    private shapes: {[p: number]: Shape} = {};
    private width: number;
    private height: number;
    private ismarked: boolean = false;
    private iterated: boolean = false;
    //private fillcolor:string;
    private allSelectedShapes: number[] = [];

    constructor(canvasDomElement?: HTMLCanvasElement,
                toolarea?: ToolArea) {
        let self = this;
        const { width, height} = canvasDomElement.getBoundingClientRect();
        this.width = width;
        this.height = height;
        this.ctx = canvasDomElement.getContext("2d");
        canvasDomElement.addEventListener("mousemove",
            createMouseHandler("handleMouseMove"));
        canvasDomElement.addEventListener("mousedown",
            createMouseHandler("handleMouseDown"));
        canvasDomElement.addEventListener("mouseup",
            createMouseHandler("handleMouseUp"));
        canvasDomElement.addEventListener("contextmenu", function (event) {
            let x = event.clientX;
            let y = event.clientY;
            event.preventDefault();
            setInterval(function(){
                var radiosHinter = document.getElementsByName("Hintergrundfarbe");
                var radiosRand = document.getElementsByName("Randfarbe");
                radiosHinter.forEach(radio =>
                    radio.onclick = function() {
                        self.fillBackColorSelectedShapes(radio.className);
                    });
                radiosRand.forEach(radio =>
                    radio.onclick = function() {
                        self.fillRandColorSelectedShapes(radio.className);
                    });
            }, 3);

            menu.show( x, y);
        });
        canvasDomElement.addEventListener("click", function (event) {
            let x = event.clientX;
            let y = event.clientY;
            event.preventDefault();
            menu.hide();
        });

        document.addEventListener("keydown", function(e) {
            if (e.keyCode === 17) {
                self.ismarked = true;
            }
            else if ( e.keyCode === 18 ) {
                self.iterated = true;
            }
        });
        document.addEventListener("keyup", function(e){
            self.ismarked = false;
            self.iterated = false;
        });

        function createMouseHandler(methodName: string) {
            return function (e) {
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
        function setupContextMenu ( self) {

            const menu = new MenuApi();

            const menuItem1 = MenuApi . createRadioOption (
                "Hintergrundfarbe",
                { "red": "#ff0000", "yellow": "#ffff00", "green": "#008000" },
                "red"
            );
            const menuItem3 = MenuApi . createRadioOption (
                "Randfarbe",
                { "bleu":"#0000ff", "black": "#000000" ,"transparent":undefined}
            );
            /**
             * Verschiebung der Shape nach vorn.
             */
            const menuItem4 = MenuApi . createItem ("+ Z-Order ", (m)=>{
                self.setZOrder();
                menu.hide () ; // Here , we just want to hide the menu
            }) ;
            /**
             * Verschiebung der Shape nach hinten.
             */
            const menuItem5 = MenuApi . createItem ("- Z-Order ", (m)=>{
                self.setZOrder();
                menu.hide () ; // Here , we just want to hide the menu
            }) ;

            const menuItem = MenuApi . createSeparator () ;
            /**
             * Delete Shapes
             */
            const menuItem2 = MenuApi . createItem ("Delete ", (m)=>{
                self.removeSelectedShapes();
                menu.hide () ; // Here , we just want to hide the menu
            }) ;

            menu.addItems (menuItem1);
            menu.addItem (menuItem);
            menu.addItems (menuItem3);
            menu.addItem (menuItem);
            menu.addItems (menuItem4);
            menu.addItem (menuItem);
            menu.addItems (menuItem5);
            menu.addItem (menuItem);
            menu.addItems (menuItem2);

            return menu ;
        }
        const menu = setupContextMenu ( this) ;

    }

    draw(): this {
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

    selectShapeFor(x: number, y: number, setSelect: boolean = false): this {

        this.ctx.clearRect(0,0,this.width, this.height);
        let allSelectedShapes: number[] = [];

        const self = this;
        Object.keys(this.shapes).forEach(
            function  (id,pos) {
                if(self.shapes[id].collider(x,y)){
                    allSelectedShapes.push(+id);
                    const nextCollider = ((pos + 1) * 13) % 60;
                    self.shapes[id].draw(self.ctx,true,nextCollider);
                }else {
                    self.shapes[id].draw(self.ctx);
                }
            }
        );

        if(setSelect && allSelectedShapes.length > 0) {

            if (this.allSelectedShapes.length === 0) {
                this.allSelectedShapes.push(allSelectedShapes[allSelectedShapes.length-1]);
            } else {
                // load last selected element
                const lastSel: number = this.allSelectedShapes[this.allSelectedShapes.length - 1];

                // check for ctrl-key being pressed

                if(this.iterated){
                    if(!this.ismarked) {
                        this.allSelectedShapes = [];
                    }
                    // choose next
                    let curIn: number = allSelectedShapes.lastIndexOf(lastSel);
                    console.log(curIn);
                    // selected shape is not part of selectables push first new
                    if (curIn < 0) {
                        this.allSelectedShapes.push(allSelectedShapes[allSelectedShapes.length-1]);
                    } else {
                        curIn+=2;
                        if(allSelectedShapes.length <= curIn) {
                            curIn %= allSelectedShapes.length;
                        }
                        this.allSelectedShapes.push(allSelectedShapes[curIn]);
                    }


                }else{
                    if(!this.ismarked) {
                        this.allSelectedShapes = [];
                        this.allSelectedShapes.push(allSelectedShapes[allSelectedShapes.length-1]);
                    }
                    else{
                        this.allSelectedShapes.push(allSelectedShapes[allSelectedShapes.length-1]);
                    }
                }

            }
        }

        // liegt den Schwerpunkt auf gewählte Elemente
        let j = 0;
        for(j;j < this.allSelectedShapes.length; j++){
            this.shapes[ this.allSelectedShapes[j]].draw(this.ctx, true, Selected);
        };

        return this;
    }

    addShape(shape: Shape, redraw: boolean = true): this {
        this.shapes[shape.id] = shape;
        return redraw ? this.draw() : this;
    }
    removeSelectedShapes() {
        for(let i = 0; i < this.allSelectedShapes.length; i++){
            this.removeShapeWithId(this.allSelectedShapes[i]);
        }
        this.allSelectedShapes = [];
    }
    removeShape(shape: Shape, redraw: boolean = true): this {
        const id = shape.id;
        delete  this.shapes[id];
        return redraw ? this.draw() : this;
    }

    removeShapeWithId(id: number, redraw: boolean = true): this {
        delete  this.shapes[id];
        return redraw ? this.draw() : this;
    }

    fillBackColorSelectedShapes(backgroundColor?:string){

        for(let i = 0; i < this.allSelectedShapes.length; i++){
            let id = this.allSelectedShapes[i];
            this.shapes[id].backgroundColor = backgroundColor;
            this.shapes[id].draw(this.ctx, true, Selected);
        }
    }
    fillRandColorSelectedShapes(borderColor?:string){

        for(let i = 0; i < this.allSelectedShapes.length; i++){
            let id = this.allSelectedShapes[i];
            this.shapes[id].borderColor = borderColor;
            this.shapes[id].draw(this.ctx, true, Selected);
        }
    }

    setZOrder(){

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
            return canvas.addShape(s,rd);
        },
        removeShape(s,rd) {
            return canvas.removeShape(s,rd);
        },
        removeShapeWithId(id, rd) {
            return canvas.removeShapeWithId(id, rd);
        },
        selectShapeFor(x, y, rd) {
            return canvas.selectShapeFor(x, y, rd);
        }
    };
    const shapesSelector: ShapeFactory[] = [
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