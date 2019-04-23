var http = require('http');
var port = 3000;
var timeTillAttract = 10; // seconds.

var ws281x = require('rpi-ws281x-native');

var NUM_LEDS = parseInt(process.argv[2], 10) || 8,
    pixelColor = new Array(NUM_LEDS);
    pixelData = new Uint32Array(NUM_LEDS),
    fadeSteps = 40,
    fadeStep = new Array(NUM_LEDS),
    fadeToColor = [0, 0, 0];

var INIT = 0,
    PLAYING = 1,
    ATTRACT = 2,
    mode = INIT,
    timeSinceLast = 0,
    attractStep = 0;


// clear the color array.
clearPixelData();
var brightness = 255;
ws281x.init(NUM_LEDS);

function clearPixelData() {
  for (var i = 0; i < NUM_LEDS; i++) {
    pixelColor[i] = fadeToColor;
    fadeStep[i] = 0;
  }
}

// Turn off the lights and reset the IO
var lightsOff = function () {
  for (var i = 0; i < NUM_LEDS; i++) {
    pixelData[i] = color(0, 0, 0);
  }
  ws281x.render(pixelData);
}

// Process interrupts to clean up properly.
var signals = { 'SIGINT': 2, 'SIGTERM': 15 };
function shutdown(signal, value) {
  console.log('Stopped by ' + signal);
  lightsOff();
  ws281x.reset();
  process.nextTick(function () { process.exit(0); });
}
Object.keys(signals).forEach(function (signal) {
  process.on(signal, function () {
    shutdown(signal, signals[signal]);
  });
});

// ---- animation-loop
var offset = 0;
setInterval(function () {
  switch (mode) {
    case INIT:
      break;

    case PLAYING:
      musicSync();
      break;

    case ATTRACT:
      attractMode();
      break;
  }
}, 1000 / 30);

// Standard animation.
function musicSync() {
  for (var i = 0; i < NUM_LEDS; i++) {
    fColor = fade(pixelColor[i], fadeToColor, fadeStep[i]);
    pixelData[i] = color(fColor[0], fColor[1], fColor[2]);
    if (fadeStep[i] > 0) {
      fadeStep[i] = fadeStep[i] - 1;
    }
  }

  ws281x.render(pixelData);
  if (Date.now() - timeSinceLast > timeTillAttract * 1000) {
    console.log('Going to attract');
    mode = ATTRACT;
  }

}

function attractMode() {
  var attractColors = [
    color(255, 0, 0),
    color(255, 255, 0),
    color(0, 255, 0),
    color(0, 255, 255),
    color(0, 0, 255),
    color(255, 0, 255),
  ];
  var attractPeriod = Math.floor(attractStep / 8);
  var attractLed = 0;
  noOfModes = 2;
  var mode = Math.floor((attractPeriod / 80 * noOfModes)) % noOfModes;
  switch (mode) {
    default:
    case 0:
      attractLed = attractPeriod % NUM_LEDS;
      break;

    case 1:
      attractLed = Math.abs(attractPeriod % (2 * NUM_LEDS) - NUM_LEDS);
      break;
  }
  var attractColor = attractPeriod % attractColors.length;

  for (var i = 0; i < NUM_LEDS; i++) {
    pixelData[i] = color(0, 0, 0);
  }
  pixelData[attractLed] = attractColors[attractColor];
  ws281x.render(pixelData);
  attractStep = attractStep + 1;
}

// power on.
for (var i = 0; i < NUM_LEDS; i++) {
  pixelData[i] = color(200, 255, 0);
}
ws281x.render(pixelData);

// generate integer from RGB value
function color(r, g, b) {
  r = r * brightness / 255;
  g = g * brightness / 255;
  b = b * brightness / 255;
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

// Fades between two colors.
function fade(oldColor, newColor, step) {
  return [
    Math.round(oldColor[0] + (newColor[0] - oldColor[0] * (fadeSteps - step) / fadeSteps)),
    Math.round(oldColor[1] + (newColor[1] - oldColor[1] * (fadeSteps - step) / fadeSteps)),
    Math.round(oldColor[2] + (newColor[2] - oldColor[2] * (fadeSteps - step) / fadeSteps))
  ];
}


function requestHandler(request, response) {
  if (request.url == '/fail') {
    for (var i = 0; i < NUM_LEDS; i++) {
      pixelData[i] = color(0, 255, 0);
    }
    ws281x.render(pixelData);
  }
  if (request.url == '/connected') {
    for (var i = 0; i < NUM_LEDS; i++) {
      pixelData[i] = color(255, 0, 0);
    }
    ws281x.render(pixelData);
    
    setTimeout(function () {
      lightsOff();
      clearPixelData();
      mode = PLAYING;
      timeSinceLast = Date.now();
    }, 1000);
  }
  var parts = request.
    url.
    split('/').
    filter(Boolean).
    map(function (x) {
      return parseInt(x, 10);
    });
  for (var i = 0; i < NUM_LEDS; i++) {
    pixelColor[parts[0]] = fadeToColor;
  }
  if (parts.length === 4) {
    if (mode == ATTRACT) {
      lightsOff();
      clearPixelData();      
      mode = PLAYING;
    }
    pixelColor[parts[0] % NUM_LEDS] = [
      parts[2] % 256, parts[1] % 256, parts[3] % 256
    ];
    fadeStep[parts[0] % NUM_LEDS] = fadeSteps;
    timeSinceLast = Date.now();
  }
  response.end('');
}

const server = http.createServer(requestHandler);
server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }
  console.log('server started');
});
