export type Point = {
  x: number;
  y: number;
  lineWidth?: number;
};

export type Shape =
  | {
      id?: number;
      type: "rect";
      startX: number;
      startY: number;
      width: number;
      height: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "diamond";
      startX: number;
      startY: number;
      width: number;
      height: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "pencil";
      points: Point[];
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "text";
      startX: number;
      startY: number;
      text: string;
      fontSize: number;
      color?: string;
    };

export class CanvasShapeManager {
  constructor(private ctx: CanvasRenderingContext2D) {
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
  }

  createAndDrawShape(
    selectedTool: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    options: {
      color?: string;
      border?: number;
      style?: string;
    } = {}
  ): Shape | null {
    const shape = this.createShape(
      selectedTool,
      startX,
      startY,
      endX,
      endY,
      options
    );
    if (shape) {
      this.drawShape(shape);
    }
    return shape;
  }

  createAndDrawPencilStroke(
    points: Point[],
    options: {
      color?: string;
      border?: number;
      style?: string;
    } = {}
  ): Shape {
    const shape: Shape = {
      type: "pencil",
      points: Array.from(points),
      color: options.color,
      border: options.border,
      style: options.style,
    };
    this.drawShape(shape);
    return shape;
  }

  private createShape(
    selectedTool: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    options: {
      color?: string;
      border?: number;
      style?: string;
    }
  ): Shape | null {
    const width = endX - startX;
    const height = endY - startY;

    switch (selectedTool.toLowerCase()) {
      case "rect":
        return {
          type: "rect",
          startX,
          startY,
          width,
          height,
          ...options,
        };

      case "circle":
        return {
          type: "circle",
          centerX: startX,
          centerY: startY,
          radius: Math.hypot(width, height),
          ...options,
        };

      case "line":
        return {
          type: "line",
          startX,
          startY,
          endX,
          endY,
          ...options,
        };

      case "arrow":
        return {
          type: "arrow",
          startX,
          startY,
          endX,
          endY,
          ...options,
        };

      case "diamond":
        return {
          type: "diamond",
          startX,
          startY,
          width,
          height,
          ...options,
        };

      default:
        return null;
    }
  }

  drawShape(shape: Shape): void {
    this.ctx.save();

    // Set common properties
    this.ctx.strokeStyle = shape.color || "#fff";
    this.ctx.lineWidth = shape.border || 1;

    if (shape.style) {
      this.ctx.setLineDash(this.getStyleDash(shape.style));
    } else {
      this.ctx.setLineDash([]);
    }

    switch (shape.type) {
      case "rect":
        this.drawRect(shape);
        break;
      case "circle":
        this.drawCircle(shape);
        break;
      case "line":
        this.drawLine(shape);
        break;
      case "arrow":
        this.drawArrow(shape);
        break;
      case "diamond":
        this.drawDiamond(shape);
        break;
      case "pencil":
        this.drawPencil(shape);
        break;
      case "text":
        this.drawText(shape);
        break;
    }

    this.ctx.restore();
  }

  private drawRect(shape: Extract<Shape, { type: "rect" }>) {
    this.ctx.strokeRect(shape.startX, shape.startY, shape.width, shape.height);
  }

  private drawCircle(shape: Extract<Shape, { type: "circle" }>) {
    this.ctx.beginPath();
    this.ctx.arc(
      shape.centerX,
      shape.centerY,
      Math.abs(shape.radius),
      0,
      Math.PI * 2
    );
    this.ctx.stroke();
  }

  private drawLine(shape: Extract<Shape, { type: "line" }>) {
    this.ctx.beginPath();
    this.ctx.moveTo(shape.startX, shape.startY);
    this.ctx.lineTo(shape.endX, shape.endY);
    this.ctx.stroke();
  }

  private drawText(shape: Extract<Shape, { type: "text" }>) {
    this.ctx.font = `${shape.fontSize}px Arial`;
    this.ctx.fillStyle = shape.color || "#fff";
    this.ctx.fillText(shape.text, shape.startX, shape.startY);
  }

  private drawArrow(shape: Extract<Shape, { type: "arrow" }>) {
    const { startX, startY, endX, endY } = shape;

    // Draw the main line
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Calculate arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const headLength = 10;

    // Draw arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  private drawDiamond(shape: Extract<Shape, { type: "diamond" }>) {
    const { startX, startY, width, height } = shape;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY - height / 2);
    this.ctx.lineTo(startX + width / 2, startY);
    this.ctx.lineTo(startX, startY + height / 2);
    this.ctx.lineTo(startX - width / 2, startY);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawPencil(shape: Extract<Shape, { type: "pencil" }>) {
    const { points } = shape;
    if (!points || points.length === 0) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      if (current && next) {
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;

        if (current.lineWidth) {
          this.ctx.lineWidth = current.lineWidth;
        }

        this.ctx.quadraticCurveTo(current.x, current.y, midX, midY);
      }
    }

    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      if (lastPoint.lineWidth) {
        this.ctx.lineWidth = lastPoint.lineWidth;
      }
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    this.ctx.stroke();
  }

  private getStyleDash(style: string): number[] {
    switch (style) {
      case "medium":
        return [5, 5];
      case "large":
        return [10, 5];
      default:
        return [];
    }
  }
}
