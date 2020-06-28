export interface Shape {
    zOrder: number;
    bgColor: string;
    bdColor: string;
    readonly id: number;

    object();

    draw(ctx: CanvasRenderingContext2D, selected?: boolean, color?: string);


    isInside(x: number, y: number): boolean;
}

export interface ShapeManager {
    addShape(shape: Shape, redraw?: boolean): this;

    removeShape(shape: Shape, redraw?: boolean): this;

    removeShapeWithId(id: number, redraw?: boolean): this;

    // chooseShapeAt(x: number, y: number, selected?: boolean): this;
    chooseShapeAt(x: number, y: number, selected?: boolean,  toSelect?: { [p: number]: Shape });
}

export interface ShapeFactory {
    label: string;

    handleMouseDown(x: number, y: number);

    handleMouseUp(x: number, y: number);

    handleMouseMove(x: number, y: number);
}
