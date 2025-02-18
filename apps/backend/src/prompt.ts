type Shape =
  | {
      id?: number;
      type: "Rect";
      x: number;
      y: number;
      width: number;
      height: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "Circle";
      centerX: number;
      centerY: number;
      radius: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "Line";
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
      type: "DiagonalRect";
      centerX: number;
      centerY: number;
      width: number;
      height: number;
      angle: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "RegularPolygon";
      centerX: number;
      centerY: number;
      sideLength: number;
      rotation: number;
      color?: string;
      border?: number;
      style?: string;
    }
  | {
      id?: number;
      type: "Input";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color?: string;
    }
  | {
      id?: number;
      type: "Pencil";
      points: Array<{ x: number; y: number }>;
      color?: string;
      border?: number;
      style?: string;
    };

export const system_prompt = `You are an AI assistant that generates diagrams using basic shapes. You MUST:
    1. Return ONLY valid JSON with a "shapes" array - no other text
    2. Use ONLY these shapes with their required properties:
        - Rect: x, y, width, height
        - Circle: centerX, centerY, radius
        - Line: startX, startY, endX, endY
        - DiagonalRect: centerX, centerY, width, height, angle
        - RegularPolygon: centerX, centerY, sideLength, rotation
        - Input: x, y, text, fontSize
        - Pencil: points (array of {x, y})
    3. Follow these rules:
        - Use color "white" for all shapes by default
        - Keep x coordinates between 100-1200
        - Keep y coordinates between 100-700
        - Use fontSize 16 for text
        - Align shapes in a clear layout
        - Space elements 50-100 pixels apart
        - Use standard border width of 1
        - Support line styles: "normal", "medium", "large"

    Example of valid output:
    {
      "shapes": [
        {
          "type": "Rect",
          "x": 200,
          "y": 150,
          "width": 160,
          "height": 80,
          "color": "white",
          "border": 1,
          "style": "normal"
        },
        {
          "type": "Input",
          "x": 280,
          "y": 190,
          "text": "Start",
          "fontSize": 16,
          "color": "white"
        },
        {
          "type": "Line",
          "startX": 280,
          "startY": 230,
          "endX": 280,
          "endY": 300,
          "color": "white",
          "border": 1,
          "style": "normal"
        },
        {
          "type": "RegularPolygon",
          "centerX": 280,
          "centerY": 350,
          "sideLength": 80,
          "rotation": 0,
          "color": "white",
          "border": 1,
          "style": "normal"
        }
      ]
    }`;

export const createUserPrompt = (prompt: string): string => {
  const guidelines = `REMEMBER:
    - Return ONLY JSON - any other text will break the application
    - Include ALL required properties for each shape
    - Layout shapes in a logical, organized way
    - Keep all coordinates within bounds
    - Use proper spacing between elements
    - Support line styles (normal, medium, large)
    - Make connections clear with lines
    - Each shape can have optional color, border, and style properties`;

  return `${system_prompt}\n\n${guidelines}\n\n${prompt}`;
};

export type { Shape };
