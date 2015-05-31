window.requestAnimFrame = (function(callback) {

  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();


window.addEventListener("load", function() {
  // Set a timeout...
  setTimeout(function() {
    // Hide the address bar!
    window.scrollTo(0, 1);
  }, 0);
});


var numRows = 30;
var numColumns = 10;
var bufferHeight = 4;

var blockSize;
var canvasWidth;
var canvasHeight;
var canvasOffset;

var canDrop;
var fastDrop;
var firstMove;
var completeRow;

var level;
var score;
var rowCount;
var interval;
var startTime;
var elapsedTime;
var saveInterval;

var grid = [];
var events = [];
var oldCopy = [];
var newCopy = [];
var completeRows = [];

var touchx;
var touchy;

var element = document.getElementById("body");
var canvas = document.getElementById("gameCanvas");

if (canvas.getContext) {
  var context = canvas.getContext("2d");
}

function Shape(type, color, column, rotation, offset) {

  this.type = type;
  this.color = color;
  this.column = column;
  this.rotation = rotation;
  this.offset = offset;
  this.rowSizes = [];
  this.restBlocks = [];
  this.sideBlocks = [];

  switch (type) {

    case 0: // line
      this.row = 1;
      this.size = 4;
      this.maxRotations = 2;
      this.array = [4];
      this.array[0] = [0, 0, new Block(color), 0];
      this.array[1] = [0, 0, new Block(color), 0];
      this.array[2] = [0, 0, new Block(color), 0];
      this.array[3] = [0, 0, new Block(color), 0];
      break;

    case 1: // square 
      this.row = 3;
      this.size = 2;
      this.maxRotations = 0;
      this.array = [2];
      this.array[0] = [new Block(color), new Block(color)];
      this.array[1] = [new Block(color), new Block(color)];
      break;

    case 2:
      this.row = 2;
      this.size = 3;
      this.maxRotations = 4;
      this.array = [3];
      this.array[0] = [0, 0, 0];
      this.array[1] = [new Block(color), new Block(color), new Block(color)];
      this.array[2] = [0, 0, new Block(color)];
      break;

    case 3:
      this.row = 2;
      this.size = 3;
      this.maxRotations = 4;
      this.array = [3];
      this.array[0] = [0, 0, 0];
      this.array[1] = [new Block(color), new Block(color), new Block(color)];
      this.array[2] = [new Block(color), 0, 0];
      break;

    case 4:
      this.row = 2;
      this.size = 3;
      this.maxRotations = 2;
      this.array = [3];
      this.array[0] = [0, 0, 0];
      this.array[1] = [0, new Block(color), new Block(color)];
      this.array[2] = [new Block(color), new Block(color), 0];
      break;

    case 5:
      this.row = 2;
      this.size = 3;
      this.maxRotations = 4;
      this.array = [3];
      this.array[0] = [0, 0, 0];
      this.array[1] = [new Block(color), new Block(color), new Block(color)];
      this.array[2] = [0, new Block(color), 0];
      break;

    case 6:

      this.row = 2;
      this.size = 3;
      this.maxRotations = 2;
      this.array = [3];
      this.array[0] = [0, 0, 0];
      this.array[1] = [new Block(color), new Block(color), 0];
      this.array[2] = [0, new Block(color), new Block(color)];
      break;
  }

  this.array = checkRotation(this.array, this.size, this.rotation);
}

function Offset(xOff, yOff) {

  this.xOff = xOff;
  this.yOff = yOff;
}

function Block(color) {

  this.color = color;
}

function RestBlock(column, row) {

  this.row = row;
  this.column = column;
}

function sideBlock(left, right) {

  this.left = left;
  this.right = right;
}

function checkRotation(array, size, rotation) {

  var arr = array
  var temp = arr;
  if (rotation != 0) {
    var x = 0;
    while (x != rotation) {
      temp = firstRotate(arr, size);
      arr = temp;
      x++;
    }
  }
  return arr;
}

function firstRotate(array, size) {

  var temp = [size];
  for (var i = 0; i < size; i++) {
    temp[i] = [size];
    for (var j = 0; j < size; j++) {
      temp[i][j] = 1;
    }
  }

  for (var x = 0; x < size; x++) {
    for (var y = 0; y < size; y++) {
      temp[y][(size - 1) - x] = array[x][y];
    }
  }
  return temp;
}


function rotateAntiClockwise() {

  // this is swipe up
  if (shape.maxRotations == 0) {
    return;
  }

  var temp = [shape.size];
  for (var i = 0; i < shape.size; i++) {
    temp[i] = [shape.size];
    for (var j = 0; j < shape.size; j++) {
      temp[i][j] = 0;
    }
  }

  for (var x = 0; x < shape.size; x++) {
    for (var y = 0; y < shape.size; y++) {
      temp[(shape.size - 1) - y][x] = shape.array[x][y];
    }
  }

  if (shape.rotation > 0) {
    shape.rotation--;
  } else {
    shape.rotation = shape.maxRotations - 1;
  }

  shape.array = temp;
  updateRestBlocks();
  updateSideBlocks();
}


function rotateClockwise() {

  if (shape.maxRotations == 0) {
    return;
  }

  var temp = [shape.size];
  for (var i = 0; i < shape.size; i++) {
    temp[i] = [shape.size];
    for (var j = 0; j < shape.size; j++) {
      temp[i][j] = 0;
    }
  }

  for (var x = 0; x < shape.size; x++) {
    for (var y = 0; y < shape.size; y++) {
      temp[y][(shape.size - 1) - x] = shape.array[x][y];
    }
  }

  if (shape.rotation < shape.maxRotations - 1) {
    shape.rotation++;
  } else {
    shape.rotation = 0;
  }

  shape.array = temp;
  updateRestBlocks();
  updateSideBlocks();
}

function updateSideBlocks() {

  shape.sideBlocks = [];

  for (var i = 0; i < shape.size; i++) {
    var left = -1;
    var right = -1;
    var checkLeft = true;
    for (var j = 0; j < shape.size; j++) {
      if (shape.array[i][j] !== 0) {
        if (checkLeft) {
          left = j;
          right = j;
          checkLeft = false;
        } else {
          right = j;
        }
      }
    }
    shape.sideBlocks.push(new sideBlock(left, right));
  }
}


function updateRestBlocks() {

  // update existing block
  shape.restBlocks = [];
  var x;
  var y;
  for (var i = 0; i < shape.size; i++) {
    var hasRestBlock = false;
    for (var j = 0; j < shape.size; j++) {
      if (shape.array[j][i] != 0) {
        hasRestBlock = true;
        x = i;
        y = j;
      }
    }
    if (hasRestBlock) {
      shape.restBlocks.push(new RestBlock(x, y));
    }
  }
}

function init() {

  var margin = 40;
  var width = 0;
  var height = 0;

  if (typeof(window.innerWidth) == 'number') {
    width = window.innerWidth - margin;
    height = window.innerHeight - margin;
  } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
    // for ie
    width = document.documentElement.canvasWidth - margin;
    height = document.documentElement.clientHeight - margin;
  }

  if (height < 350) {
    height = 350;
  } 

   do {
    blockSize = height / 20;
    height--;
  } while (blockSize % 1 != 0);

  canvasWidth = blockSize * 10;
  canvasHeight = blockSize * 20;
  canvas.width = canvasWidth + 20;
  canvas.height = canvasHeight + 20;
  canvasOffset = blockSize * 2;
}

function play() {

  score = 0;
  level = 0;
  rowCount = 0;
  interval = 600;
  saveInterval = 600;
  startTime = getGameDate();

  createGrid();
  newShape();
  animate();
}


function createGrid() {

  for (var i = 0; i < numRows; i++) {
    grid[i] = []
    for (var j = 0; j < numColumns; j++) {
      if (i >= numRows - bufferHeight) {
        grid[i][j] = 2; // this is a buffer area to stop overflow
      } else {
        grid[i][j] = 0;
      }
    }
  }
}

function getGameDate() {

  var d = new Date();
  return finishTime = Date.UTC(d.getDate());
}

function newShape() {

  var rand1 = Math.floor(Math.random() * 6);
  var rand2 = Math.floor(Math.random() * 4) + 2;
  shape = new Shape(rand1, "#EBEB05", rand2, 0, 0);
  interval = saveInterval;
  canDrop = true;
  fastDrop = false;
  firstMove = true;
  updateRestBlocks();
  updateSideBlocks();
  dropTimeout();
}


function animate() {

  if (events.length !== 0) {
    var newEvent = events.shift();
    var update = true;
    //check touch events to see if they are possible
    switch (newEvent) {

      case 0:
        for (var i = 0; i < shape.restBlocks.length; i++) {
          if (grid[shape.restBlocks[i].row + shape.row + 1][shape.restBlocks[i].column + shape.column] != 0) {
            canDrop = false;
            checkComplete = true;
            update = false;
            events = [];
          }
        }
        break;

      case 1:
        for (var i = 0; i < shape.size; i++) {
          if (shape.sideBlocks[i].right !== -1) {
            if (shape.column + shape.sideBlocks[i].right + 1 > 9 ||
              grid[shape.row + i][shape.column + shape.sideBlocks[i].right + 1] !== 0) {
              update = false;
              break;
            }
          }
        }
        break;

      case 2:
        for (var i = 0; i < shape.size; i++) {
          if (shape.sideBlocks[i].left !== -1) {
            if (shape.column + shape.sideBlocks[i].left - 1 < 0 ||
              grid[shape.row + i][shape.column + shape.sideBlocks[i].left - 1] !== 0) {
              update = false;
              break;
            }
          }
        }
        break;
      case 3:
      case 5:
        if (shape.type === 1) {
          update = false;
          break;
        }

        var rotateCounter = 0;
        for (var i = 0; i < shape.size; i++) {
          for (var j = 0; j < shape.size; j++) {
            if (grid[shape.row + i][shape.column + j] != 0) {
              rotateCounter++;
              if (rotateCounter > 4) {
                update = false;
                break;
              }
            }
          }
        }
        break;

      case 6: // game over
        return;
        break;
    }

    if (update) {
      // save current position if none exists
      if (firstMove) {
        for (var i = 0; i < shape.size; i++) {
          oldCopy[i] = [shape.size];
          newCopy[i] = [shape.size];
          for (var j = 0; j < shape.size; j++) {
            if (shape.array[i][j]) {
              oldCopy[i][j] = 1;
              newCopy[i][j] = 1;
            }
          }
        }
        firstMove = false;
      }

      switch (newEvent) {
        case 0:
          shape.row++;
          break

        case 1:
          shape.column++;
          break;

        case 2:
          shape.column--;
          break;

        case 3:
          rotateAntiClockwise();
          break;

        case 4:
          if (!fastDrop) {

            fastDrop = true;
            saveInterval = interval;
            interval = 60;
          } else {

            fastDrop = false;
            interval = saveInterval;
          }

          break;
        case 5:
          rotateClockwise();
          break;
      }

      if (newEvent !== 7) {
        // save current block if rotation and not square
        if (shape.type !== 1 && (newEvent === 3 || newEvent === 5)) {
          newCopy = [];
          for (var i = 0; i < shape.size; i++) {
            newCopy[i] = [shape.size]
            for (var j = 0; j < shape.size; j++) {
              if (shape.array[i][j]) {
                newCopy[i][j] = 1;
              }
            }
          }
        }

        // use old copy to delete itself 
        for (var i = 0; i < shape.size; i++) {
          for (var j = 0; j < shape.size; j++) {
            if (oldCopy[i][j] === 1) {
              switch (newEvent) {

                case 0:
                  grid[shape.row + i - 1][shape.column + j] = 0;
                  break;
                case 1:
                  grid[shape.row + i][shape.column + j - 1] = 0;
                  break;
                case 2:
                  grid[shape.row + i][shape.column + j + 1] = 0;
                  break;
                case 3:
                  grid[shape.row + i][shape.column + j] = 0;
                  break;
                case 4:
                  grid[shape.row + i][shape.column + j] = 0;
                  break;
                case 5:
                  grid[shape.row + i][shape.column + j] = 0;
                  break;
              }
            }
          }
        }

        // update references to the arrays  
        oldCopy = newCopy.slice(0);
        // fill new block
        for (var i = 0; i < shape.size; i++) {
          for (var j = 0; j < shape.size; j++) {
            if (shape.array[i][j] !== 0) {
              grid[shape.row + i][shape.column + j] = new Block(shape.color);
            }
          }
        }
      }

      // render updated grid
      context.clearRect(10, 10, canvasWidth, canvasHeight);
      context.strokeRect(10, 10, canvasWidth, canvasHeight);

      for (i = 6; i < numRows; i++) {
        for (j = 0; j < numColumns; j++) {
          if (grid[i][j].color) {
            context.fillStyle = grid[i][j].color;
            context.fillRect(j * blockSize + 10, ((i - bufferHeight) * blockSize) - canvasOffset + 10, blockSize, blockSize);
            context.strokeRect(j * blockSize + 10, ((i - bufferHeight) * blockSize) - canvasOffset + 10, blockSize, blockSize);
          }
        }
      }
    }
  }

  requestAnimFrame(function() {
    animate();
  });
}

function dropTimeout() {

  var timeOut = setTimeout(function() {
    drop();
  }, interval);
}


function drop() {

  // check for complete lines
  if (canDrop) {
    events.unshift(0);
    dropTimeout();
    return;
  } else {

    if (checkComplete) {
      completeRows = [];
      for (var i = 0; i < shape.size; i++) {
        var counter = 0;
        for (var j = 0; j < numColumns; j++) {
          if (grid[shape.row + i][j].color) {
            counter++;
          }
        }

        if (counter === 10) {
          if (!fastDrop) {
            fastDrop = true;
            saveInterval = interval;
            interval = 60;
          }
          completeRows.push(shape.row + i);
          completeRow = true;
        }
      }

      if (completeRow) {
        for (var i = 0; i < completeRows.length; i++) {
          for (var j = 0; j < numColumns; j++) {
            grid[completeRows[i]][j] = 0;
          }
        }
        events.unshift(7);
        checkComplete = false;
        dropTimeout();
        return;

      } else {

        if (canDrop == false && shape.row <= 5) {
          gameOver();
          return;
        } else {
          // no line cleared
          newShape();
          return;
        }
      }
    } else {
      // animation complete, update scores
      var counter = completeRows[0] - 1;
      for (var i = counter; i >= 0; i--) {
        for (var j = 0; j < numColumns; j++) {
          if (grid[i][j].color) {
            grid[i + completeRows.length][j] = new Block(shape.color);
            grid[i][j] = 0;
          }
        }
      }

      rowCount += completeRows.length;
      if (Math.floor(rowCount / 5) === level + 1) {
        level++;
        document.getElementById('level').innerHTML = level;
        if (level < 10) {
          saveInterval -= 40;
        } else {
          saveInterval -= 10;
        }
      }

      switch (completeRows.length) {
        case 1:
          score += 40 * (level + 1);
          break;
        case 2:
          score += 100 * (level + 1);
          break;
        case 3:
          score += 300 * (level + 1);
          break;
        case 4:
          score += 1200 * (level + 1);
          break;
      }

      document.getElementById('score').innerHTML = score;
      completeRow = false;
      newShape();
      return;
    }
  }
}

function gameOver() {

  var finishTime = getGameDate();
  elapsedSeconds = (startTime - finishTime) * 1000;
  events.unshift(6);
}

element.addEventListener("touchstart", function(e) {

  if (canDrop) {
    var touch = e.changedTouches[0];
    touchx = parseInt(touch.pageX);
    touchy = parseInt(touch.pageY);
  }
  e.preventDefault();
}, false);

element.addEventListener("touchmove", function(e) {

  if (canDrop) {
    var touchobj = e.changedTouches[0];
  }
  e.preventDefault();
}, false);

element.addEventListener("touchend", function(e) {

  if (canDrop) {
    var touch = e.changedTouches[0];
    var distancex = parseInt(touch.pageX) - touchx;
    var distancey = parseInt(touch.pageY) - touchy;
    // clear negatives
    var posx = (distancex < 0) ? distancex * -1 : distancex;
    var posy = (distancey < 0) ? distancey * -1 : distancex;

    var touchEvent;

    if (posx > 4 || posy > 4) {
      if (posx > 0 || posy > 0) {
        if (posx > posy) {

          if (distancex > 0) {
            touchEvent = 1; // move right

          } else {
            touchEvent = 2; // move left
          }
        } else {

          if (distancey < 0) {
            touchEvent = 3; // rotate anticlockwise
          } else {

            touchEvent = 4; // fast drop   
          }
        }
      }
    } else {

      touchEvent = 5; // rotate clockwise
    }
    updateGrid(touchEvent);
  }
  e.preventDefault();
}, false);


document.addEventListener("keydown", function(e) {

  if (canDrop) {
    switch (e.keyCode) {
      case 37:
        events.push(2);
        e.preventDefault();
        break;
      case 39:
        events.push(1);
        e.preventDefault();
        break;
      case 38:
        events.push(3);
        e.preventDefault();
        break;
      case 13:
        events.push(4);
        e.preventDefault();
        break;
      case 40:
        events.push(5);
        e.preventDefault();
        break;
    }
  }
}, false);

document.getElementById('start').onclick = function () { 

  document.getElementById('intro').classList.toggle('fade');
  play();
};

init();
