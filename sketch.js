// Theme Definitions
const themes = [
  {
    name: "Dark Blue - Light Yellow",
    bgColor: "#001b33",
    strokeColor: "#ffffcc",
  },
  {
    name: "Fid01",
    bgColor: "#b7d9cd",
    strokeColor: "#d12a2f",
  },
  {
    name: "Pantone #177BW",
    bgColor: "#090d01",
    strokeColor: "#f3f2f0",
  },
  {
    name: "Pantone #255",
    bgColor: "#d7ccb9",
    strokeColor: "#f25036",
  },
  {
    name: "Gold Duck_A",
    bgColor: "#ebdec5",
    strokeColor: "#d39a0e",
  },
];

let currentThemeIndex = 0;

// Frame and Padding Settings
const frameThickness = 10; // Thickness for frames
const mattingPadding = 100; // Space between outer edges and inner frame
const structurePadding = 50; // Space between inner frame and structure

// Generative Structure Settings
const settings = {
  branchingFactor: 0.02,
  noiseFactor: 0.02, //0.02 = default - 0.002 = straight
  agentSpeed: 10,
  instantDraw: true,
};

// Agents and World Setup
const agentArray = [];
let world;

// Structure Variables
let points = [];
let minX, maxX, minY, maxY;

// Noise Offset for Perlin Noise
let noiseOffset = 0;

// p5.js Setup Function
function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  resetSketch();
}

// p5.js Draw Function
function draw() {
  if (settings.instantDraw) {
    // Run all agents to completion
    for (const agent of agentArray) {
      while (true) {
        const result = agent.next();
        if (result.done) break;
      }
    }

    // Calculate Structure Bounds
    const structureWidth = maxX - minX;
    const structureHeight = maxY - minY;

    // Calculate Available Space (subtracting both matting and structure padding)
    const availableWidth = width - 2 * mattingPadding - 2 * structurePadding;
    const availableHeight = height - 2 * mattingPadding - 2 * structurePadding;

    // Determine Scaling Factor
    const scaleFactor = Math.min(
      availableWidth / structureWidth,
      availableHeight / structureHeight
    );

    // Calculate Centers of structure and available space
    const structureCenterX = (minX + maxX) / 2;
    const structureCenterY = (minY + maxY) / 2;

    const availableCenterX =
      mattingPadding + structurePadding + availableWidth / 2;
    const availableCenterY =
      mattingPadding + structurePadding + availableHeight / 2;

    // Determine Translation Offsets to center the structure
    const offsetX = availableCenterX - structureCenterX * scaleFactor;
    const offsetY = availableCenterY - structureCenterY * scaleFactor;

    // Set Background Based on Current Theme
    background(themes[currentThemeIndex].bgColor);
    noFill();

    // Draw Inner Frame
    drawInnerFrame();

    // Draw Generative Structure
    push();
    translate(offsetX, offsetY); // Apply the calculated translation
    scale(scaleFactor); // Apply the calculated scaling
    stroke(themes[currentThemeIndex].strokeColor);
    strokeWeight(1);
    for (const p of points) {
      rect(p.x, p.y, 1 / scaleFactor, 1 / scaleFactor); // Adjust drawing based on scaling
    }
    pop();

    noLoop(); // Stop drawing since rendering is complete
  } else {
    // Interactive Drawing Mode
    for (let i = 0; i < settings.agentSpeed; i++) {
      for (const agent of agentArray) {
        agent.next();
      }
    }
  }
}

// Function to Draw the Inner Frame
function drawInnerFrame() {
  push();
  stroke(themes[currentThemeIndex].strokeColor);
  strokeWeight(frameThickness);
  noFill();
  rect(
    mattingPadding,
    mattingPadding,
    width - 2 * mattingPadding,
    height - 2 * mattingPadding
  );
  pop();
}

// Function to Initialize a 2D Array Representing the World
function array2d() {
  const array = Array.from({ length: width }, () => Array(height).fill(false));

  return {
    canMoveTo: (x, y) => {
      const fx = floor(x);
      const fy = floor(y);
      // Check boundaries with padding
      if (
        fx < mattingPadding + structurePadding ||
        fx >= width - mattingPadding - structurePadding ||
        fy < mattingPadding + structurePadding ||
        fy >= height - mattingPadding - structurePadding
      )
        return false;
      return !array[fx][fy];
    },
    set: (x, y) => {
      const fx = floor(x);
      const fy = floor(y);
      array[fx][fy] = true;
      points.push({ x, y });

      // Update Bounding Box
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    },
  };
}

// Generator Function for Agent Behavior
function* agent() {
  const stack = [];
  let field;

  const startX = width / 2;
  const startY = height / 2;

  // Initialize Bounding Box
  minX = startX;
  maxX = startX;
  minY = startY;
  maxY = startY;

  let heading = random([PI / 3, -PI / 3]);

  const initialField = new Field(startX, startY, heading);
  stack.push(initialField);
  world.set(startX, startY);

  while (stack.length) {
    field = stack.pop();
    const { x, y, heading: currentHeading } = field;

    // Apply Perlin Noise to Heading
    const noiseValue = noise(noiseOffset) * TWO_PI;
    const noiseInfluence = map(settings.noiseFactor, 0, 10, 0, PI / 4);
    let newHeading = currentHeading + noiseValue * noiseInfluence;
    noiseOffset += 0.01;

    // Determine Number of Branches
    const numBranches = random() < settings.branchingFactor ? 2 : 1;

    for (let i = 0; i < numBranches; i++, newHeading += PI / 3) {
      let newX = x;
      let newY = y;

      // Move in the Direction of the Current Heading
      do {
        newX += cos(newHeading);
        newY += sin(newHeading);
      } while (floor(newX) === floor(x) && floor(newY) === floor(y));

      // Check Boundary Conditions
      if (
        newX <= mattingPadding + structurePadding ||
        newX >= width - mattingPadding - structurePadding ||
        newY <= mattingPadding + structurePadding ||
        newY >= height - mattingPadding - structurePadding
      ) {
        continue; // Skip if out of bounds
      }

      // Check if the Position is Already Occupied
      if (!world.canMoveTo(newX, newY)) continue;

      // Add New Field to Stack and Mark Position as Occupied
      stack.push(new Field(newX, newY, newHeading));
      world.set(newX, newY);

      yield; // Yield control back to the draw loop
    }
  }
}

// p5.js Key Pressed Function for Interactivity
function keyPressed() {
  if (key === "t" || key === "T") {
    // Cycle to the Next Theme
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    console.log("New theme:", themes[currentThemeIndex].name);
    resetSketch();
  } else if (key === "s" || key === "S") {
    // Log Current Settings
    console.log("Current settings:", settings);
  } else if (key === "r" || key === "R") {
    // Reset the Sketch
    console.log("Refreshing the sketch...");
    resetSketch();
  }
}

// Function to Reset and Redraw the Sketch
function resetSketch() {
  // Clear Canvas with New Background Color
  background(themes[currentThemeIndex].bgColor);
  points = [];
  minX = width / 2;
  maxX = width / 2;
  minY = height / 2;
  maxY = height / 2;
  noiseOffset = 0;

  // Initialize World and Agents
  world = array2d();
  agentArray.length = 0;
  agentArray.push(agent());

  loop(); // Restart the draw loop
}

// Field Class Definition
class Field {
  constructor(x, y, heading) {
    this.x = x;
    this.y = y;
    this.heading = heading;
  }
}

// p5.js Window Resized Function to Handle Canvas Resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetSketch();
}
