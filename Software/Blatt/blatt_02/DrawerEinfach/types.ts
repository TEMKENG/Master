import {ShapeEvent} from "./Events.js";

export interface Shape {
    zOrder: number;
    bgColor: string;
    bdColor: string;
    selected:boolean;
    readonly id: number;

    object();

    draw(ctx: CanvasRenderingContext2D, selected?: boolean, color?: string);


    isInside(x: number, y: number): boolean;
}

export interface ShapeManager {
    //
    // addShape(shape: Shape, redraw?: boolean): this;
    //
    // removeShape(shape: Shape, redraw?: boolean): this;
    //
    // removeShapeWithId(id: number, redraw?: boolean): this;

    // chooseShapeAt(x: number, y: number, selected?: boolean): this;

    // unselectShape(id: number);

    addShape(shape: Shape, redraw?: boolean, move?:boolean);

    removeShape(shape: Shape, redraw?: boolean);

    removeShapeWithId(id: number, redraw?: boolean);

    chooseShapeAt(x: number, y: number, selected?: boolean, toSelect?: { [p: number]: Shape });
}

export interface ShapeFactory {
    label: string;

    handleMouseDown(x: number, y: number);

    handleMouseUp(x: number, y: number);

    handleMouseMove(x: number, y: number);
}


export interface ShapeManagerEventBased {
    // apply(e: ShapeEvent): this
    apply(e: ShapeEvent);
}