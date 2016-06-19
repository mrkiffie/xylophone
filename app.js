'use strict';

var eventType = 'mousedown';
if ('ontouchstart' in window) {
  eventType = 'touchstart';
}

var samples = [
  './note/1.mp3',
  './note/2.mp3',
  './note/3.mp3',
  './note/4.mp3',
  './note/5.mp3',
  './note/6.mp3',
  './note/7.mp3',
  './note/8.mp3'
];

/**
 * Creates the xylophone based on the number of sample notes available
 */
(function createXylophone() {
  var xylophone = document.getElementById('xylophone');

  for (var i = 0; i < samples.length; i++) {

    var note = document.createElement('div');
    note.className = 'note';
    note.dataset.index = i;
    note.addEventListener(eventType, rippleEffect, false);
    note.addEventListener(eventType, soundEffect, false);
    xylophone.appendChild(note);
  }
}());

/**
 * Creates a ripple effect on the element at the specified coordinates
 * @param {Element} target
 * @param {Number} x
 * @param {Number} y
 */
function ripple(target, x, y) {
  var ripple = document.createElement('div');
  ripple.className = 'ripple-effect';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  target.appendChild(ripple);
  window.setTimeout(function () {
    ripple.parentNode.removeChild(ripple);
  }, 1000);
}

/**
 * Creates a ripple effect on the element to which it is attached
 * @param {Event} event A DOM event
 */
function rippleEffect(event) {
  event.preventDefault();

  var target = event.currentTarget;
  var rect = target.getBoundingClientRect();
  var xCenter = 0;
  var yCenter = 0;

  var touches = [];
  var i;

  if (eventType === 'touchstart') {
    touches = event.touches;
    for (i = 0; i < touches.length; i++) {
      xCenter = touches[i].clientX - rect.left;
      yCenter = touches[i].clientY - rect.top;
      ripple(target, xCenter, yCenter);
    }

  } else {
    xCenter = event.offsetX;
    yCenter = event.offsetY;
    ripple(target, xCenter, yCenter);
  };
}

/**
 * Plays the sound represented by the target
 * @param {Event} event A DOM event
 */
function soundEffect(event) {
  event.preventDefault();

  var target = event.currentTarget;
  var rect = target.getBoundingClientRect();
  var y;

  if (eventType === 'touchstart') {
    y = event.touches[0].clientY - rect.top;
  } else {
    y = event.offsetY;
  }

  var index = target.dataset.index;
  var volume = ((rect.height - y) + 20) / (rect.height + 20);

  if (mainBufferList.length > 0) {
    playSound(mainBufferList[index], volume);
  }
}

window.onload = init;
var context;
var bufferLoader;

function init() {
  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();

  bufferLoader = new BufferLoader(
    context,
    samples,
    finishedLoading
  );

  bufferLoader.load();
}

function playSound(buffer, gain) {

  // Connect the gain node to the destination.
  var gainNode = context.createGain();
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.gain.value = gain * gain || .5;
  gainNode.connect(context.destination);

  source.start(0);
}

var mainBufferList = [];

function finishedLoading(bufferList) {
  mainBufferList = bufferList;
}

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function (url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function () {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function (buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function (error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function () {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function () {
  for (var i = 0; i < this.urlList.length; ++i)
    this.loadBuffer(this.urlList[i], i);
}
