let themes = [
  {
    name: "Dark Blue - Light Yellow",
    bgColor: "#001b33",
    strokeColor: "#ffffcc",
  },
  {
    name: "Dark Green - Light Beige",
    bgColor: "#003300",
    strokeColor: "#f5f5dc",
  },
  {
    name: "Dark Gray - Light Pink",
    bgColor: "#2e2e2e",
    strokeColor: "#ffc0cb",
  },
  {
    name: "Deep Purple - Light Cyan",
    bgColor: "#301934",
    strokeColor: "#e0ffff",
  },
];
let currentThemeIndex = 0;
let color = themes[currentThemeIndex].bgColor;
let frameColor = themes[currentThemeIndex].strokeColor; // Color of the outer frame
let frameThickness = 100; // Thickness of the outer frame

const branchingFactor = 0.02;
const noiseFactor = 5;
const agentArray = [];
const agentSpeed = 10;

let world;
let x, y, heading, incr_heading, newX, newY;

let instantDraw = true; // Set to true for instant drawing, false for gradual drawing

// New variables for centering and padding
let points = [];
let minX, maxX, minY, maxY;

function setup() {
  createCanvas(windowWidth, windowHeight);
  stroke(themes[currentThemeIndex].strokeColor);

  background(themes[currentThemeIndex].bgColor);
  noFill();

  incr_heading = random([PI / 3, -PI / 3]);

  world = array2d(); // Initialize array width * height with false

  agentArray.length = 0;

  agentArray.push(agent());

  frameRate(60);

  drawFrame(); // Call function to draw the frame
}

function drawFrame() {
  push(); // Save the current drawing state
  stroke(frameColor);
  strokeWeight(frameThickness);
  noFill();

  // Adjust the rectangle to go slightly outside the canvas boundaries to eliminate white space
  rect(
    -frameThickness / 2,
    -frameThickness / 2,
    width + frameThickness,
    height + frameThickness
  );

  pop(); // Restore the previous drawing state to avoid affecting other drawings
}

function draw() {
  if (instantDraw) {
    let agent_j;
    for (let j = 0; j < agentArray.length; j++) {
      agent_j = agentArray[j];
      while (true) {
        let result = agent_j.next();
        if (result.done) break;
      }
    }

    // Compute the bounding box dimensions
    let structureWidth = maxX - minX;
    let structureHeight = maxY - minY;

    // Define padding (e.g., 10% of the canvas size)
    let padding = 0.1;
    let availableWidth = width * (1 - 2 * padding);
    let availableHeight = height * (1 - 2 * padding);

    // Compute scaling factor
    let scaleFactor = Math.min(
      availableWidth / structureWidth,
      availableHeight / structureHeight
    );

    // Compute translation offsets to center the structure
    let offsetX =
      (width - structureWidth * scaleFactor) / 2 - minX * scaleFactor;
    let offsetY =
      (height - structureHeight * scaleFactor) / 2 - minY * scaleFactor;

    // Clear the canvas
    background(color);

    // Draw the points with scaling and translation
    push();
    translate(offsetX, offsetY);
    scale(scaleFactor);

    stroke(themes[currentThemeIndex].strokeColor);
    strokeWeight(1); // Reset stroke thickness for the structure
    for (let i = 0; i < points.length; i++) {
      let p = points[i];
      rect(p.x, p.y, 1 / scaleFactor, 1 / scaleFactor); // Adjust size for scaling
    }
    pop();

    drawFrame(); // Redraw the frame after scaling

    noLoop(); // Stop looping since the drawing is complete
  } else {
    let agent_j;
    for (let i = 0; i < agentSpeed; i++) {
      for (let j = 0; j < agentArray.length; j++) {
        agent_j = agentArray[j];
        agent_j.next();
      }
    }
  }
}

function* agent() {
  let stack = [];
  let field_0, field_i;

  x = width / 2;
  y = height / 2;

  minX = x;
  maxX = x;
  minY = y;
  maxY = y;

  heading = incr_heading;

  field_0 = new field(x, y, heading);
  stack.push(field_0);
  world.set(x, y);

  while (stack.length) {
    field_i = stack.pop();

    x = field_i.x;
    y = field_i.y;
    heading = field_i.heading;

    let num;
    if (random() < branchingFactor) {
      num = 2;
    } else {
      num = 1;
    }

    for (let i = 0; i < num; i++, heading += incr_heading) {
      newX = x;
      newY = y;

      do {
        newX += cos(heading);
        newY += sin(heading);
      } while (floor(newX) === floor(x) && floor(newY) === floor(y));

      if (newX <= 0 || newX >= width || newY <= 0 || newY >= height) {
        return; // Exit the generator function
      }
      if (!world.canMoveTo(newX, newY)) continue;
      stack.push(new field(newX, newY, heading));
      world.set(newX, newY);

      yield;
    }
  }
}

function array2d() {
  const array = Array.from({ length: width }, () => Array(height).fill(false));

  return {
    canMoveTo: (x, y) => {
      return array[floor(x)][floor(y)] === false;
    },
    set: (x, y) => {
      array[floor(x)][floor(y)] = true;

      // Store the point
      points.push({ x: x, y: y });

      // Update bounding box
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    },
  };
}

function keyPressed() {
  if (key === "t" || key === "T") {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    console.log("New theme:", themes[currentThemeIndex].name);
    color = themes[currentThemeIndex].bgColor;
    frameColor = themes[currentThemeIndex].strokeColor;
    redraw(); // Redraw with new theme
  }
}
