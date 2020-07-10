import { CircleFactory, LineFactory, RectangleFactory, TriangleFactory, ChooseShape } from "./Shapes.js";
import { ToolArea } from "./ToolArea.js";
import { Canvas } from "./Canvas.js";
import { AddShapeEvent, RemoveShapeWithIdEvent, ChooseShapeAtEvent } from "./Events.js";
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
    let event = undefined;
    const sm = {
        addShape(s, rd, mv) {
            // console.log("Addshape:", s);
            event = new AddShapeEvent(s, rd, mv);
            if (mv) {
            }
            else {
                canvas.addEvent(event);
            }
            return canvas.apply(event);
        },
        removeShape(s, rd) {
            event = new RemoveShapeWithIdEvent(s.id, rd);
            return canvas.apply(event);
        },
        removeShapeWithId(id, rd) {
            event = new RemoveShapeWithIdEvent(id, rd);
            return canvas.apply(event);
        },
        chooseShapeAt(x, y, selected, toSelect) {
            event = new ChooseShapeAtEvent(x, y, selected, toSelect);
            return canvas.apply(event);
        }
    };
    const shapesSelector = [
        new LineFactory(sm),
        new CircleFactory(sm),
        new RectangleFactory(sm),
        new TriangleFactory(sm),
        new ChooseShape(sm)
    ];
    const toolArea = new ToolArea(shapesSelector, menu[0]);
    canvas = new Canvas(canvasDomElm, toolArea);
    canvas.draw();
}
init();
//# sourceMappingURL=init.js.map