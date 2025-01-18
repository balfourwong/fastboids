var fps = require('fps')
  , ticker = require('ticker')
  , debounce = require('debounce')
  , Boids = require('./')

var attractors = [[
    Infinity // x
  , Infinity // y
  , 150 // dist
  , 0.15 // spd
]]

var canvas = document.createElement('canvas')
  , ctx = canvas.getContext('2d')
  , boids = Boids({
      boids: 150
    , speedLimit: 1
    , accelerationLimit: 0.25
    , attractors: attractors
  })

// Setup UI controls
function setupControls() {
  console.log('Setting up controls...');
  var numBoidsSlider = document.getElementById('numBoids');
  var speedLimitSlider = document.getElementById('speedLimit');
  var accelerationSlider = document.getElementById('acceleration');
  var attractorStrengthSlider = document.getElementById('attractorStrength');

  if (!numBoidsSlider || !speedLimitSlider || !accelerationSlider || !attractorStrengthSlider) {
    console.error('Could not find all slider elements');
    return;
  }

  function updateValue(slider, valueId, value) {
    var display = document.getElementById(valueId);
    if (display) {
      // Use integer for number of boids, 3 decimal places for others
      display.textContent = valueId === 'numBoidsValue' ? 
        Math.round(value).toString() : 
        value.toFixed(3);
    }
  }

  function adjustBoidCount(targetCount) {
    var currentCount = boids.boids.length;
    
    if (targetCount > currentCount) {
      // Add boids
      while (boids.boids.length < targetCount) {
        boids.boids.push([
          Math.random() * canvas.width - canvas.width/2,  // x
          Math.random() * canvas.height - canvas.height/2, // y
          Math.random() * 2 - 1,  // vx
          Math.random() * 2 - 1,  // vy
          0, 0                    // ax, ay
        ]);
      }
    } else if (targetCount < currentCount) {
      // Remove boids
      boids.boids.length = targetCount;
    }
  }

  numBoidsSlider.addEventListener('input', function() {
    var value = parseInt(this.value, 10);
    console.log('Number of boids changed to:', value);
    adjustBoidCount(value);
    updateValue(this, 'numBoidsValue', value);
  });

  speedLimitSlider.addEventListener('input', function() {
    var value = parseFloat(this.value);
    console.log('Speed limit changed to:', value);
    boids.speedLimitRoot = value;
    boids.speedLimit = value * value;
    updateValue(this, 'speedLimitValue', value);
  });

  accelerationSlider.addEventListener('input', function() {
    var value = parseFloat(this.value);
    console.log('Acceleration changed to:', value);
    boids.accelerationLimitRoot = value;
    boids.accelerationLimit = value * value;
    updateValue(this, 'accelerationValue', value);
  });

  attractorStrengthSlider.addEventListener('input', function() {
    var value = parseFloat(this.value);
    console.log('Attractor strength changed to:', value);
    attractors[0][3] = value;
    updateValue(this, 'attractorStrengthValue', value);
  });

  // Set initial values
  numBoidsSlider.value = boids.boids.length;
  speedLimitSlider.value = Math.sqrt(boids.speedLimit);
  accelerationSlider.value = Math.sqrt(boids.accelerationLimit);
  attractorStrengthSlider.value = attractors[0][3];
  
  updateValue(numBoidsSlider, 'numBoidsValue', numBoidsSlider.value);
  updateValue(speedLimitSlider, 'speedLimitValue', speedLimitSlider.value);
  updateValue(accelerationSlider, 'accelerationValue', accelerationSlider.value);
  updateValue(attractorStrengthSlider, 'attractorStrengthValue', attractorStrengthSlider.value);
}

window.onload = function() {
  console.log('Window loaded, setting up controls...');
  setupControls();
};

document.body.onmousemove = function(e) {
  var halfHeight = canvas.height/2
    , halfWidth = canvas.width/2

  attractors[0][0] = e.x - halfWidth
  attractors[0][1] = e.y - halfHeight
}

window.onresize = debounce(function() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}, 100)
window.onresize()

document.body.style.margin = '0'
document.body.style.padding = '0'
document.body.appendChild(canvas)

ticker(window, 60).on('tick', function() {
  frames.tick()
  boids.tick()
}).on('draw', function() {
  var boidData = boids.boids
    , halfHeight = canvas.height/2
    , halfWidth = canvas.width/2

  ctx.fillStyle = 'rgba(0,0,0,0.25)' // black with transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw boids
  ctx.strokeStyle = '#FFFFFF' // white boids
  ctx.lineWidth = 1.5
  for (var i = 0, l = boidData.length, x, y; i < l; i += 1) {
    x = boidData[i][0]; y = boidData[i][1]
    // wrap around the screen
    boidData[i][0] = x > halfWidth ? -halfWidth : -x > halfWidth ? halfWidth : x
    boidData[i][1] = y > halfHeight ? -halfHeight : -y > halfHeight ? halfHeight : y
    
    // Draw Asteroids-style vector triangle
    var angle = Math.atan2(boidData[i][3], boidData[i][2]);
    var size = 8;
    
    ctx.save();
    ctx.translate(x + halfWidth, y + halfHeight);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(size, 0);  // tip of triangle
    ctx.lineTo(-size/2, size/2);  // bottom right
    ctx.lineTo(-size/2, -size/2); // bottom left
    ctx.lineTo(size, 0);  // back to tip
    ctx.stroke();
    
    ctx.restore();
  }
})

var frameText = document.querySelector('[data-fps]')
var countText = document.querySelector('[data-count]')
var frames = fps({ every: 10, decay: 0.04 }).on('data', function(rate) {
  for (var i = 0; i < 3; i += 1) {
    if (rate <= 56 && boids.boids.length > 10) {
      boids.boids.pop();
    }
    if (rate >= 60 && boids.boids.length < 500) {
      boids.boids.push([0,0,Math.random()*6-3,Math.random()*6-3,0,0]);
    }
  }
  frameText.innerHTML = String(Math.round(rate))
  countText.innerHTML = String(boids.boids.length)
})
