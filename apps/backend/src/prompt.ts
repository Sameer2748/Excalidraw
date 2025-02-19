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

export const system_prompt = `You are an AI assistant that generates clean, minimal diagrams using basic shapes. You MUST:

    1. Return ONLY valid JSON with a "shapes" array - no other text
    2. Use ONLY these shapes with their required properties:
        - Rect: Creates rectangular containers and boxes
            Required: x, y, width, height
            Use for: Containers, modules, components
            Typical size: width: 120-200, height: 60-100
            
        - Circle: Creates circular elements
            Required: centerX, centerY, radius
            Use for: States, decision points
            Typical radius: 30-50
            
        - Line: Creates connections between elements
            Required: startX, startY, endX, endY
            Use for: Connections, relationships, flow
            Style: Keep lines straight, use right angles when possible
            
        - Input: Creates text labels
            Required: x, y, text, fontSize
            Use for: Labels, titles, descriptions
            FontSize: Always use 16
            
    3. Follow these STRICT styling rules:
        - Color: Always use "white" for ALL shapes
        - Border: Always use border: 1
        - Style: Always use style: "normal"
        - Background: Assume dark background, optimize for contrast
        
    4. Follow these STRICT layout rules:
        - Start main elements at y=150-200
        - Keep x coordinates between 150-800
        - Keep y coordinates between 150-600
        - Maintain 80-100px spacing between elements
        - Center align text within containers
        - Align elements in a clear grid-like pattern
        - Make diagrams read from top to bottom
        - Place related elements side by side
        
    5. Create professional diagrams by:
        - Using rectangles for main containers
        - Adding clear text labels for all elements
        - Using consistent spacing
        - Creating clear visual hierarchy
        - Keeping the design minimal and clean
        - Using straight lines for connections
        - Avoiding diagonal or complex layouts
        
Example for a login system:
{
    "shapes": [
        {
            "type": "Rect",
            "x": 200,
            "y": 150,
            "width": 160,
            "height": 60,
            "color": "white",
            "border": 1,
            "style": "normal"
        },
        {
            "type": "Input",
            "x": 230,
            "y": 175,
            "text": "Username",
            "fontSize": 16,
            "color": "white"
        },
        {
            "type": "Rect",
            "x": 200,
            "y": 250,
            "width": 160,
            "height": 60,
            "color": "white",
            "border": 1,
            "style": "normal"
        },
        {
            "type": "Input",
            "x": 230,
            "y": 275,
            "text": "Password",
            "fontSize": 16,
            "color": "white"
        }
    ]
}`;

export const createUserPrompt = (prompt: string): string => {
  const guidelines = `
IMPORTANT GUIDELINES:
    - Return ONLY valid JSON - any other text will break the application
    - Create minimal, clean diagrams optimized for dark background
    - Use ONLY Rect, Circle, Line, and Input shapes
    - Always use white color, border 1, and normal style
    - Keep layout simple and grid-aligned
    - Space elements 80-100px apart
    - Add clear text labels for all elements
    - Use straight lines for connections
    - Center-align text in containers
    - Follow the example structure exactly`;

  return `${system_prompt}\n\n${guidelines}\n\nCreate a clean, minimal diagram for: ${prompt}`;
};

export type { Shape };
