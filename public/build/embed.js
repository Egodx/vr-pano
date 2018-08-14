(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (process){
/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */


var _Group = function () {
	this._tweens = {};
	this._tweensAddedDuringUpdate = {};
};

_Group.prototype = {
	getAll: function () {

		return Object.keys(this._tweens).map(function (tweenId) {
			return this._tweens[tweenId];
		}.bind(this));

	},

	removeAll: function () {

		this._tweens = {};

	},

	add: function (tween) {

		this._tweens[tween.getId()] = tween;
		this._tweensAddedDuringUpdate[tween.getId()] = tween;

	},

	remove: function (tween) {

		delete this._tweens[tween.getId()];
		delete this._tweensAddedDuringUpdate[tween.getId()];

	},

	update: function (time, preserve) {

		var tweenIds = Object.keys(this._tweens);

		if (tweenIds.length === 0) {
			return false;
		}

		time = time !== undefined ? time : TWEEN.now();

		// Tweens are updated in "batches". If you add a new tween during an update, then the
		// new tween will be updated in the next batch.
		// If you remove a tween during an update, it will normally still be updated. However,
		// if the removed tween was added during the current batch, then it will not be updated.
		while (tweenIds.length > 0) {
			this._tweensAddedDuringUpdate = {};

			for (var i = 0; i < tweenIds.length; i++) {

				if (this._tweens[tweenIds[i]].update(time) === false) {
					this._tweens[tweenIds[i]]._isPlaying = false;

					if (!preserve) {
						delete this._tweens[tweenIds[i]];
					}
				}
			}

			tweenIds = Object.keys(this._tweensAddedDuringUpdate);
		}

		return true;

	}
};

var TWEEN = new _Group();

TWEEN.Group = _Group;
TWEEN._nextId = 0;
TWEEN.nextId = function () {
	return TWEEN._nextId++;
};


// Include a performance.now polyfill.
// In node.js, use process.hrtime.
if (typeof (window) === 'undefined' && typeof (process) !== 'undefined') {
	TWEEN.now = function () {
		var time = process.hrtime();

		// Convert [seconds, nanoseconds] to milliseconds.
		return time[0] * 1000 + time[1] / 1000000;
	};
}
// In a browser, use window.performance.now if it is available.
else if (typeof (window) !== 'undefined' &&
         window.performance !== undefined &&
		 window.performance.now !== undefined) {
	// This must be bound, because directly assigning this function
	// leads to an invocation exception in Chrome.
	TWEEN.now = window.performance.now.bind(window.performance);
}
// Use Date.now if it is available.
else if (Date.now !== undefined) {
	TWEEN.now = Date.now;
}
// Otherwise, use 'new Date().getTime()'.
else {
	TWEEN.now = function () {
		return new Date().getTime();
	};
}


TWEEN.Tween = function (object, group) {
	this._object = object;
	this._valuesStart = {};
	this._valuesEnd = {};
	this._valuesStartRepeat = {};
	this._duration = 1000;
	this._repeat = 0;
	this._repeatDelayTime = undefined;
	this._yoyo = false;
	this._isPlaying = false;
	this._reversed = false;
	this._delayTime = 0;
	this._startTime = null;
	this._easingFunction = TWEEN.Easing.Linear.None;
	this._interpolationFunction = TWEEN.Interpolation.Linear;
	this._chainedTweens = [];
	this._onStartCallback = null;
	this._onStartCallbackFired = false;
	this._onUpdateCallback = null;
	this._onCompleteCallback = null;
	this._onStopCallback = null;
	this._group = group || TWEEN;
	this._id = TWEEN.nextId();

};

TWEEN.Tween.prototype = {
	getId: function getId() {
		return this._id;
	},

	isPlaying: function isPlaying() {
		return this._isPlaying;
	},

	to: function to(properties, duration) {

		this._valuesEnd = properties;

		if (duration !== undefined) {
			this._duration = duration;
		}

		return this;

	},

	start: function start(time) {

		this._group.add(this);

		this._isPlaying = true;

		this._onStartCallbackFired = false;

		this._startTime = time !== undefined ? time : TWEEN.now();
		this._startTime += this._delayTime;

		for (var property in this._valuesEnd) {

			// Check if an Array was provided as property value
			if (this._valuesEnd[property] instanceof Array) {

				if (this._valuesEnd[property].length === 0) {
					continue;
				}

				// Create a local copy of the Array with the start value at the front
				this._valuesEnd[property] = [this._object[property]].concat(this._valuesEnd[property]);

			}

			// If `to()` specifies a property that doesn't exist in the source object,
			// we should not set that property in the object
			if (this._object[property] === undefined) {
				continue;
			}

			// Save the starting value.
			this._valuesStart[property] = this._object[property];

			if ((this._valuesStart[property] instanceof Array) === false) {
				this._valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
			}

			this._valuesStartRepeat[property] = this._valuesStart[property] || 0;

		}

		return this;

	},

	stop: function stop() {

		if (!this._isPlaying) {
			return this;
		}

		this._group.remove(this);
		this._isPlaying = false;

		if (this._onStopCallback !== null) {
			this._onStopCallback.call(this._object, this._object);
		}

		this.stopChainedTweens();
		return this;

	},

	end: function end() {

		this.update(this._startTime + this._duration);
		return this;

	},

	stopChainedTweens: function stopChainedTweens() {

		for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
			this._chainedTweens[i].stop();
		}

	},

	delay: function delay(amount) {

		this._delayTime = amount;
		return this;

	},

	repeat: function repeat(times) {

		this._repeat = times;
		return this;

	},

	repeatDelay: function repeatDelay(amount) {

		this._repeatDelayTime = amount;
		return this;

	},

	yoyo: function yoyo(yoyo) {

		this._yoyo = yoyo;
		return this;

	},

	easing: function easing(easing) {

		this._easingFunction = easing;
		return this;

	},

	interpolation: function interpolation(interpolation) {

		this._interpolationFunction = interpolation;
		return this;

	},

	chain: function chain() {

		this._chainedTweens = arguments;
		return this;

	},

	onStart: function onStart(callback) {

		this._onStartCallback = callback;
		return this;

	},

	onUpdate: function onUpdate(callback) {

		this._onUpdateCallback = callback;
		return this;

	},

	onComplete: function onComplete(callback) {

		this._onCompleteCallback = callback;
		return this;

	},

	onStop: function onStop(callback) {

		this._onStopCallback = callback;
		return this;

	},

	update: function update(time) {

		var property;
		var elapsed;
		var value;

		if (time < this._startTime) {
			return true;
		}

		if (this._onStartCallbackFired === false) {

			if (this._onStartCallback !== null) {
				this._onStartCallback.call(this._object, this._object);
			}

			this._onStartCallbackFired = true;
		}

		elapsed = (time - this._startTime) / this._duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		value = this._easingFunction(elapsed);

		for (property in this._valuesEnd) {

			// Don't update properties that do not exist in the source object
			if (this._valuesStart[property] === undefined) {
				continue;
			}

			var start = this._valuesStart[property] || 0;
			var end = this._valuesEnd[property];

			if (end instanceof Array) {

				this._object[property] = this._interpolationFunction(end, value);

			} else {

				// Parses relative end values with start as base (e.g.: +10, -3)
				if (typeof (end) === 'string') {

					if (end.charAt(0) === '+' || end.charAt(0) === '-') {
						end = start + parseFloat(end);
					} else {
						end = parseFloat(end);
					}
				}

				// Protect against non numeric properties.
				if (typeof (end) === 'number') {
					this._object[property] = start + (end - start) * value;
				}

			}

		}

		if (this._onUpdateCallback !== null) {
			this._onUpdateCallback.call(this._object, value);
		}

		if (elapsed === 1) {

			if (this._repeat > 0) {

				if (isFinite(this._repeat)) {
					this._repeat--;
				}

				// Reassign starting values, restart by making startTime = now
				for (property in this._valuesStartRepeat) {

					if (typeof (this._valuesEnd[property]) === 'string') {
						this._valuesStartRepeat[property] = this._valuesStartRepeat[property] + parseFloat(this._valuesEnd[property]);
					}

					if (this._yoyo) {
						var tmp = this._valuesStartRepeat[property];

						this._valuesStartRepeat[property] = this._valuesEnd[property];
						this._valuesEnd[property] = tmp;
					}

					this._valuesStart[property] = this._valuesStartRepeat[property];

				}

				if (this._yoyo) {
					this._reversed = !this._reversed;
				}

				if (this._repeatDelayTime !== undefined) {
					this._startTime = time + this._repeatDelayTime;
				} else {
					this._startTime = time + this._delayTime;
				}

				return true;

			} else {

				if (this._onCompleteCallback !== null) {

					this._onCompleteCallback.call(this._object, this._object);
				}

				for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
					// Make the chained tweens start exactly at the time they should,
					// even if the `update()` method was called way past the duration of the tween
					this._chainedTweens[i].start(this._startTime + this._duration);
				}

				return false;

			}

		}

		return true;

	}
};


TWEEN.Easing = {

	Linear: {

		None: function (k) {

			return k;

		}

	},

	Quadratic: {

		In: function (k) {

			return k * k;

		},

		Out: function (k) {

			return k * (2 - k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k;
			}

			return - 0.5 * (--k * (k - 2) - 1);

		}

	},

	Cubic: {

		In: function (k) {

			return k * k * k;

		},

		Out: function (k) {

			return --k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k + 2);

		}

	},

	Quartic: {

		In: function (k) {

			return k * k * k * k;

		},

		Out: function (k) {

			return 1 - (--k * k * k * k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k;
			}

			return - 0.5 * ((k -= 2) * k * k * k - 2);

		}

	},

	Quintic: {

		In: function (k) {

			return k * k * k * k * k;

		},

		Out: function (k) {

			return --k * k * k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k * k * k + 2);

		}

	},

	Sinusoidal: {

		In: function (k) {

			return 1 - Math.cos(k * Math.PI / 2);

		},

		Out: function (k) {

			return Math.sin(k * Math.PI / 2);

		},

		InOut: function (k) {

			return 0.5 * (1 - Math.cos(Math.PI * k));

		}

	},

	Exponential: {

		In: function (k) {

			return k === 0 ? 0 : Math.pow(1024, k - 1);

		},

		Out: function (k) {

			return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if ((k *= 2) < 1) {
				return 0.5 * Math.pow(1024, k - 1);
			}

			return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

		}

	},

	Circular: {

		In: function (k) {

			return 1 - Math.sqrt(1 - k * k);

		},

		Out: function (k) {

			return Math.sqrt(1 - (--k * k));

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return - 0.5 * (Math.sqrt(1 - k * k) - 1);
			}

			return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);

		},

		Out: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			k *= 2;

			if (k < 1) {
				return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
			}

			return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;

		}

	},

	Back: {

		In: function (k) {

			var s = 1.70158;

			return k * k * ((s + 1) * k - s);

		},

		Out: function (k) {

			var s = 1.70158;

			return --k * k * ((s + 1) * k + s) + 1;

		},

		InOut: function (k) {

			var s = 1.70158 * 1.525;

			if ((k *= 2) < 1) {
				return 0.5 * (k * k * ((s + 1) * k - s));
			}

			return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

		}

	},

	Bounce: {

		In: function (k) {

			return 1 - TWEEN.Easing.Bounce.Out(1 - k);

		},

		Out: function (k) {

			if (k < (1 / 2.75)) {
				return 7.5625 * k * k;
			} else if (k < (2 / 2.75)) {
				return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
			} else if (k < (2.5 / 2.75)) {
				return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
			} else {
				return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
			}

		},

		InOut: function (k) {

			if (k < 0.5) {
				return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
			}

			return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.Linear;

		if (k < 0) {
			return fn(v[0], v[1], f);
		}

		if (k > 1) {
			return fn(v[m], v[m - 1], m - f);
		}

		return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

	},

	Bezier: function (v, k) {

		var b = 0;
		var n = v.length - 1;
		var pw = Math.pow;
		var bn = TWEEN.Interpolation.Utils.Bernstein;

		for (var i = 0; i <= n; i++) {
			b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
		}

		return b;

	},

	CatmullRom: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.CatmullRom;

		if (v[0] === v[m]) {

			if (k < 0) {
				i = Math.floor(f = m * (1 + k));
			}

			return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

		} else {

			if (k < 0) {
				return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
			}

			if (k > 1) {
				return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
			}

			return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

		}

	},

	Utils: {

		Linear: function (p0, p1, t) {

			return (p1 - p0) * t + p0;

		},

		Bernstein: function (n, i) {

			var fc = TWEEN.Interpolation.Utils.Factorial;

			return fc(n) / fc(i) / fc(n - i);

		},

		Factorial: (function () {

			var a = [1];

			return function (n) {

				var s = 1;

				if (a[n]) {
					return a[n];
				}

				for (var i = n; i > 1; i--) {
					s *= i;
				}

				a[n] = s;
				return s;

			};

		})(),

		CatmullRom: function (p0, p1, p2, p3, t) {

			var v0 = (p2 - p0) * 0.5;
			var v1 = (p3 - p1) * 0.5;
			var t2 = t * t;
			var t3 = t * t2;

			return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

		}

	}

};

// UMD (Universal Module Definition)
(function (root) {

	if (typeof define === 'function' && define.amd) {

		// AMD
		define([], function () {
			return TWEEN;
		});

	} else if (typeof module !== 'undefined' && typeof exports === 'object') {

		// Node.js
		module.exports = TWEEN;

	} else if (root !== undefined) {

		// Global variable
		root.TWEEN = TWEEN;

	}

})(this);

}).call(this,_dereq_('_process'))
},{"_process":4}],2:[function(_dereq_,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   3.3.1
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  return function () {
    vertxNext(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = _dereq_;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof _dereq_ === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

polyfill();
// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));

}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":4}],3:[function(_dereq_,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} [once=false] Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Hold the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var events = this._events
    , names = []
    , name;

  if (!events) return names;

  for (name in events) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],4:[function(_dereq_,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(_dereq_,module,exports){
(function (global){
(function(){var g={};
(function(window){var n,aa="function"==typeof Object.defineProperties?Object.defineProperty:function(b,c,d){b!=Array.prototype&&b!=Object.prototype&&(b[c]=d.value)},ba="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global&&null!=global?global:this;function ca(){ca=function(){};ba.Symbol||(ba.Symbol=da)}var da=function(){var b=0;return function(c){return"jscomp_symbol_"+(c||"")+b++}}();
function ea(){ca();var b=ba.Symbol.iterator;b||(b=ba.Symbol.iterator=ba.Symbol("iterator"));"function"!=typeof Array.prototype[b]&&aa(Array.prototype,b,{configurable:!0,writable:!0,value:function(){return fa(this)}});ea=function(){}}function fa(b){var c=0;return ha(function(){return c<b.length?{done:!1,value:b[c++]}:{done:!0}})}function ha(b){ea();b={next:b};b[ba.Symbol.iterator]=function(){return this};return b}function ia(b){ea();var c=b[Symbol.iterator];return c?c.call(b):fa(b)}
function ja(b,c){if(c){for(var d=ba,e=b.split("."),f=0;f<e.length-1;f++){var g=e[f];g in d||(d[g]={});d=d[g]}e=e[e.length-1];f=d[e];g=c(f);g!=f&&null!=g&&aa(d,e,{configurable:!0,writable:!0,value:g})}}
ja("Promise",function(b){function c(b){this.b=0;this.g=void 0;this.a=[];var c=this.c();try{b(c.resolve,c.reject)}catch(l){c.reject(l)}}function d(){this.a=null}function e(b){return b instanceof c?b:new c(function(c){c(b)})}if(b)return b;d.prototype.b=function(b){null==this.a&&(this.a=[],this.f());this.a.push(b)};d.prototype.f=function(){var b=this;this.c(function(){b.h()})};var f=ba.setTimeout;d.prototype.c=function(b){f(b,0)};d.prototype.h=function(){for(;this.a&&this.a.length;){var b=this.a;this.a=
[];for(var c=0;c<b.length;++c){var d=b[c];b[c]=null;try{d()}catch(m){this.g(m)}}}this.a=null};d.prototype.g=function(b){this.c(function(){throw b;})};c.prototype.c=function(){function b(b){return function(e){d||(d=!0,b.call(c,e))}}var c=this,d=!1;return{resolve:b(this.m),reject:b(this.f)}};c.prototype.m=function(b){if(b===this)this.f(new TypeError("A Promise cannot resolve to itself"));else if(b instanceof c)this.o(b);else{a:switch(typeof b){case "object":var d=null!=b;break a;case "function":d=!0;
break a;default:d=!1}d?this.l(b):this.h(b)}};c.prototype.l=function(b){var c=void 0;try{c=b.then}catch(l){this.f(l);return}"function"==typeof c?this.u(c,b):this.h(b)};c.prototype.f=function(b){this.i(2,b)};c.prototype.h=function(b){this.i(1,b)};c.prototype.i=function(b,c){if(0!=this.b)throw Error("Cannot settle("+b+", "+c+"): Promise already settled in state"+this.b);this.b=b;this.g=c;this.j()};c.prototype.j=function(){if(null!=this.a){for(var b=0;b<this.a.length;++b)g.b(this.a[b]);this.a=null}};
var g=new d;c.prototype.o=function(b){var c=this.c();b.tb(c.resolve,c.reject)};c.prototype.u=function(b,c){var d=this.c();try{b.call(c,d.resolve,d.reject)}catch(m){d.reject(m)}};c.prototype.then=function(b,d){function e(b,c){return"function"==typeof b?function(c){try{f(b(c))}catch(Ha){g(Ha)}}:c}var f,g,h=new c(function(b,c){f=b;g=c});this.tb(e(b,f),e(d,g));return h};c.prototype["catch"]=function(b){return this.then(void 0,b)};c.prototype.tb=function(b,c){function d(){switch(e.b){case 1:b(e.g);break;
case 2:c(e.g);break;default:throw Error("Unexpected state: "+e.b);}}var e=this;null==this.a?g.b(d):this.a.push(d)};c.resolve=e;c.reject=function(b){return new c(function(c,d){d(b)})};c.race=function(b){return new c(function(c,d){for(var f=ia(b),g=f.next();!g.done;g=f.next())e(g.value).tb(c,d)})};c.all=function(b){var d=ia(b),f=d.next();return f.done?e([]):new c(function(b,c){function g(c){return function(d){h[c]=d;k--;0==k&&b(h)}}var h=[],k=0;do h.push(void 0),k++,e(f.value).tb(g(h.length-1),c),f=
d.next();while(!f.done)})};return c});ja("Promise.prototype.finally",function(b){return b?b:function(b){return this.then(function(c){return Promise.resolve(b()).then(function(){return c})},function(c){return Promise.resolve(b()).then(function(){throw c;})})}});function ka(b){function c(c){return b.next(c)}function d(c){return b["throw"](c)}return new Promise(function(e,f){function g(b){b.done?e(b.value):Promise.resolve(b.value).then(c,d).then(g,f)}g(b.next())})}function p(b){return ka(b())}
function la(){this.f=!1;this.b=null;this.L=void 0;this.B=1;this.c=this.qa=0;this.h=this.a=null}function ma(b){if(b.f)throw new TypeError("Generator is already running");b.f=!0}la.prototype.g=function(b){this.L=b};function na(b,c){b.a={pc:c,wc:!0};b.B=b.qa||b.c}la.prototype["return"]=function(b){this.a={"return":b};this.B=this.c};function q(b,c,d){b.B=d;return{value:c}}la.prototype.X=function(b){this.B=b};function oa(b){b.qa=0;b.c=2}function pa(b){b.B=0;b.qa=0}
function qa(b){b.qa=0;var c=b.a.pc;b.a=null;return c}function ra(b){b.h=[b.a];b.qa=0;b.c=0}function sa(b){var c=b.h.splice(0)[0];(c=b.a=b.a||c)?c.wc?b.B=b.qa||b.c:void 0!=c.X&&b.c<c.X?(b.B=c.X,b.a=null):b.B=b.c:b.B=0}function ta(b){this.a=new la;this.b=b}function ua(b,c){ma(b.a);var d=b.a.b;if(d)return va(b,"return"in d?d["return"]:function(b){return{value:b,done:!0}},c,b.a["return"]);b.a["return"](c);return wa(b)}
function va(b,c,d,e){try{var f=c.call(b.a.b,d);if(!(f instanceof Object))throw new TypeError("Iterator result "+f+" is not an object");if(!f.done)return b.a.f=!1,f;var g=f.value}catch(h){return b.a.b=null,na(b.a,h),wa(b)}b.a.b=null;e.call(b.a,g);return wa(b)}
function wa(b){for(;b.a.B;)try{var c=b.b(b.a);if(c)return b.a.f=!1,{value:c.value,done:!1}}catch(d){b.a.L=void 0,na(b.a,d)}b.a.f=!1;if(b.a.a){c=b.a.a;b.a.a=null;if(c.wc)throw c.pc;return{value:c["return"],done:!0}}return{value:void 0,done:!0}}
function xa(b){this.next=function(c){ma(b.a);b.a.b?c=va(b,b.a.b.next,c,b.a.g):(b.a.g(c),c=wa(b));return c};this["throw"]=function(c){ma(b.a);b.a.b?c=va(b,b.a.b["throw"],c,b.a.g):(na(b.a,c),c=wa(b));return c};this["return"]=function(c){return ua(b,c)};ea();this[Symbol.iterator]=function(){return this}}function v(b,c){xa.prototype=b.prototype;return new xa(new ta(c))}
ja("Array.prototype.find",function(b){return b?b:function(b,d){a:{var c=this;c instanceof String&&(c=String(c));for(var f=c.length,g=0;g<f;g++){var h=c[g];if(b.call(d,h,g,c)){c=h;break a}}c=void 0}return c}});var ya=this;ya.a=!0;function x(b,c){var d=b.split("."),e=ya;d[0]in e||!e.execScript||e.execScript("var "+d[0]);for(var f;d.length&&(f=d.shift());)d.length||void 0===c?e[f]?e=e[f]:e=e[f]={}:e[f]=c}
function za(b,c){function d(){}d.prototype=c.prototype;b.ff=c.prototype;b.prototype=new d;b.prototype.constructor=b;b.df=function(b,d,g){return c.prototype[d].apply(b,Array.prototype.slice.call(arguments,2))}};/*

 Copyright 2016 Google Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
function Aa(b){this.c=Math.exp(Math.log(.5)/b);this.b=this.a=0}function Ba(b,c,d){var e=Math.pow(b.c,c);d=d*(1-e)+e*b.a;isNaN(d)||(b.a=d,b.b+=c)}function Ca(b){return b.a/(1-Math.pow(b.c,b.b))};function Da(){this.b=new Aa(2);this.c=new Aa(5);this.a=0}Da.prototype.getBandwidthEstimate=function(b){return 128E3>this.a?b:Math.min(Ca(this.b),Ca(this.c))};function Ea(){}function Fa(){}window.console&&window.console.log.bind&&(Ea=console.warn.bind(console));function z(b,c,d,e){this.severity=b;this.category=c;this.code=d;this.data=Array.prototype.slice.call(arguments,3);this.handled=!1}x("shaka.util.Error",z);z.prototype.toString=function(){return"shaka.util.Error "+JSON.stringify(this,null,"  ")};z.Severity={RECOVERABLE:1,CRITICAL:2};z.Category={NETWORK:1,TEXT:2,MEDIA:3,MANIFEST:4,STREAMING:5,DRM:6,PLAYER:7,CAST:8,STORAGE:9};
z.Code={UNSUPPORTED_SCHEME:1E3,BAD_HTTP_STATUS:1001,HTTP_ERROR:1002,TIMEOUT:1003,MALFORMED_DATA_URI:1004,UNKNOWN_DATA_URI_ENCODING:1005,REQUEST_FILTER_ERROR:1006,RESPONSE_FILTER_ERROR:1007,MALFORMED_TEST_URI:1008,UNEXPECTED_TEST_REQUEST:1009,INVALID_TEXT_HEADER:2E3,INVALID_TEXT_CUE:2001,UNABLE_TO_DETECT_ENCODING:2003,BAD_ENCODING:2004,INVALID_XML:2005,INVALID_MP4_TTML:2007,INVALID_MP4_VTT:2008,UNABLE_TO_EXTRACT_CUE_START_TIME:2009,BUFFER_READ_OUT_OF_BOUNDS:3E3,JS_INTEGER_OVERFLOW:3001,EBML_OVERFLOW:3002,
EBML_BAD_FLOATING_POINT_SIZE:3003,MP4_SIDX_WRONG_BOX_TYPE:3004,MP4_SIDX_INVALID_TIMESCALE:3005,MP4_SIDX_TYPE_NOT_SUPPORTED:3006,WEBM_CUES_ELEMENT_MISSING:3007,WEBM_EBML_HEADER_ELEMENT_MISSING:3008,WEBM_SEGMENT_ELEMENT_MISSING:3009,WEBM_INFO_ELEMENT_MISSING:3010,WEBM_DURATION_ELEMENT_MISSING:3011,WEBM_CUE_TRACK_POSITIONS_ELEMENT_MISSING:3012,WEBM_CUE_TIME_ELEMENT_MISSING:3013,MEDIA_SOURCE_OPERATION_FAILED:3014,MEDIA_SOURCE_OPERATION_THREW:3015,VIDEO_ERROR:3016,QUOTA_EXCEEDED_ERROR:3017,UNABLE_TO_GUESS_MANIFEST_TYPE:4E3,
DASH_INVALID_XML:4001,DASH_NO_SEGMENT_INFO:4002,DASH_EMPTY_ADAPTATION_SET:4003,DASH_EMPTY_PERIOD:4004,DASH_WEBM_MISSING_INIT:4005,DASH_UNSUPPORTED_CONTAINER:4006,DASH_PSSH_BAD_ENCODING:4007,DASH_NO_COMMON_KEY_SYSTEM:4008,DASH_MULTIPLE_KEY_IDS_NOT_SUPPORTED:4009,DASH_CONFLICTING_KEY_IDS:4010,UNPLAYABLE_PERIOD:4011,RESTRICTIONS_CANNOT_BE_MET:4012,NO_PERIODS:4014,HLS_PLAYLIST_HEADER_MISSING:4015,INVALID_HLS_TAG:4016,HLS_INVALID_PLAYLIST_HIERARCHY:4017,DASH_DUPLICATE_REPRESENTATION_ID:4018,HLS_MULTIPLE_MEDIA_INIT_SECTIONS_FOUND:4020,
HLS_COULD_NOT_GUESS_MIME_TYPE:4021,HLS_MASTER_PLAYLIST_NOT_PROVIDED:4022,HLS_REQUIRED_ATTRIBUTE_MISSING:4023,HLS_REQUIRED_TAG_MISSING:4024,HLS_COULD_NOT_GUESS_CODECS:4025,HLS_KEYFORMATS_NOT_SUPPORTED:4026,DASH_UNSUPPORTED_XLINK_ACTUATE:4027,DASH_XLINK_DEPTH_LIMIT:4028,HLS_COULD_NOT_PARSE_SEGMENT_START_TIME:4030,CONTENT_UNSUPPORTED_BY_BROWSER:4032,INVALID_STREAMS_CHOSEN:5005,NO_RECOGNIZED_KEY_SYSTEMS:6E3,REQUESTED_KEY_SYSTEM_CONFIG_UNAVAILABLE:6001,FAILED_TO_CREATE_CDM:6002,FAILED_TO_ATTACH_TO_VIDEO:6003,
INVALID_SERVER_CERTIFICATE:6004,FAILED_TO_CREATE_SESSION:6005,FAILED_TO_GENERATE_LICENSE_REQUEST:6006,LICENSE_REQUEST_FAILED:6007,LICENSE_RESPONSE_REJECTED:6008,ENCRYPTED_CONTENT_WITHOUT_DRM_INFO:6010,NO_LICENSE_SERVER_GIVEN:6012,OFFLINE_SESSION_REMOVED:6013,EXPIRED:6014,LOAD_INTERRUPTED:7E3,OPERATION_ABORTED:7001,NO_VIDEO_ELEMENT:7002,CAST_API_UNAVAILABLE:8E3,NO_CAST_RECEIVERS:8001,ALREADY_CASTING:8002,UNEXPECTED_CAST_ERROR:8003,CAST_CANCELED_BY_USER:8004,CAST_CONNECTION_TIMED_OUT:8005,CAST_RECEIVER_APP_UNAVAILABLE:8006,
STORAGE_NOT_SUPPORTED:9E3,INDEXED_DB_ERROR:9001,DEPRECATED_OPERATION_ABORTED:9002,REQUESTED_ITEM_NOT_FOUND:9003,MALFORMED_OFFLINE_URI:9004,CANNOT_STORE_LIVE_OFFLINE:9005,STORE_ALREADY_IN_PROGRESS:9006,NO_INIT_DATA_FOR_OFFLINE:9007,LOCAL_PLAYER_INSTANCE_REQUIRED:9008,NEW_KEY_OPERATION_NOT_SUPPORTED:9011,KEY_NOT_FOUND:9012,MISSING_STORAGE_CELL:9013};var Ga=/^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#(.*))?$/;function Ia(b){var c;b instanceof Ia?(Ja(this,b.ha),this.Ga=b.Ga,this.ka=b.ka,Ka(this,b.Ra),this.aa=b.aa,La(this,Ma(b.a)),this.Aa=b.Aa):b&&(c=String(b).match(Ga))?(Ja(this,c[1]||"",!0),this.Ga=Na(c[2]||""),this.ka=Na(c[3]||"",!0),Ka(this,c[4]),this.aa=Na(c[5]||"",!0),La(this,c[6]||"",!0),this.Aa=Na(c[7]||"")):this.a=new Oa(null)}n=Ia.prototype;n.ha="";n.Ga="";n.ka="";n.Ra=null;n.aa="";n.Aa="";
n.toString=function(){var b=[],c=this.ha;c&&b.push(Pa(c,Qa,!0),":");if(c=this.ka){b.push("//");var d=this.Ga;d&&b.push(Pa(d,Qa,!0),"@");b.push(encodeURIComponent(c).replace(/%25([0-9a-fA-F]{2})/g,"%$1"));c=this.Ra;null!=c&&b.push(":",String(c))}if(c=this.aa)this.ka&&"/"!=c.charAt(0)&&b.push("/"),b.push(Pa(c,"/"==c.charAt(0)?Ra:Sa,!0));(c=this.a.toString())&&b.push("?",c);(c=this.Aa)&&b.push("#",Pa(c,Ta));return b.join("")};
n.resolve=function(b){var c=new Ia(this);"data"===c.ha&&(c=new Ia);var d=!!b.ha;d?Ja(c,b.ha):d=!!b.Ga;d?c.Ga=b.Ga:d=!!b.ka;d?c.ka=b.ka:d=null!=b.Ra;var e=b.aa;if(d)Ka(c,b.Ra);else if(d=!!b.aa){if("/"!=e.charAt(0))if(this.ka&&!this.aa)e="/"+e;else{var f=c.aa.lastIndexOf("/");-1!=f&&(e=c.aa.substr(0,f+1)+e)}if(".."==e||"."==e)e="";else if(-1!=e.indexOf("./")||-1!=e.indexOf("/.")){f=0==e.lastIndexOf("/",0);e=e.split("/");for(var g=[],h=0;h<e.length;){var k=e[h++];"."==k?f&&h==e.length&&g.push(""):".."==
k?((1<g.length||1==g.length&&""!=g[0])&&g.pop(),f&&h==e.length&&g.push("")):(g.push(k),f=!0)}e=g.join("/")}}d?c.aa=e:d=""!==b.a.toString();d?La(c,Ma(b.a)):d=!!b.Aa;d&&(c.Aa=b.Aa);return c};function Ja(b,c,d){b.ha=d?Na(c,!0):c;b.ha&&(b.ha=b.ha.replace(/:$/,""))}function Ka(b,c){if(c){c=Number(c);if(isNaN(c)||0>c)throw Error("Bad port number "+c);b.Ra=c}else b.Ra=null}function La(b,c,d){c instanceof Oa?b.a=c:(d||(c=Pa(c,Ua)),b.a=new Oa(c))}
function Na(b,c){return b?c?decodeURI(b):decodeURIComponent(b):""}function Pa(b,c,d){return"string"==typeof b?(b=encodeURI(b).replace(c,Va),d&&(b=b.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),b):null}function Va(b){b=b.charCodeAt(0);return"%"+(b>>4&15).toString(16)+(b&15).toString(16)}var Qa=/[#\/\?@]/g,Sa=/[#\?:]/g,Ra=/[#\?]/g,Ua=/[#\?@]/g,Ta=/#/g;function Oa(b){this.b=b||null}Oa.prototype.a=null;Oa.prototype.c=null;
Oa.prototype.add=function(b,c){if(!this.a&&(this.a={},this.c=0,this.b))for(var d=this.b.split("&"),e=0;e<d.length;e++){var f=d[e].indexOf("="),g=null;if(0<=f){var h=d[e].substring(0,f);g=d[e].substring(f+1)}else h=d[e];h=decodeURIComponent(h.replace(/\+/g," "));g=g||"";this.add(h,decodeURIComponent(g.replace(/\+/g," ")))}this.b=null;(d=this.a.hasOwnProperty(b)&&this.a[b])||(this.a[b]=d=[]);d.push(c);this.c++;return this};
Oa.prototype.toString=function(){if(this.b)return this.b;if(!this.a)return"";var b=[],c;for(c in this.a)for(var d=encodeURIComponent(c),e=this.a[c],f=0;f<e.length;f++){var g=d;""!==e[f]&&(g+="="+encodeURIComponent(e[f]));b.push(g)}return this.b=b.join("&")};function Ma(b){var c=new Oa;c.b=b.b;if(b.a){var d={},e;for(e in b.a)d[e]=b.a[e].concat();c.a=d;c.c=b.c}return c};function A(){var b,c,d=new Promise(function(d,f){b=d;c=f});d.resolve=b;d.reject=c;return d}A.prototype.resolve=function(){};A.prototype.reject=function(){};function Xa(b,c){var d=Ya();this.i=null==b.maxAttempts?d.maxAttempts:b.maxAttempts;this.f=null==b.baseDelay?d.baseDelay:b.baseDelay;this.h=null==b.fuzzFactor?d.fuzzFactor:b.fuzzFactor;this.g=null==b.backoffFactor?d.backoffFactor:b.backoffFactor;this.a=0;this.b=this.f;if(this.c=c||!1)this.a=1}function Za(b){if(b.a>=b.i)if(b.c)b.a=1,b.b=b.f;else return Promise.reject();var c=new A;b.a?(window.setTimeout(c.resolve,b.b*(1+(2*Math.random()-1)*b.h)),b.b*=b.g):c.resolve();b.a++;return c}
function Ya(){return{maxAttempts:2,baseDelay:1E3,backoffFactor:2,fuzzFactor:.5,timeout:0}};function B(b,c){this.promise=b;this.b=c;this.a=!1}x("shaka.util.AbortableOperation",B);function $a(b){return new B(Promise.reject(b),function(){return Promise.resolve()})}B.failed=$a;function ab(){var b=Promise.reject(new z(2,7,7001));b["catch"](function(){});return new B(b,function(){return Promise.resolve()})}B.aborted=ab;function bb(b){return new B(Promise.resolve(b),function(){return Promise.resolve()})}B.completed=bb;
function cb(b){return new B(b,function(){return b["catch"](function(){})})}B.notAbortable=cb;B.prototype.abort=function(){this.a=!0;return this.b()};B.prototype.abort=B.prototype.abort;function db(b){return new B(Promise.all(b.map(function(b){return b.promise})),function(){return Promise.all(b.map(function(b){return b.abort()}))})}B.all=db;B.prototype["finally"]=function(b){this.promise.then(function(){return b(!0)},function(){return b(!1)});return this};B.prototype["finally"]=B.prototype["finally"];
B.prototype.V=function(b,c){function d(){f.reject(new z(2,7,7001));return e.abort()}var e=this,f=new A;this.promise.then(function(c){e.a?f.reject(new z(2,7,7001)):b?d=eb(b,c,f):f.resolve(c)},function(b){c?d=eb(c,b,f):f.reject(b)});return new B(f,function(){return d()})};B.prototype.chain=B.prototype.V;
function eb(b,c,d){try{var e=b(c);if(e&&e.promise&&e.abort)return d.resolve(e.promise),function(){return e.abort()};d.resolve(e);return function(){return Promise.resolve(e).then(function(){})["catch"](function(){})}}catch(f){return d.reject(f),function(){return Promise.resolve()}}};function fb(b,c){for(var d=[],e=0;e<b.length;++e){for(var f=!1,g=0;g<d.length&&!(f=c?c(b[e],d[g]):b[e]===d[g]);++g);f||d.push(b[e])}return d}function gb(b,c,d){for(var e=0;e<b.length;++e)if(d(b[e],c))return e;return-1}function hb(b,c){var d=b.indexOf(c);-1<d&&b.splice(d,1)}function ib(b,c){var d=0;b.forEach(function(b){d+=c(b)?1:0});return d};function jb(b,c,d,e,f){var g=f in e,h=!0,k;for(k in c){var l=f+"."+k,m=g?e[f]:d[k];g||k in b?void 0===c[k]?void 0===m||g?delete b[k]:b[k]=m:m.constructor==Object&&c[k]&&c[k].constructor==Object?(b[k]||(b[k]=m),h=h&&jb(b[k],c[k],m,e,l)):typeof c[k]!=typeof m||null==c[k]||c[k].constructor!=m.constructor?h=!1:b[k]=c[k]:h=!1}return h}
function kb(b){function c(b){switch(typeof b){case "undefined":case "boolean":case "number":case "string":case "symbol":case "function":return b;default:if(!b)return b;if(0<=d.indexOf(b))return null;var e=b.constructor==Array;if(b.constructor!=Object&&!e)return null;d.push(b);var g=e?[]:{},h;for(h in b)g[h]=c(b[h]);e&&(g.length=b.length);return g}}var d=[];return c(b)};function lb(b,c){function d(){return Promise.all(b.map(function(b){return b.destroy()}))}return Promise.resolve(c()).then(function(b){return d().then(function(){return b})},function(b){return d().then(function(){throw b;})})};function mb(){this.a=[]}function nb(b,c){b.a.push(c["finally"](function(){hb(b.a,c)}))}mb.prototype.destroy=function(){var b=[];this.a.forEach(function(c){c.promise["catch"](function(){});b.push(c.abort())});this.a=[];return Promise.all(b)};function C(b){this.c=!1;this.g=new mb;this.a=[];this.b=[];this.f=b||null}x("shaka.net.NetworkingEngine",C);C.RequestType={MANIFEST:0,SEGMENT:1,LICENSE:2,APP:3};C.PluginPriority={FALLBACK:1,PREFERRED:2,APPLICATION:3};var ob={};function pb(b,c,d){d=d||3;var e=ob[b];if(!e||d>=e.priority)ob[b]={priority:d,me:c}}C.registerScheme=pb;C.unregisterScheme=function(b){delete ob[b]};C.prototype.pe=function(b){this.a.push(b)};C.prototype.registerRequestFilter=C.prototype.pe;
C.prototype.Ue=function(b){hb(this.a,b)};C.prototype.unregisterRequestFilter=C.prototype.Ue;C.prototype.gd=function(){this.a=[]};C.prototype.clearAllRequestFilters=C.prototype.gd;C.prototype.qe=function(b){this.b.push(b)};C.prototype.registerResponseFilter=C.prototype.qe;C.prototype.Ve=function(b){hb(this.b,b)};C.prototype.unregisterResponseFilter=C.prototype.Ve;C.prototype.hd=function(){this.b=[]};C.prototype.clearAllResponseFilters=C.prototype.hd;
function qb(b,c){return{uris:b,method:"GET",body:null,headers:{},allowCrossSiteCredentials:!1,retryParameters:c}}C.prototype.destroy=function(){this.c=!0;this.a=[];this.b=[];return this.g.destroy()};C.prototype.destroy=C.prototype.destroy;
function rb(b){b.then=function(c,d){Ea("The network request interface has changed!  Please update your application to the new interface, which allows operations to be aborted.  Support for the old API will be removed in v2.5.");return b.promise.then(c,d)};b["catch"]=function(c){Ea("The network request interface has changed!  Please update your application to the new interface, which allows operations to be aborted.  Support for the old API will be removed in v2.5.");return b.promise["catch"](c)};
return b}
C.prototype.request=function(b,c){var d=this;if(this.c)return rb(ab());c.method=c.method||"GET";c.headers=c.headers||{};c.retryParameters=c.retryParameters?kb(c.retryParameters):Ya();c.uris=kb(c.uris);var e=sb(this,b,c),f=e.V(function(){return tb(d,b,c,new Xa(c.retryParameters,!1),0,null)}),g=f.V(function(c){return ub(d,b,c)}),h=Date.now(),k=0;e.promise.then(function(){k=Date.now()-h},function(){});var l=0;f.promise.then(function(){l=Date.now()},function(){});e=g.V(function(c){var e=Date.now()-l;
c.timeMs+=k;c.timeMs+=e;d.f&&!c.fromCache&&1==b&&d.f(c.timeMs,c.data.byteLength);return c},function(b){b&&(b.severity=2);throw b;});nb(this.g,e);return rb(e)};C.prototype.request=C.prototype.request;function sb(b,c,d){var e=bb(void 0);b.a.forEach(function(b){e=e.V(function(){return b(c,d)})});return e.V(void 0,function(b){if(b&&7001==b.code)throw b;throw new z(2,1,1006,b);})}
function tb(b,c,d,e,f,g){var h=new Ia(d.uris[f]),k=h.ha;k||(k=location.protocol,k=k.slice(0,-1),Ja(h,k),d.uris[f]=h.toString());var l=(k=ob[k])?k.me:null;if(!l)return $a(new z(2,1,1E3,h));var m;return cb(Za(e)).V(function(){if(b.c)return ab();m=Date.now();var e=l(d.uris[f],d,c);void 0==e.promise&&(Ea("The scheme plugin interface has changed!  Please update your scheme plugins to the new interface to add support for abort().  Support for the old plugin interface will be removed in v2.5."),e=cb(e));
return e}).V(function(b){void 0==b.timeMs&&(b.timeMs=Date.now()-m);return b},function(h){if(h&&7001==h.code)throw h;if(b.c)return ab();if(h&&1==h.severity)return f=(f+1)%d.uris.length,tb(b,c,d,e,f,h);throw h||g;})}function ub(b,c,d){var e=bb(void 0);b.b.forEach(function(b){e=e.V(function(){return b(c,d)})});return e.V(function(){return d},function(b){if(b&&7001==b.code)throw b;var c=2;b instanceof z&&(c=b.severity);throw new z(c,1,1007,b);})};function vb(){this.a={}}vb.prototype.push=function(b,c){this.a.hasOwnProperty(b)?this.a[b].push(c):this.a[b]=[c]};vb.prototype.get=function(b){return(b=this.a[b])?b.slice():null};vb.prototype.remove=function(b,c){var d=this.a[b];if(d)for(var e=0;e<d.length;++e)d[e]==c&&(d.splice(e,1),--e)};function D(){this.a=new vb}D.prototype.destroy=function(){wb(this);this.a=null;return Promise.resolve()};function E(b,c,d,e){b.a&&(c=new xb(c,d,e),b.a.push(d,c))}function yb(b,c,d,e){E(b,c,d,function(b){this.na(c,d);e(b)}.bind(b))}D.prototype.na=function(b,c){if(this.a)for(var d=this.a.get(c)||[],e=0;e<d.length;++e){var f=d[e];f.target==b&&(f.na(),this.a.remove(c,f))}};function wb(b){if(b.a){var c=b.a,d=[],e;for(e in c.a)d.push.apply(d,c.a[e]);for(c=0;c<d.length;++c)d[c].na();b.a.a={}}}
function xb(b,c,d){this.target=b;this.type=c;this.a=d;this.target.addEventListener(c,d,!1)}xb.prototype.na=function(){this.target.removeEventListener(this.type,this.a,!1);this.a=this.target=null};function F(b,c){var d=c||{},e;for(e in d)this[e]=d[e];this.defaultPrevented=this.cancelable=this.bubbles=!1;this.timeStamp=window.performance&&window.performance.now?window.performance.now():Date.now();this.type=b;this.isTrusted=!1;this.target=this.currentTarget=null;this.a=!1}F.prototype.preventDefault=function(){this.cancelable&&(this.defaultPrevented=!0)};F.prototype.stopImmediatePropagation=function(){this.a=!0};F.prototype.stopPropagation=function(){};function zb(b,c){return b.reduce(function(b,c,f){return c["catch"](b.bind(null,f))}.bind(null,c),Promise.reject())}function Ab(b,c){return b.concat(c)}function Bb(){}function Cb(b){return null!=b}function Db(b,c,d){return d.indexOf(b)==c};function Eb(b,c){if(0==c.length)return b;var d=c.map(function(b){return new Ia(b)});return b.map(function(b){return new Ia(b)}).map(function(b){return d.map(b.resolve.bind(b))}).reduce(Ab,[]).map(function(b){return b.toString()})}function Fb(b,c){return{keySystem:b,licenseServerUri:"",distinctiveIdentifierRequired:!1,persistentStateRequired:!1,audioRobustness:"",videoRobustness:"",serverCertificate:null,initData:c||[],keyIds:[]}}var Gb=1/15;function Hb(b){return!b||0==Object.keys(b).length}function G(b){return Object.keys(b).map(function(c){return b[c]})}function Ib(b,c){return Object.keys(b).every(function(d){return c(d,b[d])})}function Jb(b,c){Object.keys(b).forEach(function(d){c(d,b[d])})};function Kb(b,c){var d=b;c&&(d+='; codecs="'+c+'"');return d}var Mb={codecs:"codecs",frameRate:"framerate",bandwidth:"bitrate",width:"width",height:"height",channelsCount:"channels"};function H(b){if(!b)return"";b=new Uint8Array(b);239==b[0]&&187==b[1]&&191==b[2]&&(b=b.subarray(3));b=escape(Nb(b));try{return decodeURIComponent(b)}catch(c){throw new z(2,2,2004);}}x("shaka.util.StringUtils.fromUTF8",H);
function Ob(b,c,d){if(!b)return"";if(!d&&0!=b.byteLength%2)throw new z(2,2,2004);if(b instanceof ArrayBuffer)var e=b;else d=new Uint8Array(b.byteLength),d.set(new Uint8Array(b)),e=d.buffer;b=Math.floor(b.byteLength/2);d=new Uint16Array(b);e=new DataView(e);for(var f=0;f<b;f++)d[f]=e.getUint16(2*f,c);return Nb(d)}x("shaka.util.StringUtils.fromUTF16",Ob);
function Pb(b){var c=new Uint8Array(b);if(239==c[0]&&187==c[1]&&191==c[2])return H(c);if(254==c[0]&&255==c[1])return Ob(c.subarray(2),!1);if(255==c[0]&&254==c[1])return Ob(c.subarray(2),!0);var d=function(b,c){return b.byteLength<=c||32<=b[c]&&126>=b[c]}.bind(null,c);if(0==c[0]&&0==c[2])return Ob(b,!1);if(0==c[1]&&0==c[3])return Ob(b,!0);if(d(0)&&d(1)&&d(2)&&d(3))return H(b);throw new z(2,2,2003);}x("shaka.util.StringUtils.fromBytesAutoDetect",Pb);
function Qb(b){b=encodeURIComponent(b);b=unescape(b);for(var c=new Uint8Array(b.length),d=0;d<b.length;++d)c[d]=b.charCodeAt(d);return c.buffer}x("shaka.util.StringUtils.toUTF8",Qb);function Nb(b){for(var c="",d=0;d<b.length;d+=16E3)c+=String.fromCharCode.apply(null,b.subarray(d,d+16E3));return c};function Rb(b){this.a=null;this.b=function(){this.a=null;b()}.bind(this)}Rb.prototype.cancel=function(){null!=this.a&&(clearTimeout(this.a),this.a=null)};function Sb(b){b.cancel();b.a=setTimeout(b.b,500)}function Tb(b,c){b.cancel();var d=function(){this.b();this.a=setTimeout(d,1E3*c)}.bind(b);b.a=setTimeout(d,1E3*c)};function Ub(b,c){var d=void 0==c?!0:c,e=window.btoa(Nb(b)).replace(/\+/g,"-").replace(/\//g,"_");return d?e:e.replace(/=*$/,"")}x("shaka.util.Uint8ArrayUtils.toBase64",Ub);function Vb(b){b=window.atob(b.replace(/-/g,"+").replace(/_/g,"/"));for(var c=new Uint8Array(b.length),d=0;d<b.length;++d)c[d]=b.charCodeAt(d);return c}x("shaka.util.Uint8ArrayUtils.fromBase64",Vb);function Wb(b){for(var c=new Uint8Array(b.length/2),d=0;d<b.length;d+=2)c[d/2]=window.parseInt(b.substr(d,2),16);return c}
x("shaka.util.Uint8ArrayUtils.fromHex",Wb);function Xb(b){for(var c="",d=0;d<b.length;++d){var e=b[d].toString(16);1==e.length&&(e="0"+e);c+=e}return c}x("shaka.util.Uint8ArrayUtils.toHex",Xb);function Yb(b,c){if(!b&&!c)return!0;if(!b||!c||b.length!=c.length)return!1;for(var d=0;d<b.length;++d)if(b[d]!=c[d])return!1;return!0}x("shaka.util.Uint8ArrayUtils.equal",Yb);
function Zb(b){for(var c=0,d=0;d<arguments.length;++d)c+=arguments[d].length;c=new Uint8Array(c);for(var e=d=0;e<arguments.length;++e)c.set(arguments[e],d),d+=arguments[e].length;return c}x("shaka.util.Uint8ArrayUtils.concat",Zb);function $b(b){this.o=b;this.l=this.j=this.u=null;this.M=!1;this.b=null;this.g=new D;this.a=[];this.m=[];this.i=new A;this.f=null;this.h=function(c){this.i.reject(c);b.onError(c)}.bind(this);this.A={};this.H=new Rb(this.oe.bind(this));this.fa=this.c=!1;this.K=[];this.T=!1;this.v=new Rb(this.ne.bind(this));Tb(this.v,1);this.i["catch"](function(){})}n=$b.prototype;
n.destroy=function(){this.c=!0;var b=[];this.a.forEach(function(c){c=c.ia.close()["catch"](Bb);var d=new Promise(function(b){setTimeout(b,1E3)});b.push(Promise.race([c,d]))});this.i.reject();this.g&&b.push(this.g.destroy());this.l&&b.push(this.l.setMediaKeys(null)["catch"](Bb));this.v&&(this.v.cancel(),this.v=null);this.H&&(this.H.cancel(),this.H=null);this.g=this.l=this.j=this.u=this.b=null;this.a=[];this.m=[];this.o=this.h=this.f=null;return Promise.all(b)};n.configure=function(b){this.f=b};
n.init=function(b,c){var d={},e=[];this.fa=c;this.m=b.offlineSessionIds;ac(this,b,c||0<b.offlineSessionIds.length,d,e);return e.length?bc(this,d,e):(this.M=!0,Promise.resolve())};
n.sb=function(b){if(!this.j)return yb(this.g,b,"encrypted",function(){this.h(new z(2,6,6010))}.bind(this)),Promise.resolve();this.l=b;yb(this.g,this.l,"play",this.Td.bind(this));b=this.l.setMediaKeys(this.j);b=b["catch"](function(b){return Promise.reject(new z(2,6,6003,b.message))});var c=null;this.b.serverCertificate&&this.b.serverCertificate.length&&(c=this.j.setServerCertificate(this.b.serverCertificate).then(function(){})["catch"](function(b){return Promise.reject(new z(2,6,6004,b.message))}));
return Promise.all([b,c]).then(function(){if(this.c)return Promise.reject();cc(this);this.b.initData.length||this.m.length||E(this.g,this.l,"encrypted",this.Id.bind(this))}.bind(this))["catch"](function(b){return this.c?Promise.resolve():Promise.reject(b)}.bind(this))};
function dc(b,c){return Promise.all(c.map(function(b){return ec(this,b).then(function(b){if(b){for(var c=new A,d=0;d<this.a.length;d++)if(this.a[d].ia==b){this.a[d].oa=c;break}return Promise.all([b.remove(),c])}}.bind(this))}.bind(b)))}function cc(b){var c=b.b?b.b.initData:[];c.forEach(function(b){fc(this,b.initDataType,b.initData)}.bind(b));b.m.forEach(function(b){ec(this,b)}.bind(b));c.length||b.m.length||b.i.resolve();return b.i}n.keySystem=function(){return this.b?this.b.keySystem:""};
function gc(b){return b.a.map(function(b){return b.ia.sessionId})}n.wb=function(){var b=this.a.map(function(b){b=b.ia.expiration;return isNaN(b)?Infinity:b});return Math.min.apply(Math,b)};
function ac(b,c,d,e,f){var g=hc(b),h=ic(b,c);c.periods.forEach(function(b){b.variants.forEach(function(b){g&&(b.drmInfos=[g]);h&&(b.drmInfos=h);b.drmInfos.forEach(function(c){jc(this,c);window.cast&&window.cast.__platform__&&"com.microsoft.playready"==c.keySystem&&(c.keySystem="com.chromecast.playready");var g=e[c.keySystem];g||(g={audioCapabilities:[],videoCapabilities:[],distinctiveIdentifier:"optional",persistentState:d?"required":"optional",sessionTypes:[d?"persistent-license":"temporary"],label:c.keySystem,
drmInfos:[]},e[c.keySystem]=g,f.push(c.keySystem));g.drmInfos.push(c);c.distinctiveIdentifierRequired&&(g.distinctiveIdentifier="required");c.persistentStateRequired&&(g.persistentState="required");var h=[];b.video&&h.push(b.video);b.audio&&h.push(b.audio);h.forEach(function(b){("video"==b.type?g.videoCapabilities:g.audioCapabilities).push({robustness:("video"==b.type?c.videoRobustness:c.audioRobustness)||"",contentType:Kb(b.mimeType,b.codecs)})}.bind(this))}.bind(this))}.bind(this))}.bind(b))}
function bc(b,c,d){if(1==d.length&&""==d[0])return Promise.reject(new z(2,6,6E3));var e=new A,f=e;[!0,!1].forEach(function(b){d.forEach(function(d){var e=c[d];e.drmInfos.some(function(b){return!!b.licenseServerUri})==b&&(0==e.audioCapabilities.length&&delete e.audioCapabilities,0==e.videoCapabilities.length&&delete e.videoCapabilities,f=f["catch"](function(){return this.c?Promise.reject():navigator.requestMediaKeySystemAccess(d,[e])}.bind(this)))}.bind(this))}.bind(b));f=f["catch"](function(){return Promise.reject(new z(2,
6,6001))});f=f.then(function(b){if(this.c)return Promise.reject();var d=0<=navigator.userAgent.indexOf("Edge/"),e=b.getConfiguration();this.u=(e.audioCapabilities||[]).concat(e.videoCapabilities||[]).map(function(b){return b.contentType});d&&(this.u=null);d=c[b.keySystem];kc(this,b.keySystem,d,d.drmInfos);return this.b.licenseServerUri?b.createMediaKeys():Promise.reject(new z(2,6,6012))}.bind(b)).then(function(b){if(this.c)return Promise.reject();this.j=b;this.M=!0}.bind(b))["catch"](function(b){if(this.c)return Promise.resolve();
this.u=this.b=null;return b instanceof z?Promise.reject(b):Promise.reject(new z(2,6,6002,b.message))}.bind(b));e.reject();return f}
function jc(b,c){var d=c.keySystem;if(d){if(!c.licenseServerUri){var e=b.f.servers[d];e&&(c.licenseServerUri=e)}c.keyIds||(c.keyIds=[]);if(d=b.f.advanced[d])c.distinctiveIdentifierRequired||(c.distinctiveIdentifierRequired=d.distinctiveIdentifierRequired),c.persistentStateRequired||(c.persistentStateRequired=d.persistentStateRequired),c.videoRobustness||(c.videoRobustness=d.videoRobustness),c.audioRobustness||(c.audioRobustness=d.audioRobustness),c.serverCertificate||(c.serverCertificate=d.serverCertificate)}}
function hc(b){if(Hb(b.f.clearKeys))return null;var c=[],d=[],e;for(e in b.f.clearKeys){var f=b.f.clearKeys[e],g=Wb(e);f=Wb(f);g={kty:"oct",kid:Ub(g,!1),k:Ub(f,!1)};c.push(g);d.push(g.kid)}b=JSON.stringify({keys:c});d=JSON.stringify({kids:d});d=[{initData:new Uint8Array(Qb(d)),initDataType:"keyids"}];return{keySystem:"org.w3.clearkey",licenseServerUri:"data:application/json;base64,"+window.btoa(b),distinctiveIdentifierRequired:!1,persistentStateRequired:!1,audioRobustness:"",videoRobustness:"",serverCertificate:null,
initData:d,keyIds:[]}}function ic(b,c){var d=b.f,e=Object.keys(d.servers);return!e.length||c.periods.some(function(b){return b.variants.some(function(b){return b.drmInfos.length})})?null:e.map(function(b){return{keySystem:b,licenseServerUri:d.servers[b],distinctiveIdentifierRequired:!1,persistentStateRequired:!1,audioRobustness:"",videoRobustness:"",serverCertificate:null,initData:[],keyIds:[]}})}
function kc(b,c,d,e){var f=[],g=[],h=[],k=[];lc(e,f,g,h,k);b.b={keySystem:c,licenseServerUri:f[0],distinctiveIdentifierRequired:"required"==d.distinctiveIdentifier,persistentStateRequired:"required"==d.persistentState,audioRobustness:d.audioCapabilities?d.audioCapabilities[0].robustness:"",videoRobustness:d.videoCapabilities?d.videoCapabilities[0].robustness:"",serverCertificate:g[0],initData:h,keyIds:k}}
function lc(b,c,d,e,f){function g(b,c){return b.keyId&&b.keyId==c.keyId?!0:b.initDataType==c.initDataType&&Yb(b.initData,c.initData)}b.forEach(function(b){-1==c.indexOf(b.licenseServerUri)&&c.push(b.licenseServerUri);b.serverCertificate&&-1==gb(d,b.serverCertificate,Yb)&&d.push(b.serverCertificate);b.initData&&b.initData.forEach(function(b){-1==gb(e,b,g)&&e.push(b)});if(b.keyIds)for(var h=0;h<b.keyIds.length;++h)-1==f.indexOf(b.keyIds[h])&&f.push(b.keyIds[h])})}
n.Id=function(b){for(var c=new Uint8Array(b.initData),d=0;d<this.a.length;++d)if(Yb(c,this.a[d].initData))return;fc(this,b.initDataType,c)};
function ec(b,c){try{var d=b.j.createSession("persistent-license")}catch(g){var e=new z(2,6,6005,g.message);b.h(e);return Promise.reject(e)}E(b.g,d,"message",b.Gc.bind(b));E(b.g,d,"keystatuseschange",b.Cc.bind(b));var f={initData:null,ia:d,loaded:!1,Ub:Infinity,oa:null};b.a.push(f);return d.load(c).then(function(b){if(!this.c){if(b)return f.loaded=!0,this.a.every(function(b){return b.loaded})&&this.i.resolve(),d;this.a.splice(this.a.indexOf(f),1);this.h(new z(2,6,6013))}}.bind(b),function(b){this.c||
(this.a.splice(this.a.indexOf(f),1),this.h(new z(2,6,6005,b.message)))}.bind(b))}
function fc(b,c,d){try{var e=b.fa?b.j.createSession("persistent-license"):b.j.createSession()}catch(f){b.h(new z(2,6,6005,f.message));return}E(b.g,e,"message",b.Gc.bind(b));E(b.g,e,"keystatuseschange",b.Cc.bind(b));b.a.push({initData:d,ia:e,loaded:!1,Ub:Infinity,oa:null});e.generateRequest(c,d.buffer)["catch"](function(b){if(!this.c){for(var c=0;c<this.a.length;++c)if(this.a[c].ia==e){this.a.splice(c,1);break}this.h(new z(2,6,6006,b.message))}}.bind(b))}
n.Gc=function(b){this.f.delayLicenseRequestUntilPlayed&&this.l.paused&&!this.T?this.K.push(b):mc(this,b)};
function mc(b,c){for(var d=c.target,e,f=0;f<b.a.length;f++)if(b.a[f].ia==d){e=b.a[f];break}f=qb([b.b.licenseServerUri],b.f.retryParameters);f.body=c.message;f.method="POST";"com.microsoft.playready"!=b.b.keySystem&&"com.chromecast.playready"!=b.b.keySystem||nc(f);b.o.Oa.request(2,f).promise.then(function(b){return this.c?Promise.reject():d.update(b.data).then(function(){this.o.onEvent(new F("drmsessionupdate"));e&&(e.oa&&e.oa.resolve(),setTimeout(function(){e.loaded=!0;this.a.every(function(b){return b.loaded})&&
this.i.resolve()}.bind(this),5E3))}.bind(this))}.bind(b),function(b){if(this.c)return Promise.resolve();b=new z(2,6,6007,b);this.h(b);e&&e.oa&&e.oa.reject(b)}.bind(b))["catch"](function(b){if(this.c)return Promise.resolve();b=new z(2,6,6008,b.message);this.h(b);e&&e.oa&&e.oa.reject(b)}.bind(b))}
function nc(b){var c=Ob(b.body,!0,!0);if(-1==c.indexOf("PlayReadyKeyMessage"))b.headers["Content-Type"]="text/xml; charset=utf-8";else{c=(new DOMParser).parseFromString(c,"application/xml");for(var d=c.getElementsByTagName("HttpHeader"),e=0;e<d.length;++e)b.headers[d[e].querySelector("name").textContent]=d[e].querySelector("value").textContent;b.body=Vb(c.querySelector("Challenge").textContent).buffer}}
n.Cc=function(b){b=b.target;var c;for(c=0;c<this.a.length&&this.a[c].ia!=b;++c);if(c!=this.a.length){var d=!1;b.keyStatuses.forEach(function(b,e){if("string"==typeof e){var f=e;e=b;b=f}if("com.microsoft.playready"==this.b.keySystem&&16==e.byteLength){f=new DataView(e);var g=f.getUint32(0,!0),l=f.getUint16(4,!0),m=f.getUint16(6,!0);f.setUint32(0,g,!1);f.setUint16(4,l,!1);f.setUint16(6,m,!1)}"com.microsoft.playready"==this.b.keySystem&&"status-pending"==b&&(b="usable");"status-pending"!=b&&(this.a[c].loaded=
!0,this.a.every(function(b){return b.loaded})&&this.i.resolve());"expired"==b&&(d=!0);f=Xb(new Uint8Array(e));this.A[f]=b}.bind(this));var e=b.expiration-Date.now();(0>e||d&&1E3>e)&&!this.a[c].oa&&(this.a.splice(c,1),b.close()["catch"](function(){}));Sb(this.H)}};n.oe=function(){function b(b,d){return"expired"==d}!Hb(this.A)&&Ib(this.A,b)&&this.h(new z(2,6,6014));this.o.zb(this.A)};
function oc(){var b=[],c=[{contentType:'video/mp4; codecs="avc1.42E01E"'},{contentType:'video/webm; codecs="vp8"'}],d=[{videoCapabilities:c,persistentState:"required",sessionTypes:["persistent-license"]},{videoCapabilities:c}],e={};"org.w3.clearkey com.widevine.alpha com.microsoft.playready com.apple.fps.2_0 com.apple.fps.1_0 com.apple.fps com.adobe.primetime".split(" ").forEach(function(c){var f=navigator.requestMediaKeySystemAccess(c,d).then(function(b){var d=b.getConfiguration().sessionTypes;d=
d?0<=d.indexOf("persistent-license"):!1;0<=navigator.userAgent.indexOf("Tizen 3")&&(d=!1);e[c]={persistentState:d};return b.createMediaKeys()})["catch"](function(){e[c]=null});b.push(f)});return Promise.all(b).then(function(){return e})}n.Td=function(){for(var b=0;b<this.K.length;b++)mc(this,this.K[b]);this.T=!0;this.K=[]};function pc(b,c){var d=b.keySystem();return 0==c.drmInfos.length||c.drmInfos.some(function(b){return b.keySystem==d})}
function qc(b,c){if(!b.length)return c;if(!c.length)return b;for(var d=[],e=0;e<b.length;e++)for(var f=0;f<c.length;f++)if(b[e].keySystem==c[f].keySystem){var g=b[e];f=c[f];var h=[];h=h.concat(g.initData||[]);h=h.concat(f.initData||[]);var k=[];k=k.concat(g.keyIds);k=k.concat(f.keyIds);d.push({keySystem:g.keySystem,licenseServerUri:g.licenseServerUri||f.licenseServerUri,distinctiveIdentifierRequired:g.distinctiveIdentifierRequired||f.distinctiveIdentifierRequired,persistentStateRequired:g.persistentStateRequired||
f.persistentStateRequired,videoRobustness:g.videoRobustness||f.videoRobustness,audioRobustness:g.audioRobustness||f.audioRobustness,serverCertificate:g.serverCertificate||f.serverCertificate,initData:h,keyIds:k});break}return d}n.ne=function(){this.a.forEach(function(b){var c=b.Ub,d=b.ia.expiration;isNaN(d)&&(d=Infinity);d!=c&&(this.o.onExpirationUpdated(b.ia.sessionId,d),b.Ub=d)}.bind(this))};function rc(b){return!b||1==b.length&&1E-6>b.end(0)-b.start(0)?null:b.length?b.end(b.length-1):null}function sc(b,c){return!b||!b.length||1==b.length&&1E-6>b.end(0)-b.start(0)?!1:c>=b.start(0)&&c<=b.end(b.length-1)}function tc(b,c){if(!b||!b.length||1==b.length&&1E-6>b.end(0)-b.start(0))return 0;for(var d=0,e=b.length-1;0<=e&&b.end(e)>c;--e)d+=b.end(e)-Math.max(b.start(e),c);return d}function uc(b){if(!b)return[];for(var c=[],d=0;d<b.length;d++)c.push({start:b.start(d),end:b.end(d)});return c};function I(b,c,d){this.startTime=b;this.endTime=c;this.payload=d;this.region=new vc;this.position=null;this.positionAlign=wc;this.size=100;this.textAlign=xc;this.writingDirection=yc;this.lineInterpretation=zc;this.line=null;this.lineHeight="";this.lineAlign=Ac;this.displayAlign=Bc;this.fontSize=this.backgroundColor=this.color="";this.fontWeight=Cc;this.fontStyle=Dc;this.fontFamily="";this.textDecoration=[];this.wrapLine=!0;this.id=""}x("shaka.text.Cue",I);var wc="auto";
I.positionAlign={LEFT:"line-left",RIGHT:"line-right",CENTER:"center",AUTO:wc};var xc="center",Ec={LEFT:"left",RIGHT:"right",CENTER:xc,START:"start",END:"end"};I.textAlign=Ec;var Bc="before",Fc={BEFORE:Bc,CENTER:"center",AFTER:"after"};I.displayAlign=Fc;var yc=0;I.writingDirection={HORIZONTAL_LEFT_TO_RIGHT:yc,HORIZONTAL_RIGHT_TO_LEFT:1,VERTICAL_LEFT_TO_RIGHT:2,VERTICAL_RIGHT_TO_LEFT:3};var zc=0;I.lineInterpretation={LINE_NUMBER:zc,PERCENTAGE:1};var Ac="center",Gc={CENTER:Ac,START:"start",END:"end"};
I.lineAlign=Gc;var Cc=400;I.fontWeight={NORMAL:Cc,BOLD:700};var Dc="normal",Hc={NORMAL:Dc,ITALIC:"italic",OBLIQUE:"oblique"};I.fontStyle=Hc;I.textDecoration={UNDERLINE:"underline",LINE_THROUGH:"lineThrough",OVERLINE:"overline"};function vc(){this.id="";this.regionAnchorY=this.regionAnchorX=this.viewportAnchorY=this.viewportAnchorX=0;this.height=this.width=100;this.viewportAnchorUnits=this.widthUnits=this.heightUnits=Ic;this.scroll=Jc}x("shaka.text.CueRegion",vc);var Ic=1;
vc.units={PX:0,PERCENTAGE:Ic,LINES:2};var Jc="";vc.scrollMode={NONE:Jc,UP:"up"};function Kc(){this.a=new muxjs.mp4.Transmuxer({keepOriginalTimestamps:!0});this.c=null;this.f=[];this.b=[];this.a.on("data",this.h.bind(this));this.a.on("done",this.g.bind(this))}Kc.prototype.destroy=function(){this.a.dispose();this.a=null;return Promise.resolve()};function Lc(b,c){return window.muxjs&&"mp2t"==b.split(";")[0].split("/")[1]?c?MediaSource.isTypeSupported(Mc(c,b)):MediaSource.isTypeSupported(Mc("audio",b))||MediaSource.isTypeSupported(Mc("video",b)):!1}
function Mc(b,c){var d=c.replace("mp2t","mp4");"audio"==b&&(d=d.replace("video","audio"));var e=/avc1\.(66|77|100)\.(\d+)/.exec(d);if(e){var f="avc1.",g=e[1],h=Number(e[2]);f=("66"==g?f+"4200":"77"==g?f+"4d00":f+"6400")+(h>>4).toString(16);f+=(h&15).toString(16);d=d.replace(e[0],f)}return d}function Nc(b,c){b.c=new A;b.f=[];b.b=[];var d=new Uint8Array(c);b.a.push(d);b.a.flush();return b.c}
Kc.prototype.h=function(b){for(var c=0;c<b.captions.length;c++){var d=b.captions[c];this.b.push(new I(d.startTime,d.endTime,d.text))}c=new Uint8Array(b.data.byteLength+b.initSegment.byteLength);c.set(b.initSegment,0);c.set(b.data,b.initSegment.byteLength);this.f.push(c)};Kc.prototype.g=function(){var b={data:Zb.apply(null,this.f),cues:this.b};this.c.resolve(b)};function Oc(b){this.f=null;this.c=b;this.i=this.g=0;this.h=Infinity;this.b=this.a=null}var J={};x("shaka.text.TextEngine.registerParser",function(b,c){J[b]=c});x("shaka.text.TextEngine.unregisterParser",function(b){delete J[b]});Oc.prototype.destroy=function(){this.c=this.f=null;return Promise.resolve()};Oc.prototype.Ee=function(b){this.c=b};Oc.prototype.setDisplayer=Oc.prototype.Ee;
Oc.prototype.Mb=function(b){var c={periodStart:0,segmentStart:null,segmentEnd:0};try{return this.f.parseMedia(new Uint8Array(b),c)[0].startTime}catch(d){throw new z(2,2,2009,d);}};
function Pc(b,c,d,e){return Promise.resolve().then(function(){if(this.f&&this.c)if(null==d||null==e)this.f.parseInit(new Uint8Array(c));else{var b={periodStart:this.g,segmentStart:this.g+d,segmentEnd:this.g+e};b=this.f.parseMedia(new Uint8Array(c),b).filter(function(b){return b.startTime>=this.i&&b.startTime<this.h}.bind(this));this.c.append(b);null==this.a&&(this.a=Math.max(d,this.i));this.b=Math.min(e,this.h)}}.bind(b))}
Oc.prototype.remove=function(b,c){return Promise.resolve().then(function(){!this.c||!this.c.remove(b,c)||null==this.a||c<=this.a||b>=this.b||(b<=this.a&&c>=this.b?this.a=this.b=null:b<=this.a&&c<this.b?this.a=c:b>this.a&&c>=this.b&&(this.b=b))}.bind(this))};Oc.prototype.kc=function(b){this.c.append(b)};Oc.prototype.appendCues=Oc.prototype.kc;function Qc(b){this.f=b;this.o=null;this.b={};this.a=null;this.c={};this.i=new D;this.m=!1;this.h={};this.l=!1;b=this.j=new A;var c=new MediaSource;yb(this.i,c,"sourceopen",b.resolve);this.f.src=window.URL.createObjectURL(c);this.g=c}
function Rc(){var b={};'video/mp4; codecs="avc1.42E01E",video/mp4; codecs="avc3.42E01E",video/mp4; codecs="hev1.1.6.L93.90",video/mp4; codecs="hvc1.1.6.L93.90",video/mp4; codecs="hev1.2.4.L153.B0"; eotf="smpte2084",video/mp4; codecs="hvc1.2.4.L153.B0"; eotf="smpte2084",video/mp4; codecs="vp9",video/mp4; codecs="vp09.00.10.08",audio/mp4; codecs="mp4a.40.2",audio/mp4; codecs="ac-3",audio/mp4; codecs="ec-3",audio/mp4; codecs="opus",audio/mp4; codecs="flac",video/webm; codecs="vp8",video/webm; codecs="vp9",video/webm; codecs="av1",audio/webm; codecs="vorbis",audio/webm; codecs="opus",video/mp2t; codecs="avc1.42E01E",video/mp2t; codecs="avc3.42E01E",video/mp2t; codecs="hvc1.1.6.L93.90",video/mp2t; codecs="mp4a.40.2",video/mp2t; codecs="ac-3",video/mp2t; codecs="ec-3",text/vtt,application/mp4; codecs="wvtt",application/ttml+xml,application/mp4; codecs="stpp"'.split(",").forEach(function(c){b[c]=!!J[c]||
MediaSource.isTypeSupported(c)||Lc(c);var d=c.split(";")[0];b[d]=b[d]||b[c]});return b}n=Qc.prototype;
n.destroy=function(){this.m=!0;var b=[],c;for(c in this.c){var d=this.c[c],e=d[0];this.c[c]=d.slice(0,1);e&&b.push(e.p["catch"](Bb));for(e=1;e<d.length;++e)d[e].p["catch"](Bb),d[e].p.reject()}this.a&&b.push(this.a.destroy());for(var f in this.h)b.push(this.h[f].destroy());this.f&&(this.f.removeAttribute("src"),this.f.load());return Promise.all(b).then(function(){this.i.destroy();this.o=this.a=this.g=this.f=this.i=null;this.b={};this.h={};this.c={}}.bind(this))};
n.init=function(b,c){var d=this;return this.j.then(function(){for(var e in b){var f=b[e];f=Kb(f.mimeType,f.codecs);"text"==e?Sc(d,f):(!c&&MediaSource.isTypeSupported(f)||!Lc(f,e)||(d.h[e]=new Kc,f=Mc(e,f)),f=d.g.addSourceBuffer(f),E(d.i,f,"error",d.Qe.bind(d,e)),E(d.i,f,"updateend",d.Pa.bind(d,e)),d.b[e]=f,d.c[e]=[])}})};function Sc(b,c){b.a||(b.a=new Oc(b.o));b.a.f=new J[c]}
function Tc(b,c){if("text"==c)var d=b.a.a;else d=Uc(b,c),d=!d||1==d.length&&1E-6>d.end(0)-d.start(0)?null:1==d.length&&0>d.start(0)?0:d.length?d.start(0):null;return d}function Vc(b,c){return"text"==c?b.a.b:rc(Uc(b,c))}function Wc(b,c,d){if("text"==c)return b=b.a,null==b.b||b.b<d?0:b.b-Math.max(d,b.a);b=Uc(b,c);return tc(b,d)}n.Ib=function(){var b=this.a&&null!=this.a.a?[{start:this.a.a,end:this.a.b}]:[];return{total:uc(this.f.buffered),audio:uc(Uc(this,"audio")),video:uc(Uc(this,"video")),text:b}};
function Uc(b,c){try{return b.b[c].buffered}catch(d){return null}}function Xc(b,c,d,e,f){return"text"==c?Pc(b.a,d,e,f):b.h[c]?Nc(b.h[c],d).then(function(b){this.a||Sc(this,"text/vtt");this.l&&this.a.kc(b.cues);return Yc(this,c,this.Vc.bind(this,c,b.data.buffer))}.bind(b)):Yc(b,c,b.Vc.bind(b,c,d))}n.remove=function(b,c,d){return"text"==b?this.a.remove(c,d):Yc(this,b,this.Wc.bind(this,b,c,d))};
function Zc(b,c){return"text"==c?b.a?b.a.remove(0,Infinity):Promise.resolve():Yc(b,c,b.Wc.bind(b,c,0,b.g.duration))}n.flush=function(b){return"text"==b?Promise.resolve():Yc(this,b,this.ld.bind(this,b))};function $c(b,c,d,e,f){return"text"==c?(b.a.g=d,b=b.a,b.i=e,b.h=f,Promise.resolve()):Promise.all([Yc(b,c,b.bd.bind(b,c)),Yc(b,c,b.Ge.bind(b,c,d)),Yc(b,c,b.De.bind(b,c,e,f))])}n.endOfStream=function(b){return ad(this,function(){b?this.g.endOfStream(b):this.g.endOfStream()}.bind(this))};
n.ja=function(b){return ad(this,function(){this.g.duration=b}.bind(this))};n.S=function(){return this.g.duration};n.Vc=function(b,c){this.b[b].appendBuffer(c)};n.Wc=function(b,c,d){d<=c?this.Pa(b):this.b[b].remove(c,d)};n.bd=function(b){var c=this.b[b].appendWindowStart,d=this.b[b].appendWindowEnd;this.b[b].abort();this.b[b].appendWindowStart=c;this.b[b].appendWindowEnd=d;this.Pa(b)};n.ld=function(b){this.f.currentTime-=.001;this.Pa(b)};
n.Ge=function(b,c){0>c&&(c+=.001);this.b[b].timestampOffset=c;this.Pa(b)};n.De=function(b,c,d){this.b[b].appendWindowStart=0;this.b[b].appendWindowEnd=d;this.b[b].appendWindowStart=c;this.Pa(b)};n.Qe=function(b){this.c[b][0].p.reject(new z(2,3,3014,this.f.error?this.f.error.code:0))};n.Pa=function(b){var c=this.c[b][0];c&&(c.p.resolve(),bd(this,b))};
function Yc(b,c,d){if(b.m)return Promise.reject();d={start:d,p:new A};b.c[c].push(d);if(1==b.c[c].length)try{d.start()}catch(e){"QuotaExceededError"==e.name?d.p.reject(new z(2,3,3017,c)):d.p.reject(new z(2,3,3015,e)),bd(b,c)}return d.p}
function ad(b,c){if(b.m)return Promise.reject();var d=[],e;for(e in b.b){var f=new A,g={start:function(b){b.resolve()}.bind(null,f),p:f};b.c[e].push(g);d.push(f);1==b.c[e].length&&g.start()}return Promise.all(d).then(function(){try{c()}catch(l){var b=Promise.reject(new z(2,3,3015,l))}for(var d in this.b)bd(this,d);return b}.bind(b),function(){return Promise.reject()}.bind(b))}function bd(b,c){b.c[c].shift();var d=b.c[c][0];if(d)try{d.start()}catch(e){d.p.reject(new z(2,3,3015,e)),bd(b,c)}};function cd(b,c,d){return d==c||b>=dd&&d==c.split("-")[0]||b>=ed&&d.split("-")[0]==c.split("-")[0]?!0:!1}var dd=1,ed=2;function fd(b){b=b.toLowerCase().split("-");var c=gd[b[0]];c&&(b[0]=c);return b.join("-")}
var gd={aar:"aa",abk:"ab",afr:"af",aka:"ak",alb:"sq",amh:"am",ara:"ar",arg:"an",arm:"hy",asm:"as",ava:"av",ave:"ae",aym:"ay",aze:"az",bak:"ba",bam:"bm",baq:"eu",bel:"be",ben:"bn",bih:"bh",bis:"bi",bod:"bo",bos:"bs",bre:"br",bul:"bg",bur:"my",cat:"ca",ces:"cs",cha:"ch",che:"ce",chi:"zh",chu:"cu",chv:"cv",cor:"kw",cos:"co",cre:"cr",cym:"cy",cze:"cs",dan:"da",deu:"de",div:"dv",dut:"nl",dzo:"dz",ell:"el",eng:"en",epo:"eo",est:"et",eus:"eu",ewe:"ee",fao:"fo",fas:"fa",fij:"fj",fin:"fi",fra:"fr",fre:"fr",
fry:"fy",ful:"ff",geo:"ka",ger:"de",gla:"gd",gle:"ga",glg:"gl",glv:"gv",gre:"el",grn:"gn",guj:"gu",hat:"ht",hau:"ha",heb:"he",her:"hz",hin:"hi",hmo:"ho",hrv:"hr",hun:"hu",hye:"hy",ibo:"ig",ice:"is",ido:"io",iii:"ii",iku:"iu",ile:"ie",ina:"ia",ind:"id",ipk:"ik",isl:"is",ita:"it",jav:"jv",jpn:"ja",kal:"kl",kan:"kn",kas:"ks",kat:"ka",kau:"kr",kaz:"kk",khm:"km",kik:"ki",kin:"rw",kir:"ky",kom:"kv",kon:"kg",kor:"ko",kua:"kj",kur:"ku",lao:"lo",lat:"la",lav:"lv",lim:"li",lin:"ln",lit:"lt",ltz:"lb",lub:"lu",
lug:"lg",mac:"mk",mah:"mh",mal:"ml",mao:"mi",mar:"mr",may:"ms",mkd:"mk",mlg:"mg",mlt:"mt",mon:"mn",mri:"mi",msa:"ms",mya:"my",nau:"na",nav:"nv",nbl:"nr",nde:"nd",ndo:"ng",nep:"ne",nld:"nl",nno:"nn",nob:"nb",nor:"no",nya:"ny",oci:"oc",oji:"oj",ori:"or",orm:"om",oss:"os",pan:"pa",per:"fa",pli:"pi",pol:"pl",por:"pt",pus:"ps",que:"qu",roh:"rm",ron:"ro",rum:"ro",run:"rn",rus:"ru",sag:"sg",san:"sa",sin:"si",slk:"sk",slo:"sk",slv:"sl",sme:"se",smo:"sm",sna:"sn",snd:"sd",som:"so",sot:"st",spa:"es",sqi:"sq",
srd:"sc",srp:"sr",ssw:"ss",sun:"su",swa:"sw",swe:"sv",tah:"ty",tam:"ta",tat:"tt",tel:"te",tgk:"tg",tgl:"tl",tha:"th",tib:"bo",tir:"ti",ton:"to",tsn:"tn",tso:"ts",tuk:"tk",tur:"tr",twi:"tw",uig:"ug",ukr:"uk",urd:"ur",uzb:"uz",ven:"ve",vie:"vi",vol:"vo",wel:"cy",wln:"wa",wol:"wo",xho:"xh",yid:"yi",yor:"yo",zha:"za",zho:"zh",zul:"zu"};function hd(b,c,d){var e=b.video;return e&&(e.width<c.minWidth||e.width>c.maxWidth||e.width>d.width||e.height<c.minHeight||e.height>c.maxHeight||e.height>d.height||e.width*e.height<c.minPixels||e.width*e.height>c.maxPixels)||b.bandwidth<c.minBandwidth||b.bandwidth>c.maxBandwidth?!1:!0}function id(b,c,d){var e=!1;b.variants.forEach(function(b){var f=b.allowedByApplication;b.allowedByApplication=hd(b,c,d);f!=b.allowedByApplication&&(e=!0)});return e}
function jd(b,c,d,e){e.variants=e.variants.filter(function(e){return b&&b.M&&!pc(b,e)?!1:kd(e.audio,b,c)&&kd(e.video,b,d)});e.textStreams=e.textStreams.filter(function(b){return!!J[Kb(b.mimeType,b.codecs)]})}
function kd(b,c,d){if(!b)return!0;var e=null;c&&c.M&&(e=c.u);c=Kb(b.mimeType,b.codecs);var f=Kb(b.mimeType,b.codecs),g=b.mimeType,h;for(h in Mb){var k=b[h],l=Mb[h];k&&(g+="; "+l+'="'+k+'"')}return!(J[f]||MediaSource.isTypeSupported(g)||Lc(f,b.type))||e&&b.encrypted&&0>e.indexOf(c)||d&&(b.mimeType!=d.mimeType||b.codecs.split(".")[0]!=d.codecs.split(".")[0])?!1:!0}
function ld(b){var c=b.audio,d=b.video,e=c?c.codecs:null,f=d?d.codecs:null,g=[];f&&g.push(f);e&&g.push(e);var h=[];d&&h.push(d.mimeType);c&&h.push(c.mimeType);h=h[0]||null;var k=[];c&&k.push(c.kind);d&&k.push(d.kind);k=k[0]||null;var l=[];c&&l.push.apply(l,c.roles);d&&l.push.apply(l,d.roles);l=fb(l);b={id:b.id,active:!1,type:"variant",bandwidth:b.bandwidth,language:b.language,label:null,kind:k,width:null,height:null,frameRate:null,mimeType:h,codecs:g.join(", "),audioCodec:e,videoCodec:f,primary:b.primary,
roles:l,videoId:null,audioId:null,channelsCount:null,audioBandwidth:null,videoBandwidth:null};d&&(b.videoId=d.id,b.width=d.width||null,b.height=d.height||null,b.frameRate=d.frameRate||null,b.videoBandwidth=d.bandwidth||null);c&&(b.audioId=c.id,b.channelsCount=c.channelsCount,b.audioBandwidth=c.bandwidth||null,b.label=c.label);return b}
function md(b){return{id:b.id,active:!1,type:"text",bandwidth:0,language:b.language,label:b.label,kind:b.kind||null,width:null,height:null,frameRate:null,mimeType:b.mimeType,codecs:b.codecs||null,audioCodec:null,videoCodec:null,primary:b.primary,roles:b.roles,videoId:null,audioId:null,channelsCount:null,audioBandwidth:null,videoBandwidth:null}}function nd(b){var c=[],d=od(b.variants);b=b.textStreams;d.forEach(function(b){c.push(ld(b))});b.forEach(function(b){c.push(md(b))});return c}
function pd(b,c,d){return od(b.variants).map(function(b){var e=ld(b);b.video&&b.audio?e.active=d==b.video.id&&c==b.audio.id:b.video?e.active=d==b.video.id:b.audio&&(e.active=c==b.audio.id);return e})}function qd(b,c){return b.textStreams.map(function(b){var d=md(b);d.active=c==b.id;return d})}function rd(b,c){for(var d=0;d<b.variants.length;d++)if(b.variants[d].id==c.id)return b.variants[d];return null}function sd(b){return b.allowedByApplication&&b.allowedByKeySystem}
function od(b){return b.filter(function(b){return sd(b)})}function td(b,c,d,e,f){b=ud(b,c,d,f);return vd(b,e)}
function ud(b,c,d,e){var f=od(b),g=f;b=f.filter(function(b){return b.primary});b.length&&(g=b);var h=g.length?g[0].language:"";g=g.filter(function(b){return b.language==h});if(c){var k=fd(c);[ed,dd,0].forEach(function(b){var c=!1;f.forEach(function(d){k=fd(k);var f=fd(d.language);cd(b,k,f)&&(c?g.push(d):(g=[d],c=!0),e&&(e.audio=!0))})})}if(d&&(c=wd(g,d),c.length))return c;c=g.map(function(b){return(b.audio?b.audio.roles:[]).concat(b.video?b.video.roles:[])}).reduce(Ab,[]);return c.length?wd(g,c[0]):
g}function vd(b,c){var d=b.filter(function(b){return b.audio&&b.audio.channelsCount}).reduce(function(b,c){var d=c.audio.channelsCount;b[d]?b[d].push(c):b[d]=[c];return b},{}),e=Object.keys(d);if(0==e.length)return b;var f=e.filter(function(b){return b<=c});return f.length?d[Math.max.apply(null,f)]:d[Math.min.apply(null,e)]}
function xd(b,c,d,e){var f=b,g=b.filter(function(b){return b.primary});g.length&&(f=g);var h=f.length?f[0].language:"";f=f.filter(function(b){return b.language==h});if(c){var k=fd(c);[ed,dd,0].forEach(function(c){var d=!1;b.forEach(function(b){var g=fd(b.language);cd(c,k,g)&&(d?f.push(b):(f=[b],d=!0),e&&(e.text=!0))})})}if(d){if(c=yd(f,d),c.length)return c}else if(c=f.filter(function(b){return 0==b.roles.length}),c.length)return c;c=f.map(function(b){return b.roles}).reduce(Ab,[]);return c.length?
yd(f,c[0]):f}function wd(b,c){return b.filter(function(b){return b.audio&&0<=b.audio.roles.indexOf(c)||b.video&&0<=b.video.roles.indexOf(c)})}function yd(b,c){return b.filter(function(b){return 0<=b.roles.indexOf(c)})}function zd(b,c,d){for(var e=0;e<d.length;e++)if(d[e].audio==b&&d[e].video==c)return d[e];return null}function Ad(b,c,d){function e(b,c){return null==b?null==c:c.id==b}for(var f=0;f<d.length;f++)if(e(b,d[f].audio)&&e(c,d[f].video))return d[f];return null}
function Bd(b,c){for(var d=b.periods.length-1;0<d;--d)if(c+Gb>=b.periods[d].startTime)return d;return 0}function Cd(b,c){for(var d=0;d<b.periods.length;++d){var e=b.periods[d];if("text"==c.type)for(var f=0;f<e.textStreams.length;++f){if(e.textStreams[f]==c)return d}else for(f=0;f<e.variants.length;++f){var g=e.variants[f];if(g.audio==c||g.video==c||g.video&&g.video.trickModeVideo==c)return d}}return-1};function K(){this.h=null;this.c=!1;this.b=new Da;this.g=[];this.i=!1;this.a=this.f=null}x("shaka.abr.SimpleAbrManager",K);K.prototype.stop=function(){this.h=null;this.c=!1;this.g=[];this.f=null};K.prototype.stop=K.prototype.stop;K.prototype.init=function(b){this.h=b};K.prototype.init=K.prototype.init;
K.prototype.chooseVariant=function(){var b=Dd(this.a.restrictions,this.g),c=this.b.getBandwidthEstimate(this.a.defaultBandwidthEstimate);if(this.g.length&&!b.length)throw new z(2,4,4012);for(var d=b[0]||null,e=0;e<b.length;++e){var f=b[e],g=(b[e+1]||{bandwidth:Infinity}).bandwidth/this.a.bandwidthUpgradeTarget;c>=f.bandwidth/this.a.bandwidthDowngradeTarget&&c<=g&&(d=f)}this.f=Date.now();return d};K.prototype.chooseVariant=K.prototype.chooseVariant;K.prototype.enable=function(){this.c=!0};
K.prototype.enable=K.prototype.enable;K.prototype.disable=function(){this.c=!1};K.prototype.disable=K.prototype.disable;K.prototype.segmentDownloaded=function(b,c){var d=this.b;if(!(16E3>c)){var e=8E3*c/b,f=b/1E3;d.a+=c;Ba(d.b,f,e);Ba(d.c,f,e)}if(null!=this.f&&this.c)a:{if(!this.i){if(!(128E3<=this.b.a))break a;this.i=!0}else if(Date.now()-this.f<1E3*this.a.switchInterval)break a;d=this.chooseVariant();this.b.getBandwidthEstimate(this.a.defaultBandwidthEstimate);this.h(d)}};
K.prototype.segmentDownloaded=K.prototype.segmentDownloaded;K.prototype.getBandwidthEstimate=function(){return this.b.getBandwidthEstimate(this.a.defaultBandwidthEstimate)};K.prototype.getBandwidthEstimate=K.prototype.getBandwidthEstimate;K.prototype.setVariants=function(b){this.g=b};K.prototype.setVariants=K.prototype.setVariants;K.prototype.configure=function(b){this.a=b};K.prototype.configure=K.prototype.configure;
function Dd(b,c){return c.filter(function(c){return hd(c,b,{width:Infinity,height:Infinity})}).sort(function(b,c){return b.bandwidth-c.bandwidth})};var Ed="ended play playing pause pausing ratechange seeked seeking timeupdate volumechange".split(" "),Fd="buffered currentTime duration ended loop muted paused playbackRate seeking videoHeight videoWidth volume".split(" "),Gd=["loop","playbackRate"],Hd=["pause","play"],Id="adaptation buffering emsg error loading streaming texttrackvisibility timelineregionadded timelineregionenter timelineregionexit trackschanged unloading".split(" "),Jd={drmInfo:20,getAudioLanguages:2,getAudioLanguagesAndRoles:2,
getBufferedInfo:2,getConfiguration:2,getExpiration:2,getManifestUri:2,getPlaybackRate:2,getTextLanguages:2,getTextLanguagesAndRoles:2,getTextTracks:2,getStats:5,usingEmbeddedTextTrack:2,getVariantTracks:2,isAudioOnly:10,isBuffering:1,isInProgress:1,isLive:10,isTextTrackVisible:1,keySystem:10,seekRange:1},Nd={getPlayheadTimeAsDate:1,getPresentationStartTimeAsDate:20},Od=[["getConfiguration","configure"]],Pd=[["isTextTrackVisible","setTextTrackVisibility"]],Qd="addTextTrack cancelTrickPlay configure resetConfiguration retryStreaming selectAudioLanguage selectEmbeddedTextTrack selectTextLanguage selectTextTrack selectVariantTrack setTextTrackVisibility trickPlay".split(" "),
Rd=["attach","detach","load","unload"];
function Sd(b){return JSON.stringify(b,function(b,d){if("function"!=typeof d){if(d instanceof Event||d instanceof F){var c={},f;for(f in d){var g=d[f];g&&"object"==typeof g?"detail"==f&&(c[f]=g):f in Event||(c[f]=g)}return c}if(d instanceof TimeRanges)for(c={__type__:"TimeRanges",length:d.length,start:[],end:[]},f=0;f<d.length;++f)c.start.push(d.start(f)),c.end.push(d.end(f));else c="number"==typeof d?isNaN(d)?"NaN":isFinite(d)?d:0>d?"-Infinity":"Infinity":d;return c}})}
function Td(b){return JSON.parse(b,function(b,d){return"NaN"==d?NaN:"-Infinity"==d?-Infinity:"Infinity"==d?Infinity:d&&"object"==typeof d&&"TimeRanges"==d.__type__?Ud(d):d})}function Ud(b){return{length:b.length,start:function(c){return b.start[c]},end:function(c){return b.end[c]}}};function Vd(b,c,d,e,f,g){this.K=b;this.g=c;this.M=d;this.j=!1;this.A=e;this.H=f;this.u=g;this.b=this.h=!1;this.v="";this.i=null;this.l=this.Ac.bind(this);this.m=this.Pd.bind(this);this.a={video:{},player:{}};this.o=0;this.c={};this.f=null}var Wd=!1,Xd=null;n=Vd.prototype;n.destroy=function(){Yd(this);Xd&&Zd(this);this.H=this.A=this.g=null;this.b=this.h=!1;this.m=this.l=this.f=this.c=this.a=this.i=null;return Promise.resolve()};n.Z=function(){return this.b};n.Yb=function(){return this.v};
n.init=function(){if(window.chrome&&chrome.cast&&chrome.cast.isAvailable){delete window.__onGCastApiAvailable;this.h=!0;this.g();var b=new chrome.cast.SessionRequest(this.K);b=new chrome.cast.ApiConfig(b,this.Bc.bind(this),this.Wd.bind(this),"origin_scoped");chrome.cast.initialize(b,function(){},function(){});Wd&&setTimeout(this.g.bind(this),20);(b=Xd)&&b.status!=chrome.cast.SessionStatus.STOPPED?this.Bc(b):Xd=null}else window.__onGCastApiAvailable=function(b){b&&this.init()}.bind(this)};
n.ac=function(b){this.i=b;this.b&&$d({type:"appData",appData:this.i})};n.cast=function(b){if(!this.h)return Promise.reject(new z(1,8,8E3));if(!Wd)return Promise.reject(new z(1,8,8001));if(this.b)return Promise.reject(new z(1,8,8002));this.f=new A;chrome.cast.requestSession(this.Vb.bind(this,b),this.zc.bind(this));return this.f};n.vb=function(){this.b&&(Yd(this),Xd&&(Zd(this),Xd.stop(function(){},function(){}),Xd=null))};
n.get=function(b,c){if("video"==b){if(0<=Hd.indexOf(c))return this.Lc.bind(this,b,c)}else if("player"==b){if(Nd[c]&&!this.get("player","isLive")())return function(){};if(0<=Qd.indexOf(c))return this.Lc.bind(this,b,c);if(0<=Rd.indexOf(c))return this.se.bind(this,b,c);if(Jd[c])return this.Ic.bind(this,b,c)}return this.Ic(b,c)};n.set=function(b,c,d){this.a[b][c]=d;$d({type:"set",targetName:b,property:c,value:d})};
n.Vb=function(b,c){Xd=c;c.addUpdateListener(this.l);c.addMessageListener("urn:x-cast:com.google.shaka.v2",this.m);this.Ac();$d({type:"init",initState:b,appData:this.i});this.f.resolve()};n.zc=function(b){var c=8003;switch(b.code){case "cancel":c=8004;break;case "timeout":c=8005;break;case "receiver_unavailable":c=8006}this.f.reject(new z(2,8,c,b))};n.Ic=function(b,c){return this.a[b][c]};n.Lc=function(b,c){$d({type:"call",targetName:b,methodName:c,args:Array.prototype.slice.call(arguments,2)})};
n.se=function(b,c){var d=Array.prototype.slice.call(arguments,2),e=new A,f=this.o.toString();this.o++;this.c[f]=e;$d({type:"asyncCall",targetName:b,methodName:c,args:d,id:f});return e};n.Bc=function(b){var c=this.u();this.f=new A;this.j=!0;this.Vb(c,b)};n.Wd=function(b){Wd="available"==b;this.g()};function Zd(b){var c=Xd;c.removeUpdateListener(b.l);c.removeMessageListener("urn:x-cast:com.google.shaka.v2",b.m)}
n.Ac=function(){var b=Xd?"connected"==Xd.status:!1;if(this.b&&!b){this.H();for(var c in this.a)this.a[c]={};Yd(this)}this.v=(this.b=b)?Xd.receiver.friendlyName:"";this.g()};function Yd(b){for(var c in b.c){var d=b.c[c];delete b.c[c];d.reject(new z(1,7,7E3))}}
n.Pd=function(b,c){var d=Td(c);switch(d.type){case "event":var e=d.event;this.A(d.targetName,new F(e.type,e));break;case "update":e=d.update;for(var f in e){d=this.a[f]||{};for(var g in e[f])d[g]=e[f][g]}this.j&&(this.M(),this.j=!1);break;case "asyncComplete":if(f=d.id,d=d.error,g=this.c[f],delete this.c[f],g)if(d){f=new z(d.severity,d.category,d.code);for(e in d)f[e]=d[e];g.reject(f)}else g.resolve()}};function $d(b){b=Sd(b);Xd.sendMessage("urn:x-cast:com.google.shaka.v2",b,function(){},Fa)};function L(){this.Db=new vb;this.lb=this}L.prototype.addEventListener=function(b,c){this.Db.push(b,c)};L.prototype.removeEventListener=function(b,c){this.Db.remove(b,c)};L.prototype.dispatchEvent=function(b){for(var c=this.Db.get(b.type)||[],d=0;d<c.length;++d){b.target=this.lb;b.currentTarget=this.lb;var e=c[d];try{e.handleEvent?e.handleEvent(b):e.call(this,b)}catch(f){}if(b.a)break}return b.defaultPrevented};function M(b,c,d){L.call(this);this.c=b;this.b=c;this.i=this.g=this.f=this.j=this.h=null;this.a=new Vd(d,this.Le.bind(this),this.Me.bind(this),this.Ne.bind(this),this.Oe.bind(this),this.rc.bind(this));ae(this)}za(M,L);x("shaka.cast.CastProxy",M);M.prototype.destroy=function(b){b&&this.a&&this.a.vb();b=[this.i?this.i.destroy():null,this.b?this.b.destroy():null,this.a?this.a.destroy():null];this.a=this.i=this.j=this.h=this.b=this.c=null;return Promise.all(b)};M.prototype.destroy=M.prototype.destroy;
M.prototype.Ad=function(){return this.h};M.prototype.getVideo=M.prototype.Ad;M.prototype.sd=function(){return this.j};M.prototype.getPlayer=M.prototype.sd;M.prototype.dd=function(){return this.a?this.a.h&&Wd:!1};M.prototype.canCast=M.prototype.dd;M.prototype.Z=function(){return this.a?this.a.Z():!1};M.prototype.isCasting=M.prototype.Z;M.prototype.Yb=function(){return this.a?this.a.Yb():""};M.prototype.receiverName=M.prototype.Yb;M.prototype.cast=function(){var b=this.rc();return this.a.cast(b).then(function(){if(this.b)return this.b.jb()}.bind(this))};
M.prototype.cast=M.prototype.cast;M.prototype.ac=function(b){this.a.ac(b)};M.prototype.setAppData=M.prototype.ac;M.prototype.Se=function(){var b=this.a;if(b.b){var c=b.u();chrome.cast.requestSession(b.Vb.bind(b,c),b.zc.bind(b))}};M.prototype.suggestDisconnect=M.prototype.Se;M.prototype.vb=function(){this.a.vb()};M.prototype.forceDisconnect=M.prototype.vb;
function ae(b){b.a.init();b.i=new D;Ed.forEach(function(b){E(this.i,this.c,b,this.$e.bind(this))}.bind(b));Id.forEach(function(b){E(this.i,this.b,b,this.le.bind(this))}.bind(b));b.h={};for(var c in b.c)Object.defineProperty(b.h,c,{configurable:!1,enumerable:!0,get:b.Ze.bind(b,c),set:b.af.bind(b,c)});b.j={};for(var d in b.b)Object.defineProperty(b.j,d,{configurable:!1,enumerable:!0,get:b.ke.bind(b,d)});b.f=new L;b.f.lb=b.h;b.g=new L;b.g.lb=b.j}n=M.prototype;
n.rc=function(){var b={video:{},player:{},playerAfterLoad:{},manifest:this.b.Kb(),startTime:null};this.c.pause();Gd.forEach(function(c){b.video[c]=this.c[c]}.bind(this));this.c.ended||(b.startTime=this.c.currentTime);Od.forEach(function(c){var d=c[1];c=this.b[c[0]]();b.player[d]=c}.bind(this));Pd.forEach(function(c){var d=c[1];c=this.b[c[0]]();b.playerAfterLoad[d]=c}.bind(this));return b};n.Le=function(){this.dispatchEvent(new F("caststatuschanged"))};
n.Me=function(){this.f.dispatchEvent(new F(this.h.paused?"pause":"play"))};
n.Oe=function(){var b=this;Od.forEach(function(b){var c=b[1];b=this.a.get("player",b[0])();this.b[c](b)}.bind(this));var c=this.a.get("player","getManifestUri")(),d=this.a.get("video","ended"),e=Promise.resolve(),f=this.c.autoplay,g=null;d||(g=this.a.get("video","currentTime"));c&&(this.c.autoplay=!1,e=this.b.load(c,g));var h={};Gd.forEach(function(b){h[b]=this.a.get("video",b)}.bind(this));e.then(function(){b.c&&(Gd.forEach(function(b){this.c[b]=h[b]}.bind(b)),Pd.forEach(function(b){var c=b[1];b=
this.a.get("player",b[0])();this.b[c](b)}.bind(b)),b.c.autoplay=f,c&&b.c.play())},function(c){b.b.dispatchEvent(new F("error",{detail:c}))})};n.Ze=function(b){if("addEventListener"==b)return this.f.addEventListener.bind(this.f);if("removeEventListener"==b)return this.f.removeEventListener.bind(this.f);if(this.a.Z()&&0==Object.keys(this.a.a.video).length){var c=this.c[b];if("function"!=typeof c)return c}return this.a.Z()?this.a.get("video",b):(b=this.c[b],"function"==typeof b&&(b=b.bind(this.c)),b)};
n.af=function(b,c){this.a.Z()?this.a.set("video",b,c):this.c[b]=c};n.$e=function(b){this.a.Z()||this.f.dispatchEvent(new F(b.type,b))};
n.ke=function(b){if("addEventListener"==b)return this.g.addEventListener.bind(this.g);if("removeEventListener"==b)return this.g.removeEventListener.bind(this.g);if("getMediaElement"==b)return function(){return this.h}.bind(this);if("getNetworkingEngine"==b)return this.b.sc.bind(this.b);if(this.a.Z()){if("getManifest"==b)return function(){Ea("getManifest() does not work while casting!");return null};if("attach"==b)return function(){Ea("attach() does not work while casting!");return Promise.resolve()};
if("detach"==b)return function(){Ea("detach() does not work while casting!");return Promise.resolve()}}return this.a.Z()&&0==Object.keys(this.a.a.video).length&&Jd[b]||!this.a.Z()?this.b[b].bind(this.b):this.a.get("player",b)};n.le=function(b){this.a.Z()||this.g.dispatchEvent(b)};n.Ne=function(b,c){this.a.Z()&&("video"==b?this.f.dispatchEvent(c):"player"==b&&this.g.dispatchEvent(c))};function be(b,c,d,e){L.call(this);this.a=b;this.b=c;this.c=new D;this.u={video:b,player:c};this.v=d||function(){};this.A=e||function(b){return b};this.o=!1;this.h=!0;this.g=0;this.m=!1;this.j=!0;this.l=this.i=this.f=null;ce(this)}za(be,L);x("shaka.cast.CastReceiver",be);be.prototype.isConnected=function(){return this.o};be.prototype.isConnected=be.prototype.isConnected;be.prototype.Dd=function(){return this.h};be.prototype.isIdle=be.prototype.Dd;
be.prototype.destroy=function(){var b=[this.c?this.c.destroy():null,this.b?this.b.destroy():null];null!=this.l&&window.clearTimeout(this.l);this.v=this.u=this.c=this.b=this.a=null;this.o=!1;this.h=!0;this.l=this.i=this.f=null;return Promise.all(b).then(function(){cast.receiver.CastReceiverManager.getInstance().stop()})};be.prototype.destroy=be.prototype.destroy;
function ce(b){var c=cast.receiver.CastReceiverManager.getInstance();c.onSenderConnected=b.Fc.bind(b);c.onSenderDisconnected=b.Fc.bind(b);c.onSystemVolumeChanged=b.kd.bind(b);b.i=c.getCastMessageBus("urn:x-cast:com.google.cast.media");b.i.onMessage=b.Kd.bind(b);b.f=c.getCastMessageBus("urn:x-cast:com.google.shaka.v2");b.f.onMessage=b.Zd.bind(b);c.start();Ed.forEach(function(b){E(this.c,this.a,b,this.Jc.bind(this,"video"))}.bind(b));Id.forEach(function(b){E(this.c,this.b,b,this.Jc.bind(this,"player"))}.bind(b));
cast.__platform__&&cast.__platform__.canDisplayType('video/mp4; codecs="avc1.640028"; width=3840; height=2160')?b.b.bc(3840,2160):b.b.bc(1920,1080);E(b.c,b.a,"loadeddata",function(){this.m=!0}.bind(b));E(b.c,b.b,"loading",function(){this.h=!1;de(this)}.bind(b));E(b.c,b.a,"playing",function(){this.h=!1;de(this)}.bind(b));E(b.c,b.a,"pause",function(){de(this)}.bind(b));E(b.c,b.b,"unloading",function(){this.h=!0;de(this)}.bind(b));E(b.c,b.a,"ended",function(){window.setTimeout(function(){this.a&&this.a.ended&&
(this.h=!0,de(this))}.bind(this),5E3)}.bind(b))}n=be.prototype;n.Fc=function(){this.g=0;this.j=!0;this.o=0!=cast.receiver.CastReceiverManager.getInstance().getSenders().length;de(this)};function de(b){Promise.resolve().then(function(){this.b&&(this.dispatchEvent(new F("caststatuschanged")),ee(this)||fe(this,0))}.bind(b))}
function ge(b,c,d){for(var e in c.player)b.b[e](c.player[e]);b.v(d);d=Promise.resolve();var f=b.a.autoplay;c.manifest&&(b.a.autoplay=!1,d=b.b.load(c.manifest,c.startTime));d.then(function(){if(b.b){for(var d in c.video)b.a[d]=c.video[d];for(var e in c.playerAfterLoad)b.b[e](c.playerAfterLoad[e]);b.a.autoplay=f;c.manifest&&(b.a.play(),fe(b,0))}},function(c){b.b.dispatchEvent(new F("error",{detail:c}))})}n.Jc=function(b,c){this.b&&(this.Wb(),he(this,{type:"event",targetName:b,event:c},this.f))};
n.Wb=function(){null!=this.l&&window.clearTimeout(this.l);this.l=window.setTimeout(this.Wb.bind(this),500);var b={video:{},player:{}};Fd.forEach(function(c){b.video[c]=this.a[c]}.bind(this));if(this.b.P())for(var c in Nd)0==this.g%Nd[c]&&(b.player[c]=this.b[c]());for(var d in Jd)0==this.g%Jd[d]&&(b.player[d]=this.b[d]());if(c=cast.receiver.CastReceiverManager.getInstance().getSystemVolume())b.video.volume=c.level,b.video.muted=c.muted;this.m&&(this.g+=1);he(this,{type:"update",update:b},this.f);ee(this)};
function ee(b){return b.j&&(b.a.duration||b.b.P())?(ie(b),b.j=!1,!0):!1}function ie(b){var c={contentId:b.b.Kb(),streamType:b.b.P()?"LIVE":"BUFFERED",duration:b.a.duration,contentType:""};fe(b,0,c)}n.kd=function(){var b=cast.receiver.CastReceiverManager.getInstance().getSystemVolume();b&&he(this,{type:"update",update:{video:{volume:b.level,muted:b.muted}}},this.f);he(this,{type:"event",targetName:"video",event:{type:"volumechange"}},this.f)};
n.Zd=function(b){var c=Td(b.data);switch(c.type){case "init":this.g=0;this.m=!1;this.j=!0;ge(this,c.initState,c.appData);this.Wb();break;case "appData":this.v(c.appData);break;case "set":var d=c.targetName,e=c.property;c=c.value;if("video"==d){var f=cast.receiver.CastReceiverManager.getInstance();if("volume"==e){f.setSystemVolumeLevel(c);break}else if("muted"==e){f.setSystemVolumeMuted(c);break}}this.u[d][e]=c;break;case "call":d=this.u[c.targetName];d[c.methodName].apply(d,c.args);break;case "asyncCall":d=
c.targetName;e=c.methodName;"player"==d&&"load"==e&&(this.g=0,this.m=!1);f=c.id;b=b.senderId;var g=this.u[d];c=g[e].apply(g,c.args);"player"==d&&"load"==e&&(c=c.then(function(){this.j=!0}.bind(this)));c.then(this.Qc.bind(this,b,f,null),this.Qc.bind(this,b,f))}};
n.Kd=function(b){var c=Td(b.data);switch(c.type){case "PLAY":this.a.play();fe(this,0);break;case "PAUSE":this.a.pause();fe(this,0);break;case "SEEK":b=c.currentTime;var d=c.resumeState;null!=b&&(this.a.currentTime=Number(b));d&&"PLAYBACK_START"==d?(this.a.play(),fe(this,0)):d&&"PLAYBACK_PAUSE"==d&&(this.a.pause(),fe(this,0));break;case "STOP":this.b.jb().then(function(){this.b&&fe(this,0)}.bind(this));break;case "GET_STATUS":fe(this,Number(c.requestId));break;case "VOLUME":d=c.volume;b=d.level;d=
d.muted;var e=this.a.volume,f=this.a.muted;null!=b&&(this.a.volume=Number(b));null!=d&&(this.a.muted=d);e==this.a.volume&&f==this.a.muted||fe(this,0);break;case "LOAD":this.g=0;this.j=this.m=!1;b=c.currentTime;d=this.A(c.media.contentId);this.a.autoplay=!0;this.b.load(d,b).then(function(){this.b&&ie(this)}.bind(this))["catch"](function(b){var d="LOAD_FAILED";7==b.category&&7E3==b.code&&(d="LOAD_CANCELLED");he(this,{requestId:Number(c.requestId),type:d},this.i)}.bind(this));break;default:he(this,{requestId:Number(c.requestId),
type:"INVALID_REQUEST",reason:"INVALID_COMMAND"},this.i)}};n.Qc=function(b,c,d){this.b&&he(this,{type:"asyncComplete",id:c,error:d},this.f,b)};function he(b,c,d,e){b.o&&(b=Sd(c),e?d.getCastChannel(e).send(b):d.broadcast(b))}
function fe(b,c,d){var e=b.a.playbackRate;var f=je;f=b.h?f.IDLE:b.b.vc()?f.Xc:b.a.paused?f.Zc:f.$c;e={mediaSessionId:0,playbackRate:e,playerState:f,currentTime:b.a.currentTime,supportedMediaCommands:15,volume:{level:b.a.volume,muted:b.a.muted}};d&&(e.media=d);he(b,{requestId:c,type:"MEDIA_STATUS",status:[e]},b.i)}var je={IDLE:"IDLE",$c:"PLAYING",Xc:"BUFFERING",Zc:"PAUSED"};function ke(b,c){var d=N(b,c);return 1!=d.length?null:d[0]}function N(b,c){return Array.prototype.filter.call(b.childNodes,function(b){return b instanceof Element&&b.tagName==c})}function le(b){return Array.prototype.filter.call(b.childNodes,function(b){return b instanceof Element&&"pssh"==b.localName&&"urn:mpeg:cenc:2013"==b.namespaceURI})}function me(b,c,d){return b.hasAttributeNS(c,d)?b.getAttributeNS(c,d):null}
function ne(b){var c=b.firstChild;return c&&c.nodeType==Node.TEXT_NODE?b.textContent.trim():null}function O(b,c,d,e){var f=null;b=b.getAttribute(c);null!=b&&(f=d(b));return null==f?void 0!=e?e:null:f}function oe(b){if(!b)return null;/^\d+-\d+-\d+T\d+:\d+:\d+(\.\d+)?$/.test(b)&&(b+="Z");b=Date.parse(b);return isNaN(b)?null:Math.floor(b/1E3)}
function pe(b){if(!b)return null;b=/^P(?:([0-9]*)Y)?(?:([0-9]*)M)?(?:([0-9]*)D)?(?:T(?:([0-9]*)H)?(?:([0-9]*)M)?(?:([0-9.]*)S)?)?$/.exec(b);if(!b)return null;b=31536E3*Number(b[1]||null)+2592E3*Number(b[2]||null)+86400*Number(b[3]||null)+3600*Number(b[4]||null)+60*Number(b[5]||null)+Number(b[6]||null);return isFinite(b)?b:null}function qe(b){var c=/([0-9]+)-([0-9]+)/.exec(b);if(!c)return null;b=Number(c[1]);if(!isFinite(b))return null;c=Number(c[2]);return isFinite(c)?{start:b,end:c}:null}
function re(b){b=Number(b);return 0===b%1?b:null}function se(b){b=Number(b);return 0===b%1&&0<b?b:null}function te(b){b=Number(b);return 0===b%1&&0<=b?b:null}function ue(b){var c;b=(c=b.match(/^(\d+)\/(\d+)$/))?Number(c[1]/c[2]):Number(b);return isNaN(b)?null:b};var ve={"urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b":"org.w3.clearkey","urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed":"com.widevine.alpha","urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95":"com.microsoft.playready","urn:uuid:f239e769-efa3-4850-9c16-a903c6932efb":"com.adobe.primetime"};
function we(b,c,d){b=xe(b);var e=null,f=[],g=[],h=b.map(function(b){return b.keyId}).filter(Cb);if(h.length&&1<h.filter(Db).length)throw new z(2,4,4010);d||(g=b.filter(function(b){return"urn:mpeg:dash:mp4protection:2011"==b.Pc?(e=b.init||e,!1):!0}),g.length&&(f=ye(e,c,g),0==f.length&&(f=[Fb("",e)])));!b.length||!d&&g.length||(f=G(ve).map(function(b){return Fb(b,e)}));var k=h[0]||null;k&&f.forEach(function(b){b.initData.forEach(function(b){b.keyId=k})});return{lc:k,ef:e,drmInfos:f,qc:!0}}
function ze(b,c,d,e){var f=we(b,c,e);if(d.qc){b=1==d.drmInfos.length&&!d.drmInfos[0].keySystem;c=0==f.drmInfos.length;if(0==d.drmInfos.length||b&&!c)d.drmInfos=f.drmInfos;d.qc=!1}else if(0<f.drmInfos.length&&(d.drmInfos=d.drmInfos.filter(function(b){return f.drmInfos.some(function(c){return c.keySystem==b.keySystem})}),0==d.drmInfos.length))throw new z(2,4,4008);return f.lc||d.lc}function ye(b,c,d){return d.map(function(d){var e=ve[d.Pc];return e?[Fb(e,d.init||b)]:c(d.node)||[]}).reduce(Ab,[])}
function xe(b){return b.map(function(b){var c=b.getAttribute("schemeIdUri"),e=me(b,"urn:mpeg:cenc:2013","default_KID"),f=le(b).map(ne);if(!c)return null;c=c.toLowerCase();if(e&&(e=e.replace(/-/g,"").toLowerCase(),0<=e.indexOf(" ")))throw new z(2,4,4009);var g=[];try{g=f.map(function(b){return{initDataType:"cenc",initData:Vb(b),keyId:null}})}catch(h){throw new z(2,4,4007);}return{node:b,Pc:c,keyId:e,init:0<g.length?g:null}}).filter(Cb)};function Ae(b,c,d,e,f){null!=f&&(f=Math.round(f));var g={RepresentationID:c,Number:d,Bandwidth:e,Time:f};return b.replace(/\$(RepresentationID|Number|Bandwidth|Time)?(?:%0([0-9]+)([diouxX]))?\$/g,function(b,c,d,e){if("$$"==b)return"$";var f=g[c];if(null==f)return b;"RepresentationID"==c&&d&&(d=void 0);switch(e){case void 0:case "d":case "i":case "u":b=f.toString();break;case "o":b=f.toString(8);break;case "x":b=f.toString(16);break;case "X":b=f.toString(16).toUpperCase();break;default:b=f.toString()}d=
window.parseInt(d,10)||1;return Array(Math.max(0,d-b.length)+1).join("0")+b})}
function Be(b,c){var d=Ce(b,c,"timescale"),e=1;d&&(e=se(d)||1);d=Ce(b,c,"duration");(d=se(d||""))&&(d/=e);var f=Ce(b,c,"startNumber"),g=Number(Ce(b,c,"presentationTimeOffset"))||0,h=te(f||"");if(null==f||null==h)h=1;var k=De(b,c,"SegmentTimeline");f=null;if(k){f=e;var l=b.N.duration||Infinity;k=N(k,"S");for(var m=[],r=0,t=0;t<k.length;++t){var u=k[t],y=O(u,"t",te),w=O(u,"d",te);u=O(u,"r",re);null!=y&&(y-=g);if(!w)break;y=null!=y?y:r;u=u||0;if(0>u)if(t+1<k.length){u=O(k[t+1],"t",te);if(null==u)break;
else if(y>=u)break;u=Math.ceil((u-y)/w)-1}else{if(Infinity==l)break;else if(y/f>=l)break;u=Math.ceil((l*f-y)/w)-1}0<m.length&&y!=r&&(m[m.length-1].end=y/f);for(var Ha=0;Ha<=u;++Ha)r=y+w,m.push({start:y/f,end:r/f,We:y}),y=r}f=m}return{timescale:e,R:d,Fa:h,da:g/e||0,hc:g,I:f}}function Ce(b,c,d){return[c(b.w),c(b.U),c(b.ba)].filter(Cb).map(function(b){return b.getAttribute(d)}).reduce(function(b,c){return b||c})}
function De(b,c,d){return[c(b.w),c(b.U),c(b.ba)].filter(Cb).map(function(b){return ke(b,d)}).reduce(function(b,c){return b||c})}function Ee(b,c){var d=new DOMParser;try{var e=H(b);var f=d.parseFromString(e,"text/xml")}catch(h){}if(f&&f.documentElement.tagName==c)var g=f.documentElement;return g&&0<g.getElementsByTagName("parsererror").length?null:g}
function Fe(b,c,d,e,f,g){for(var h=me(b,"http://www.w3.org/1999/xlink","href"),k=me(b,"http://www.w3.org/1999/xlink","actuate")||"onRequest",l=0;l<b.attributes.length;l++){var m=b.attributes[l];"http://www.w3.org/1999/xlink"==m.namespaceURI&&(b.removeAttributeNS(m.namespaceURI,m.localName),--l)}if(5<=g)return $a(new z(2,4,4028));if("onLoad"!=k)return $a(new z(2,4,4027));var r=Eb([e],[h]);return f.request(0,qb(r,c)).V(function(e){e=Ee(e.data,b.tagName);if(!e)return $a(new z(2,4,4001,h));for(;b.childNodes.length;)b.removeChild(b.childNodes[0]);
for(;e.childNodes.length;){var k=e.childNodes[0];e.removeChild(k);b.appendChild(k)}for(k=0;k<e.attributes.length;k++){var l=e.attributes[k].nodeName,m=e.getAttribute(l);b.setAttribute(l,m)}return Ge(b,c,d,r[0],f,g+1)})}
function Ge(b,c,d,e,f,g){g=g||0;if(me(b,"http://www.w3.org/1999/xlink","href")){var h=Fe(b,c,d,e,f,g);d&&(h=h.V(void 0,function(){return Ge(b,c,d,e,f,g)}));return h}for(h=0;h<b.childNodes.length;h++){var k=b.childNodes[h];k instanceof Element&&"urn:mpeg:dash:resolve-to-zero:2013"==me(k,"http://www.w3.org/1999/xlink","href")&&(b.removeChild(k),--h)}h=[];for(k=0;k<b.childNodes.length;k++){var l=b.childNodes[k];l.nodeType==Node.ELEMENT_NODE&&h.push(Ge(l,c,d,e,f,g))}return db(h).V(function(){return b})}
;function P(b,c,d){this.c=b;this.b=c;this.a=d}x("shaka.media.InitSegmentReference",P);P.prototype.Fb=function(){return this.c()};P.prototype.createUris=P.prototype.Fb;P.prototype.Lb=function(){return this.b};P.prototype.getStartByte=P.prototype.Lb;P.prototype.Jb=function(){return this.a};P.prototype.getEndByte=P.prototype.Jb;function Q(b,c,d,e,f,g){this.position=b;this.startTime=c;this.endTime=d;this.c=e;this.b=f;this.a=g}x("shaka.media.SegmentReference",Q);Q.prototype.W=function(){return this.position};
Q.prototype.getPosition=Q.prototype.W;Q.prototype.Mb=function(){return this.startTime};Q.prototype.getStartTime=Q.prototype.Mb;Q.prototype.od=function(){return this.endTime};Q.prototype.getEndTime=Q.prototype.od;Q.prototype.Fb=function(){return this.c()};Q.prototype.createUris=Q.prototype.Fb;Q.prototype.Lb=function(){return this.b};Q.prototype.getStartByte=Q.prototype.Lb;Q.prototype.Jb=function(){return this.a};Q.prototype.getEndByte=Q.prototype.Jb;function R(b,c){this.G=b;this.b=c==He;this.a=0}x("shaka.util.DataViewReader",R);var He=1;R.Endianness={bf:0,cf:He};R.prototype.ga=function(){return this.a<this.G.byteLength};R.prototype.hasMoreData=R.prototype.ga;R.prototype.W=function(){return this.a};R.prototype.getPosition=R.prototype.W;R.prototype.pd=function(){return this.G.byteLength};R.prototype.getLength=R.prototype.pd;R.prototype.ca=function(){try{var b=this.G.getUint8(this.a);this.a+=1;return b}catch(c){Ie()}};R.prototype.readUint8=R.prototype.ca;
R.prototype.eb=function(){try{var b=this.G.getUint16(this.a,this.b);this.a+=2;return b}catch(c){Ie()}};R.prototype.readUint16=R.prototype.eb;R.prototype.C=function(){try{var b=this.G.getUint32(this.a,this.b);this.a+=4;return b}catch(c){Ie()}};R.prototype.readUint32=R.prototype.C;R.prototype.Kc=function(){try{var b=this.G.getInt32(this.a,this.b);this.a+=4;return b}catch(c){Ie()}};R.prototype.readInt32=R.prototype.Kc;
R.prototype.Sa=function(){try{if(this.b){var b=this.G.getUint32(this.a,!0);var c=this.G.getUint32(this.a+4,!0)}else c=this.G.getUint32(this.a,!1),b=this.G.getUint32(this.a+4,!1)}catch(d){Ie()}if(2097151<c)throw new z(2,3,3001);this.a+=8;return c*Math.pow(2,32)+b};R.prototype.readUint64=R.prototype.Sa;R.prototype.Ea=function(b){this.a+b>this.G.byteLength&&Ie();var c=new Uint8Array(this.G.buffer,this.G.byteOffset+this.a,b);this.a+=b;return new Uint8Array(c)};R.prototype.readBytes=R.prototype.Ea;
R.prototype.F=function(b){this.a+b>this.G.byteLength&&Ie();this.a+=b};R.prototype.skip=R.prototype.F;R.prototype.Oc=function(b){this.a<b&&Ie();this.a-=b};R.prototype.rewind=R.prototype.Oc;R.prototype.seek=function(b){(0>b||b>this.G.byteLength)&&Ie();this.a=b};R.prototype.seek=R.prototype.seek;R.prototype.Xb=function(){for(var b=this.a;this.ga()&&0!=this.G.getUint8(this.a);)this.a+=1;b=new Uint8Array(this.G.buffer,this.G.byteOffset+b,this.a-b);this.a+=1;return H(b)};
R.prototype.readTerminatedString=R.prototype.Xb;function Ie(){throw new z(2,3,3E3);};function S(){this.c=[];this.b=[];this.a=!1}x("shaka.util.Mp4Parser",S);S.prototype.D=function(b,c){var d=Je(b);this.c[d]=0;this.b[d]=c;return this};S.prototype.box=S.prototype.D;S.prototype.Y=function(b,c){var d=Je(b);this.c[d]=1;this.b[d]=c;return this};S.prototype.fullBox=S.prototype.Y;S.prototype.stop=function(){this.a=!0};S.prototype.stop=S.prototype.stop;
S.prototype.parse=function(b,c){var d=new Uint8Array(b);d=new R(new DataView(d.buffer,d.byteOffset,d.byteLength),0);for(this.a=!1;d.ga()&&!this.a;)this.Ab(0,d,c)};S.prototype.parse=S.prototype.parse;
S.prototype.Ab=function(b,c,d){var e=c.W(),f=c.C(),g=c.C();switch(f){case 0:f=c.G.byteLength-e;break;case 1:f=c.Sa()}var h=this.b[g];if(h){var k=null,l=null;1==this.c[g]&&(l=c.C(),k=l>>>24,l&=16777215);g=e+f;d&&g>c.G.byteLength&&(g=c.G.byteLength);g-=c.W();c=0<g?c.Ea(g):new Uint8Array(0);c=new R(new DataView(c.buffer,c.byteOffset,c.byteLength),0);h({ra:this,Hc:d||!1,version:k,flags:l,s:c,size:f,start:e+b})}else c.F(e+f-c.W())};S.prototype.parseNext=S.prototype.Ab;
function T(b){for(;b.s.ga()&&!b.ra.a;)b.ra.Ab(b.start,b.s,b.Hc)}S.children=T;function Ke(b){for(var c=b.s.C();0<c&&!b.ra.a;--c)b.ra.Ab(b.start,b.s,b.Hc)}S.sampleDescription=Ke;function Le(b){return function(c){b(c.s.Ea(c.s.G.byteLength-c.s.W()))}}S.allData=Le;function Je(b){for(var c=0,d=0;d<b.length;d++)c=c<<8|b.charCodeAt(d);return c}function Me(b){return String.fromCharCode(b>>24&255,b>>16&255,b>>8&255,b&255)}S.typeToString=Me;function Ne(b,c,d,e){var f,g=(new S).Y("sidx",function(b){f=Oe(c,e,d,b)});b&&g.parse(b);if(f)return f;throw new z(2,3,3004);}
function Oe(b,c,d,e){var f=[];e.s.F(4);var g=e.s.C();if(0==g)throw new z(2,3,3005);if(0==e.version){var h=e.s.C();var k=e.s.C()}else h=e.s.Sa(),k=e.s.Sa();e.s.F(2);var l=e.s.eb();b=b+e.size+k;for(k=0;k<l;k++){var m=e.s.C(),r=(m&2147483648)>>>31;m&=2147483647;var t=e.s.C();e.s.F(4);if(1==r)throw new z(2,3,3006);f.push(new Q(f.length,h/g-c,(h+t)/g-c,function(){return d},b,b+m-1));h+=t;b+=m}e.ra.stop();return f};function U(b){this.a=b}x("shaka.media.SegmentIndex",U);U.prototype.destroy=function(){this.a=null;return Promise.resolve()};U.prototype.destroy=U.prototype.destroy;U.prototype.find=function(b){for(var c=this.a.length-1;0<=c;--c){var d=this.a[c];if(b>=d.startTime&&b<d.endTime)return d.position}return this.a.length&&b<this.a[0].startTime?this.a[0].position:null};U.prototype.find=U.prototype.find;
U.prototype.get=function(b){if(0==this.a.length)return null;b-=this.a[0].position;return 0>b||b>=this.a.length?null:this.a[b]};U.prototype.get=U.prototype.get;U.prototype.offset=function(b){for(var c=0;c<this.a.length;++c)this.a[c].startTime+=b,this.a[c].endTime+=b};U.prototype.offset=U.prototype.offset;
U.prototype.Rb=function(b){for(var c=[],d=0,e=0;d<this.a.length&&e<b.length;){var f=this.a[d],g=b[e];f.startTime<g.startTime?(c.push(f),d++):(f.startTime>g.startTime?0==d&&c.push(g):(.1<Math.abs(f.endTime-g.endTime)?c.push(new Q(f.position,g.startTime,g.endTime,g.c,g.b,g.a)):c.push(f),d++),e++)}for(;d<this.a.length;)c.push(this.a[d++]);if(c.length)for(d=c[c.length-1].position+1;e<b.length;)f=b[e++],f=new Q(d++,f.startTime,f.endTime,f.c,f.b,f.a),c.push(f);else c=b;this.a=c};U.prototype.merge=U.prototype.Rb;
U.prototype.Hb=function(b){for(var c=0;c<this.a.length;++c)if(this.a[c].endTime>b){this.a.splice(0,c);return}this.a=[]};U.prototype.evict=U.prototype.Hb;function Pe(b,c){for(;b.a.length;)if(b.a[b.a.length-1].startTime>=c)b.a.pop();else break;for(;b.a.length;)if(0>=b.a[0].endTime)b.a.shift();else break;if(0!=b.a.length){var d=b.a[0];d.startTime<Gb&&(b.a[0]=new Q(d.position,0,d.endTime,d.c,d.b,d.a));d=b.a[b.a.length-1];b.a[b.a.length-1]=new Q(d.position,d.startTime,c,d.c,d.b,d.a)}};function Qe(b){this.b=b;this.a=new R(b,0);Re||(Re=[new Uint8Array([255]),new Uint8Array([127,255]),new Uint8Array([63,255,255]),new Uint8Array([31,255,255,255]),new Uint8Array([15,255,255,255,255]),new Uint8Array([7,255,255,255,255,255]),new Uint8Array([3,255,255,255,255,255,255]),new Uint8Array([1,255,255,255,255,255,255,255])])}var Re;Qe.prototype.ga=function(){return this.a.ga()};
function Se(b){var c=Te(b);if(7<c.length)throw new z(2,3,3002);for(var d=0,e=0;e<c.length;e++)d=256*d+c[e];c=d;d=Te(b);a:{for(e=0;e<Re.length;e++)if(Yb(d,Re[e])){e=!0;break a}e=!1}if(e)d=b.b.byteLength-b.a.W();else{if(8==d.length&&d[1]&224)throw new z(2,3,3001);e=d[0]&(1<<8-d.length)-1;for(var f=1;f<d.length;f++)e=256*e+d[f];d=e}d=b.a.W()+d<=b.b.byteLength?d:b.b.byteLength-b.a.W();e=new DataView(b.b.buffer,b.b.byteOffset+b.a.W(),d);b.a.F(d);return new Ue(c,e)}
function Te(b){var c=b.a.ca(),d;for(d=1;8>=d&&!(c&1<<8-d);d++);if(8<d)throw new z(2,3,3002);var e=new Uint8Array(d);e[0]=c;for(c=1;c<d;c++)e[c]=b.a.ca();return e}function Ue(b,c){this.id=b;this.a=c}function Ve(b){if(8<b.a.byteLength)throw new z(2,3,3002);if(8==b.a.byteLength&&b.a.getUint8(0)&224)throw new z(2,3,3001);for(var c=0,d=0;d<b.a.byteLength;d++){var e=b.a.getUint8(d);c=256*c+e}return c};function We(){}
We.prototype.parse=function(b,c,d,e){var f;c=new Qe(new DataView(c));if(440786851!=Se(c).id)throw new z(2,3,3008);var g=Se(c);if(408125543!=g.id)throw new z(2,3,3009);c=g.a.byteOffset;g=new Qe(g.a);for(f=null;g.ga();){var h=Se(g);if(357149030==h.id){f=h;break}}if(!f)throw new z(2,3,3010);g=new Qe(f.a);f=1E6;for(h=null;g.ga();){var k=Se(g);if(2807729==k.id)f=Ve(k);else if(17545==k.id)if(h=k,4==h.a.byteLength)h=h.a.getFloat32(0);else if(8==h.a.byteLength)h=h.a.getFloat64(0);else throw new z(2,3,3003);
}if(null==h)throw new z(2,3,3011);g=f/1E9;f=h*g;b=Se(new Qe(new DataView(b)));if(475249515!=b.id)throw new z(2,3,3007);return Xe(b,c,g,f,d,e)};function Xe(b,c,d,e,f,g){function h(){return f}var k=[];b=new Qe(b.a);for(var l=null,m=null;b.ga();){var r=Se(b);if(187==r.id){var t=Ye(r);t&&(r=d*t.Xe,t=c+t.re,null!=l&&k.push(new Q(k.length,l-g,r-g,h,m,t-1)),l=r,m=t)}}null!=l&&k.push(new Q(k.length,l-g,e-g,h,m,null));return k}
function Ye(b){var c=new Qe(b.a);b=Se(c);if(179!=b.id)throw new z(2,3,3013);b=Ve(b);c=Se(c);if(183!=c.id)throw new z(2,3,3012);c=new Qe(c.a);for(var d=0;c.ga();){var e=Se(c);if(241==e.id){d=Ve(e);break}}return{Xe:b,re:d}};function Ze(b,c){var d=De(b,c,"Initialization");if(!d)return null;var e=b.w.ea,f=d.getAttribute("sourceURL");f&&(e=Eb(b.w.ea,[f]));f=0;var g=null;if(d=O(d,"range",qe))f=d.start,g=d.end;return new P(function(){return e},f,g)}
function $e(b,c){var d=Number(Ce(b,af,"presentationTimeOffset"))||0,e=Ce(b,af,"timescale"),f=1;e&&(f=se(e)||1);d=d/f||0;e=Ze(b,af);var g=b.w.contentType;f=b.w.mimeType.split("/")[1];if("text"!=g&&"mp4"!=f&&"webm"!=f)throw new z(2,4,4006);if("webm"==f&&!e)throw new z(2,4,4005);g=De(b,af,"RepresentationIndex");var h=Ce(b,af,"indexRange"),k=b.w.ea;h=qe(h||"");if(g){var l=g.getAttribute("sourceURL");l&&(k=Eb(b.w.ea,[l]));h=O(g,"range",qe,h)}if(!h)throw new z(2,4,4002);f=bf(b,c,e,k,h.start,h.end,f,d);
return{createSegmentIndex:f.createSegmentIndex,findSegmentPosition:f.findSegmentPosition,getSegmentReference:f.getSegmentReference,initSegmentReference:e,da:d}}
function bf(b,c,d,e,f,g,h,k){var l=b.presentationTimeline,m=!b.Ja||!b.N.Nb,r=b.N.index,t=b.N.duration,u=c,y=null;return{createSegmentIndex:function(){var b=[u(e,f,g),"webm"==h?u(d.c(),d.b,d.a):null];u=null;return Promise.all(b).then(function(b){var c=b[0];b=b[1]||null;c="mp4"==h?Ne(c,f,e,k):(new We).parse(c,b,e,k);l.bb(c,0==r);y=new U(c);m&&Pe(y,t)})},findSegmentPosition:function(b){return y.find(b)},getSegmentReference:function(b){return y.get(b)}}}function af(b){return b.fb};function cf(b,c){var d=Ze(b,df);var e=ef(b);var f=Be(b,df),g=f.Fa;0==g&&(g=1);var h=0;f.R?h=f.R*(g-1):f.I&&0<f.I.length&&(h=f.I[0].start);e={R:f.R,startTime:h,Fa:g,da:f.da,I:f.I,Na:e};if(!e.R&&!e.I&&1<e.Na.length)throw new z(2,4,4002);if(!e.R&&!b.N.duration&&!e.I&&1==e.Na.length)throw new z(2,4,4002);if(e.I&&0==e.I.length)throw new z(2,4,4002);g=f=null;b.ba.id&&b.w.id&&(g=b.ba.id+","+b.w.id,f=c[g]);h=ff(b.N.duration,e.Fa,b.w.ea,e);f?(f.Rb(h),g=b.presentationTimeline.Za(),f.Hb(g-b.N.start)):(b.presentationTimeline.bb(h,
0==b.N.index),f=new U(h),g&&b.Ja&&(c[g]=f));b.Ja&&b.N.Nb||Pe(f,b.N.duration);return{createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:f.find.bind(f),getSegmentReference:f.get.bind(f),initSegmentReference:d,da:e.da}}function df(b){return b.ta}
function ff(b,c,d,e){var f=e.Na.length;e.I&&e.I.length!=e.Na.length&&(f=Math.min(e.I.length,e.Na.length));for(var g=[],h=e.startTime,k=0;k<f;k++){var l=e.Na[k],m=Eb(d,[l.Fd]),r=void 0;r=null!=e.R?h+e.R:e.I?e.I[k].end:h+b;g.push(new Q(k+c,h,r,function(b){return b}.bind(null,m),l.start,l.end));h=r}return g}
function ef(b){return[b.w.ta,b.U.ta,b.ba.ta].filter(Cb).map(function(b){return N(b,"SegmentURL")}).reduce(function(b,d){return 0<b.length?b:d}).map(function(c){c.getAttribute("indexRange")&&!b.uc&&(b.uc=!0);var d=c.getAttribute("media");c=O(c,"mediaRange",qe,{start:0,end:null});return{Fd:d,start:c.start,end:c.end}})};function gf(b,c,d,e){var f=hf(b);var g=Be(b,jf);var h=Ce(b,jf,"media"),k=Ce(b,jf,"index");g={R:g.R,timescale:g.timescale,Fa:g.Fa,da:g.da,hc:g.hc,I:g.I,Qb:h,ab:k};h=g.ab?1:0;h+=g.I?1:0;h+=g.R?1:0;if(0==h)throw new z(2,4,4002);1!=h&&(g.ab&&(g.I=null),g.R=null);if(!g.ab&&!g.Qb)throw new z(2,4,4002);if(g.ab){d=b.w.mimeType.split("/")[1];if("mp4"!=d&&"webm"!=d)throw new z(2,4,4006);if("webm"==d&&!f)throw new z(2,4,4005);e=Ae(g.ab,b.w.id,null,b.bandwidth||null,null);e=Eb(b.w.ea,[e]);b=bf(b,c,f,e,0,null,
d,g.da)}else g.R?(e||b.presentationTimeline.yb(g.R),b=kf(b,g)):(e=c=null,b.ba.id&&b.w.id&&(e=b.ba.id+","+b.w.id,c=d[e]),h=lf(b,g),c?(c.Rb(h),d=b.presentationTimeline.Za(),c.Hb(d-b.N.start)):(b.presentationTimeline.bb(h,0==b.N.index),c=new U(h),e&&b.Ja&&(d[e]=c)),b.Ja&&b.N.Nb||Pe(c,b.N.duration),b={createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:c.find.bind(c),getSegmentReference:c.get.bind(c)});return{createSegmentIndex:b.createSegmentIndex,findSegmentPosition:b.findSegmentPosition,
getSegmentReference:b.getSegmentReference,initSegmentReference:f,da:g.da}}function jf(b){return b.hb}
function kf(b,c){var d=b.N.duration,e=c.R,f=c.Fa,g=c.timescale,h=c.Qb,k=b.bandwidth||null,l=b.w.id,m=b.w.ea;return{createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:function(b){return 0>b||d&&b>=d?null:Math.floor(b/e)},getSegmentReference:function(b){var c=b*e,r=c+e;d&&(r=Math.min(r,d));return 0>r||d&&c>=d?null:new Q(b,c,r,function(){var d=Ae(h,l,b+f,k,c*g);return Eb(m,[d])},0,null)}}}
function lf(b,c){for(var d=[],e=0;e<c.I.length;e++){var f=e+c.Fa;d.push(new Q(f,c.I[e].start,c.I[e].end,function(b,c,d,e,f,r){b=Ae(b,c,f,d,r);return Eb(e,[b]).map(function(b){return b.toString()})}.bind(null,c.Qb,b.w.id,b.bandwidth||null,b.w.ea,f,c.I[e].We+c.hc),0,null))}return d}function hf(b){var c=Ce(b,jf,"initialization");if(!c)return null;var d=b.w.id,e=b.bandwidth||null,f=b.w.ea;return new P(function(){var b=Ae(c,d,null,e,null);return Eb(f,[b])},0,null)};var mf={},nf={};x("shaka.media.ManifestParser.registerParserByExtension",function(b,c){nf[b]=c});x("shaka.media.ManifestParser.registerParserByMime",function(b,c){mf[b]=c});function of(){var b={},c;for(c in mf)b[c]=!0;for(var d in nf)b[d]=!0;["application/dash+xml","application/x-mpegurl","application/vnd.apple.mpegurl","application/vnd.ms-sstr+xml"].forEach(function(c){b[c]=!!mf[c]});["mpd","m3u8","ism"].forEach(function(c){b[c]=!!nf[c]});return b}
function pf(b,c,d,e){var f=e;f||(e=(new Ia(b)).aa.split("/").pop().split("."),1<e.length&&(e=e.pop().toLowerCase(),f=nf[e]));if(f)return Promise.resolve(f);d=qb([b],d);d.method="HEAD";return c.request(0,d).promise.then(function(c){(c=c.headers["content-type"])&&(c=c.toLowerCase());return(f=mf[c])?f:Promise.reject(new z(2,4,4E3,b))},function(b){b.severity=2;return Promise.reject(b)})};function V(b,c){this.f=b;this.l=c;this.c=this.b=Infinity;this.a=1;this.j=this.h=0;this.i=!0;this.g=0}x("shaka.media.PresentationTimeline",V);V.prototype.S=function(){return this.b};V.prototype.getDuration=V.prototype.S;V.prototype.ja=function(b){this.b=b};V.prototype.setDuration=V.prototype.ja;V.prototype.ud=function(){return this.f};V.prototype.getPresentationStartTime=V.prototype.ud;V.prototype.Rc=function(b){this.j=b};V.prototype.setClockOffset=V.prototype.Rc;
V.prototype.Bb=function(b){this.i=b};V.prototype.setStatic=V.prototype.Bb;V.prototype.cc=function(b){this.c=b};V.prototype.setSegmentAvailabilityDuration=V.prototype.cc;V.prototype.Sc=function(b){this.l=b};V.prototype.setDelay=V.prototype.Sc;V.prototype.bb=function(b,c){0!=b.length&&(c&&(this.h=Math.max(this.h,b[0].startTime)),this.a=b.reduce(function(b,c){return Math.max(b,c.endTime-c.startTime)},this.a))};V.prototype.notifySegments=V.prototype.bb;
V.prototype.yb=function(b){this.a=Math.max(this.a,b)};V.prototype.notifyMaxSegmentDuration=V.prototype.yb;V.prototype.P=function(){return Infinity==this.b&&!this.i};V.prototype.isLive=V.prototype.P;V.prototype.Ba=function(){return Infinity!=this.b&&!this.i};V.prototype.isInProgress=V.prototype.Ba;V.prototype.Za=function(){if(Infinity==this.c)return this.g;var b=this.La()-this.c;return Math.max(this.g,b)};V.prototype.getSegmentAvailabilityStart=V.prototype.Za;V.prototype.Tc=function(b){this.g=b};
V.prototype.setUserSeekStart=V.prototype.Tc;V.prototype.La=function(){return this.P()||this.Ba()?Math.min(Math.max(0,(Date.now()+this.j)/1E3-this.a-this.f),this.b):this.b};V.prototype.getSegmentAvailabilityEnd=V.prototype.La;V.prototype.Ya=function(b){var c=Math.max(this.h,this.g);if(Infinity==this.c)return c;var d=this.La()-this.c;b=Math.min(d+b,this.la());return Math.max(c,b)};V.prototype.getSafeSeekRangeStart=V.prototype.Ya;V.prototype.Ka=function(){return this.Ya(0)};
V.prototype.getSeekRangeStart=V.prototype.Ka;V.prototype.la=function(){var b=this.P()||this.Ba()?this.l:0;return Math.max(0,this.La()-b)};V.prototype.getSeekRangeEnd=V.prototype.la;function qf(){this.a=this.b=null;this.h=[];this.c=null;this.j=[];this.i=1;this.l={};this.m=0;this.o=new Aa(5);this.g=null;this.f=new mb}x("shaka.dash.DashParser",qf);n=qf.prototype;n.configure=function(b){this.b=b};n.start=function(b,c){this.h=[b];this.a=c;return rf(this).then(function(b){this.a&&sf(this,b);return this.c}.bind(this))};n.stop=function(){this.b=this.a=null;this.h=[];this.c=null;this.j=[];this.l={};null!=this.g&&(window.clearTimeout(this.g),this.g=null);return this.f.destroy()};
n.update=function(){rf(this)["catch"](function(b){if(this.a)this.a.onError(b)}.bind(this))};n.onExpirationUpdated=function(){};function rf(b){var c=Date.now(),d=b.a.networkingEngine.request(0,qb(b.h,b.b.retryParameters));nb(b.f,d);return d.promise.then(function(c){if(b.a)return tf(b,c.data,c.uri)}).then(function(){var d=(Date.now()-c)/1E3;Ba(b.o,1,d);return d})}
function tf(b,c,d){c=Ee(c,"MPD");if(!c)throw new z(2,4,4001,d);c=Ge(c,b.b.retryParameters,b.b.dash.xlinkFailGracefully,d,b.a.networkingEngine);nb(b.f,c);return c.promise.then(function(c){return uf(b,c,d)})}
function uf(b,c,d){d=[d];var e=N(c,"Location").map(ne).filter(Cb);0<e.length&&(d=b.h=e);e=N(c,"BaseURL").map(ne);d=Eb(d,e);var f=O(c,"minBufferTime",pe);b.m=O(c,"minimumUpdatePeriod",pe,-1);var g=O(c,"availabilityStartTime",oe);e=O(c,"timeShiftBufferDepth",pe);var h=O(c,"suggestedPresentationDelay",pe),k=O(c,"maxSegmentDuration",pe),l=c.getAttribute("type")||"static";if(b.c)var m=b.c.presentationTimeline;else{var r=Math.max(b.b.dash.defaultPresentationDelay,1.5*f);m=new V(g,null!=h?h:r)}g=vf(b,{Ja:"static"!=
l,presentationTimeline:m,ba:null,N:null,U:null,w:null,bandwidth:0,uc:!1},d,c);h=g.duration;var t=g.periods;m.Bb("static"==l);"static"!=l&&g.mc||m.ja(h||Infinity);m.cc(null!=e?e:Infinity);m.yb(k||1);if(b.c)return Promise.resolve();c=N(c,"UTCTiming");e=m.P();return wf(b,d,c,e).then(function(b){this.a&&(m.Rc(b),this.c={presentationTimeline:m,periods:t,offlineSessionIds:[],minBufferTime:f||0})}.bind(b))}
function vf(b,c,d,e){var f=O(e,"mediaPresentationDuration",pe),g=[],h=0;e=N(e,"Period");for(var k=0;k<e.length;k++){var l=e[k];h=O(l,"start",pe,h);var m=O(l,"duration",pe),r=null;if(k!=e.length-1){var t=O(e[k+1],"start",pe);null!=t&&(r=t-h)}else null!=f&&(r=f-h);null==r&&(r=m);l=xf(b,c,d,{start:h,duration:r,node:l,index:k,Nb:null==r||k==e.length-1});g.push(l);m=c.ba.id;-1==b.j.indexOf(m)&&(b.j.push(m),b.c&&(b.a.filterNewPeriod(l),b.c.periods.push(l)));if(null==r){h=null;break}h+=r}null==b.c&&b.a.filterAllPeriods(g);
return null!=f?{periods:g,duration:f,mc:!1}:{periods:g,duration:h,mc:!0}}
function xf(b,c,d,e){c.ba=yf(e.node,null,d);c.N=e;c.ba.id||(c.ba.id="__shaka_period_"+e.start);N(e.node,"EventStream").forEach(b.ie.bind(b,e.start,e.duration));d=N(e.node,"AdaptationSet").map(b.ge.bind(b,c)).filter(Cb);var f=d.map(function(b){return b.te}).reduce(Ab,[]),g=f.filter(Db);if(c.Ja&&f.length!=g.length)throw new z(2,4,4018);var h=d.filter(function(b){return!b.gc});d.filter(function(b){return b.gc}).forEach(function(b){var c=b.streams[0],d=b.gc;h.forEach(function(b){b.id==d&&b.streams.forEach(function(b){b.trickModeVideo=
c})})});d=zf(h,"video");f=zf(h,"audio");if(!d.length&&!f.length)throw new z(2,4,4004);f.length||(f=[null]);d.length||(d=[null]);c=[];for(g=0;g<f.length;g++)for(var k=0;k<d.length;k++)Af(b,f[g],d[k],c);b=zf(h,"text");d=[];for(f=0;f<b.length;f++)d.push.apply(d,b[f].streams);return{startTime:e.start,textStreams:d,variants:c}}function zf(b,c){return b.filter(function(b){return b.contentType==c})}
function Af(b,c,d,e){if(c||d)if(c&&d){var f=c.drmInfos;var g=d.drmInfos;if(f.length&&g.length?0<qc(f,g).length:1){g=qc(c.drmInfos,d.drmInfos);for(var h=0;h<c.streams.length;h++)for(var k=0;k<d.streams.length;k++)f=(d.streams[k].bandwidth||0)+(c.streams[h].bandwidth||0),f={id:b.i++,language:c.language,primary:c.Pb||d.Pb,audio:c.streams[h],video:d.streams[k],bandwidth:f,drmInfos:g,allowedByApplication:!0,allowedByKeySystem:!0},e.push(f)}}else for(g=c||d,h=0;h<g.streams.length;h++)f=g.streams[h].bandwidth||
0,f={id:b.i++,language:g.language||"und",primary:g.Pb,audio:c?g.streams[h]:null,video:d?g.streams[h]:null,bandwidth:f,drmInfos:g.drmInfos,allowedByApplication:!0,allowedByKeySystem:!0},e.push(f)}
n.ge=function(b,c){b.U=yf(c,b.ba,null);var d=!1,e=N(c,"Role"),f=e.map(function(b){return b.getAttribute("value")}).filter(Cb),g=void 0;"text"==b.U.contentType&&(g="subtitle");for(var h=0;h<e.length;h++){var k=e[h].getAttribute("schemeIdUri");if(null==k||"urn:mpeg:dash:role:2011"==k)switch(k=e[h].getAttribute("value"),k){case "main":d=!0;break;case "caption":case "subtitle":g=k}}var l=null,m=!1;N(c,"EssentialProperty").forEach(function(b){"http://dashif.org/guidelines/trickmode"==b.getAttribute("schemeIdUri")?
l=b.getAttribute("value"):m=!0});if(m)return null;e=N(c,"ContentProtection");var r=we(e,this.b.dash.customScheme,this.b.dash.ignoreDrmInfo);e=fd(c.getAttribute("lang")||"und");k=c.getAttribute("label");h=N(c,"Representation");f=h.map(this.je.bind(this,b,r,g,e,k,d,f)).filter(function(b){return!!b});if(0==f.length)throw new z(2,4,4003);b.U.contentType&&"application"!=b.U.contentType||(b.U.contentType=Bf(f[0].mimeType,f[0].codecs),f.forEach(function(c){c.type=b.U.contentType}));f.forEach(function(b){r.drmInfos.forEach(function(c){b.keyId&&
c.keyIds.push(b.keyId)})});g=h.map(function(b){return b.getAttribute("id")}).filter(Cb);return{id:b.U.id||"__fake__"+this.i++,contentType:b.U.contentType,language:e,Pb:d,streams:f,drmInfos:r.drmInfos,gc:l,te:g}};
n.je=function(b,c,d,e,f,g,h,k){b.w=yf(k,b.U,null);if(!Cf(b.w))return null;b.bandwidth=O(k,"bandwidth",se)||0;var l=this.ue.bind(this);if(b.w.fb)l=$e(b,l);else if(b.w.ta)l=cf(b,this.l);else if(b.w.hb)l=gf(b,l,this.l,!!this.c);else{var m=b.w.ea,r=b.N.duration||0;l={createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:function(b){return 0<=b&&b<r?1:null},getSegmentReference:function(b){return 1!=b?null:new Q(1,0,r,function(){return m},0,null)},initSegmentReference:null,da:0}}k=N(k,"ContentProtection");
k=ze(k,this.b.dash.customScheme,c,this.b.dash.ignoreDrmInfo);return{id:this.i++,createSegmentIndex:l.createSegmentIndex,findSegmentPosition:l.findSegmentPosition,getSegmentReference:l.getSegmentReference,initSegmentReference:l.initSegmentReference,presentationTimeOffset:l.da,mimeType:b.w.mimeType,codecs:b.w.codecs,frameRate:b.w.frameRate,bandwidth:b.bandwidth,width:b.w.width,height:b.w.height,kind:d,encrypted:0<c.drmInfos.length,keyId:k,language:e,label:f,type:b.U.contentType,primary:g,trickModeVideo:null,
containsEmsgBoxes:b.w.containsEmsgBoxes,roles:h,channelsCount:b.w.Tb}};n.Pe=function(){this.g=null;rf(this).then(function(b){this.a&&sf(this,b)}.bind(this))["catch"](function(b){this.a&&(b.severity=1,this.a.onError(b),sf(this,0))}.bind(this))};function sf(b,c){0>b.m||(b.g=window.setTimeout(b.Pe.bind(b),1E3*Math.max(3,b.m-c,Ca(b.o))))}
function yf(b,c,d){c=c||{contentType:"",mimeType:"",codecs:"",containsEmsgBoxes:!1,frameRate:void 0,Tb:null};d=d||c.ea;var e=N(b,"BaseURL").map(ne),f=b.getAttribute("contentType")||c.contentType,g=b.getAttribute("mimeType")||c.mimeType,h=b.getAttribute("codecs")||c.codecs,k=O(b,"frameRate",ue)||c.frameRate,l=!!N(b,"InbandEventStream").length,m=N(b,"AudioChannelConfiguration");m=Df(m)||c.Tb;f||(f=Bf(g,h));return{ea:Eb(d,e),fb:ke(b,"SegmentBase")||c.fb,ta:ke(b,"SegmentList")||c.ta,hb:ke(b,"SegmentTemplate")||
c.hb,width:O(b,"width",te)||c.width,height:O(b,"height",te)||c.height,contentType:f,mimeType:g,codecs:h,frameRate:k,containsEmsgBoxes:l||c.containsEmsgBoxes,id:b.getAttribute("id"),Tb:m}}
function Df(b){for(var c=0;c<b.length;++c){var d=b[c],e=d.getAttribute("schemeIdUri");if(e&&(d=d.getAttribute("value")))switch(e){case "urn:mpeg:dash:outputChannelPositionList:2012":return d.trim().split(/ +/).length;case "urn:mpeg:dash:23003:3:audio_channel_configuration:2011":case "urn:dts:dash:audio_channel_configuration:2012":e=parseInt(d,10);if(!e)continue;return e;case "tag:dolby.com,2014:dash:audio_channel_configuration:2011":case "urn:dolby:dash:audio_channel_configuration:2011":if(e=parseInt(d,
16)){for(b=0;e;)e&1&&++b,e>>=1;return b}}}return null}function Cf(b){var c=b.fb?1:0;c+=b.ta?1:0;c+=b.hb?1:0;if(0==c)return"text"==b.contentType||"application"==b.contentType?!0:!1;1!=c&&(b.fb&&(b.ta=null),b.hb=null);return!0}
function Ef(b,c,d,e){c=Eb(c,[d]);c=qb(c,b.b.retryParameters);c.method=e;c=b.a.networkingEngine.request(0,c);nb(b.f,c);return c.promise.then(function(b){if("HEAD"==e){if(!b.headers||!b.headers.date)return 0;b=b.headers.date}else b=H(b.data);b=Date.parse(b);return isNaN(b)?0:b-Date.now()})}
function wf(b,c,d,e){d=d.map(function(b){return{scheme:b.getAttribute("schemeIdUri"),value:b.getAttribute("value")}});var f=b.b.dash.clockSyncUri;e&&!d.length&&f&&d.push({scheme:"urn:mpeg:dash:utc:http-head:2014",value:f});return zb(d,function(b){var d=b.value;switch(b.scheme){case "urn:mpeg:dash:utc:http-head:2014":case "urn:mpeg:dash:utc:http-head:2012":return Ef(this,c,d,"HEAD");case "urn:mpeg:dash:utc:http-xsdate:2014":case "urn:mpeg:dash:utc:http-iso:2014":case "urn:mpeg:dash:utc:http-xsdate:2012":case "urn:mpeg:dash:utc:http-iso:2012":return Ef(this,
c,d,"GET");case "urn:mpeg:dash:utc:direct:2014":case "urn:mpeg:dash:utc:direct:2012":return b=Date.parse(d),isNaN(b)?0:b-Date.now();case "urn:mpeg:dash:utc:http-ntp:2014":case "urn:mpeg:dash:utc:ntp:2014":case "urn:mpeg:dash:utc:sntp:2014":return Promise.reject();default:return Promise.reject()}}.bind(b))["catch"](function(){return 0})}
n.ie=function(b,c,d){var e=d.getAttribute("schemeIdUri")||"",f=d.getAttribute("value")||"",g=O(d,"timescale",te)||1;N(d,"Event").forEach(function(d){var h=O(d,"presentationTime",te)||0,l=O(d,"duration",te)||0;h=h/g+b;l=h+l/g;null!=c&&(h=Math.min(h,b+c),l=Math.min(l,b+c));d={schemeIdUri:e,value:f,startTime:h,endTime:l,id:d.getAttribute("id")||"",eventElement:d};this.a.onTimelineRegionAdded(d)}.bind(this))};
n.ue=function(b,c,d){b=qb(b,this.b.retryParameters);null!=c&&(b.headers.Range="bytes="+c+"-"+(null!=d?d:""));c=this.a.networkingEngine.request(1,b);nb(this.f,c);return c.promise.then(function(b){return b.data})};function Bf(b,c){return J[Kb(b,c)]?"text":b.split("/")[0]}nf.mpd=qf;mf["application/dash+xml"]=qf;function Ff(b,c,d,e){this.uri=b;this.type=c;this.a=d;this.segments=e||null}function Gf(b,c,d,e){this.id=b;this.name=c;this.a=d;this.value=e||null}Gf.prototype.toString=function(){function b(b){return b.name+'="'+b.value+'"'}return this.value?"#"+this.name+":"+this.value:0<this.a.length?"#"+this.name+":"+this.a.map(b).join(","):"#"+this.name};function Hf(b,c){this.name=b;this.value=c}Gf.prototype.getAttribute=function(b){var c=this.a.filter(function(c){return c.name==b});return c.length?c[0]:null};
function If(b,c,d){d=d||null;return(b=b.getAttribute(c))?b.value:d}function Jf(b,c){this.a=c;this.uri=b};function Kf(b,c){return b.filter(function(b){return b.name==c})}function Lf(b,c){var d=Kf(b,c);return d.length?d[0]:null}function Mf(b,c,d){return b.filter(function(b){var e=b.getAttribute("TYPE");b=b.getAttribute("GROUP-ID");return e.value==c&&b.value==d})}function Nf(b,c){return Eb([b],[c])[0]};function Of(b){this.b=b;this.a=0}function Pf(b){Qf(b,/[ \t]+/gm)}function Qf(b,c){c.lastIndex=b.a;var d=c.exec(b.b);d=null==d?null:{position:d.index,length:d[0].length,we:d};if(b.a==b.b.length||null==d||d.position!=b.a)return null;b.a+=d.length;return d.we}function Rf(b){return b.a==b.b.length?null:(b=Qf(b,/[^ \t\n]*/gm))?b[0]:null};function Sf(){this.a=0}
function Tf(b,c,d){c=H(c);c=c.replace(/\r\n|\r(?=[^\n]|$)/gm,"\n").trim();var e=c.split(/\n+/m);if(!/^#EXTM3U($|[ \t\n])/m.test(e[0]))throw new z(2,4,4015);c=0;for(var f=1;f<e.length;f++)if(!/^#(?!EXT)/m.test(e[f])){var g=Uf(b,e[f]);--b.a;if(0<=Vf.indexOf(g.name)){c=1;break}else"EXT-X-STREAM-INF"==g.name&&(f+=1)}f=[];for(g=1;g<e.length;)if(/^#(?!EXT)/m.test(e[g]))g+=1;else{var h=Uf(b,e[g]);if(0<=Wf.indexOf(h.name)){if(1!=c)throw new z(2,4,4017);e=e.splice(g,e.length-g);b=Xf(b,e,f);return new Ff(d,
c,f,b)}f.push(h);g+=1;"EXT-X-STREAM-INF"==h.name&&(h.a.push(new Hf("URI",e[g])),g+=1)}return new Ff(d,c,f)}function Xf(b,c,d){var e=[],f=[];c.forEach(function(c){if(/^(#EXT)/.test(c))c=Uf(b,c),0<=Vf.indexOf(c.name)?d.push(c):f.push(c);else{if(/^#(?!EXT)/m.test(c))return[];e.push(new Jf(c.trim(),f));f=[]}});return e}
function Uf(b,c){a:{var d=b.a++;var e=c.match(/^#(EXT[^:]*)(?::(.*))?$/);if(!e)throw new z(2,4,4016,c);var f=e[1],g=e[2];e=[];if(g&&0<=g.indexOf("=")){g=new Of(g);for(var h,k=/([^=]+)=(?:"([^"]*)"|([^",]*))(?:,|$)/g;h=Qf(g,k);)e.push(new Hf(h[1],h[2]||h[3]))}else if(g){d=new Gf(d,f,e,g);break a}d=new Gf(d,f,e)}return d}var Vf="EXT-X-TARGETDURATION EXT-X-MEDIA-SEQUENCE EXT-X-DISCONTINUITY-SEQUENCE EXT-X-PLAYLIST-TYPE EXT-X-MAP EXT-X-I-FRAMES-ONLY EXT-X-ENDLIST".split(" "),Wf="EXTINF EXT-X-BYTERANGE EXT-X-DISCONTINUITY EXT-X-PROGRAM-DATE-TIME EXT-X-KEY EXT-X-DATERANGE".split(" ");function Yf(b){try{var c=Yf.parse(b);return bb({uri:b,data:c.data,headers:{"content-type":c.contentType}})}catch(d){return $a(d)}}x("shaka.net.DataUriPlugin",Yf);
Yf.parse=function(b){var c=b.split(":");if(2>c.length||"data"!=c[0])throw new z(2,1,1004,b);c=c.slice(1).join(":").split(",");if(2>c.length)throw new z(2,1,1004,b);var d=c[0];c=window.decodeURIComponent(c.slice(1).join(","));d=d.split(";");var e=null;1<d.length&&(e=d[1]);if("base64"==e)b=Vb(c).buffer;else{if(e)throw new z(2,1,1005,b);b=Qb(c)}return{data:b,contentType:d[0]}};pb("data",Yf);function Zf(){this.h=this.c=null;this.K=1;this.v={};this.H={};this.T={};this.a={};this.b=null;this.l="";this.u=new Sf;this.j=this.i=null;this.f=$f;this.m=null;this.g=0;this.A=Infinity;this.o=new mb}x("shaka.hls.HlsParser",Zf);n=Zf.prototype;n.configure=function(b){this.h=b};n.start=function(b,c){this.c=c;this.l=b;return ag(this,b).then(function(c){return bg(this,c.data,b).then(function(){cg(this,this.i);return this.m}.bind(this))}.bind(this))};
n.stop=function(){this.h=this.c=null;this.v={};this.H={};this.m=null;return this.o.destroy()};n.update=function(){if(this.f!=dg.pa){var b=[],c;for(c in this.a)b.push(eg(this,this.a[c],c));return Promise.all(b)}};
function eg(b,c,d){ag(b,d).then(function(b){var e=dg,g=Tf(this.u,b.data,d);if(1!=g.type)throw new z(2,4,4017);b=Lf(g.a,"EXT-X-MEDIA-SEQUENCE");var h=c.stream;gg(this,g,b?Number(b.value):0,h.mimeType,h.codecs).then(function(b){c.gb.a=b;b=b[b.length-1];Lf(g.a,"EXT-X-ENDLIST")&&(hg(this,e.pa),this.b.ja(b.endTime))}.bind(this))}.bind(b))}n.onExpirationUpdated=function(){};
function bg(b,c,d){c=Tf(b.u,c,d);if(0!=c.type)throw new z(2,4,4022);return ig(b,c).then(function(b){this.c.filterAllPeriods([b]);var c=Infinity,d=0,e=0,k=Infinity;for(m in this.a){var l=this.a[m];c=Math.min(c,l.Sb);d=Math.max(d,l.Sb);e=Math.max(e,l.Ed);"text"!=l.stream.type&&(k=Math.min(k,l.duration))}var m=null;l=0;this.f!=dg.pa&&(m=Date.now()/1E3-e,l=3*this.g);this.b=new V(m,l);this.b.Bb(this.f==dg.pa);this.b.yb(this.g);if(this.f!=dg.pa){c=3*this.g;this.b.Sc(c);this.i=this.A;this.f==dg.ic&&this.b.cc(c);
for(c=0;95443.7176888889<=d;)c+=95443.7176888889,d-=95443.7176888889;if(c)for(var r in this.a)d=this.a[r],95443.7176888889>d.Sb&&(d.stream.presentationTimeOffset=-c,d.gb.offset(c))}else{this.b.ja(k);for(var t in this.a)r=this.a[t],r.stream.presentationTimeOffset=c,r.gb.offset(-c),Pe(r.gb,k)}this.m={presentationTimeline:this.b,periods:[b],offlineSessionIds:[],minBufferTime:0}}.bind(b))}
function ig(b,c){var d=c.a,e=Kf(c.a,"EXT-X-MEDIA").filter(function(b){return"SUBTITLES"==jg(b,"TYPE")}.bind(b)).map(function(b){return kg(this,b)}.bind(b));return Promise.all(e).then(function(b){var e=Kf(d,"EXT-X-STREAM-INF").map(function(b){return lg(this,b,c)}.bind(this));return Promise.all(e).then(function(c){return{startTime:0,variants:c.reduce(Ab,[]),textStreams:b}}.bind(this))}.bind(b))}
function lg(b,c,d){var e=If(c,"CODECS","avc1.42E01E,mp4a.40.2").split(","),f=c.getAttribute("RESOLUTION"),g=null,h=null,k=If(c,"FRAME-RATE"),l=Number(jg(c,"BANDWIDTH"));if(f){var m=f.value.split("x");g=m[0];h=m[1]}d=Kf(d.a,"EXT-X-MEDIA");var r=If(c,"AUDIO"),t=If(c,"VIDEO");r?d=Mf(d,"AUDIO",r):t&&(d=Mf(d,"VIDEO",t));if(m=mg("text",e)){var u=If(c,"SUBTITLES");u&&(u=Mf(d,"SUBTITLES",u),u.length&&(b.v[u[0].id].stream.codecs=m));e.splice(e.indexOf(m),1)}d=d.map(function(b){return ng(this,b,e)}.bind(b));
var y=[],w=[];return Promise.all(d).then(function(b){r?y=b:t&&(w=b);b=!1;if(y.length||w.length)if(y.length)if(jg(c,"URI")==y[0].$b){var d="audio";b=!0}else d="video";else d="audio";else 1==e.length?(d=mg("video",e),d=f||k||d?"video":"audio"):(d="video",e=[e.join(",")]);return b?Promise.resolve():og(this,c,e,d)}.bind(b)).then(function(b){b&&("audio"==b.stream.type?y=[b]:w=[b]);w&&pg(w);y&&pg(y);return qg(this,y,w,l,g,h,k)}.bind(b))}
function pg(b){b.forEach(function(b){var c=b.stream.codecs.split(",");c=c.filter(function(b){return"mp4a.40.34"!=b});b.stream.codecs=c.join(",")})}
function qg(b,c,d,e,f,g,h){d.forEach(function(b){if(b=b.stream)b.width=Number(f)||void 0,b.height=Number(g)||void 0,b.frameRate=Number(h)||void 0}.bind(b));c.length||(c=[null]);d.length||(d=[null]);for(var k=[],l=0;l<c.length;l++)for(var m=0;m<d.length;m++){var r=c[l]?c[l].stream:null,t=d[m]?d[m].stream:null,u=c[l]?c[l].drmInfos:null,y=d[m]?d[m].drmInfos:null,w=void 0;if(r&&t)if(u.length&&y.length?0<qc(u,y).length:1)w=qc(u,y);else continue;else r?w=u:t&&(w=y);u=(d[l]?d[l].$b:"")+" - "+(c[l]?c[l].$b:
"");b.H[u]||(r=rg(b,r,t,e,w),k.push(r),b.H[u]=r)}return k}function rg(b,c,d,e,f){return{id:b.K++,language:c?c.language:"und",primary:!!c&&c.primary||!!d&&d.primary,audio:c,video:d,bandwidth:e,drmInfos:f,allowedByApplication:!0,allowedByKeySystem:!0}}function kg(b,c){jg(c,"TYPE");return ng(b,c,[]).then(function(b){return b.stream})}
function ng(b,c,d){var e=jg(c,"URI");e=Nf(b.l,e);if(b.a[e])return Promise.resolve(b.a[e]);var f=jg(c,"TYPE").toLowerCase();"subtitles"==f&&(f="text");var g=fd(If(c,"LANGUAGE","und")),h=If(c,"NAME"),k=c.getAttribute("DEFAULT"),l=c.getAttribute("AUTOSELECT"),m=If(c,"CHANNELS");return sg(b,e,d,f,g,!!k||!!l,h,"audio"==f?tg(m):null).then(function(b){if(this.a[e])return this.a[e];this.v[c.id]=b;return this.a[e]=b}.bind(b))}function tg(b){if(!b)return null;b=b.split("/")[0];return parseInt(b,10)}
function og(b,c,d,e){var f=jg(c,"URI");f=Nf(b.l,f);return b.a[f]?Promise.resolve(b.a[f]):sg(b,f,d,e,"und",!1,null,null).then(function(b){return this.a[f]?this.a[f]:this.a[f]=b}.bind(b))}
function sg(b,c,d,e,f,g,h,k){var l=c;c=Nf(b.l,c);var m,r="",t;return ag(b,c).then(function(b){m=Tf(this.u,b.data,c);if(1!=m.type)throw new z(2,4,4017);b=m;var f=dg,g=Lf(b.a,"EXT-X-PLAYLIST-TYPE"),h=Lf(b.a,"EXT-X-ENDLIST");h=g&&"VOD"==g.value||h;g=g&&"EVENT"==g.value&&!h;g=!h&&!g;h?hg(this,f.pa):(g?hg(this,f.ic):hg(this,f.Yc),b=ug(b.a,"EXT-X-TARGETDURATION"),b=Number(b.value),this.g=Math.max(b,this.g),this.A=Math.min(b,this.A));if(1==d.length)r=d[0];else if(b=mg(e,d),null!=b)r=b;else throw new z(2,
4,4025,d);return vg(this,e,r,m)}.bind(b)).then(function(b){t=b;b=Lf(m.a,"EXT-X-MEDIA-SEQUENCE");return gg(this,m,b?Number(b.value):0,t,r)}.bind(b)).then(function(b){var c=b[0].startTime,d=b[b.length-1].endTime,u=d-c;b=new U(b);var Wa=wg(m),fg=void 0;"text"==e&&(fg="subtitle");var Kd=[];m.segments.forEach(function(b){b=Kf(b.a,"EXT-X-KEY");Kd.push.apply(Kd,b)});var Ld=!1,Md=[],Lb=null;Kd.forEach(function(b){if("NONE"!=jg(b,"METHOD")){Ld=!0;var c=jg(b,"KEYFORMAT");if(b=(c=xg[c])?c(b):null)b.keyIds.length&&
(Lb=b.keyIds[0]),Md.push(b)}});if(Ld&&!Md.length)throw new z(2,4,4026);Wa={id:this.K++,createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:b.find.bind(b),getSegmentReference:b.get.bind(b),initSegmentReference:Wa,presentationTimeOffset:0,mimeType:t,codecs:r,kind:fg,encrypted:Ld,keyId:Lb,language:f,label:h||null,type:e,primary:g,trickModeVideo:null,containsEmsgBoxes:!1,frameRate:void 0,width:void 0,height:void 0,bandwidth:void 0,roles:[],channelsCount:k};this.T[Wa.id]=b;return{stream:Wa,
gb:b,drmInfos:Md,$b:l,Sb:c,Ed:d,duration:u}}.bind(b))}function wg(b){var c=Kf(b.a,"EXT-X-MAP");if(!c.length)return null;if(1<c.length)throw new z(2,4,4020);c=c[0];var d=jg(c,"URI"),e=Nf(b.uri,d);b=0;d=null;if(c=If(c,"BYTERANGE"))b=c.split("@"),c=Number(b[0]),b=Number(b[1]),d=b+c-1;return new P(function(){return[e]},b,d)}
function yg(b,c,d,e,f){var g=d.a,h=Nf(b.uri,d.uri);b=ug(g,"EXTINF").value.split(",");b=f+Number(b[0]);d=0;var k=null;if(g=Lf(g,"EXT-X-BYTERANGE"))d=g.value.split("@"),g=Number(d[0]),d=d[1]?Number(d[1]):c.a+1,k=d+g-1;return new Q(e,f,b,function(){return[h]},d,k)}
function gg(b,c,d,e,f){var g=c.segments,h=[],k=Nf(c.uri,g[0].uri),l=yg(c,null,g[0],d,0),m=wg(c);return zg(b,c.uri,m,l,e,f).then(function(b){k.split("/").pop();for(var e=0;e<g.length;++e){var f=h[h.length-1];f=yg(c,f,g[e],d+e,0==e?b:f.endTime);h.push(f)}return h}.bind(b))}
function Ag(b,c){var d=b.c.networkingEngine,e=qb(c.c(),b.h.retryParameters),f={},g=c.b;f.Range="bytes="+g+"-"+(g+2048-1);var h={};if(0!=g||null!=c.a)g="bytes="+g+"-",null!=c.a&&(g+=c.a),h.Range=g;e.headers=f;f=d.request(1,e);nb(b.o,f);return f.promise["catch"](function(){Ea("Unable to fetch a partial HLS segment! Falling back to a full segment request, which is expensive!  Your server should support Range requests and CORS preflights.",e.uris[0]);e.headers=h;return d.request(1,e)})}
function zg(b,c,d,e,f,g){if(b.m&&(c=b.a[c].gb.get(e.position)))return Promise.resolve(c.startTime);e=[Ag(b,e)];if("video/mp4"==f||"audio/mp4"==f)d?e.push(Ag(b,d)):e.push(e[0]);return Promise.all(e).then(function(b){if("video/mp4"==f||"audio/mp4"==f)return Bg(b[0].data,b[1].data);if("audio/mpeg"==f)return 0;if("video/mp2t"==f)return Cg(b[0].data);if("application/mp4"==f||0==f.indexOf("text/")){b=b[0].data;var c=Kb(f,g);if(J[c]){var d=new Oc(null);d.f=new J[c];b=d.Mb(b)}else b=0;return b}throw new z(2,
4,4030);}.bind(b))}function Bg(b,c){var d=0;(new S).D("moov",T).D("trak",T).D("mdia",T).Y("mdhd",function(b){b.s.F(0==b.version?8:16);d=b.s.C();b.ra.stop()}).parse(c,!0);if(!d)throw new z(2,4,4030);var e=0,f=!1;(new S).D("moof",T).D("traf",T).Y("tfdt",function(b){e=(0==b.version?b.s.C():b.s.Sa())/d;f=!0;b.ra.stop()}).parse(b,!0);if(!f)throw new z(2,4,4030);return e}
function Cg(b){function c(){throw new z(2,4,4030);}b=new R(new DataView(b),0);for(var d=0,e=0;;)if(d=b.W(),e=b.ca(),71!=e&&c(),b.eb()&16384||c(),e=(b.ca()&48)>>4,0!=e&&2!=e||c(),3==e&&(e=b.ca(),b.F(e)),1!=b.C()>>8)b.seek(d+188),e=b.ca(),71!=e&&(b.seek(d+192),e=b.ca()),71!=e&&(b.seek(d+204),e=b.ca()),71!=e&&c(),b.Oc(1);else return b.F(3),d=b.ca()>>6,0!=d&&1!=d||c(),0==b.ca()&&c(),d=b.ca(),e=b.eb(),b=b.eb(),(1073741824*((d&14)>>1)+((e&65534)<<14|(b&65534)>>1))/9E4}
function mg(b,c){for(var d=Dg[b],e=0;e<d.length;e++)for(var f=0;f<c.length;f++)if(d[e].test(c[f].trim()))return c[f].trim();return"text"==b?"":null}
function vg(b,c,d,e){e=Nf(e.uri,e.segments[0].uri);var f=(new Ia(e)).aa.split(".").pop(),g=Eg[c][f];if(g)return Promise.resolve(g);if("text"==c)return d&&"vtt"!=d?Promise.resolve("application/mp4"):Promise.resolve("text/vtt");c=qb([e],b.h.retryParameters);c.method="HEAD";c=b.c.networkingEngine.request(1,c);nb(b.o,c);return c.promise.then(function(b){b=b.headers["content-type"];if(!b)throw new z(2,4,4021,f);return b.split(";")[0]})}
function jg(b,c){var d=b.getAttribute(c);if(!d)throw new z(2,4,4023,c);return d.value}function ug(b,c){var d=Lf(b,c);if(!d)throw new z(2,4,4024,c);return d}function ag(b,c){var d=b.c.networkingEngine.request(0,qb([c],b.h.retryParameters));nb(b.o,d);return d.promise}
var Dg={audio:[/^vorbis$/,/^opus$/,/^flac$/,/^mp4a/,/^[ae]c-3$/],video:[/^avc/,/^hev/,/^hvc/,/^vp0?[89]/,/^av1$/],text:[/^vtt$/,/^wvtt/,/^stpp/]},Eg={audio:{mp4:"audio/mp4",m4s:"audio/mp4",m4i:"audio/mp4",m4a:"audio/mp4",ts:"video/mp2t"},video:{mp4:"video/mp4",m4s:"video/mp4",m4i:"video/mp4",m4v:"video/mp4",ts:"video/mp2t"},text:{mp4:"application/mp4",m4s:"application/mp4",m4i:"application/mp4",vtt:"text/vtt",ttml:"application/ttml+xml"}};
Zf.prototype.M=function(){this.c&&(this.j=null,this.update().then(function(){cg(this,this.i)}.bind(this))["catch"](function(b){this.c&&(b.severity=1,this.c.onError(b),cg(this,0))}.bind(this)))};function cg(b,c){null!=b.i&&null!=c&&(b.j=window.setTimeout(b.M.bind(b),1E3*c))}function hg(b,c){b.f=c;b.b&&b.b.Bb(b.f==dg.pa);b.f==dg.pa&&null!=b.j&&(window.clearTimeout(b.j),b.j=null,b.i=null)}
var xg={"urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed":function(b){var c=jg(b,"METHOD");if("SAMPLE-AES-CENC"!=c&&"SAMPLE-AES-CTR"!=c)return null;c=jg(b,"URI");c=Yf.parse(c);c=new Uint8Array(c.data);c=Fb("com.widevine.alpha",[{initDataType:"cenc",initData:c}]);if(b=If(b,"KEYID"))c.keyIds=[b.substr(2).toLowerCase()];return c}},$f="VOD",dg={pa:$f,Yc:"EVENT",ic:"LIVE"};nf.m3u8=Zf;mf["application/x-mpegurl"]=Zf;mf["application/vnd.apple.mpegurl"]=Zf;function Fg(b,c,d,e){this.a=b;this.u=c;this.o=d;this.v=e;this.h=new D;this.b=null;this.g=!1;this.m=b.readyState;this.c=!1;this.j=this.A=-1;this.f=this.i=!1;c=this.l.bind(this);E(this.h,b,"waiting",c);this.b=new Rb(c);Tb(this.b,.25)}Fg.prototype.destroy=function(){var b=this.h.destroy();this.v=this.u=this.a=this.h=null;null!=this.b&&(this.b.cancel(),this.b=null);return b};Fg.prototype.cb=function(){this.f=!0;this.l()};
Fg.prototype.l=function(){if(0!=this.a.readyState){if(this.a.seeking){if(!this.g)return}else this.g=!1;if(!this.a.paused){this.a.readyState!=this.m&&(this.c=!1,this.m=this.a.readyState);var b=this.o.smallGapLimit,c=this.a.currentTime,d=this.a.buffered;a:{if(d&&d.length&&!(1==d.length&&1E-6>d.end(0)-d.start(0))){var e=.1;/(Edge\/|Trident\/|Tizen)/.test(navigator.userAgent)&&(e=.5);for(var f=0;f<d.length;f++)if(d.start(f)>c&&(0==f||d.end(f-1)-c<=e)){e=f;break a}}e=null}if(null==e){if(d=this.a.currentTime,
c=this.a.buffered,3>this.a.readyState&&0<this.a.playbackRate)if(this.j!=d)this.j=d,this.A=Date.now(),this.i=!1;else if(!this.i&&this.A<Date.now()-1E3)for(e=0;e<c.length;e++)if(d>=c.start(e)&&d<c.end(e)-.5){this.a.currentTime+=.1;this.j=this.a.currentTime;this.i=!0;break}}else if(0!=e||this.f){f=d.start(e);var g=this.u.presentationTimeline.la();if(!(f>=g)){g=f-c;b=g<=b;var h=!1;.001>g||(b||this.c||(this.c=!0,c=new F("largegap",{currentTime:c,gapSize:g}),c.cancelable=!0,this.v(c),this.o.jumpLargeGaps&&
!c.defaultPrevented&&(h=!0)),!b&&!h)||(0!=e&&d.end(e-1),this.a.currentTime=f)}}}}};function Gg(b,c,d){this.a=b;this.i=c;this.h=d;this.c=new D;this.f=1;this.g=!1;this.b=null;0<b.readyState?this.Dc():yb(this.c,b,"loadedmetadata",this.Dc.bind(this));E(this.c,b,"ratechange",this.Vd.bind(this))}n=Gg.prototype;n.destroy=function(){var b=this.c.destroy();this.c=null;null!=this.b&&(this.b.cancel(),this.b=null);this.i=this.a=null;return b};function Hg(b){return 0<b.a.readyState?b.a.currentTime:b.h}function Ig(b,c){0<b.a.readyState?Jg(b,b.a.currentTime,c):(b.h=c,setTimeout(b.i,0))}n.Xa=function(){return this.f};
function Kg(b,c){null!=b.b&&(b.b.cancel(),b.b=null);b.f=c;b.a.playbackRate=b.g||0>c?0:c;!b.g&&0>c&&(b.b=new Rb(function(){b.a.currentTime+=c/4}),Tb(b.b,.25))}n.Vd=function(){var b=this.g||0>this.f?0:this.f;this.a.playbackRate&&this.a.playbackRate!=b&&Kg(this,this.a.playbackRate)};n.Dc=function(){.001>Math.abs(this.a.currentTime-this.h)?this.Ec():(yb(this.c,this.a,"seeking",this.Ec.bind(this)),this.a.currentTime=0==this.a.currentTime?this.h:this.a.currentTime)};
n.Ec=function(){var b=this;E(this.c,this.a,"seeking",function(){return b.i()})};function Jg(b,c,d){function e(){!b.a||10<=f++||b.a.currentTime!=c||(b.a.currentTime=d,setTimeout(e,100))}b.a.currentTime=d;var f=0;setTimeout(e,100)};function Lg(b,c,d,e,f,g){this.c=b;this.b=c;this.h=d;this.i=f;this.f=null;this.g=new Fg(b,c,d,g);c=this.Xd.bind(this);d=this.b.presentationTimeline;null==e?e=Infinity>d.S()?d.Ka():d.la():0>e&&(e=d.la()+e);e=Mg(this,Ng(this,e));this.a=new Gg(b,c,e);this.f=new Rb(this.Ud.bind(this));Tb(this.f,.25)}n=Lg.prototype;n.destroy=function(){var b=Promise.all([this.a.destroy(),this.g.destroy()]);this.g=this.a=null;null!=this.f&&(this.f.cancel(),this.f=null);this.i=this.h=this.b=this.c=null;return b};
function Og(b){var c=Hg(b.a);0<b.c.readyState&&(b.c.paused||(c=Ng(b,c)));return c}n.Xa=function(){return this.a.Xa()};n.cb=function(){this.g.cb()};n.Ud=function(){if(0!=this.c.readyState&&!this.c.paused){var b=this.c.currentTime,c=this.b.presentationTimeline,d=c.Ka();c=c.la();3>c-d&&(d=c-3);b<d&&(b=Pg(this,b),this.c.currentTime=b)}};n.Xd=function(){var b=this.g;b.g=!0;b.f=!1;b.c=!1;b=Hg(this.a);var c=Pg(this,b);.001<Math.abs(c-b)?Ig(this.a,c):this.i()};
function Mg(b,c){var d=b.b.presentationTimeline.S();return c>=d?d-b.h.durationBackoff:c}function Pg(b,c){var d=sc.bind(null,b.c.buffered),e=Math.max(b.b.minBufferTime||0,b.h.rebufferingGoal),f=b.b.presentationTimeline,g=f.Ka(),h=f.la(),k=f.S();3>h-g&&(g=h-3);var l=f.Ya(e),m=f.Ya(5);e=f.Ya(e+5);return c>=k?Mg(b,c):c>h?h:c<g?d(m)?m:e:c>=l||d(c)?c:e}function Ng(b,c){var d=b.b.presentationTimeline.Ka();if(c<d)return d;d=b.b.presentationTimeline.la();return c>d?d:c};function Qg(b,c,d,e,f,g,h){this.a=b;this.v=c;this.g=d;this.u=e;this.l=f;this.h=g;this.A=h;this.c=[];this.j=new D;this.b=!1;this.i=-1;this.f=null;Rg(this)}Qg.prototype.destroy=function(){var b=this.j?this.j.destroy():Promise.resolve();this.j=null;Sg(this);this.A=this.h=this.l=this.u=this.g=this.v=this.a=null;this.c=[];return b};
Qg.prototype.o=function(b){if(!this.c.some(function(c){return c.info.schemeIdUri==b.schemeIdUri&&c.info.startTime==b.startTime&&c.info.endTime==b.endTime})){var c={info:b,status:1};this.c.push(c);var d=new F("timelineregionadded",{detail:Tg(b)});this.h(d);this.m(!0,c)}};function Tg(b){var c=kb(b);c.eventElement=b.eventElement;return c}
Qg.prototype.m=function(b,c){var d=c.info.startTime>this.a.currentTime?1:c.info.endTime<this.a.currentTime?3:2,e=2==c.status,f=2==d;if(d!=c.status){if(!b||e||f)e||this.h(new F("timelineregionenter",{detail:Tg(c.info)})),f||this.h(new F("timelineregionexit",{detail:Tg(c.info)}));c.status=d}};function Rg(b){Sg(b);b.f=window.setTimeout(b.H.bind(b),250)}function Sg(b){b.f&&(window.clearTimeout(b.f),b.f=null)}
Qg.prototype.H=function(){this.f=null;Rg(this);var b=Bd(this.g,this.a.currentTime);b!=this.i&&(-1!=this.i&&this.A(),this.i=b);b=tc(this.a.buffered,this.a.currentTime);var c=rc(this.a.buffered),d=this.g.presentationTimeline,e=d.La();c=d.P()&&c>=e;d=this.v;d=d.g?"ended"==d.g.readyState:!0;c=c||this.a.ended||d;this.b?(d=Math.max(this.g.minBufferTime||0,this.u.rebufferingGoal),(c||b>=d)&&0!=this.b&&(this.b=!1,this.l(!1))):!c&&.5>b&&1!=this.b&&(this.b=!0,this.l(!0));this.c.forEach(this.m.bind(this,!1))};function Ug(b,c){this.a=c;this.b=b;this.h=null;this.j=1;this.m=Promise.resolve();this.g=[];this.i={};this.c={};this.o=!1;this.A=null;this.v=this.f=this.l=!1;this.u=0}n=Ug.prototype;n.destroy=function(){for(var b in this.c)Vg(this.c[b]);this.h=this.c=this.i=this.g=this.m=this.b=this.a=null;this.f=!0;return Promise.resolve()};
n.configure=function(b){this.h=b;this.A=new Xa({maxAttempts:Math.max(b.retryParameters.maxAttempts,2),baseDelay:b.retryParameters.baseDelay,backoffFactor:b.retryParameters.backoffFactor,fuzzFactor:b.retryParameters.fuzzFactor,timeout:0},!0)};n.init=function(){var b=Og(this.a.Qa);b=this.a.yc(this.b.periods[Bd(this.b,b)]);return b.variant||b.text?Wg(this,b).then(function(){!this.f&&this.a&&this.a.Ld&&this.a.Ld()}.bind(this)):Promise.reject(new z(2,5,5005))};
function W(b){var c=Og(b.a.Qa);return b.b.periods[Bd(b.b,c)]}function Xg(b){var c=b.c.video||b.c.audio;return c?b.b.periods[c.Ca]:null}function Yg(b){return Zg(b,"audio")}function $g(b){return Zg(b,"video")}function Zg(b,c){var d=b.c[c];return d?d.sa||d.stream:null}
function ah(b,c,d){Zc(b.a.J,"text");b.u++;b.v=!1;var e=b.u;return b.a.J.init({text:c},!1).then(function(){return bh(b,[c])}).then(function(){if(!b.f&&d&&b.u==e&&!b.c.text&&!b.v){var f=Og(b.a.Qa);b.c.text=ch(c,Bd(b.b,f));dh(b,b.c.text,0)}})}function eh(b){b.v=!0;b.c.text&&(Vg(b.c.text),delete b.c.text)}function fh(b,c){var d=b.c.video;if(d){var e=d.stream;if(e)if(c){var f=e.trickModeVideo;f&&!d.sa&&(gh(b,f,!1),d.sa=e)}else if(e=d.sa)d.sa=null,gh(b,e,!0)}}
function hh(b,c,d){c.video&&gh(b,c.video,d);c.audio&&gh(b,c.audio,d)}function gh(b,c,d){var e=b.c[c.type];if(!e&&"text"==c.type&&b.h.ignoreTextStreamFailures)ah(b,c,!0);else if(e){var f=Cd(b.b,c);d&&f!=e.Ca?ih(b):(e.sa&&(c.trickModeVideo?(e.sa=c,c=c.trickModeVideo):e.sa=null),(f=b.g[f])&&f.Ta&&(f=b.i[c.id])&&f.Ta&&e.stream!=c&&("text"==c.type&&Sc(b.a.J,Kb(c.mimeType,c.codecs)),e.stream=c,e.xb=!0,d&&(e.za?e.Cb=!0:e.Da?(e.va=!0,e.Cb=!0):(Vg(e),jh(b,e,!0)))))}}
function kh(b){var c=Og(b.a.Qa);Object.keys(b.c).every(function(b){var d=this.a.J;"text"==b?(b=d.a,b=c>=b.a&&c<b.b):(b=Uc(d,b),b=sc(b,c));return b}.bind(b))||ih(b)}function ih(b){for(var c in b.c){var d=b.c[c];d.za||d.va||(d.Da?d.va=!0:null==Tc(b.a.J,c)?null==d.ua&&dh(b,d,0):(Vg(d),jh(b,d,!1)))}}
function Wg(b,c,d){var e=Og(b.a.Qa),f=Bd(b.b,e),g={},h=[];c.variant&&c.variant.audio&&(g.audio=c.variant.audio,h.push(c.variant.audio));c.variant&&c.variant.video&&(g.video=c.variant.video,h.push(c.variant.video));c.text&&(g.text=c.text,h.push(c.text));return b.a.J.init(g,b.h.forceTransmuxTS).then(function(){if(!b.f){var c=b.b.presentationTimeline.S();Infinity>c?b.a.J.ja(c):b.a.J.ja(Math.pow(2,32));return bh(b,h)}}).then(function(){if(!b.f)for(var c in g){var e=g[c];b.c[c]||(b.c[c]=ch(e,f,d),dh(b,
b.c[c],0))}})}function ch(b,c,d){return{stream:b,type:b.type,Ma:null,ma:null,sa:null,xb:!0,Ca:c,endOfStream:!1,Da:!1,ua:null,va:!1,Cb:!1,za:!1,Zb:!1,$a:!1,Mc:d||0}}
function lh(b,c){var d=b.g[c];if(d)return d.promise;d={promise:new A,Ta:!1};b.g[c]=d;var e=b.b.periods[c].variants.map(function(b){var c=[];b.audio&&c.push(b.audio);b.video&&c.push(b.video);b.video&&b.video.trickModeVideo&&c.push(b.video.trickModeVideo);return c}).reduce(Ab,[]).filter(Db);e.push.apply(e,b.b.periods[c].textStreams);b.m=b.m.then(function(){if(!this.f)return bh(this,e)}.bind(b)).then(function(){this.f||(this.g[c].promise.resolve(),this.g[c].Ta=!0)}.bind(b))["catch"](function(b){this.f||
(this.g[c].promise["catch"](function(){}),this.g[c].promise.reject(),delete this.g[c],this.a.onError(b))}.bind(b));return d.promise}
function bh(b,c){c.map(function(b){return b.id}).filter(Db);for(var d=[],e=0;e<c.length;++e){var f=c[e],g=b.i[f.id];g?d.push(g.promise):(b.i[f.id]={promise:new A,Ta:!1},d.push(f.createSegmentIndex()))}return Promise.all(d).then(function(){if(!this.f)for(var b=0;b<c.length;++b){var d=this.i[c[b].id];d.Ta||(d.promise.resolve(),d.Ta=!0)}}.bind(b))["catch"](function(b){if(!this.f){for(var d=0;d<c.length;d++)this.i[c[d].id].promise["catch"](function(){}),this.i[c[d].id].promise.reject(),delete this.i[c[d].id];
return Promise.reject(b)}}.bind(b))}n.Re=function(b){if(!this.f&&!b.Da&&null!=b.ua&&!b.za)if(b.ua=null,b.va)jh(this,b,b.Cb);else{try{var c=mh(this,b);null!=c&&(dh(this,b,c),b.$a=!1)}catch(d){nh(this,d);return}c=G(this.c);oh(this,b);c.every(function(b){return b.endOfStream})&&this.a.J.endOfStream().then(function(){if(!this.f){var b=this.a.J.S();b<this.b.presentationTimeline.S()&&this.b.presentationTimeline.ja(b)}}.bind(this))}};
function mh(b,c){var d=Og(b.a.Qa),e=ph(b,c,d),f=Cd(b.b,c.stream),g=Bd(b.b,e),h=Wc(b.a.J,c.type,d),k=Math.max(b.j*Math.max(b.b.minBufferTime||0,b.h.rebufferingGoal),b.j*b.h.bufferingGoal);if(e>=b.b.presentationTimeline.S())return c.endOfStream=!0,null;c.endOfStream=!1;c.Ca=g;if(g!=f)return null;if(h>=k)return.5;g=Vc(b.a.J,c.type);g=qh(b,c,d,g,f);if(!g)return 1;var l=Infinity;G(b.c).forEach(function(c){l=Math.min(l,ph(b,c,d))});if(e>=l+b.b.presentationTimeline.a)return 1;c.Mc=0;rh(b,c,d,f,g);return null}
function ph(b,c,d){return c.Ma&&c.ma?b.b.periods[Cd(b.b,c.Ma)].startTime+c.ma.endTime:Math.max(d,c.Mc)}function qh(b,c,d,e,f){if(c.ma&&c.stream==c.Ma)return sh(b,c,f,c.ma.position+1);d=c.ma?c.stream.findSegmentPosition(Math.max(0,b.b.periods[Cd(b.b,c.Ma)].startTime+c.ma.endTime-b.b.periods[f].startTime)):c.stream.findSegmentPosition(Math.max(0,(e||d)-b.b.periods[f].startTime));if(null==d)return null;var g=null;null==e&&(g=sh(b,c,f,Math.max(0,d-1)));return g||sh(b,c,f,d)}
function sh(b,c,d,e){d=b.b.periods[d];c=c.stream.getSegmentReference(e);if(!c)return null;e=b.b.presentationTimeline;b=e.Za();e=e.La();return d.startTime+c.endTime<b||d.startTime+c.startTime>e?null:c}
function rh(b,c,d,e,f){var g=b.b.periods[e],h=c.stream,k=b.b.presentationTimeline.S(),l=b.b.periods[e+1];e=th(b,c,e,Math.max(0,g.startTime-.1),l?l.startTime:k);c.Da=!0;c.xb=!1;k=uh(b,f);Promise.all([e,k]).then(function(b){if(!this.f&&!this.l)return vh(this,c,d,g,h,f,b[1])}.bind(b)).then(function(){this.f||this.l||(c.Da=!1,c.Zb=!1,c.va||this.a.cb(),dh(this,c,0),wh(this,h))}.bind(b))["catch"](function(b){this.f||this.l||(c.Da=!1,"text"==c.type&&this.h.ignoreTextStreamFailures?delete this.c.text:3017==
b.code?xh(this,c,b):(c.$a=!0,b.severity=2,nh(this,b)))}.bind(b))}function xh(b,c,d){if(!G(b.c).some(function(b){return b!=c&&b.Zb})){var e=Math.round(100*b.j);if(20<e)b.j-=.2;else if(4<e)b.j-=.04;else{c.$a=!0;b.l=!0;b.a.onError(d);return}c.Zb=!0}dh(b,c,4)}
function th(b,c,d,e,f){if(!c.xb)return Promise.resolve();d=$c(b.a.J,c.type,b.b.periods[d].startTime-c.stream.presentationTimeOffset,e,f);if(!c.stream.initSegmentReference)return d;b=uh(b,c.stream.initSegmentReference).then(function(b){if(!this.f)return Xc(this.a.J,c.type,b,null,null)}.bind(b))["catch"](function(b){c.xb=!0;return Promise.reject(b)});return Promise.all([d,b])}
function vh(b,c,d,e,f,g,h){f.containsEmsgBoxes&&(new S).Y("emsg",b.he.bind(b,e,g)).parse(h);return yh(b,c,d).then(function(){if(!this.f)return Xc(this.a.J,c.type,h,g.startTime,g.endTime)}.bind(b)).then(function(){if(!this.f)return c.Ma=f,c.ma=g,Promise.resolve()}.bind(b))}
n.he=function(b,c,d){var e=d.s.Xb(),f=d.s.Xb(),g=d.s.C(),h=d.s.C(),k=d.s.C(),l=d.s.C();d=d.s.Ea(d.s.G.byteLength-d.s.W());b=b.startTime+c.startTime+h/g;if("urn:mpeg:dash:event:2012"==e)this.a.Nd();else this.a.onEvent(new F("emsg",{detail:{startTime:b,endTime:b+k/g,schemeIdUri:e,value:f,timescale:g,presentationTimeDelta:h,eventDuration:k,id:l,messageData:d}}))};
function yh(b,c,d){var e=Math.max(b.h.bufferBehind,b.b.presentationTimeline.a),f=Tc(b.a.J,c.type);if(null==f)return Promise.resolve();d=d-f-e;return 0>=d?Promise.resolve():b.a.J.remove(c.type,f,f+d).then(function(){}.bind(b))}function wh(b,c){if(!b.o&&(b.o=G(b.c).every(function(b){return"text"==b.type?!0:!b.va&&!b.za&&b.ma}),b.o)){var d=Cd(b.b,c);b.g[d]||lh(b,d).then(function(){this.f||this.a.xc()}.bind(b))["catch"](Bb);for(d=0;d<b.b.periods.length;++d)lh(b,d)["catch"](Bb);b.a.$d&&b.a.$d()}}
function oh(b,c){if(c.Ca!=Cd(b.b,c.stream)){var d=c.Ca,e=G(b.c);e.every(function(b){return b.Ca==d})&&e.every(zh)&&lh(b,d).then(function(){if(!this.f&&e.every(function(b){var c=Cd(this.b,b.stream);return zh(b)&&b.Ca==d&&c!=d}.bind(this))){var b=this.b.periods[d],c=this.a.yc(b),h={};c.variant&&c.variant.video&&(h.video=c.variant.video);c.variant&&c.variant.audio&&(h.audio=c.variant.audio);c.text&&(h.text=c.text);for(var k in this.c)if(!h[k]&&"text"!=k){this.a.onError(new z(2,5,5005));return}for(var l in h)if(!this.c[l])if("text"==
l)Wg(this,{text:h.text},b.startTime),delete h[l];else{this.a.onError(new z(2,5,5005));return}for(var m in this.c)(b=h[m])?(gh(this,b,!1),dh(this,this.c[m],0)):delete this.c[m];this.a.xc()}}.bind(b))["catch"](Bb)}}function zh(b){return!b.Da&&null==b.ua&&!b.va&&!b.za}function uh(b,c){var d=qb(c.c(),b.h.retryParameters);if(0!=c.b||null!=c.a){var e="bytes="+c.b+"-";null!=c.a&&(e+=c.a);d.headers.Range=e}return b.a.Oa.request(1,d).promise.then(function(b){return b.data})}
function jh(b,c,d){c.va=!1;c.Cb=!1;c.za=!0;Zc(b.a.J,c.type).then(function(){if(!this.f&&d)return this.a.J.flush(c.type)}.bind(b)).then(function(){this.f||(c.Ma=null,c.ma=null,c.za=!1,c.endOfStream=!1,dh(this,c,0))}.bind(b))}function dh(b,c,d){c.ua=window.setTimeout(b.Re.bind(b,c),1E3*d)}function Vg(b){null!=b.ua&&(window.clearTimeout(b.ua),b.ua=null)}function nh(b,c){Za(b.A).then(function(){this.f||(this.a.onError(c),c.handled||this.h.failureCallback(c))}.bind(b))};function Ah(b,c,d,e,f,g){if(200<=d&&299>=d&&202!=d)return f&&(e=f),{uri:e,data:c,headers:b,fromCache:!!b["x-shaka-from-cache"]};f=null;try{f=Pb(c)}catch(h){}throw new z(401==d||403==d?2:1,1,1001,e,d,f,b,g);};function Bh(b,c,d){var e=new Bh.b;Jb(c.headers,function(b,c){e.append(b,c)});var f=new Bh.a,g={body:c.body||void 0,headers:e,method:c.method,signal:f.signal,credentials:c.allowCrossSiteCredentials?"include":void 0},h=!1,k=!1,l;c.retryParameters.timeout&&(l=setTimeout(function(){k=!0;f.abort()},c.retryParameters.timeout));c=Bh.c;g=c(b,g).then(function(c){clearTimeout(l);return c.arrayBuffer().then(function(e){var f={};c.headers.forEach(function(b,c){f[c.trim()]=b});return Ah(f,e,c.status,b,c.url,d)})})["catch"](function(c){clearTimeout(l);
return h?Promise.reject(new z(1,1,7001,b,d)):k?Promise.reject(new z(1,1,1003,b,d)):void 0==c.severity?Promise.reject(new z(1,1,1002,b,c,d)):Promise.reject(c)});return new B(g,function(){h=!0;f.abort();return Promise.resolve()})}x("shaka.net.HttpFetchPlugin",Bh);Bh.isSupported=function(){return!(!window.fetch||!window.AbortController)};Bh.isSupported=Bh.isSupported;Bh.c=window.fetch;Bh.a=window.AbortController;Bh.b=window.Headers;Bh.isSupported()&&(pb("http",Bh,2),pb("https",Bh,2));function Ch(b,c,d){var e=new Ch.f,f=new Promise(function(f,h){e.open(c.method,b,!0);e.responseType="arraybuffer";e.timeout=c.retryParameters.timeout;e.withCredentials=c.allowCrossSiteCredentials;e.onabort=function(){h(new z(1,1,7001,b,d))};e.onload=function(c){c=c.target;var e=c.getAllResponseHeaders().trim().split("\r\n").reduce(function(b,c){var d=c.split(": ");b[d[0].toLowerCase()]=d.slice(1).join(": ");return b},{});try{var g=Ah(e,c.response,c.status,b,c.responseURL,d);f(g)}catch(t){h(t)}};e.onerror=
function(c){h(new z(1,1,1002,b,c,d))};e.ontimeout=function(){h(new z(1,1,1003,b,d))};for(var g in c.headers)e.setRequestHeader(g.toLowerCase(),c.headers[g]);e.send(c.body)});return new B(f,function(){e.abort();return Promise.resolve()})}x("shaka.net.HttpXHRPlugin",Ch);Ch.f=window.XMLHttpRequest;pb("http",Ch,1);pb("https",Ch,1);function Dh(b){this.a={};this.c=Promise.resolve();this.h=!1;this.i=b;this.f=this.b=this.g=0}Dh.prototype.destroy=function(){this.h=!0;var b=this.c["catch"](function(){});this.c=Promise.resolve();return b};function Eh(b,c,d,e,f){b.a[c]=b.a[c]||[];b.a[c].push({request:d,nc:e,Hd:f})}
function Fh(b,c){var d=G(b.a);b.a={};d.forEach(function(c){c.forEach(function(c){b.b+=c.nc})});var e=Promise.resolve().then(function(){Gh(b);return Promise.all(d.map(function(d){return Hh(b,c,d)}))});b.c=b.c.then(function(){return e});return e}function Hh(b,c,d){var e=Promise.resolve();d.forEach(function(d){e=e.then(function(){Gh(b);return Ih(b,c,d)})});return e}
function Ih(b,c,d){return Promise.resolve().then(function(){Gh(b);return c.request(1,d.request).promise}).then(function(c){Gh(b);b.g+=d.nc;b.f+=c.data.byteLength;b.i(b.b?b.g/b.b:0,b.f);return d.Hd(c.data)})}function Gh(b){if(b.h)throw new z(2,9,7001);};function Jh(b,c){var d=this;this.c=b;this.b=b.objectStore(c);this.a=new A;b.onabort=function(b){b.preventDefault();d.a.reject()};b.onerror=function(b){b.preventDefault();d.a.reject()};b.oncomplete=function(){d.a.resolve()}}Jh.prototype.abort=function(){try{this.c.abort()}catch(b){}return this.a["catch"](function(){})};Jh.prototype.store=function(){return this.b};Jh.prototype.promise=function(){return this.a};function Kh(b){this.b=b;this.a=[]}Kh.prototype.destroy=function(){return Promise.all(this.a.map(function(b){return b.abort()}))};function Lh(b,c){return Mh(b,c,"readwrite")}function Mh(b,c,d){d=b.b.transaction([c],d);var e=new Jh(d,c);b.a.push(e);e.promise().then(function(){hb(b.a,e)},function(){hb(b.a,e)});return e};function Nh(){this.a={}}Nh.prototype.destroy=function(){var b=G(this.a).map(function(b){return b.destroy()});this.a={};return Promise.all(b)};Nh.prototype.init=function(){var b=this;Jb(Oh,function(c,e){var d=e();d&&(b.a[c]=d)});var c=G(this.a).map(function(b){return b.init()});return Promise.all(c)};
function Ph(b){var c=null;Jb(b.a,function(b,e){Jb(e.getCells(),function(d,e){e.hasFixedKeySpace()||c||(c={path:{$:b,O:d},O:e})})});if(c)return c;throw new z(2,9,9013,"Could not find a cell that supports add-operations");}function Qh(b,c){Jb(b.a,function(b,e){Jb(e.getCells(),function(d,e){c({$:b,O:d},e)})})}function Rh(b,c,d){b=b.a[c];if(!b)throw new z(2,9,9013,"Could not find mechanism with name "+c);c=b.getCells()[d];if(!c)throw new z(2,9,9013,"Could not find cell with name "+d);return c}
function Sh(b){b=G(b.a).map(function(b){return b.erase()});return Promise.all(b)}x("shaka.offline.StorageMuxer.register",function(b,c){Oh[b]=c});x("shaka.offline.StorageMuxer.unregister",function(b){delete Oh[b]});function Th(){return G(Oh).some(function(b){return(b=b())?(b.destroy(),!0):!1})}var Oh={};function Uh(b){this.a=new Kh(b)}n=Uh.prototype;n.destroy=function(){return this.a.destroy()};n.hasFixedKeySpace=function(){return!0};n.addSegments=function(){return Vh("segment")};n.removeSegments=function(b,c){return Wh(this,"segment",b,c)};n.getSegments=function(b){return Xh(this,"segment",b).then(function(b){return b.map(Yh)})};n.addManifests=function(){return Vh("manifest")};
n.updateManifestExpiration=function(b,c){var d=Lh(this.a,"manifest"),e=d.store(),f=new A;e.get(b).onsuccess=function(d){(d=d.target.result)?(d.expiration=c,e.put(d),f.resolve()):f.reject(new z(2,9,9012,"Could not find values for "+b))};return d.promise().then(function(){return f})};n.removeManifests=function(b,c){return Wh(this,"manifest",b,c)};n.getManifests=function(b){return Xh(this,"manifest",b).then(function(b){return b.map(Zh)})};
n.getAllManifests=function(){var b=Mh(this.a,"manifest","readonly"),c={};b.store().openCursor().onsuccess=function(b){if(b=b.target.result)c[b.key]=Zh(b.value),b["continue"]()};return b.promise().then(function(){return c})};function Vh(b){return Promise.reject(new z(2,9,9011,"Cannot add new value to "+b))}function Wh(b,c,d,e){b=Lh(b.a,c);var f=b.store();d.forEach(function(b){f["delete"](b).onsuccess=function(){return e(b)}});return b.promise()}
function Xh(b,c,d){b=Mh(b.a,c,"readonly");var e=b.store(),f={},g=[];d.forEach(function(b){e.get(b).onsuccess=function(c){c=c.target.result;void 0==c&&g.push(b);f[b]=c}});return b.promise().then(function(){return g.length?Promise.reject(new z(2,9,9012,"Could not find values for "+g)):d.map(function(b){return f[b]})})}
function Zh(b){return{originalManifestUri:b.originalManifestUri,duration:b.duration,size:b.size,expiration:null==b.expiration?Infinity:b.expiration,periods:b.periods.map($h),sessionIds:b.sessionIds,drmInfo:b.drmInfo,appMetadata:b.appMetadata}}function $h(b){ai(b);b.streams.forEach(function(){});return{startTime:b.startTime,streams:b.streams.map(bi)}}
function bi(b){var c=b.Bd?ci(b.Bd):null;return{id:b.id,primary:b.primary,presentationTimeOffset:b.presentationTimeOffset,contentType:b.contentType,mimeType:b.mimeType,codecs:b.codecs,frameRate:b.frameRate,kind:b.kind,language:b.language,label:b.label,width:b.width,height:b.height,initSegmentKey:c,encrypted:b.encrypted,keyId:b.keyId,segments:b.segments.map(di),variantIds:b.variantIds}}function di(b){var c=ci(b.uri);return{startTime:b.startTime,endTime:b.endTime,dataKey:c}}
function Yh(b){return{data:b.data}}function ci(b){var c;if((c=/^offline:[0-9]+\/[0-9]+\/([0-9]+)$/.exec(b))||(c=/^offline:segment\/([0-9]+)$/.exec(b)))return Number(c[1]);throw new z(2,9,9004,"Could not parse uri "+b);}
function ai(b){var c=b.streams.filter(function(b){return"audio"==b.contentType}),d=b.streams.filter(function(b){return"video"==b.contentType});if(!c.every(function(b){return b.variantIds})||!d.every(function(b){return b.variantIds})){c.forEach(function(b){b.variantIds=[]});d.forEach(function(b){b.variantIds=[]});var e=0;if(d.length&&!c.length){var f=e++;d.forEach(function(b){b.variantIds.push(f)})}if(!d.length&&c.length){var g=e++;c.forEach(function(b){b.variantIds.push(g)})}d.length&&c.length&&c.forEach(function(b){d.forEach(function(c){var d=
e++;b.variantIds.push(d);c.variantIds.push(d)})})}};function ei(b,c,d,e){this.a=new Kh(b);this.c=c;this.b=d;this.f=e}n=ei.prototype;n.destroy=function(){return this.a.destroy()};n.hasFixedKeySpace=function(){return this.f};n.addSegments=function(b){return fi(this,this.c,b)};n.removeSegments=function(b,c){return gi(this,this.c,b,c)};n.getSegments=function(b){return hi(this,this.c,b)};n.addManifests=function(b){return fi(this,this.b,b)};
n.updateManifestExpiration=function(b,c){var d=Lh(this.a,this.b),e=d.store();e.get(b).onsuccess=function(d){if(d=d.target.result)d.expiration=c,e.put(d,b)};return d.promise()};n.removeManifests=function(b,c){return gi(this,this.b,b,c)};n.getManifests=function(b){return hi(this,this.b,b)};n.getAllManifests=function(){var b=Mh(this.a,this.b,"readonly"),c={};b.store().openCursor().onsuccess=function(b){if(b=b.target.result)c[b.key]=b.value,b["continue"]()};return b.promise().then(function(){return c})};
function fi(b,c,d){if(b.f)return Promise.reject(new z(1,9,9011,"Cannot add new value to "+c));b=Lh(b.a,c);var e=b.store(),f=[];d.forEach(function(b){e.add(b).onsuccess=function(b){f.push(b.target.result)}});return b.promise().then(function(){return f})}function gi(b,c,d,e){b=Lh(b.a,c);var f=b.store();d.forEach(function(b){f["delete"](b).onsuccess=function(){return e(b)}});return b.promise()}
function hi(b,c,d){b=Mh(b.a,c,"readonly");var e=b.store(),f={},g=[];d.forEach(function(b){var c=e.get(b);c.onsuccess=function(){void 0==c.result&&g.push(b);f[b]=c.result}});return b.promise().then(function(){return g.length?Promise.reject(new z(1,9,9012,"Could not find values for "+g)):d.map(function(b){return f[b]})})};function ii(){this.c=this.b=this.a=this.f=null}
ii.prototype.init=function(){var b=this,c=new A,d=window.indexedDB.open("shaka_offline_db",3);d.onsuccess=function(d){d=d.target.result;b.f=d;var e=d.objectStoreNames;e=e.contains("manifest")&&e.contains("segment")?new Uh(d):null;b.a=e;e=d.objectStoreNames;e=e.contains("manifest-v2")&&e.contains("segment-v2")?new ei(d,"segment-v2","manifest-v2",!0):null;b.b=e;e=d.objectStoreNames;d=e.contains("manifest-v3")&&e.contains("segment-v3")?new ei(d,"segment-v3","manifest-v3",!1):null;b.c=d;c.resolve()};
d.onupgradeneeded=function(b){b=b.target.result;var c={autoIncrement:!0};b.createObjectStore("manifest-v3",c);b.createObjectStore("segment-v3",c)};d.onerror=function(b){c.reject(new z(2,9,9001,d.error));b.preventDefault()};return c};
ii.prototype.destroy=function(){var b=this;return p(function d(){return v(d,function(d){switch(d.B){case 1:if(!b.a){d.X(2);break}return q(d,b.a.destroy(),2);case 2:if(!b.b){d.X(4);break}return q(d,b.b.destroy(),4);case 4:if(!b.c){d.X(6);break}return q(d,b.c.destroy(),6);case 6:b.f&&b.f.close(),d.B=0}})})};ii.prototype.getCells=function(){var b={};this.a&&(b.v1=this.a);this.b&&(b.v2=this.b);this.c&&(b.v3=this.c);return b};
ii.prototype.erase=function(){var b=this;return p(function d(){return v(d,function(d){switch(d.B){case 1:if(!b.a){d.X(2);break}return q(d,b.a.destroy(),2);case 2:if(!b.b){d.X(4);break}return q(d,b.b.destroy(),4);case 4:if(!b.c){d.X(6);break}return q(d,b.c.destroy(),6);case 6:return b.f&&b.f.close(),q(d,ji(),8);case 8:return b.f=null,b.a=null,b.b=null,b.c=null,q(d,b.init(),0)}})})};
function ji(){var b=new A,c=window.indexedDB.deleteDatabase("shaka_offline_db");c.onblocked=function(){};c.onsuccess=function(){b.resolve()};c.onerror=function(d){b.reject(new z(2,9,9001,c.error));d.preventDefault()};return b}Oh.idb=function(){return window.indexedDB?new ii:null};function ki(b,c,d,e){this.a=b;this.g=c;this.f=d;this.c=e;this.b=["offline:",b,"/",c,"/",d,"/",e].join("")}ki.prototype.$=function(){return this.g};ki.prototype.O=function(){return this.f};ki.prototype.key=function(){return this.c};ki.prototype.toString=function(){return this.b};
function li(b){b=/^offline:([a-z]+)\/([^/]+)\/([^/]+)\/([0-9]+)$/.exec(b);if(null==b)return null;var c=b[1];if("manifest"!=c&&"segment"!=c)return null;var d=b[2];if(!d)return null;var e=b[3];return e&&null!=c?new ki(c,d,e,Number(b[4])):null};function mi(b,c){this.b=b;this.a=c}function ni(b,c){var d=new V(null,0);d.ja(c.duration);var e=c.periods.map(function(c){return oi(b,c,d)}),f=c.drmInfo?[c.drmInfo]:[];c.drmInfo&&e.forEach(function(b){b.variants.forEach(function(b){b.drmInfos=f})});return{presentationTimeline:d,minBufferTime:2,offlineSessionIds:c.sessionIds,periods:e}}
function oi(b,c,d){var e=c.streams.filter(function(b){return"audio"==b.contentType}),f=c.streams.filter(function(b){return"video"==b.contentType});e=pi(b,e,f);f=c.streams.filter(function(b){return"text"==b.contentType}).map(function(c){return qi(b,c)});c.streams.forEach(function(c,e){var f=c.segments.map(function(c,d){return ri(b,d,c)});d.bb(f,0==e)});return{startTime:c.startTime,variants:e,textStreams:f}}
function pi(b,c,d){var e={},f=[];f.push.apply(f,c);f.push.apply(f,d);f.forEach(function(b){b.variantIds.forEach(function(b){e[b]=e[b]||{id:b,language:"",primary:!1,audio:null,video:null,bandwidth:0,drmInfos:[],allowedByApplication:!0,allowedByKeySystem:!0}})});c.forEach(function(c){var d=qi(b,c);c.variantIds.forEach(function(b){b=e[b];b.language=d.language;b.primary=b.primary||d.primary;b.audio=d})});d.forEach(function(c){var d=qi(b,c);c.variantIds.forEach(function(b){b=e[b];b.primary=b.primary||
d.primary;b.video=d})});return G(e)}
function qi(b,c){var d=c.segments.map(function(c,d){return ri(b,d,c)}),e=new U(d);d={id:c.id,createSegmentIndex:function(){return Promise.resolve()},findSegmentPosition:function(b){return e.find(b)},getSegmentReference:function(b){return e.get(b)},initSegmentReference:null,presentationTimeOffset:c.presentationTimeOffset,mimeType:c.mimeType,codecs:c.codecs,width:c.width||void 0,height:c.height||void 0,frameRate:c.frameRate||void 0,kind:c.kind,encrypted:c.encrypted,keyId:c.keyId,language:c.language,
label:c.label||null,type:c.contentType,primary:c.primary,trickModeVideo:null,containsEmsgBoxes:!1,roles:[],channelsCount:null};null!=c.initSegmentKey&&(d.initSegmentReference=si(b,c.initSegmentKey));return d}function ri(b,c,d){var e=new ki("segment",b.b,b.a,d.dataKey);return new Q(c,d.startTime,d.endTime,function(){return[e.toString()]},0,null)}function si(b,c){var d=new ki("segment",b.b,b.a,c);return new P(function(){return[d.toString()]},0,null)};function ti(){this.a=null}n=ti.prototype;n.configure=function(){};n.start=function(b){var c=li(b);this.a=c;if(null==c||"manifest"!=c.a)return Promise.reject(new z(2,1,9004,c));var d=new Nh;return lb([d],function(){return p(function f(){var b,h,k,l;return v(f,function(f){switch(f.B){case 1:return q(f,d.init(),2);case 2:return q(f,Rh(d,c.$(),c.O()),3);case 3:return b=f.L,q(f,b.getManifests([c.key()]),4);case 4:return h=f.L,k=h[0],l=new mi(c.$(),c.O()),f["return"](ni(l,k))}})})})};n.stop=function(){return Promise.resolve()};
n.update=function(){};n.onExpirationUpdated=function(b,c){var d=this.a,e=new Nh;return lb([e],function(){return p(function g(){var h,k,l,m,r;return v(g,function(g){switch(g.B){case 1:return q(g,e.init(),2);case 2:return q(g,Rh(e,d.$(),d.O()),3);case 3:return h=g.L,q(g,h.getManifests([d.key()]),4);case 4:k=g.L;l=k[0];m=0<=l.sessionIds.indexOf(b);r=void 0==l.expiration||l.expiration>c;if(m&&r)return q(g,h.updateManifestExpiration(d.key(),c),0);g.X(0)}})})})["catch"](function(){})};
mf["application/x-offline-manifest"]=ti;function ui(b){var c=li(b);return c&&"manifest"==c.a?ui.a(b):c&&"segment"==c.a?ui.b(c.key(),c):$a(new z(2,1,9004,b))}x("shaka.offline.OfflineScheme",ui);ui.a=function(b){b={uri:b,data:new ArrayBuffer(0),headers:{"content-type":"application/x-offline-manifest"}};return bb(b)};
ui.b=function(b,c){var d=new Nh,e=lb([d],function(){return p(function g(){var b,e,l;return v(g,function(g){switch(g.B){case 1:return q(g,d.init(),2);case 2:return q(g,Rh(d,c.$(),c.O()),3);case 3:return b=g.L,q(g,b.getSegments([c.key()]),4);case 4:return e=g.L,l=e[0],g["return"]({uri:c,data:l.data,headers:{}})}})})});return cb(e)};pb("offline",ui);function X(b){this.a=null;this.b=b;for(var c=0;c<b.textTracks.length;++c){var d=b.textTracks[c];d.mode="disabled";"Shaka Player TextTrack"==d.label&&(this.a=d)}this.a||(this.a=b.addTextTrack("subtitles","Shaka Player TextTrack"));this.a.mode="hidden";this.c=this.a.cues}x("shaka.text.SimpleTextDisplayer",X);X.prototype.remove=function(b,c){if(!this.a)return!1;vi(this,function(d){return d.startTime>=c||d.endTime<=b?!1:!0});return!0};X.prototype.remove=X.prototype.remove;
X.prototype.append=function(b){var c=[];if(window.VTTRegion){var d=b.map(function(b){return b.region});d=d.filter(Db);for(var e=0;e<d.length;e++){var f=wi(this,d[e]);c.push(f)}}var g=[];for(d=0;d<b.length;d++)(e=xi(b[d],c))&&g.push(e);g.slice().sort(function(b,c){return b.startTime!=c.startTime?b.startTime-c.startTime:b.endTime!=c.endTime?b.endTime-c.startTime:g.indexOf(c)-g.indexOf(b)}).forEach(function(b){this.a.addCue(b)}.bind(this))};X.prototype.append=X.prototype.append;
X.prototype.destroy=function(){this.a&&vi(this,function(){return!0});this.b=this.a=null;return Promise.resolve()};X.prototype.destroy=X.prototype.destroy;X.prototype.isTextVisible=function(){return"showing"==this.a.mode};X.prototype.isTextVisible=X.prototype.isTextVisible;X.prototype.setTextVisibility=function(b){this.a.mode=b?"showing":"hidden"};X.prototype.setTextVisibility=X.prototype.setTextVisibility;
function xi(b,c){if(b.startTime>=b.endTime)return null;var d=new VTTCue(b.startTime,b.endTime,b.payload);d.lineAlign=b.lineAlign;d.positionAlign=b.positionAlign;d.size=b.size;try{d.align=b.textAlign}catch(f){}"center"==b.textAlign&&"center"!=d.align&&(d.align="middle");2==b.writingDirection?d.vertical="lr":3==b.writingDirection&&(d.vertical="rl");1==b.lineInterpretation&&(d.snapToLines=!1);null!=b.line&&(d.line=b.line);null!=b.position&&(d.position=b.position);if(b.region.id.length){var e=c.filter(function(c){return c.id==
b.region.id});e.length&&(d.region=e[0])}return d}function wi(b,c){var d=new VTTRegion,e=b.b.offsetWidth,f=b.b.offsetHeight;d.id=c.id;d.regionAnchorX=c.regionAnchorX;d.regionAnchorY=c.regionAnchorY;d.scroll=c.scroll;2==c.heightUnits&&(d.lines=c.height);d.width=0==c.widthUnits?100*c.width/e:c.width;0==c.viewportAnchorUnits?(d.viewportAnchorX=100*c.viewportAnchorX/e,d.viewportAnchorY=100*c.viewportAnchorY/f):(d.viewportAnchorX=c.viewportAnchorX,d.viewportAnchorY=c.viewportAnchorY);return d}
function vi(b,c){for(var d=b.c,e=[],f=0;f<d.length;++f)c(d[f])&&e.push(d[f]);for(d=0;d<e.length;++d)b.a.removeCue(e[d])};function Y(b,c){L.call(this);this.xa=!1;this.f=null;this.Wa=!1;this.v=null;this.o=new D;this.h=this.Eb=this.b=this.m=this.a=this.A=this.g=this.i=this.l=this.u=null;this.ad=1E9;this.nb=[];this.qb=!1;this.ya=!0;this.T=this.rb=this.Ia=null;this.jc=!1;this.H=null;this.pb=[];this.K={};this.c=yi(this);this.ob={width:Infinity,height:Infinity};this.j=zi();this.mb=0;this.M=this.c.preferredAudioLanguage;this.wa=this.c.preferredTextLanguage;this.Ha=this.c.preferredVariantRole;this.Va=this.c.preferredTextRole;
this.fa=this.c.preferredAudioChannelCount;c&&c(this);this.u=new C(this.Je.bind(this));b&&this.sb(b,!0)}za(Y,L);x("shaka.Player",Y);function Ai(b){if(!b.Ia)return Promise.resolve();var c=Promise.resolve();b.m&&(c=b.m.stop(),b.m=null);return Promise.all([c,b.Ia()])}
Y.prototype.destroy=function(){var b=this;return p(function d(){var e;return v(d,function(d){switch(d.B){case 1:return q(d,b.detach(),2);case 2:return b.xa=!0,e=Promise.all([b.o?b.o.destroy():null,b.u?b.u.destroy():null]),b.Wa=!1,b.o=null,b.h=null,b.u=null,b.c=null,q(d,e,0)}})})};Y.prototype.destroy=Y.prototype.destroy;Y.version="v2.4.0";var Bi={};Y.registerSupportPlugin=function(b,c){Bi[b]=c};
Y.isBrowserSupported=function(){return!!window.Promise&&!!window.Uint8Array&&!!Array.prototype.forEach&&!!window.MediaSource&&!!MediaSource.isTypeSupported&&!!window.MediaKeys&&!!window.navigator&&!!window.navigator.requestMediaKeySystemAccess&&!!window.MediaKeySystemAccess&&!!window.MediaKeySystemAccess.prototype.getConfiguration};Y.probeSupport=function(){return oc().then(function(b){var c=of(),d=Rc();b={manifest:c,media:d,drm:b};for(var e in Bi)b[e]=Bi[e]();return b})};
Y.prototype.sb=function(b,c){var d=this;return p(function f(){return v(f,function(f){switch(f.B){case 1:void 0===c&&(c=!0);if(!d.f){f.X(2);break}return q(f,d.detach(),2);case 2:d.f=b;E(d.o,d.f,"error",d.be.bind(d));if(c)return d.i=new Qc(d.f),q(f,d.i.j,0);f.X(0)}})})};Y.prototype.attach=Y.prototype.sb;Y.prototype.detach=function(){var b=this;return p(function d(){return v(d,function(d){switch(d.B){case 1:return b.f?q(d,b.jb(!1),2):d["return"]();case 2:b.o.na(b.f,"error"),b.f=null,d.B=0}})})};
Y.prototype.detach=Y.prototype.detach;function Ci(b,c,d){return p(function f(){var g,h;return v(f,function(f){switch(f.B){case 1:return q(f,pf(c,b.u,b.c.manifest.retryParameters,d),2);case 2:return g=f.L,b.m=new g,b.m.configure(b.c.manifest),h={networkingEngine:b.u,filterNewPeriod:b.ub.bind(b),filterAllPeriods:b.dc.bind(b),onTimelineRegionAdded:b.ae.bind(b),onEvent:b.ib.bind(b),onError:b.Ua.bind(b)},f["return"](b.m.start(c,h))}})})}
function Di(b){b.b.periods.some(function(b){return b.variants.some(function(b){return b.video&&b.audio})})&&b.b.periods.forEach(function(b){b.variants=b.variants.filter(function(b){return b.video&&b.audio})});if(0==b.b.periods.length)throw new z(2,4,4014);}function Ei(b){var c=b.b.presentationTimeline.S(),d=b.c.playRangeEnd,e=b.c.playRangeStart;0<e&&(b.P()||b.b.presentationTimeline.Tc(e));d<c&&(b.P()||b.b.presentationTimeline.ja(d))}
Y.prototype.load=function(b,c,d){var e=this;return p(function g(){var h,k,l,m,r,t,u,y,w,Ha,Wa;return v(g,function(g){switch(g.B){case 1:if(!e.f)throw new z(2,7,7002);k=new A;l=function(){h=new z(2,7,7E3);return k};e.dispatchEvent(new F("loading"));m=Date.now();g.qa=2;r=e.jb();e.Ia=l;return q(g,r,4);case 4:e.j=zi();E(e.o,e.f,"playing",e.kb.bind(e));E(e.o,e.f,"pause",e.kb.bind(e));E(e.o,e.f,"ended",e.kb.bind(e));t=e.c.abrFactory;e.h=new t;e.h.configure(e.c.abr);e.v=new e.c.textDisplayFactory;e.v.setTextVisibility(e.Wa);
if(h)throw h;u=e;return q(g,Ci(e,b,d),5);case 5:u.b=g.L;e.Eb=b;if(h)throw h;Di(e);e.l=new $b({Oa:e.u,onError:e.Ua.bind(e),zb:e.Md.bind(e),onExpirationUpdated:e.Jd.bind(e),onEvent:e.ib.bind(e)});e.l.configure(e.c.drm);return q(g,e.l.init(e.b,!1),6);case 6:if(h)throw h;e.dc(e.b.periods);e.mb=Date.now()/1E3;e.M=e.c.preferredAudioLanguage;e.wa=e.c.preferredTextLanguage;e.fa=e.c.preferredAudioChannelCount;Ei(e);return q(g,e.l.sb(e.f),7);case 7:if(h)throw h;e.h.init(e.Ke.bind(e));e.i||(e.i=new Qc(e.f));
e.i.o=e.v;e.g=new Lg(e.f,e.b,e.c.streaming,void 0==c?null:c,e.Ie.bind(e),e.ib.bind(e));e.A=new Qg(e.f,e.i,e.b,e.c.streaming,e.Uc.bind(e),e.ib.bind(e),e.He.bind(e));e.a=new Ug(e.b,{Qa:e.g,J:e.i,Oa:e.u,yc:e.Gd.bind(e),xc:e.ed.bind(e),onError:e.Ua.bind(e),onEvent:e.ib.bind(e),Nd:e.Od.bind(e),cb:e.Yd.bind(e),filterNewPeriod:e.ub.bind(e),filterAllPeriods:e.dc.bind(e)});e.a.configure(e.c.streaming);Fi(e);e.dispatchEvent(new F("streaming"));return q(g,e.a.init(),8);case 8:if(h)throw h;e.c.streaming.startAtSegmentBoundary&&
(y=Gi(e,Og(e.g)),Ig(e.g.a,y));e.b.periods.forEach(e.ub.bind(e));Hi(e);Ii(e);w=W(e.a);Ha=td(w.variants,e.M,e.Ha,e.fa);e.h.setVariants(Ha);w.variants.some(function(b){return b.primary});e.pb.forEach(e.A.o.bind(e.A));e.pb=[];yb(e.o,e.f,"loadeddata",function(){this.j.loadLatency=(Date.now()-m)/1E3}.bind(e));if(h)throw h;e.Ia=null;pa(g);break;case 2:return Wa=qa(g),k.resolve(),e.Ia==l&&(e.Ia=null,e.dispatchEvent(new F("unloading"))),h?g["return"](Promise.reject(h)):g["return"](Promise.reject(Wa))}})})};
Y.prototype.load=Y.prototype.load;
function Fi(b){function c(b){return(b.video?b.video.codecs.split(".")[0]:"")+"-"+(b.audio?b.audio.codecs.split(".")[0]:"")}var d=b.b.periods.reduce(function(b,c){return b.concat(c.variants)},[]);d=vd(d,b.c.preferredAudioChannelCount);var e={};d.forEach(function(b){var d=c(b);d in e||(e[d]=[]);e[d].push(b)});var f=null,g=Infinity;Jb(e,function(b,c){var d=0,e=0;c.forEach(function(b){d+=b.bandwidth||0;++e});var h=d/e;h<g&&(f=b,g=h)});b.b.periods.forEach(function(b){b.variants=b.variants.filter(function(b){return c(b)==
f?!0:!1})})}Y.prototype.configure=function(b,c){if(2==arguments.length&&"string"==typeof b){for(var d=b,e={},f=e,g=0,h=0;;){g=d.indexOf(".",g);if(0>g)break;if(0==g||"\\"!=d[g-1])h=d.substring(h,g).replace(/\\\./g,"."),f[h]={},f=f[h],h=g+1;g+=1}f[d.substring(h).replace(/\\\./g,".")]=c;b=e}d=jb(this.c,b,yi(this),Ji(),"");Ki(this);return d};Y.prototype.configure=Y.prototype.configure;
function Ki(b){b.m&&b.m.configure(b.c.manifest);b.l&&b.l.configure(b.c.drm);if(b.a){b.a.configure(b.c.streaming);try{b.b.periods.forEach(b.ub.bind(b))}catch(f){b.Ua(f)}var c=Yg(b.a),d=$g(b.a),e=W(b.a);(c=zd(c,d,e.variants))&&c.allowedByApplication&&c.allowedByKeySystem||Li(b,e)}b.h&&(b.h.configure(b.c.abr),b.c.abr.enabled&&!b.ya?b.h.enable():b.h.disable())}Y.prototype.getConfiguration=function(){var b=yi(this);jb(b,this.c,yi(this),Ji(),"");return b};Y.prototype.getConfiguration=Y.prototype.getConfiguration;
Y.prototype.ve=function(){this.c=yi(this);Ki(this)};Y.prototype.resetConfiguration=Y.prototype.ve;Y.prototype.rd=function(){return this.f};Y.prototype.getMediaElement=Y.prototype.rd;Y.prototype.sc=function(){return this.u};Y.prototype.getNetworkingEngine=Y.prototype.sc;Y.prototype.Kb=function(){return this.Eb};Y.prototype.getManifestUri=Y.prototype.Kb;Y.prototype.P=function(){return this.b?this.b.presentationTimeline.P():!1};Y.prototype.isLive=Y.prototype.P;
Y.prototype.Ba=function(){return this.b?this.b.presentationTimeline.Ba():!1};Y.prototype.isInProgress=Y.prototype.Ba;Y.prototype.Cd=function(){if(!this.b||!this.b.periods.length)return!1;var b=this.b.periods[0].variants;return b.length?!b[0].video:!1};Y.prototype.isAudioOnly=Y.prototype.Cd;Y.prototype.xe=function(){var b=0,c=0;this.b&&(c=this.b.presentationTimeline,b=c.Ka(),c=c.la());return{start:b,end:c}};Y.prototype.seekRange=Y.prototype.xe;
Y.prototype.keySystem=function(){return this.l?this.l.keySystem():""};Y.prototype.keySystem=Y.prototype.keySystem;Y.prototype.drmInfo=function(){return this.l?this.l.b:null};Y.prototype.drmInfo=Y.prototype.drmInfo;Y.prototype.wb=function(){return this.l?this.l.wb():Infinity};Y.prototype.getExpiration=Y.prototype.wb;Y.prototype.vc=function(){return this.qb};Y.prototype.isBuffering=Y.prototype.vc;
Y.prototype.jb=function(b){var c=this;return p(function e(){return v(e,function(e){switch(e.B){case 1:if(c.xa)return e["return"]();void 0===b&&(b=!0);c.dispatchEvent(new F("unloading"));return q(e,Ai(c),2);case 2:return c.rb||(c.rb=Mi(c).then(function(){c.Uc(!1);c.rb=null})),q(e,c.rb,3);case 3:if(b)return c.i=new Qc(c.f),q(e,c.i.j,0);e.X(0)}})})};Y.prototype.unload=Y.prototype.jb;Y.prototype.Xa=function(){return this.g?this.g.Xa():0};Y.prototype.getPlaybackRate=Y.prototype.Xa;
Y.prototype.Te=function(b){this.g&&Kg(this.g.a,b);this.a&&fh(this.a,1!=b)};Y.prototype.trickPlay=Y.prototype.Te;Y.prototype.fd=function(){this.g&&Kg(this.g.a,1);this.a&&fh(this.a,!1)};Y.prototype.cancelTrickPlay=Y.prototype.fd;Y.prototype.zd=function(){if(!this.b||!this.g)return[];var b=Bd(this.b,Og(this.g)),c=this.K[b]||{};return pd(this.b.periods[b],c.audio,c.video)};Y.prototype.getVariantTracks=Y.prototype.zd;
Y.prototype.yd=function(){if(!this.b||!this.g)return[];var b=Bd(this.b,Og(this.g)),c=this.K[b]||{};if(!c.text){var d=xd(this.b.periods[b].textStreams,this.wa,this.Va);d.length&&(c.text=d[0].id)}return qd(this.b.periods[b],c.text).filter(function(b){return 0>this.nb.indexOf(b.id)}.bind(this))};Y.prototype.getTextTracks=Y.prototype.yd;
Y.prototype.Be=function(b){if(this.a){var c=W(this.a);a:{for(var d=0;d<c.textStreams.length;d++)if(c.textStreams[d].id==b.id){b=c.textStreams[d];break a}b=null}b&&(this.i.l=!1,Ni(this,b,!1),c=b,this.ya?this.H=c:gh(this.a,c,!0),this.wa=b.language)}};Y.prototype.selectTextTrack=Y.prototype.Be;Y.prototype.ze=function(){this.i.l=!0;eh(this.a)};Y.prototype.selectEmbeddedTextTrack=Y.prototype.ze;Y.prototype.Ye=function(){return this.i?this.i.l:!1};Y.prototype.usingEmbeddedTextTrack=Y.prototype.Ye;
Y.prototype.Ce=function(b,c){if(this.a){this.c.abr.enabled&&Ea("Changing tracks while abr manager is enabled will likely result in the selected track being overriden. Consider disabling abr before calling selectVariantTrack().");var d=W(this.a),e=rd(d,b);e&&sd(e)&&(Oi(this,e,!1),Pi(this,e,c),this.M=e.language,e.audio&&e.audio.channelsCount&&(this.fa=e.audio.channelsCount),d=td(d.variants,this.M,this.Ha,this.fa),this.h.setVariants(d))}};Y.prototype.selectVariantTrack=Y.prototype.Ce;
Y.prototype.nd=function(){if(!this.a)return[];var b=W(this.a);b=od(b.variants).map(function(b){return b.audio}).filter(Db);return Qi(b)};Y.prototype.getAudioLanguagesAndRoles=Y.prototype.nd;Y.prototype.xd=function(){if(!this.a)return[];var b=W(this.a);return Qi(b.textStreams)};Y.prototype.getTextLanguagesAndRoles=Y.prototype.xd;Y.prototype.md=function(){if(!this.a)return[];var b=W(this.a);return od(b.variants).map(function(b){return b.language}).filter(Db)};Y.prototype.getAudioLanguages=Y.prototype.md;
Y.prototype.wd=function(){return this.a?W(this.a).textStreams.map(function(b){return b.language}).filter(Db):[]};Y.prototype.getTextLanguages=Y.prototype.wd;function Qi(b){var c=[];b.forEach(function(b){if(b){var d=b.language;b.roles.length?b.roles.forEach(function(b){c.push({language:d,role:b})}):c.push({language:d,role:""})}else c.push({language:"und",role:""})});return fb(c,function(b,c){return b.language==c.language&&b.role==c.role})}
Y.prototype.ye=function(b,c){if(this.a){var d=W(this.a);this.M=b;this.Ha=c||"";Li(this,d)}};Y.prototype.selectAudioLanguage=Y.prototype.ye;Y.prototype.Ae=function(b,c){if(this.a){var d=W(this.a);this.wa=b;this.Va=c||"";Li(this,d)}};Y.prototype.selectTextLanguage=Y.prototype.Ae;Y.prototype.Ob=function(){return this.v?this.v.isTextVisible():this.Wa};Y.prototype.isTextTrackVisible=Y.prototype.Ob;
Y.prototype.Fe=function(b){this.v&&this.v.setTextVisibility(b);this.Wa=b;Ri(this);!this.c.streaming.alwaysStreamText&&this.a&&(b?(b=W(this.a),(b=xd(b.textStreams,this.wa,this.Va)[0])&&ah(this.a,b,!0)):eh(this.a))};Y.prototype.setTextTrackVisibility=Y.prototype.Fe;Y.prototype.td=function(){return this.b?new Date(1E3*this.b.presentationTimeline.f+1E3*this.f.currentTime):null};Y.prototype.getPlayheadTimeAsDate=Y.prototype.td;
Y.prototype.vd=function(){return this.b?new Date(1E3*this.b.presentationTimeline.f):null};Y.prototype.getPresentationStartTimeAsDate=Y.prototype.vd;Y.prototype.Ib=function(){return this.i?this.i.Ib():{total:[],audio:[],video:[],text:[]}};Y.prototype.getBufferedInfo=Y.prototype.Ib;
Y.prototype.getStats=function(){Si(this);this.kb();var b=null,c=null,d=this.f;d=d&&d.getVideoPlaybackQuality?d.getVideoPlaybackQuality():{};if(this.g&&this.b){var e=Bd(this.b,Og(this.g)),f=this.b.periods[e];if(e=this.K[e])c=Ad(e.audio,e.video,f.variants),b=c.video||{}}b||(b={});c||(c={});return{width:b.width||0,height:b.height||0,streamBandwidth:c.bandwidth||0,decodedFrames:Number(d.totalVideoFrames),droppedFrames:Number(d.droppedVideoFrames),estimatedBandwidth:this.h?this.h.getBandwidthEstimate():
NaN,loadLatency:this.j.loadLatency,playTime:this.j.playTime,bufferingTime:this.j.bufferingTime,switchHistory:kb(this.j.switchHistory),stateHistory:kb(this.j.stateHistory)}};Y.prototype.getStats=Y.prototype.getStats;
Y.prototype.addTextTrack=function(b,c,d,e,f,g){if(!this.a)return Promise.reject();for(var h=W(this.a),k,l=0;l<this.b.periods.length;l++)if(this.b.periods[l]==h){if(l==this.b.periods.length-1){if(k=this.b.presentationTimeline.S()-h.startTime,Infinity==k)return Promise.reject()}else k=this.b.periods[l+1].startTime-h.startTime;break}var m={id:this.ad++,createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:function(){return 1},getSegmentReference:function(c){return 1!=c?null:new Q(1,0,
k,function(){return[b]},0,null)},initSegmentReference:null,presentationTimeOffset:0,mimeType:e,codecs:f||"",kind:d,encrypted:!1,keyId:null,language:c,label:g||null,type:"text",primary:!1,trickModeVideo:null,containsEmsgBoxes:!1,roles:[],channelsCount:null};this.nb.push(m.id);h.textStreams.push(m);return ah(this.a,m,this.Wa).then(function(){if(!this.xa){var b=this.b.periods.indexOf(h),e=Zg(this.a,"text");e&&(this.K[b].text=e.id);this.nb.splice(this.nb.indexOf(m.id),1);Li(this,h);Hi(this);return{id:m.id,
active:!1,type:"text",bandwidth:0,language:c,label:g||null,kind:d,width:null,height:null}}}.bind(this))};Y.prototype.addTextTrack=Y.prototype.addTextTrack;Y.prototype.bc=function(b,c){this.ob.width=b;this.ob.height=c};Y.prototype.setMaxHardwareResolution=Y.prototype.bc;Y.prototype.Nc=function(){if(this.a){var b=this.a;if(b.f)b=!1;else if(b.l)b=!1;else{for(var c in b.c){var d=b.c[c];d.$a&&(d.$a=!1,dh(b,d,.1))}b=!0}}else b=!1;return b};Y.prototype.retryStreaming=Y.prototype.Nc;Y.prototype.qd=function(){return this.b};
Y.prototype.getManifest=Y.prototype.qd;function Oi(b,c,d){c.video&&Ti(b,c.video);c.audio&&Ti(b,c.audio);var e=Xg(b.a);c!=zd(Yg(b.a),$g(b.a),e?e.variants:[])&&b.j.switchHistory.push({timestamp:Date.now()/1E3,id:c.id,type:"variant",fromAdaptation:d,bandwidth:c.bandwidth})}function Ni(b,c,d){Ti(b,c);b.j.switchHistory.push({timestamp:Date.now()/1E3,id:c.id,type:"text",fromAdaptation:d,bandwidth:null})}function Ti(b,c){var d=Cd(b.b,c);b.K[d]||(b.K[d]={});b.K[d][c.type]=c.id}
function Mi(b){b.o&&(b.o.na(b.f,"loadeddata"),b.o.na(b.f,"playing"),b.o.na(b.f,"pause"),b.o.na(b.f,"ended"));var c=Promise.all([b.h?b.h.stop():null,b.i?b.i.destroy():null,b.l?b.l.destroy():null,b.g?b.g.destroy():null,b.A?b.A.destroy():null,b.a?b.a.destroy():null,b.m?b.m.stop():null,b.v?b.v.destroy():null]);b.ya=!0;b.l=null;b.i=null;b.g=null;b.A=null;b.a=null;b.m=null;b.v=null;b.b=null;b.Eb=null;b.pb=[];b.K={};b.j=zi();return c}
function Ji(){return{".drm.servers":"",".drm.clearKeys":"",".drm.advanced":{distinctiveIdentifierRequired:!1,persistentStateRequired:!1,videoRobustness:"",audioRobustness:"",serverCertificate:new Uint8Array(0)}}}
function yi(b){var c=5E5;navigator.connection&&navigator.connection.type&&(c=1E6*navigator.connection.downlink);return{drm:{retryParameters:Ya(),servers:{},clearKeys:{},advanced:{},delayLicenseRequestUntilPlayed:!1},manifest:{retryParameters:Ya(),dash:{customScheme:function(b){if(b)return null},clockSyncUri:"",ignoreDrmInfo:!1,xlinkFailGracefully:!1,defaultPresentationDelay:10}},streaming:{retryParameters:Ya(),failureCallback:b.jd.bind(b),rebufferingGoal:2,bufferingGoal:10,bufferBehind:30,ignoreTextStreamFailures:!1,
alwaysStreamText:!1,startAtSegmentBoundary:!1,smallGapLimit:.5,jumpLargeGaps:!1,durationBackoff:1,forceTransmuxTS:!1},abrFactory:K,textDisplayFactory:function(){return new X(b.f)},abr:{enabled:!0,defaultBandwidthEstimate:c,switchInterval:8,bandwidthUpgradeTarget:.85,bandwidthDowngradeTarget:.95,restrictions:{minWidth:0,maxWidth:Infinity,minHeight:0,maxHeight:Infinity,minPixels:0,maxPixels:Infinity,minBandwidth:0,maxBandwidth:Infinity}},preferredAudioLanguage:"",preferredTextLanguage:"",preferredVariantRole:"",
preferredTextRole:"",preferredAudioChannelCount:2,restrictions:{minWidth:0,maxWidth:Infinity,minHeight:0,maxHeight:Infinity,minPixels:0,maxPixels:Infinity,minBandwidth:0,maxBandwidth:Infinity},playRangeStart:0,playRangeEnd:Infinity}}n=Y.prototype;n.jd=function(b){var c=[1001,1002,1003];this.P()&&0<=c.indexOf(b.code)&&(b.severity=1,this.Nc())};
function zi(){return{width:NaN,height:NaN,streamBandwidth:NaN,decodedFrames:NaN,droppedFrames:NaN,estimatedBandwidth:NaN,loadLatency:NaN,playTime:0,bufferingTime:0,switchHistory:[],stateHistory:[]}}
n.dc=function(b){b.forEach(jd.bind(null,this.l,this.a?Yg(this.a):null,this.a?$g(this.a):null));var c=ib(b,function(b){return b.variants.some(sd)});if(0==c)throw new z(2,4,4032);if(c<b.length)throw new z(2,4,4011);b.forEach(function(b){id(b,this.c.restrictions,this.ob)&&this.a&&W(this.a)==b&&Hi(this);if(!b.variants.some(sd))throw new z(2,4,4012);}.bind(this))};
n.ub=function(b){jd(this.l,this.a?Yg(this.a):null,this.a?$g(this.a):null,b);var c=b.variants,d=c.some(sd);id(b,this.c.restrictions,this.ob)&&this.a&&W(this.a)==b&&Hi(this);b=c.some(sd);if(!d)throw new z(2,4,4011);if(!b)throw new z(2,4,4012);};function Pi(b,c,d){b.ya?(b.T=c,b.jc=d||!1):hh(b.a,c,d||!1)}function Si(b){if(b.b){var c=Date.now()/1E3;b.qb?b.j.bufferingTime+=c-b.mb:b.j.playTime+=c-b.mb;b.mb=c}}
function Gi(b,c){function d(b,c){if(!b)return null;var d=b.findSegmentPosition(c-g.startTime);return null==d?null:(d=b.getSegmentReference(d))?d.startTime+g.startTime:null}var e=Yg(b.a),f=$g(b.a),g=W(b.a);e=d(e,c);f=d(f,c);return null!=f&&null!=e?Math.max(f,e):null!=f?f:null!=e?e:c}n.Je=function(b,c){this.h&&this.h.segmentDownloaded(b,c)};n.Uc=function(b){Si(this);this.qb=b;this.kb();if(this.g){var c=this.g.a;b!=c.g&&(c.g=b,Kg(c,c.f))}this.dispatchEvent(new F("buffering",{buffering:b}))};n.He=function(){Hi(this)};
n.kb=function(){if(!this.xa){var b=this.qb?"buffering":this.f.ended?"ended":this.f.paused?"paused":"playing";var c=Date.now()/1E3;if(this.j.stateHistory.length){var d=this.j.stateHistory[this.j.stateHistory.length-1];d.duration=c-d.timestamp;if(b==d.state)return}this.j.stateHistory.push({timestamp:c,state:b,duration:0})}};n.Ie=function(){if(this.A){var b=this.A;b.c.forEach(b.m.bind(b,!0))}this.a&&kh(this.a)};
function Ui(b,c){if(!c||!c.length)return b.Ua(new z(2,4,4012)),null;b.h.setVariants(c);return b.h.chooseVariant()}function Li(b,c){var d=td(c.variants,b.M,b.Ha,b.fa),e=xd(c.textStreams,b.wa,b.Va);if(d=Ui(b,d))Oi(b,d,!0),Pi(b,d,!0);(e=e[0])&&(b.c.streaming.alwaysStreamText||b.Ob())&&(Ni(b,e,!0),b.ya?b.H=e:gh(b.a,e,!0));Ii(b)}
n.Gd=function(b){this.ya=!0;this.h.disable();var c={audio:!1,text:!1},d=td(b.variants,this.M,this.Ha,this.fa,c),e=xd(b.textStreams,this.wa,this.Va,c);d=Ui(this,d);e=e[0]||null;if(this.T){a:{var f=this.b;for(var g=0;g<f.periods.length;++g)for(var h=f.periods[g],k=0;k<h.variants.length;++k)if(h.variants[k]==this.T){f=g;break a}f=-1}this.b.periods[f]==b&&(d=this.T);this.T=null}this.H&&(this.b.periods[Cd(this.b,this.H)]==b&&(e=this.H),this.H=null);d&&Oi(this,d,!0);e&&(Ni(this,e,!0),!Xg(this.a)&&d&&d.audio&&
c.text&&e.language!=d.audio.language&&(this.v.setTextVisibility(!0),Ri(this)));return this.c.streaming.alwaysStreamText||this.Ob()?{variant:d,text:e}:{variant:d,text:null}};n.ed=function(){this.ya=!1;this.c.abr.enabled&&this.h.enable();this.T&&(hh(this.a,this.T,this.jc),this.T=null);this.H&&(gh(this.a,this.H,!0),this.H=null)};n.Od=function(){this.m&&this.m.update&&this.m.update()};n.Yd=function(){this.g&&this.g.cb()};n.Ke=function(b,c){Oi(this,b,!0);this.a&&(hh(this.a,b,c||!1),Ii(this))};
function Ii(b){Promise.resolve().then(function(){this.xa||this.dispatchEvent(new F("adaptation"))}.bind(b))}function Hi(b){Promise.resolve().then(function(){this.xa||this.dispatchEvent(new F("trackschanged"))}.bind(b))}function Ri(b){b.dispatchEvent(new F("texttrackvisibility"))}n.Ua=function(b){if(!this.xa){var c=new F("error",{detail:b});this.dispatchEvent(c);c.defaultPrevented&&(b.handled=!0)}};n.ae=function(b){this.A?this.A.o(b):this.pb.push(b)};n.ib=function(b){this.dispatchEvent(b)};
n.be=function(){if(this.f.error){var b=this.f.error.code;if(1!=b){var c=this.f.error.msExtendedCode;c&&(0>c&&(c+=Math.pow(2,32)),c=c.toString(16));this.Ua(new z(2,3,3016,b,c,this.f.error.message))}}};
n.Md=function(b){var c=["output-restricted","internal-error"],d=W(this.a),e=!1,f=Object.keys(b),g=1==f.length&&"00"==f[0];f.length&&d.variants.forEach(function(d){var f=[];d.audio&&f.push(d.audio);d.video&&f.push(d.video);f.forEach(function(f){var h=d.allowedByKeySystem;f.keyId&&(f=b[g?"00":f.keyId],d.allowedByKeySystem=!!f&&0>c.indexOf(f));h!=d.allowedByKeySystem&&(e=!0)})});(f=zd(Yg(this.a),$g(this.a),d.variants))&&!f.allowedByKeySystem&&Li(this,d);e&&(Hi(this),d=td(d.variants,this.M,this.Ha,this.fa),
this.h.setVariants(d))};n.Jd=function(b,c){if(this.m&&this.m.onExpirationUpdated)this.m.onExpirationUpdated(b,c);this.dispatchEvent(new F("expirationupdated"))};function Vi(b,c,d){var e=void 0==c.expiration?Infinity:c.expiration,f=c.presentationTimeline.S();c=nd(c.periods[0]);return{offlineUri:null,originalManifestUri:b,duration:f,size:0,expiration:e,tracks:c,appMetadata:d}}function Wi(b,c){var d=oi(new mi(b.$(),b.O()),c.periods[0],new V(null,0)),e=c.appMetadata||{};d=nd(d);return{offlineUri:b.toString(),originalManifestUri:c.originalManifestUri,duration:c.duration,size:c.size,expiration:c.expiration,tracks:d,appMetadata:e}};function Xi(){this.a={}}function Yi(b,c,d){d=d.endTime-d.startTime;return Zi(b,c)*d}function Zi(b,c){var d=b.a[c];null==d&&(d=0);return d};function Z(b){if(!b||b.constructor!=Y)throw new z(2,9,9008);this.a=b;this.b=$i(this);this.g=!1;this.c=null;this.f=[]}x("shaka.offline.Storage",Z);function aj(){return Th()}Z.support=aj;Z.prototype.destroy=function(){this.a=this.b=null;return Promise.resolve()};Z.prototype.destroy=Z.prototype.destroy;Z.prototype.configure=function(b){jb(this.b,b,$i(this),{},"")};Z.prototype.configure=Z.prototype.configure;
Z.prototype.store=function(b,c,d){var e=this;return p(function g(){var h,k,l,m,r,t;return v(g,function(g){switch(g.B){case 1:bj();if(e.g)return g["return"](Promise.reject(new z(2,9,9006)));e.g=!0;h=c||{};k=null;l=function(b){k=k||b};return q(g,cj(e,b,l,d),2);case 2:m=g.L;r=!m.manifest.presentationTimeline.P()&&!m.manifest.presentationTimeline.Ba();if(!r)throw new z(2,9,9005,b);dj(e);if(k)throw k;t=new Nh;return g["return"](lb([t,m.Gb],function(){return p(function w(){var c,d,g,l,r,u,Lb;return v(w,
function(w){switch(w.B){case 1:return oa(w),q(w,t.init(),4);case 4:return dj(e),ej(e,m.Gb,m.manifest.periods),q(w,Ph(t),5);case 5:return c=w.L,dj(e),w.qa=6,q(w,fj(e,c.O,m.Gb,m.manifest,b,h||{}),8);case 8:return d=w.L,dj(e),q(w,c.O.addManifests([d]),9);case 9:return g=w.L,dj(e),l=new ki("manifest",c.path.$,c.path.O,g[0]),w["return"](Wi(l,d));case 6:return r=qa(w),u=e.f,Lb=function(){},q(w,c.O.removeSegments(u,Lb),10);case 10:throw k||r;case 2:ra(w),e.g=!1,e.c=null,e.f=[],sa(w)}})})}))}})})};
Z.prototype.store=Z.prototype.store;function fj(b,c,d,e,f,g){var h=Vi(f,e,g),k=new Dh(function(c,d){h.size=d;b.b.progressCallback(h,c)}),l;return lb([k],function(){l=gj(b,k,c,d,e,f,g);return Fh(k,b.a.u)}).then(function(){l.size=h.size;return l})}
Z.prototype.remove=function(b){var c=this;bj();var d=li(b);if(null==d||"manifest"!=d.a)return Promise.reject(new z(2,9,9004,b));var e=new Nh;return lb([e],function(){return p(function g(){var b,k,l;return v(g,function(g){switch(g.B){case 1:return q(g,e.init(),2);case 2:return q(g,Rh(e,d.$(),d.O()),3);case 3:return b=g.L,q(g,b.getManifests([d.key()]),4);case 4:return k=g.L,l=k[0],q(g,Promise.all([hj(c,d,l),ij(c,b,d,l)]),0)}})})})};Z.prototype.remove=Z.prototype.remove;
function hj(b,c,d){var e,f=new $b({Oa:b.a.u,onError:function(b){6013!=b.code&&(e=b)},zb:function(){},onExpirationUpdated:function(){},onEvent:function(){}});f.configure(b.a.getConfiguration().drm);var g=ni(new mi(c.$(),c.O()),d);return lb([f],function(){return p(function k(){return v(k,function(c){switch(c.B){case 1:return q(c,f.init(g,b.b.usePersistentLicense),2);case 2:return q(c,dc(f,d.sessionIds),0)}})})}).then(function(){if(e)throw e;})}
function ij(b,c,d,e){function f(){k+=1;b.b.progressCallback(l,k/h)}var g=jj(e),h=g.length+1,k=0,l=Wi(d,e);return Promise.all([c.removeSegments(g,f),c.removeManifests([d.key()],f)])}
Z.prototype.list=function(){function b(b,d){return p(function h(){var e;return v(h,function(f){switch(f.B){case 1:return q(f,d.getAllManifests(),2);case 2:e=f.L,Jb(e,function(d,e){var f=Wi(new ki("manifest",b.$,b.O,d),e);c.push(f)}),f.B=0}})})}bj();var c=[],d=new Nh;return lb([d],function(){return p(function f(){var c;return v(f,function(f){switch(f.B){case 1:return q(f,d.init(),2);case 2:return c=Promise.resolve(),Qh(d,function(d,f){c=c.then(function(){return b(d,f)})}),q(f,c,0)}})})}).then(function(){return c})};
Z.prototype.list=Z.prototype.list;
function cj(b,c,d,e){function f(){}var g=b.a.u,h=b.a.getConfiguration(),k,l,m;return pf(c,g,h.manifest.retryParameters,e).then(function(b){var e=this;dj(this);l=new $b({Oa:g,onError:d,zb:f,onExpirationUpdated:function(){},onEvent:function(){}});l.configure(h.drm);var k={networkingEngine:g,filterAllPeriods:function(b){ej(e,l,b)},filterNewPeriod:function(b){kj(e,l,b)},onTimelineRegionAdded:function(){},onEvent:function(){},onError:d};m=new b;m.configure(h.manifest);return m.start(c,k)}.bind(b)).then(function(b){dj(this);
k=b;return l.init(k,this.b.usePersistentLicense)}.bind(b)).then(function(){dj(this);return lj(k)}.bind(b)).then(function(){dj(this);return cc(l)}.bind(b)).then(function(){dj(this);return m.stop()}.bind(b)).then(function(){dj(this);return{manifest:k,Gb:l}}.bind(b))["catch"](function(b){if(m)return m.stop().then(function(){throw b;});throw b;})}
function mj(b,c){var d=[],e=fd(b),f=[0,dd,ed],g=c.filter(function(b){return"variant"==b.type});f=f.map(function(b){return g.filter(function(c){c=fd(c.language);return cd(b,e,c)})});for(var h,k=0;k<f.length;k++)if(f[k].length){h=f[k];break}h||(f=g.filter(function(b){return b.primary}),f.length&&(h=f));h||(h=g,g.map(function(b){return b.language}).filter(Db));var l=h.filter(function(b){return b.height&&480>=b.height});l.length&&(l.sort(function(b,c){return c.height-b.height}),h=l.filter(function(b){return b.height==
l[0].height}));h.sort(function(b,c){return b.bandwidth-c.bandwidth});h.length&&d.push(h[Math.floor(h.length/2)]);d.push.apply(d,c.filter(function(b){return"text"==b.type}));return d}function $i(b){return{trackSelectionCallback:function(c){var d=b.a.getConfiguration();return mj(d.preferredAudioLanguage,c)},progressCallback:function(b,d){if(b||d)return null},usePersistentLicense:!0}}function ej(b,c,d){d.forEach(function(d){return kj(b,c,d)})}
function kj(b,c,d){var e=null;if(b.c){var f=b.c.filter(function(b){return"variant"==b.type})[0];f&&(e=rd(d,f))}var g=f=null;e&&(e.audio&&(f=e.audio),e.video&&(g=e.video));jd(c,f,g,d);id(d,b.a.getConfiguration().restrictions,{width:Infinity,height:Infinity})}
function lj(b){var c=b.periods.map(function(b){return b.variants}).reduce(Ab,[]).map(function(b){var c=[];b.audio&&c.push(b.audio);b.video&&c.push(b.video);return c}).reduce(Ab,[]).filter(Db);b=b.periods.map(function(b){return b.textStreams}).reduce(Ab,[]);c.push.apply(c,b);return Promise.all(c.map(function(b){return b.createSegmentIndex()}))}
function gj(b,c,d,e,f,g,h){var k=new Xi,l=f.periods.map(function(g){return nj(b,c,d,k,e,f,g)}),m=e.b,r=gc(e);if(m&&b.b.usePersistentLicense){if(!r.length)throw new z(2,9,9007,g);m.initData=[]}return{originalManifestUri:g,duration:f.presentationTimeline.S(),size:0,expiration:e.wb(),periods:l,sessionIds:b.b.usePersistentLicense?r:[],drmInfo:m,appMetadata:h}}
function nj(b,c,d,e,f,g,h){var k=pd(h,null,null),l=qd(h,null);k=b.b.trackSelectionCallback(k.concat(l));null==b.c&&(b.c=k,ej(b,f,g.periods));oj(k);g.periods.forEach(function(b){b.variants.forEach(function(b){var c=b.audio,d=b.video;c&&!d&&(e.a[c.id]=c.bandwidth||b.bandwidth);!c&&d&&(e.a[d.id]=d.bandwidth||b.bandwidth);if(c&&d){var f=c.bandwidth||393216,g=d.bandwidth||b.bandwidth-f;0>=g&&(g=b.bandwidth);e.a[c.id]=f;e.a[d.id]=g}});b.textStreams.forEach(function(b){e.a[b.id]=52})});var m={};k.forEach(function(b){"variant"==
b.type&&null!=b.audioId&&(m[b.audioId]=!0);"variant"==b.type&&null!=b.videoId&&(m[b.videoId]=!0);"text"==b.type&&(m[b.id]=!0)});var r={};pj(g).filter(function(b){return!!m[b.id]}).forEach(function(f){r[f.id]=qj(b,c,d,e,g,f)});k.forEach(function(b){"variant"==b.type&&null!=b.audioId&&r[b.audioId].variantIds.push(b.id);"variant"==b.type&&null!=b.videoId&&r[b.videoId].variantIds.push(b.id)});return{startTime:h.startTime,streams:G(r)}}
function qj(b,c,d,e,f,g){var h={id:g.id,primary:g.primary,presentationTimeOffset:g.presentationTimeOffset||0,contentType:g.type,mimeType:g.mimeType,codecs:g.codecs,frameRate:g.frameRate,kind:g.kind,language:g.language,label:g.label,width:g.width||null,height:g.height||null,initSegmentKey:null,encrypted:g.encrypted,keyId:g.keyId,segments:[],variantIds:[]};f=f.presentationTimeline.Za();var k=g.id;rj(g,f,function(f){Eh(c,k,sj(b,f),Yi(e,g.id,f),function(c){return d.addSegments([{data:c}]).then(function(c){b.f.push(c[0]);
h.segments.push({startTime:f.startTime,endTime:f.endTime,dataKey:c[0]})})})});(f=g.initSegmentReference)&&Eh(c,k,sj(b,f),.5*Zi(e,g.id),function(c){return d.addSegments([{data:c}]).then(function(c){b.f.push(c[0]);h.initSegmentKey=c[0]})});return h}function rj(b,c,d){c=b.findSegmentPosition(c);for(var e=null==c?null:b.getSegmentReference(c);e;)d(e),e=b.getSegmentReference(++c)}function dj(b){if(!b.a)throw new z(2,9,7001);}function bj(){if(!Th())throw new z(2,9,9E3);}
function sj(b,c){var d=b.a.getConfiguration().streaming.retryParameters;d=qb(c.c(),d);if(0!=c.b||null!=c.a)d.headers.Range="bytes="+c.b+"-"+(null==c.a?"":c.a);return d}function jj(b){var c=[];b.periods.forEach(function(b){b.streams.forEach(function(b){null!=b.initSegmentKey&&c.push(b.initSegmentKey);b.segments.forEach(function(b){c.push(b.dataKey)})})});return c}
Z.deleteAll=function(b){var c=b.u,d=b.getConfiguration().drm,e=new Nh;return lb([e],function(){return p(function g(){var b,k;return v(g,function(g){switch(g.B){case 1:return q(g,e.init(),2);case 2:return q(g,tj(e),3);case 3:return b=g.L,k=Promise.resolve(),b.forEach(function(b){k=k.then(function(){return uj(c,d,b)})}),q(g,k,4);case 4:return q(g,Sh(e),0)}})})})};
function uj(b,c,d){var e=new $b({Oa:b,onError:function(){},zb:function(){},onExpirationUpdated:function(){},onEvent:function(){}});e.configure(c);return lb([e],function(){return p(function g(){return v(g,function(b){switch(b.B){case 1:return q(b,e.init(d,!0),2);case 2:return q(b,dc(e,d.offlineSessionIds),0)}})})})}function oj(b){b.some(function(c){return b.some(function(b){return c!=b&&c.type==b.type&&c.kind==b.kind&&c.language==b.language})})}
function pj(b){var c={};b.periods.forEach(function(b){b.textStreams.forEach(function(b){c[b.id]=b});b.variants.forEach(function(b){b.audio&&(c[b.audio.id]=b.audio);b.video&&(c[b.video.id]=b.video)})});return G(c)}function tj(b){var c=[],d=[];Qh(b,function(b,f){var e=new mi(b.$,b.O);d.push(f.getAllManifests().then(function(b){G(b).forEach(function(b){c.push(ni(e,b))})}))});return Promise.all(d).then(function(){return c})}Bi.offline=aj;x("shaka.polyfill.installAll",function(){for(var b=0;b<vj.length;++b)vj[b].cd()});var vj=[];function wj(b,c){c=c||0;for(var d={priority:c,cd:b},e=0;e<vj.length;e++)if(vj[e].priority<c){vj.splice(e,0,d);return}vj.push(d)}x("shaka.polyfill.register",wj);function xj(b){var c=b.type.replace(/^(webkit|moz|MS)/,"").toLowerCase();if("function"===typeof Event)var d=new Event(c,b);else d=document.createEvent("Event"),d.initEvent(c,b.bubbles,b.cancelable);b.target.dispatchEvent(d)}
wj(function(){if(window.Document){var b=Element.prototype;b.requestFullscreen=b.requestFullscreen||b.mozRequestFullScreen||b.msRequestFullscreen||b.webkitRequestFullscreen;b=Document.prototype;b.exitFullscreen=b.exitFullscreen||b.mozCancelFullScreen||b.msExitFullscreen||b.webkitExitFullscreen;"fullscreenElement"in document||(Object.defineProperty(document,"fullscreenElement",{get:function(){return document.mozFullScreenElement||document.msFullscreenElement||document.webkitFullscreenElement}}),Object.defineProperty(document,
"fullscreenEnabled",{get:function(){return document.mozFullScreenEnabled||document.msFullscreenEnabled||document.webkitFullscreenEnabled}}));document.addEventListener("webkitfullscreenchange",xj);document.addEventListener("webkitfullscreenerror",xj);document.addEventListener("mozfullscreenchange",xj);document.addEventListener("mozfullscreenerror",xj);document.addEventListener("MSFullscreenChange",xj);document.addEventListener("MSFullscreenError",xj)}});wj(function(){var b=navigator.userAgent;b&&0<=b.indexOf("CrKey")&&delete window.indexedDB});var yj;function zj(b,c,d){if("input"==b)switch(this.type){case "range":b="change"}yj.call(this,b,c,d)}wj(function(){0>navigator.userAgent.indexOf("Trident/")||HTMLInputElement.prototype.addEventListener==zj||(yj=HTMLInputElement.prototype.addEventListener,HTMLInputElement.prototype.addEventListener=zj)});wj(function(){});function Aj(){var b=MediaSource.prototype.addSourceBuffer;MediaSource.prototype.addSourceBuffer=function(){var c=b.apply(this,arguments);c.abort=function(){};return c}}function Bj(){var b=SourceBuffer.prototype.remove;SourceBuffer.prototype.remove=function(c,d){return b.call(this,c,d-.001)}}
function Cj(){var b=MediaSource.prototype.endOfStream;MediaSource.prototype.endOfStream=function(){for(var c=0,d=0;d<this.sourceBuffers.length;++d){var g=this.sourceBuffers[d];g=g.buffered.end(g.buffered.length-1);c=Math.max(c,g)}if(!isNaN(this.duration)&&c<this.duration)for(this.tc=!0,c=0;c<this.sourceBuffers.length;++c)this.sourceBuffers[c].oc=!1;return b.apply(this,arguments)};var c=!1,d=MediaSource.prototype.addSourceBuffer;MediaSource.prototype.addSourceBuffer=function(){var b=d.apply(this,arguments);
b.mediaSource_=this;b.addEventListener("updateend",Dj,!1);c||(this.addEventListener("sourceclose",Ej,!1),c=!0);return b}}function Dj(b){var c=b.target,d=c.mediaSource_;if(d.tc){b.preventDefault();b.stopPropagation();b.stopImmediatePropagation();c.oc=!0;for(b=0;b<d.sourceBuffers.length;++b)if(0==d.sourceBuffers[b].oc)return;d.tc=!1}}
function Ej(b){b=b.target;for(var c=0;c<b.sourceBuffers.length;++c)b.sourceBuffers[c].removeEventListener("updateend",Dj,!1);b.removeEventListener("sourceclose",Ej,!1)}function Fj(){var b=MediaSource.isTypeSupported;MediaSource.isTypeSupported=function(c){return"mp2t"==c.split(/ *; */)[0].split("/")[1]?!1:b(c)}}
function Gj(){var b=MediaSource.isTypeSupported,c=/^dv(?:he|av)\./;MediaSource.isTypeSupported=function(d){for(var e=d.split(/ *; */),f=e[0],g={},h=1;h<e.length;++h){var k=e[h].split("="),l=k[0];k=k[1].replace(/"(.*)"/,"$1");g[l]=k}e=g.codecs;if(!e)return b(d);var m=!1,r=!1;d=e.split(",").filter(function(b){if(c.test(b))return r=!0,!1;/^(hev|hvc)1\.2/.test(b)&&(m=!0);return!0});r&&(m=!1);g.codecs=d.join(",");m&&(g.eotf="smpte2084");for(var t in g)f+="; "+t+'="'+g[t]+'"';return cast.__platform__.canDisplayType(f)}}
wj(function(){if(window.MediaSource)if(window.cast&&cast.__platform__&&cast.__platform__.canDisplayType)Gj();else if(navigator.vendor&&0<=navigator.vendor.indexOf("Apple")){var b=navigator.appVersion;Fj();0<=b.indexOf("Version/8")?window.MediaSource=null:0<=b.indexOf("Version/9")?Aj():0<=b.indexOf("Version/10")?(Aj(),Cj()):0<=b.indexOf("Version/11")&&(Aj(),Bj())}});function Hj(b){this.f=[];this.b=[];this.a=[];(new S).Y("pssh",this.c.bind(this)).parse(b.buffer)}Hj.prototype.c=function(b){if(!(1<b.version)){var c=Xb(b.s.Ea(16)),d=[];if(0<b.version)for(var e=b.s.C(),f=0;f<e;++f){var g=Xb(b.s.Ea(16));d.push(g)}e=b.s.C();b.s.F(e);this.b.push.apply(this.b,d);this.f.push(c);this.a.push({start:b.start,end:b.start+b.size-1})}};function Ij(b,c){try{var d=new Jj(b,c);return Promise.resolve(d)}catch(e){return Promise.reject(e)}}
function Jj(b,c){this.keySystem=b;for(var d=!1,e=0;e<c.length;++e){var f=c[e],g={audioCapabilities:[],videoCapabilities:[],persistentState:"optional",distinctiveIdentifier:"optional",initDataTypes:f.initDataTypes,sessionTypes:["temporary"],label:f.label},h=!1;if(f.audioCapabilities)for(var k=0;k<f.audioCapabilities.length;++k){var l=f.audioCapabilities[k];if(l.contentType){h=!0;var m=l.contentType.split(";")[0];MSMediaKeys.isTypeSupported(this.keySystem,m)&&(g.audioCapabilities.push(l),d=!0)}}if(f.videoCapabilities)for(k=
0;k<f.videoCapabilities.length;++k)l=f.videoCapabilities[k],l.contentType&&(h=!0,m=l.contentType.split(";")[0],MSMediaKeys.isTypeSupported(this.keySystem,m)&&(g.videoCapabilities.push(l),d=!0));h||(d=MSMediaKeys.isTypeSupported(this.keySystem,"video/mp4"));"required"==f.persistentState&&(d=!1);if(d){this.a=g;return}}d=Error("Unsupported keySystem");d.name="NotSupportedError";d.code=DOMException.NOT_SUPPORTED_ERR;throw d;}Jj.prototype.createMediaKeys=function(){var b=new Kj(this.keySystem);return Promise.resolve(b)};
Jj.prototype.getConfiguration=function(){return this.a};function Lj(b){var c=this.mediaKeys;c&&c!=b&&Mj(c,null);delete this.mediaKeys;return(this.mediaKeys=b)?Mj(b,this):Promise.resolve()}function Kj(b){this.a=new MSMediaKeys(b);this.b=new D}Kj.prototype.createSession=function(b){var c=b||"temporary";if("temporary"!=c)throw new TypeError("Session type "+b+" is unsupported on this platform.");return new Nj(this.a,c)};Kj.prototype.setServerCertificate=function(){return Promise.resolve(!1)};
function Mj(b,c){function d(){c.msSetMediaKeys(e.a);c.removeEventListener("loadedmetadata",d)}wb(b.b);if(!c)return Promise.resolve();E(b.b,c,"msneedkey",Oj);var e=b;try{return 1<=c.readyState?c.msSetMediaKeys(b.a):c.addEventListener("loadedmetadata",d),Promise.resolve()}catch(f){return Promise.reject(f)}}function Nj(b){L.call(this);this.c=null;this.g=b;this.b=this.a=null;this.f=new D;this.sessionId="";this.expiration=NaN;this.closed=new A;this.keyStatuses=new Pj}za(Nj,L);n=Nj.prototype;
n.generateRequest=function(b,c){this.a=new A;try{this.c=this.g.createSession("video/mp4",new Uint8Array(c),null),E(this.f,this.c,"mskeymessage",this.Sd.bind(this)),E(this.f,this.c,"mskeyadded",this.Qd.bind(this)),E(this.f,this.c,"mskeyerror",this.Rd.bind(this)),Qj(this,"status-pending")}catch(d){this.a.reject(d)}return this.a};n.load=function(){return Promise.reject(Error("MediaKeySession.load not yet supported"))};n.update=function(b){this.b=new A;try{this.c.update(new Uint8Array(b))}catch(c){this.b.reject(c)}return this.b};
n.close=function(){try{this.c.close(),this.closed.resolve(),wb(this.f)}catch(b){this.closed.reject(b)}return this.closed};n.remove=function(){return Promise.reject(Error("MediaKeySession.remove is only applicable for persistent licenses, which are not supported on this platform"))};
function Oj(b){var c=document.createEvent("CustomEvent");c.initCustomEvent("encrypted",!1,!1,null);c.initDataType="cenc";if(b=b.initData){var d=new Hj(b);if(!(1>=d.a.length)){for(var e=[],f=0;f<d.a.length;f++)e.push(b.subarray(d.a[f].start,d.a[f].end+1));b=fb(e,Rj);for(e=d=0;e<b.length;e++)d+=b[e].length;d=new Uint8Array(d);for(f=e=0;f<b.length;f++)d.set(b[f],e),e+=b[f].length;b=d}}c.initData=b;this.dispatchEvent(c)}function Rj(b,c){return Yb(b,c)}
n.Sd=function(b){this.a&&(this.a.resolve(),this.a=null);this.dispatchEvent(new F("message",{messageType:void 0==this.keyStatuses.a?"licenserequest":"licenserenewal",message:b.message.buffer}))};n.Qd=function(){this.a?(Qj(this,"usable"),this.a.resolve(),this.a=null):this.b&&(Qj(this,"usable"),this.b.resolve(),this.b=null)};
n.Rd=function(){var b=Error("EME PatchedMediaKeysMs key error");b.errorCode=this.c.error;if(null!=this.a)this.a.reject(b),this.a=null;else if(null!=this.b)this.b.reject(b),this.b=null;else switch(this.c.error.code){case MSMediaKeyError.MS_MEDIA_KEYERR_OUTPUT:case MSMediaKeyError.MS_MEDIA_KEYERR_HARDWARECHANGE:Qj(this,"output-not-allowed");break;default:Qj(this,"internal-error")}};function Qj(b,c){var d=b.keyStatuses;d.size=void 0==c?0:1;d.a=c;b.dispatchEvent(new F("keystatuseschange"))}
function Pj(){this.size=0;this.a=void 0}var Sj;n=Pj.prototype;n.forEach=function(b){this.a&&b(this.a,Sj)};n.get=function(b){if(this.has(b))return this.a};n.has=function(b){var c=Sj;return this.a&&Yb(new Uint8Array(b),new Uint8Array(c))?!0:!1};n.entries=function(){};n.keys=function(){};n.values=function(){};
wj(function(){!window.HTMLVideoElement||!window.MSMediaKeys||navigator.requestMediaKeySystemAccess&&MediaKeySystemAccess.prototype.getConfiguration||(Sj=(new Uint8Array([0])).buffer,delete HTMLMediaElement.prototype.mediaKeys,HTMLMediaElement.prototype.mediaKeys=null,HTMLMediaElement.prototype.setMediaKeys=Lj,window.MediaKeys=Kj,window.MediaKeySystemAccess=Jj,navigator.requestMediaKeySystemAccess=Ij)});function Tj(){return Promise.reject(Error("The key system specified is not supported."))}function Uj(b){return null==b?Promise.resolve():Promise.reject(Error("MediaKeys not supported."))}function Vj(){throw new TypeError("Illegal constructor.");}Vj.prototype.createSession=function(){};Vj.prototype.setServerCertificate=function(){};function Wj(){throw new TypeError("Illegal constructor.");}Wj.prototype.getConfiguration=function(){};Wj.prototype.createMediaKeys=function(){};
wj(function(){!window.HTMLVideoElement||navigator.requestMediaKeySystemAccess&&MediaKeySystemAccess.prototype.getConfiguration||(navigator.requestMediaKeySystemAccess=Tj,delete HTMLMediaElement.prototype.mediaKeys,HTMLMediaElement.prototype.mediaKeys=null,HTMLMediaElement.prototype.setMediaKeys=Uj,window.MediaKeys=Vj,window.MediaKeySystemAccess=Wj)},-10);var Xj="";function Yj(b){var c=Xj;return c?c+b.charAt(0).toUpperCase()+b.slice(1):b}function Zj(b,c){try{var d=new ak(b,c);return Promise.resolve(d)}catch(e){return Promise.reject(e)}}function bk(b){var c=this.mediaKeys;c&&c!=b&&ck(c,null);delete this.mediaKeys;(this.mediaKeys=b)&&ck(b,this);return Promise.resolve()}
function ak(b,c){this.a=this.keySystem=b;var d=!1;"org.w3.clearkey"==b&&(this.a="webkit-org.w3.clearkey",d=!1);var e=!1;var f=document.getElementsByTagName("video");f=f.length?f[0]:document.createElement("video");for(var g=0;g<c.length;++g){var h=c[g],k={audioCapabilities:[],videoCapabilities:[],persistentState:"optional",distinctiveIdentifier:"optional",initDataTypes:h.initDataTypes,sessionTypes:["temporary"],label:h.label},l=!1;if(h.audioCapabilities)for(var m=0;m<h.audioCapabilities.length;++m){var r=
h.audioCapabilities[m];if(r.contentType){l=!0;var t=r.contentType.split(";")[0];f.canPlayType(t,this.a)&&(k.audioCapabilities.push(r),e=!0)}}if(h.videoCapabilities)for(m=0;m<h.videoCapabilities.length;++m)r=h.videoCapabilities[m],r.contentType&&(l=!0,f.canPlayType(r.contentType,this.a)&&(k.videoCapabilities.push(r),e=!0));l||(e=f.canPlayType("video/mp4",this.a)||f.canPlayType("video/webm",this.a));"required"==h.persistentState&&(d?(k.persistentState="required",k.sessionTypes=["persistent-license"]):
e=!1);if(e){this.b=k;return}}d="Unsupported keySystem";if("org.w3.clearkey"==b||"com.widevine.alpha"==b)d="None of the requested configurations were supported.";d=Error(d);d.name="NotSupportedError";d.code=DOMException.NOT_SUPPORTED_ERR;throw d;}ak.prototype.createMediaKeys=function(){var b=new dk(this.a);return Promise.resolve(b)};ak.prototype.getConfiguration=function(){return this.b};function dk(b){this.g=b;this.b=null;this.a=new D;this.c=[];this.f={}}
function ck(b,c){b.b=c;wb(b.a);var d=Xj;c&&(E(b.a,c,d+"needkey",b.fe.bind(b)),E(b.a,c,d+"keymessage",b.ee.bind(b)),E(b.a,c,d+"keyadded",b.ce.bind(b)),E(b.a,c,d+"keyerror",b.de.bind(b)))}n=dk.prototype;n.createSession=function(b){var c=b||"temporary";if("temporary"!=c&&"persistent-license"!=c)throw new TypeError("Session type "+b+" is unsupported on this platform.");b=this.b||document.createElement("video");b.src||(b.src="about:blank");c=new ek(b,this.g,c);this.c.push(c);return c};
n.setServerCertificate=function(){return Promise.resolve(!1)};n.fe=function(b){var c=document.createEvent("CustomEvent");c.initCustomEvent("encrypted",!1,!1,null);c.initDataType="webm";c.initData=b.initData;this.b.dispatchEvent(c)};n.ee=function(b){var c=fk(this,b.sessionId);c&&(b=new F("message",{messageType:void 0==c.keyStatuses.a?"licenserequest":"licenserenewal",message:b.message}),c.b&&(c.b.resolve(),c.b=null),c.dispatchEvent(b))};
n.ce=function(b){if(b=fk(this,b.sessionId))gk(b,"usable"),b.a&&b.a.resolve(),b.a=null};
n.de=function(b){var c=fk(this,b.sessionId);if(c){var d=Error("EME v0.1b key error");d.errorCode=b.errorCode;d.errorCode.systemCode=b.systemCode;!b.sessionId&&c.b?(d.method="generateRequest",45==b.systemCode&&(d.message="Unsupported session type."),c.b.reject(d),c.b=null):b.sessionId&&c.a?(d.method="update",c.a.reject(d),c.a=null):(d=b.systemCode,b.errorCode.code==MediaKeyError.MEDIA_KEYERR_OUTPUT?gk(c,"output-restricted"):1==d?gk(c,"expired"):gk(c,"internal-error"))}};
function fk(b,c){var d=b.f[c];return d?d:(d=b.c.shift())?(d.sessionId=c,b.f[c]=d):null}function ek(b,c,d){L.call(this);this.f=b;this.h=!1;this.a=this.b=null;this.c=c;this.g=d;this.sessionId="";this.expiration=NaN;this.closed=new A;this.keyStatuses=new hk}za(ek,L);
function ik(b,c,d){if(b.h)return Promise.reject(Error("The session is already initialized."));b.h=!0;try{if("persistent-license"==b.g)if(d)var e=new Uint8Array(Qb("LOAD_SESSION|"+d));else{var f=Qb("PERSISTENT|"),g=new Uint8Array(f.byteLength+c.byteLength);g.set(new Uint8Array(f),0);g.set(new Uint8Array(c),f.byteLength);e=g}else e=new Uint8Array(c)}catch(k){return Promise.reject(k)}b.b=new A;var h=Yj("generateKeyRequest");try{b.f[h](b.c,e)}catch(k){if("InvalidStateError"!=k.name)return b.b=null,Promise.reject(k);
setTimeout(function(){try{this.f[h](this.c,e)}catch(l){this.b.reject(l),this.b=null}}.bind(b),10)}return b.b}n=ek.prototype;
n.ec=function(b,c){if(this.a)this.a.then(this.ec.bind(this,b,c))["catch"](this.ec.bind(this,b,c));else{this.a=b;if("webkit-org.w3.clearkey"==this.c){var d=H(c);var e=JSON.parse(d);"oct"!=e.keys[0].kty&&(this.a.reject(Error("Response is not a valid JSON Web Key Set.")),this.a=null);d=Vb(e.keys[0].k);e=Vb(e.keys[0].kid)}else d=new Uint8Array(c),e=null;var f=Yj("addKey");try{this.f[f](this.c,d,e,this.sessionId)}catch(g){this.a.reject(g),this.a=null}}};
function gk(b,c){var d=b.keyStatuses;d.size=void 0==c?0:1;d.a=c;b.dispatchEvent(new F("keystatuseschange"))}n.generateRequest=function(b,c){return ik(this,c,null)};n.load=function(b){return"persistent-license"==this.g?ik(this,null,b):Promise.reject(Error("Not a persistent session."))};n.update=function(b){var c=new A;this.ec(c,b);return c};
n.close=function(){if("persistent-license"!=this.g){if(!this.sessionId)return this.closed.reject(Error("The session is not callable.")),this.closed;var b=Yj("cancelKeyRequest");try{this.f[b](this.c,this.sessionId)}catch(c){}}this.closed.resolve();return this.closed};n.remove=function(){return"persistent-license"!=this.g?Promise.reject(Error("Not a persistent session.")):this.close()};function hk(){this.size=0;this.a=void 0}var jk;n=hk.prototype;n.forEach=function(b){this.a&&b(this.a,jk)};n.get=function(b){if(this.has(b))return this.a};
n.has=function(b){var c=jk;return this.a&&Yb(new Uint8Array(b),new Uint8Array(c))?!0:!1};n.entries=function(){};n.keys=function(){};n.values=function(){};
wj(function(){if(!(!window.HTMLVideoElement||navigator.requestMediaKeySystemAccess&&MediaKeySystemAccess.prototype.getConfiguration)){if(HTMLMediaElement.prototype.webkitGenerateKeyRequest)Xj="webkit";else if(!HTMLMediaElement.prototype.generateKeyRequest)return;jk=(new Uint8Array([0])).buffer;navigator.requestMediaKeySystemAccess=Zj;delete HTMLMediaElement.prototype.mediaKeys;HTMLMediaElement.prototype.mediaKeys=null;HTMLMediaElement.prototype.setMediaKeys=bk;window.MediaKeys=dk;window.MediaKeySystemAccess=
ak}});wj(function(){if(window.HTMLMediaElement){var b=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){var c=b.apply(this,arguments);c&&c["catch"](function(){});return c}}});function kk(){return{droppedVideoFrames:this.webkitDroppedFrameCount,totalVideoFrames:this.webkitDecodedFrameCount,corruptedVideoFrames:0,creationTime:NaN,totalFrameDelay:0}}wj(function(){if(window.HTMLVideoElement){var b=HTMLVideoElement.prototype;!b.getVideoPlaybackQuality&&"webkitDroppedFrameCount"in b&&(b.getVideoPlaybackQuality=kk)}});function lk(b,c,d){return new window.TextTrackCue(b,c,d)}function mk(b,c,d){return new window.TextTrackCue(b+"-"+c+"-"+d,b,c,d)}wj(function(){if(!window.VTTCue&&window.TextTrackCue){var b=TextTrackCue.length;if(3==b)window.VTTCue=lk;else if(6==b)window.VTTCue=mk;else{try{var c=!!lk(1,2,"")}catch(d){c=!1}c&&(window.VTTCue=lk)}}});function nk(){}nk.prototype.parseInit=function(){};
nk.prototype.parseMedia=function(b,c){var d=H(b),e=[],f=new DOMParser,g=null;try{g=f.parseFromString(d,"text/xml")}catch(Ha){throw new z(2,2,2005);}if(g){if(f=g.getElementsByTagName("tt")[0]){g=f.getAttribute("ttp:frameRate");var h=f.getAttribute("ttp:subFrameRate");var k=f.getAttribute("ttp:frameRateMultiplier");var l=f.getAttribute("ttp:tickRate");d=f.getAttribute("xml:space")||"default"}else throw new z(2,2,2005);if("default"!=d&&"preserve"!=d)throw new z(2,2,2005);d="default"==d;g=new ok(g,h,
k,l);h=pk(f.getElementsByTagName("styling")[0]);k=pk(f.getElementsByTagName("layout")[0]);l=[];for(var m=0;m<k.length;m++){var r=k[m],t=h;var u=new vc;var y=r.getAttribute("xml:id");if(y){u.id=y;var w;if(w=qk(r,t,"tts:extent"))w=(y=rk.exec(w))||sk.exec(w),null!=w&&(u.width=Number(w[1]),u.height=Number(w[2]),u.widthUnits=y?Ic:0,u.heightUnits=y?Ic:0);if(r=qk(r,t,"tts:origin"))w=(y=rk.exec(r))||sk.exec(r),null!=w&&(u.viewportAnchorX=Number(w[1]),u.viewportAnchorY=Number(w[2]),u.viewportAnchorUnits=y?
Ic:0)}else u=null;u&&l.push(u)}f=pk(f.getElementsByTagName("body")[0]);for(m=0;m<f.length;m++)(u=tk(f[m],c.periodStart,g,h,k,l,d))&&e.push(u)}return e};
var rk=/^(\d{1,2}|100)% (\d{1,2}|100)%$/,uk=/^(\d+px|\d+em)$/,sk=/^(\d+)px (\d+)px$/,vk=/^(\d{2,}):(\d{2}):(\d{2}):(\d{2})\.?(\d+)?$/,wk=/^(?:(\d{2,}):)?(\d{2}):(\d{2})$/,xk=/^(?:(\d{2,}):)?(\d{2}):(\d{2}\.\d{2,})$/,yk=/^(\d*(?:\.\d*)?)f$/,zk=/^(\d*(?:\.\d*)?)t$/,Ak=/^(?:(\d*(?:\.\d*)?)h)?(?:(\d*(?:\.\d*)?)m)?(?:(\d*(?:\.\d*)?)s)?(?:(\d*(?:\.\d*)?)ms)?$/,Bk={left:"start",center:Ac,right:"end",start:"start",end:"end"},Ck={left:"line-left",center:"center",right:"line-right"};
function pk(b){var c=[];if(!b)return c;for(var d=b.childNodes,e=0;e<d.length;e++){var f="span"==d[e].nodeName&&"p"==b.nodeName;d[e].nodeType!=Node.ELEMENT_NODE||"br"==d[e].nodeName||f||(f=pk(d[e]),c=c.concat(f))}c.length||c.push(b);return c}function Dk(b,c){for(var d=b.childNodes,e=0;e<d.length;e++)if("br"==d[e].nodeName&&0<e)d[e-1].textContent+="\n";else if(0<d[e].childNodes.length)Dk(d[e],c);else if(c){var f=d[e].textContent.trim();f=f.replace(/\s+/g," ");d[e].textContent=f}}
function tk(b,c,d,e,f,g,h){if(!b.hasAttribute("begin")&&!b.hasAttribute("end")&&/^\s*$/.test(b.textContent))return null;Dk(b,h);h=Ek(b.getAttribute("begin"),d);var k=Ek(b.getAttribute("end"),d);d=Ek(b.getAttribute("dur"),d);var l=b.textContent;null==k&&null!=d&&(k=h+d);if(null==h||null==k)throw new z(2,2,2001);c=new I(h+c,k+c,l);if((f=Fk(b,"region",f))&&f.getAttribute("xml:id")){var m=f.getAttribute("xml:id");g=g.filter(function(b){return b.id==m});c.region=g[0]}Gk(c,b,f,e);return c}
function Gk(b,c,d,e){"rtl"==Hk(c,d,e,"tts:direction")&&(b.writingDirection=1);var f=Hk(c,d,e,"tts:writingMode");"tb"==f||"tblr"==f?b.writingDirection=2:"tbrl"==f?b.writingDirection=3:"rltb"==f||"rl"==f?b.writingDirection=1:f&&(b.writingDirection=yc);if(f=Hk(c,d,e,"tts:textAlign"))b.positionAlign=Ck[f],b.lineAlign=Bk[f],b.textAlign=Ec[f.toUpperCase()];if(f=Hk(c,d,e,"tts:displayAlign"))b.displayAlign=Fc[f.toUpperCase()];if(f=Hk(c,d,e,"tts:color"))b.color=f;if(f=Hk(c,d,e,"tts:backgroundColor"))b.backgroundColor=
f;if(f=Hk(c,d,e,"tts:fontFamily"))b.fontFamily=f;(f=Hk(c,d,e,"tts:fontWeight"))&&"bold"==f&&(b.fontWeight=700);(f=Hk(c,d,e,"tts:wrapOption"))&&"noWrap"==f&&(b.wrapLine=!1);(f=Hk(c,d,e,"tts:lineHeight"))&&f.match(uk)&&(b.lineHeight=f);(f=Hk(c,d,e,"tts:fontSize"))&&f.match(uk)&&(b.fontSize=f);if(f=Hk(c,d,e,"tts:fontStyle"))b.fontStyle=Hc[f.toUpperCase()];(d=qk(d,e,"tts:textDecoration"))&&Ik(b,d);(c=Jk(c,e,"tts:textDecoration"))&&Ik(b,c)}
function Ik(b,c){for(var d=c.split(" "),e=0;e<d.length;e++)switch(d[e]){case "underline":0>b.textDecoration.indexOf("underline")&&b.textDecoration.push("underline");break;case "noUnderline":0<=b.textDecoration.indexOf("underline")&&hb(b.textDecoration,"underline");break;case "lineThrough":0>b.textDecoration.indexOf("lineThrough")&&b.textDecoration.push("lineThrough");break;case "noLineThrough":0<=b.textDecoration.indexOf("lineThrough")&&hb(b.textDecoration,"lineThrough");break;case "overline":0>b.textDecoration.indexOf("overline")&&
b.textDecoration.push("overline");break;case "noOverline":0<=b.textDecoration.indexOf("overline")&&hb(b.textDecoration,"overline")}}function Hk(b,c,d,e){return(b=Jk(b,d,e))?b:qk(c,d,e)}function qk(b,c,d){for(var e=pk(b),f=0;f<e.length;f++){var g=e[f].getAttribute(d);if(g)return g}return(b=Fk(b,"style",c))?b.getAttribute(d):null}function Jk(b,c,d){return(b=Fk(b,"style",c))?b.getAttribute(d):null}
function Fk(b,c,d){if(!b||1>d.length)return null;var e=null,f=b;for(b=null;f&&!(b=f.getAttribute(c))&&(f=f.parentNode,f instanceof Element););if(c=b)for(b=0;b<d.length;b++)if(d[b].getAttribute("xml:id")==c){e=d[b];break}return e}
function Ek(b,c){var d=null;if(vk.test(b)){d=vk.exec(b);var e=Number(d[1]),f=Number(d[2]),g=Number(d[3]),h=Number(d[4]);h+=(Number(d[5])||0)/c.b;g+=h/c.frameRate;d=g+60*f+3600*e}else wk.test(b)?d=Kk(wk,b):xk.test(b)?d=Kk(xk,b):yk.test(b)?(d=yk.exec(b),d=Number(d[1])/c.frameRate):zk.test(b)?(d=zk.exec(b),d=Number(d[1])/c.a):Ak.test(b)&&(d=Kk(Ak,b));return d}
function Kk(b,c){var d=b.exec(c);return null==d||""==d[0]?null:(Number(d[4])||0)/1E3+(Number(d[3])||0)+60*(Number(d[2])||0)+3600*(Number(d[1])||0)}function ok(b,c,d,e){this.frameRate=Number(b)||30;this.b=Number(c)||1;this.a=Number(e);0==this.a&&(this.a=b?this.frameRate*this.b:1);d&&(b=/^(\d+) (\d+)$/g.exec(d))&&(this.frameRate*=b[1]/b[2])}J["application/ttml+xml"]=nk;function Lk(){this.a=new nk}Lk.prototype.parseInit=function(b){var c=!1;(new S).D("moov",T).D("trak",T).D("mdia",T).D("minf",T).D("stbl",T).Y("stsd",Ke).D("stpp",function(b){c=!0;b.ra.stop()}).parse(b);if(!c)throw new z(2,2,2007);};Lk.prototype.parseMedia=function(b,c){var d=!1,e=[];(new S).D("mdat",Le(function(b){d=!0;e=e.concat(this.a.parseMedia(b,c))}.bind(this))).parse(b);if(!d)throw new z(2,2,2007);return e};J['application/mp4; codecs="stpp"']=Lk;
J['application/mp4; codecs="stpp.TTML.im1t"']=Lk;function Mk(){}Mk.prototype.parseInit=function(){};
Mk.prototype.parseMedia=function(b,c){var d=H(b);d=d.replace(/\r\n|\r(?=[^\n]|$)/gm,"\n");d=d.split(/\n{2,}/m);if(!/^WEBVTT($|[ \t\n])/m.test(d[0]))throw new z(2,2,2E3);var e=c.segmentStart;if(null==e&&(e=0,0<=d[0].indexOf("X-TIMESTAMP-MAP"))){var f=d[0].match(/LOCAL:((?:(\d{1,}):)?(\d{2}):(\d{2})\.(\d{3}))/m),g=d[0].match(/MPEGTS:(\d+)/m);f&&g&&(e=Nk(new Of(f[1])),e=c.periodStart+(Number(g[1])/9E4-e))}g=[];var h=d[0].split("\n");for(f=1;f<h.length;f++)if(/^Region:/.test(h[f])){var k=new Of(h[f]),
l=new vc;Rf(k);Pf(k);for(var m=Rf(k);m;){var r=l,t=m;(m=/^id=(.*)$/.exec(t))?r.id=m[1]:(m=/^width=(\d{1,2}|100)%$/.exec(t))?r.width=Number(m[1]):(m=/^lines=(\d+)$/.exec(t))?(r.height=Number(m[1]),r.heightUnits=2):(m=/^regionanchor=(\d{1,2}|100)%,(\d{1,2}|100)%$/.exec(t))?(r.regionAnchorX=Number(m[1]),r.regionAnchorY=Number(m[2])):(m=/^viewportanchor=(\d{1,2}|100)%,(\d{1,2}|100)%$/.exec(t))?(r.viewportAnchorX=Number(m[1]),r.viewportAnchorY=Number(m[2])):/^scroll=up$/.exec(t)&&(r.scroll="up");Pf(k);
m=Rf(k)}g.push(l)}f=[];for(k=1;k<d.length;k++){h=d[k].split("\n");m=h;t=e;h=g;if(1==m.length&&!m[0]||/^NOTE($|[ \t])/.test(m[0])||"STYLE"==m[0])h=null;else{l=null;0>m[0].indexOf("--\x3e")&&(l=m[0],m.splice(0,1));r=new Of(m[0]);var u=Nk(r),y=Qf(r,/[ \t]+--\x3e[ \t]+/g),w=Nk(r);if(null==u||null==y||null==w)throw new z(2,2,2001);m=new I(u+t,w+t,m.slice(1).join("\n").trim());Pf(r);for(t=Rf(r);t;)Ok(m,t,h),Pf(r),t=Rf(r);null!=l&&(m.id=l);h=m}h&&f.push(h)}return f};
function Ok(b,c,d){var e;if(e=/^align:(start|middle|center|end|left|right)$/.exec(c))c=e[1],"middle"==c?b.textAlign=xc:b.textAlign=Ec[c.toUpperCase()];else if(e=/^vertical:(lr|rl)$/.exec(c))b.writingDirection="lr"==e[1]?2:3;else if(e=/^size:([\d.]+)%$/.exec(c))b.size=Number(e[1]);else if(e=/^position:([\d.]+)%(?:,(line-left|line-right|center|start|end))?$/.exec(c))b.position=Number(e[1]),e[2]&&(c=e[2],b.positionAlign="line-left"==c||"start"==c?"line-left":"line-right"==c||"end"==c?"line-right":"center");
else if(e=/^region:(.*)$/.exec(c)){if(c=Pk(d,e[1]))b.region=c}else if(d=/^line:([\d.]+)%(?:,(start|end|center))?$/.exec(c))b.lineInterpretation=1,b.line=Number(d[1]),d[2]&&(b.lineAlign=Gc[d[2].toUpperCase()]);else if(d=/^line:(-?\d+)(?:,(start|end|center))?$/.exec(c))b.lineInterpretation=zc,b.line=Number(d[1]),d[2]&&(b.lineAlign=Gc[d[2].toUpperCase()])}function Pk(b,c){var d=b.filter(function(b){return b.id==c});return d.length?d[0]:null}
function Nk(b){b=Qf(b,/(?:(\d{1,}):)?(\d{2}):(\d{2})\.(\d{3})/g);if(null==b)return null;var c=Number(b[2]),d=Number(b[3]);return 59<c||59<d?null:Number(b[4])/1E3+d+60*c+3600*(Number(b[1])||0)}J["text/vtt"]=Mk;J['text/vtt; codecs="vtt"']=Mk;function Qk(){this.a=null}Qk.prototype.parseInit=function(b){var c=!1;(new S).D("moov",T).D("trak",T).D("mdia",T).Y("mdhd",function(b){0==b.version?(b.s.F(4),b.s.F(4),this.a=b.s.C(),b.s.F(4)):(b.s.F(8),b.s.F(8),this.a=b.s.C(),b.s.F(8));b.s.F(4)}.bind(this)).D("minf",T).D("stbl",T).Y("stsd",Ke).D("wvtt",function(){c=!0}).parse(b);if(!this.a)throw new z(2,2,2008);if(!c)throw new z(2,2,2008);};
Qk.prototype.parseMedia=function(b,c){var d=this;if(!this.a)throw new z(2,2,2008);var e=0,f=[],g,h=[],k=!1,l=!1,m=!1,r=null;(new S).D("moof",T).D("traf",T).Y("tfdt",function(b){k=!0;e=0==b.version?b.s.C():b.s.Sa()}).Y("tfhd",function(b){var c=b.flags;b=b.s;b.F(4);c&1&&b.F(8);c&2&&b.F(4);r=c&8?b.C():null}).Y("trun",function(b){l=!0;var c=b.version,d=b.flags;b=b.s;var e=b.C();d&1&&b.F(4);d&4&&b.F(4);for(var g=[],h=0;h<e;h++){var k={duration:null,sampleSize:null,fc:null};d&256&&(k.duration=b.C());d&
512&&(k.sampleSize=b.C());d&1024&&b.F(4);d&2048&&(k.fc=0==c?b.C():b.Kc());g.push(k)}f=g}).D("mdat",Le(function(b){m=!0;g=b})).parse(b);if(!m&&!k&&!l)throw new z(2,2,2008);var t=e,u=new DataView(g.buffer,g.byteOffset,g.byteLength),y=new R(u,0);f.forEach(function(b){var f=b.duration||r,g=b.fc?e+b.fc:t;t=g+(f||0);var k=0;do{var l=y.C();k+=l;var m=y.C(),u=null;"vttc"==Me(m)?8<l&&(u=y.Ea(l-8)):y.F(l-8);f&&u&&h.push(Rk(u,c.periodStart+g/d.a,c.periodStart+t/d.a))}while(b.sampleSize&&k<b.sampleSize)});return h.filter(Cb)};
function Rk(b,c,d){var e,f,g;(new S).D("payl",Le(function(b){e=H(b)})).D("iden",Le(function(b){f=H(b)})).D("sttg",Le(function(b){g=H(b)})).parse(b);return e?Sk(e,f,g,c,d):null}function Sk(b,c,d,e,f){b=new I(e,f,b);c&&(b.id=c);if(d)for(c=new Of(d),d=Rf(c);d;)Ok(b,d,[]),Pf(c),d=Rf(c);return b}J['application/mp4; codecs="wvtt"']=Qk;}.call(g,this));
if (typeof(module)!="undefined"&&module.exports)module.exports=g.shaka;
else if (typeof(define)!="undefined" && define.amd)define(function(){return g.shaka});
else this.shaka=g.shaka;
}).call(window);


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(_dereq_,module,exports){
// stats.js - http://github.com/mrdoob/stats.js
var Stats=function(){var l=Date.now(),m=l,g=0,n=Infinity,o=0,h=0,p=Infinity,q=0,r=0,s=0,f=document.createElement("div");f.id="stats";f.addEventListener("mousedown",function(b){b.preventDefault();t(++s%2)},!1);f.style.cssText="width:80px;opacity:0.9;cursor:pointer";var a=document.createElement("div");a.id="fps";a.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#002";f.appendChild(a);var i=document.createElement("div");i.id="fpsText";i.style.cssText="color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
i.innerHTML="FPS";a.appendChild(i);var c=document.createElement("div");c.id="fpsGraph";c.style.cssText="position:relative;width:74px;height:30px;background-color:#0ff";for(a.appendChild(c);74>c.children.length;){var j=document.createElement("span");j.style.cssText="width:1px;height:30px;float:left;background-color:#113";c.appendChild(j)}var d=document.createElement("div");d.id="ms";d.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#020;display:none";f.appendChild(d);var k=document.createElement("div");
k.id="msText";k.style.cssText="color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";k.innerHTML="MS";d.appendChild(k);var e=document.createElement("div");e.id="msGraph";e.style.cssText="position:relative;width:74px;height:30px;background-color:#0f0";for(d.appendChild(e);74>e.children.length;)j=document.createElement("span"),j.style.cssText="width:1px;height:30px;float:left;background-color:#131",e.appendChild(j);var t=function(b){s=b;switch(s){case 0:a.style.display=
"block";d.style.display="none";break;case 1:a.style.display="none",d.style.display="block"}};return{REVISION:12,domElement:f,setMode:t,begin:function(){l=Date.now()},end:function(){var b=Date.now();g=b-l;n=Math.min(n,g);o=Math.max(o,g);k.textContent=g+" MS ("+n+"-"+o+")";var a=Math.min(30,30-30*(g/200));e.appendChild(e.firstChild).style.height=a+"px";r++;b>m+1E3&&(h=Math.round(1E3*r/(b-m)),p=Math.min(p,h),q=Math.max(q,h),i.textContent=h+" FPS ("+p+"-"+q+")",a=Math.min(30,30-30*(h/100)),c.appendChild(c.firstChild).style.height=
a+"px",m=b,r=0);return b},update:function(){l=this.end()}}};"object"===typeof module&&(module.exports=Stats);

},{}],7:[function(_dereq_,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WebVRManager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Emitter = _dereq_('./emitter.js');
var Modes = _dereq_('./modes.js');
var Util = _dereq_('./util.js');

/**
 * Everything having to do with the WebVR button.
 * Emits a 'click' event when it's clicked.
 */
function ButtonManager(opt_root) {
  var root = opt_root || document.body;
  this.loadIcons_();

  // Make the fullscreen button.
  var fsButton = this.createButton();
  fsButton.src = this.ICONS.fullscreen;
  fsButton.title = 'Fullscreen mode';
  var s = fsButton.style;
  s.bottom = 0;
  s.right = 0;
  fsButton.addEventListener('click', this.createClickHandler_('fs'));
  root.appendChild(fsButton);
  this.fsButton = fsButton;

  // Make the VR button.
  var vrButton = this.createButton();
  vrButton.src = this.ICONS.cardboard;
  vrButton.title = 'Virtual reality mode';
  var s = vrButton.style;
  s.bottom = 0;
  s.right = '48px';
  vrButton.addEventListener('click', this.createClickHandler_('vr'));
  root.appendChild(vrButton);
  this.vrButton = vrButton;

  this.isVisible = true;

}
ButtonManager.prototype = new Emitter();

ButtonManager.prototype.createButton = function() {
  var button = document.createElement('img');
  button.className = 'webvr-button';
  var s = button.style;
  s.position = 'absolute';
  s.width = '24px'
  s.height = '24px';
  s.backgroundSize = 'cover';
  s.backgroundColor = 'transparent';
  s.border = 0;
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.MozUserSelect = 'none';
  s.cursor = 'pointer';
  s.padding = '12px';
  s.zIndex = 1;
  s.display = 'none';
  s.boxSizing = 'content-box';

  // Prevent button from being selected and dragged.
  button.draggable = false;
  button.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });

  // Style it on hover.
  button.addEventListener('mouseenter', function(e) {
    s.filter = s.webkitFilter = 'drop-shadow(0 0 5px rgba(255,255,255,1))';
  });
  button.addEventListener('mouseleave', function(e) {
    s.filter = s.webkitFilter = '';
  });
  return button;
};

ButtonManager.prototype.setMode = function(mode, isVRCompatible) {
  isVRCompatible = isVRCompatible || WebVRConfig.FORCE_ENABLE_VR;
  if (!this.isVisible) {
    return;
  }
  switch (mode) {
    case Modes.NORMAL:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.fullscreen;
      this.vrButton.style.display = (isVRCompatible ? 'block' : 'none');
      break;
    case Modes.MAGIC_WINDOW:
      this.fsButton.style.display = 'block';
      this.fsButton.src = this.ICONS.exitFullscreen;
      this.vrButton.style.display = 'none';
      break;
    case Modes.VR:
      this.fsButton.style.display = 'none';
      this.vrButton.style.display = 'none';
      break;
  }

  // Hack for Safari Mac/iOS to force relayout (svg-specific issue)
  // http://goo.gl/hjgR6r
  var oldValue = this.fsButton.style.display;
  this.fsButton.style.display = 'inline-block';
  this.fsButton.offsetHeight;
  this.fsButton.style.display = oldValue;
};

ButtonManager.prototype.setVisibility = function(isVisible) {
  this.isVisible = isVisible;
  this.fsButton.style.display = isVisible ? 'block' : 'none';
  this.vrButton.style.display = isVisible ? 'block' : 'none';
};

ButtonManager.prototype.createClickHandler_ = function(eventName) {
  return function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.emit(eventName);
  }.bind(this);
};

ButtonManager.prototype.loadIcons_ = function() {
  // Preload some hard-coded SVG.
  this.ICONS = {};
  this.ICONS.cardboard = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMjAuNzQgNkgzLjIxQzIuNTUgNiAyIDYuNTcgMiA3LjI4djEwLjQ0YzAgLjcuNTUgMS4yOCAxLjIzIDEuMjhoNC43OWMuNTIgMCAuOTYtLjMzIDEuMTQtLjc5bDEuNC0zLjQ4Yy4yMy0uNTkuNzktMS4wMSAxLjQ0LTEuMDFzMS4yMS40MiAxLjQ1IDEuMDFsMS4zOSAzLjQ4Yy4xOS40Ni42My43OSAxLjExLjc5aDQuNzljLjcxIDAgMS4yNi0uNTcgMS4yNi0xLjI4VjcuMjhjMC0uNy0uNTUtMS4yOC0xLjI2LTEuMjh6TTcuNSAxNC42MmMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTMgMS4xOCAwIDIuMTIuOTYgMi4xMiAyLjEzcy0uOTUgMi4xMi0yLjEyIDIuMTJ6bTkgMGMtMS4xNyAwLTIuMTMtLjk1LTIuMTMtMi4xMiAwLTEuMTcuOTYtMi4xMyAyLjEzLTIuMTNzMi4xMi45NiAyLjEyIDIuMTMtLjk1IDIuMTItMi4xMiAyLjEyeiIvPgogICAgPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgyNHYyNEgwVjB6Ii8+Cjwvc3ZnPgo=');
  this.ICONS.fullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNyAxNEg1djVoNXYtMkg3di0zem0tMi00aDJWN2gzVjVINXY1em0xMiA3aC0zdjJoNXYtNWgtMnYzek0xNCA1djJoM3YzaDJWNWgtNXoiLz4KPC9zdmc+Cg==');
  this.ICONS.exitFullscreen = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNNSAxNmgzdjNoMnYtNUg1djJ6bTMtOEg1djJoNVY1SDh2M3ptNiAxMWgydi0zaDN2LTJoLTV2NXptMi0xMVY1aC0ydjVoNVY4aC0zeiIvPgo8L3N2Zz4K');
  this.ICONS.settings = Util.base64('image/svg+xml', 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNHB4IiBoZWlnaHQ9IjI0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0ZGRkZGRiI+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+CiAgICA8cGF0aCBkPSJNMTkuNDMgMTIuOThjLjA0LS4zMi4wNy0uNjQuMDctLjk4cy0uMDMtLjY2LS4wNy0uOThsMi4xMS0xLjY1Yy4xOS0uMTUuMjQtLjQyLjEyLS42NGwtMi0zLjQ2Yy0uMTItLjIyLS4zOS0uMy0uNjEtLjIybC0yLjQ5IDFjLS41Mi0uNC0xLjA4LS43My0xLjY5LS45OGwtLjM4LTIuNjVDMTQuNDYgMi4xOCAxNC4yNSAyIDE0IDJoLTRjLS4yNSAwLS40Ni4xOC0uNDkuNDJsLS4zOCAyLjY1Yy0uNjEuMjUtMS4xNy41OS0xLjY5Ljk4bC0yLjQ5LTFjLS4yMy0uMDktLjQ5IDAtLjYxLjIybC0yIDMuNDZjLS4xMy4yMi0uMDcuNDkuMTIuNjRsMi4xMSAxLjY1Yy0uMDQuMzItLjA3LjY1LS4wNy45OHMuMDMuNjYuMDcuOThsLTIuMTEgMS42NWMtLjE5LjE1LS4yNC40Mi0uMTIuNjRsMiAzLjQ2Yy4xMi4yMi4zOS4zLjYxLjIybDIuNDktMWMuNTIuNCAxLjA4LjczIDEuNjkuOThsLjM4IDIuNjVjLjAzLjI0LjI0LjQyLjQ5LjQyaDRjLjI1IDAgLjQ2LS4xOC40OS0uNDJsLjM4LTIuNjVjLjYxLS4yNSAxLjE3LS41OSAxLjY5LS45OGwyLjQ5IDFjLjIzLjA5LjQ5IDAgLjYxLS4yMmwyLTMuNDZjLjEyLS4yMi4wNy0uNDktLjEyLS42NGwtMi4xMS0xLjY1ek0xMiAxNS41Yy0xLjkzIDAtMy41LTEuNTctMy41LTMuNXMxLjU3LTMuNSAzLjUtMy41IDMuNSAxLjU3IDMuNSAzLjUtMS41NyAzLjUtMy41IDMuNXoiLz4KPC9zdmc+Cg==');
};

module.exports = ButtonManager;

},{"./emitter.js":2,"./modes.js":3,"./util.js":4}],2:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function Emitter() {
  this.callbacks = {};
}

Emitter.prototype.emit = function(eventName) {
  var callbacks = this.callbacks[eventName];
  if (!callbacks) {
    //console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments);
  // Eliminate the first param (the callback).
  args.shift();
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(this, args);
  }
};

Emitter.prototype.on = function(eventName, callback) {
  if (eventName in this.callbacks) {
    this.callbacks[eventName].push(callback);
  } else {
    this.callbacks[eventName] = [callback];
  }
};

module.exports = Emitter;

},{}],3:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Modes = {
  UNKNOWN: 0,
  // Not fullscreen, just tracking.
  NORMAL: 1,
  // Magic window immersive mode.
  MAGIC_WINDOW: 2,
  // Full screen split screen VR mode.
  VR: 3,
};

module.exports = Modes;

},{}],4:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = {};

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.isFirefox = function() {
  return /firefox/i.test(navigator.userAgent);
};

Util.isIOS = function() {
  return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
};

Util.isIFrame = function() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

Util.appendQueryParameter = function(url, key, value) {
  // Determine delimiter based on if the URL already GET parameters in it.
  var delimiter = (url.indexOf('?') < 0 ? '?' : '&');
  url += delimiter + key + '=' + value;
  return url;
};

// From http://goo.gl/4WX3tg
Util.getQueryParameter = function(name) {
  var name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

module.exports = Util;

},{}],5:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ButtonManager = _dereq_('./button-manager.js');
var Emitter = _dereq_('./emitter.js');
var Modes = _dereq_('./modes.js');
var Util = _dereq_('./util.js');

/**
 * Helper for getting in and out of VR mode.
 */
function WebVRManager(renderer, effect, params) {
  this.params = params || {};

  this.mode = Modes.UNKNOWN;

  // Set option to hide the button.
  this.hideButton = this.params.hideButton || false;
  // Whether or not the FOV should be distorted or un-distorted. By default, it
  // should be distorted, but in the case of vertex shader based distortion,
  // ensure that we use undistorted parameters.
  this.predistorted = !!this.params.predistorted;

  // Save the THREE.js renderer and effect for later.
  this.renderer = renderer;
  this.effect = effect;
  var polyfillWrapper = document.querySelector('.webvr-polyfill-fullscreen-wrapper');
  this.button = new ButtonManager(polyfillWrapper);

  this.isFullscreenDisabled = !!Util.getQueryParameter('no_fullscreen');
  this.startMode = Modes.NORMAL;
  var startModeParam = parseInt(Util.getQueryParameter('start_mode'));
  if (!isNaN(startModeParam)) {
    this.startMode = startModeParam;
  }

  if (this.hideButton) {
    this.button.setVisibility(false);
  }

  // Check if the browser is compatible with WebVR.
  this.getDeviceByType_(VRDisplay).then(function(hmd) {
    this.hmd = hmd;

    // Only enable VR mode if there's a VR device attached or we are running the
    // polyfill on mobile.
    if (!this.isVRCompatibleOverride) {
      this.isVRCompatible =  !hmd.isPolyfilled || Util.isMobile();
    }

    switch (this.startMode) {
      case Modes.MAGIC_WINDOW:
        this.setMode_(Modes.MAGIC_WINDOW);
        break;
      case Modes.VR:
        this.enterVRMode_();
        this.setMode_(Modes.VR);
        break;
      default:
        this.setMode_(Modes.NORMAL);
    }

    this.emit('initialized');
  }.bind(this));

  // Hook up button listeners.
  this.button.on('fs', this.onFSClick_.bind(this));
  this.button.on('vr', this.onVRClick_.bind(this));

  // Bind to fullscreen events.
  document.addEventListener('webkitfullscreenchange',
      this.onFullscreenChange_.bind(this));
  document.addEventListener('mozfullscreenchange',
      this.onFullscreenChange_.bind(this));
  document.addEventListener('msfullscreenchange',
      this.onFullscreenChange_.bind(this));

  // Bind to VR* specific events.
  window.addEventListener('vrdisplaypresentchange',
      this.onVRDisplayPresentChange_.bind(this));
  window.addEventListener('vrdisplaydeviceparamschange',
      this.onVRDisplayDeviceParamsChange_.bind(this));
}

WebVRManager.prototype = new Emitter();

// Expose these values externally.
WebVRManager.Modes = Modes;

WebVRManager.prototype.render = function(scene, camera, timestamp) {
  // Scene may be an array of two scenes, one for each eye.
  if (scene instanceof Array) {
    this.effect.render(scene[0], camera);
  } else {
    this.effect.render(scene, camera);
  }
};

WebVRManager.prototype.setVRCompatibleOverride = function(isVRCompatible) {
  this.isVRCompatible = isVRCompatible;
  this.isVRCompatibleOverride = true;

  // Don't actually change modes, just update the buttons.
  this.button.setMode(this.mode, this.isVRCompatible);
};

WebVRManager.prototype.setFullscreenCallback = function(callback) {
  this.fullscreenCallback = callback;
};

WebVRManager.prototype.setVRCallback = function(callback) {
  this.vrCallback = callback;
};

WebVRManager.prototype.setExitFullscreenCallback = function(callback) {
  this.exitFullscreenCallback = callback;
}

/**
 * Promise returns true if there is at least one HMD device available.
 */
WebVRManager.prototype.getDeviceByType_ = function(type) {
  return new Promise(function(resolve, reject) {
    navigator.getVRDisplays().then(function(displays) {
      // Promise succeeds, but check if there are any displays actually.
      for (var i = 0; i < displays.length; i++) {
        if (displays[i] instanceof type) {
          resolve(displays[i]);
          break;
        }
      }
      resolve(null);
    }, function() {
      // No displays are found.
      resolve(null);
    });
  });
};

/**
 * Helper for entering VR mode.
 */
WebVRManager.prototype.enterVRMode_ = function() {
  this.hmd.requestPresent([{
    source: this.renderer.domElement,
    predistorted: this.predistorted
  }]);
};

WebVRManager.prototype.setMode_ = function(mode) {
  var oldMode = this.mode;
  if (mode == this.mode) {
    console.warn('Not changing modes, already in %s', mode);
    return;
  }
  // console.log('Mode change: %s => %s', this.mode, mode);
  this.mode = mode;
  this.button.setMode(mode, this.isVRCompatible);

  // Emit an event indicating the mode changed.
  this.emit('modechange', mode, oldMode);
};

/**
 * Main button was clicked.
 */
WebVRManager.prototype.onFSClick_ = function() {
  switch (this.mode) {
    case Modes.NORMAL:
      // TODO: Remove this hack if/when iOS gets real fullscreen mode.
      // If this is an iframe on iOS, break out and open in no_fullscreen mode.
      if (Util.isIOS() && Util.isIFrame()) {
        if (this.fullscreenCallback) {
          this.fullscreenCallback();
        } else {
          var url = window.location.href;
          url = Util.appendQueryParameter(url, 'no_fullscreen', 'true');
          url = Util.appendQueryParameter(url, 'start_mode', Modes.MAGIC_WINDOW);
          top.location.href = url;
          return;
        }
      }
      this.setMode_(Modes.MAGIC_WINDOW);
      this.requestFullscreen_();
      break;
    case Modes.MAGIC_WINDOW:
      if (this.isFullscreenDisabled) {
        window.history.back();
        return;
      }
      if (this.exitFullscreenCallback) {
        this.exitFullscreenCallback();
      }
      this.setMode_(Modes.NORMAL);
      this.exitFullscreen_();
      break;
  }
};

/**
 * The VR button was clicked.
 */
WebVRManager.prototype.onVRClick_ = function() {
  // TODO: Remove this hack when iOS has fullscreen mode.
  // If this is an iframe on iOS, break out and open in no_fullscreen mode.
  if (this.mode == Modes.NORMAL && Util.isIOS() && Util.isIFrame()) {
    if (this.vrCallback) {
      this.vrCallback();
    } else {
      var url = window.location.href;
      url = Util.appendQueryParameter(url, 'no_fullscreen', 'true');
      url = Util.appendQueryParameter(url, 'start_mode', Modes.VR);
      top.location.href = url;
      return;
    }
  }
  this.enterVRMode_();
};

WebVRManager.prototype.requestFullscreen_ = function() {
  var canvas = document.body;
  //var canvas = this.renderer.domElement;
  if (canvas.requestFullscreen) {
    canvas.requestFullscreen();
  } else if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen();
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  } else if (canvas.msRequestFullscreen) {
    canvas.msRequestFullscreen();
  }
};

WebVRManager.prototype.exitFullscreen_ = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

WebVRManager.prototype.onVRDisplayPresentChange_ = function(e) {
  console.log('onVRDisplayPresentChange_', e);
  if (this.hmd.isPresenting) {
    this.setMode_(Modes.VR);
  } else {
    this.setMode_(Modes.NORMAL);
  }
};

WebVRManager.prototype.onVRDisplayDeviceParamsChange_ = function(e) {
  console.log('onVRDisplayDeviceParamsChange_', e);
};

WebVRManager.prototype.onFullscreenChange_ = function(e) {
  // If we leave full-screen, go back to normal mode.
  if (document.webkitFullscreenElement === null ||
      document.mozFullScreenElement === null) {
    this.setMode_(Modes.NORMAL);
  }
};

module.exports = WebVRManager;

},{"./button-manager.js":1,"./emitter.js":2,"./modes.js":3,"./util.js":4}]},{},[5])(5)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(_dereq_,module,exports){
module.exports={
  "_from": "webvr-polyfill@0.9.41",
  "_id": "webvr-polyfill@0.9.41",
  "_inBundle": false,
  "_integrity": "sha512-xgZPm7DXd2iUn4wh+/ubh1AzYWaHlx6VCmpxgTvoKzi1sMz9ePChQvsq1tm18aUfuzs6dtMrnNWoaQIwl81QsQ==",
  "_location": "/webvr-polyfill",
  "_phantomChildren": {},
  "_requested": {
    "type": "version",
    "registry": true,
    "raw": "webvr-polyfill@0.9.41",
    "name": "webvr-polyfill",
    "escapedName": "webvr-polyfill",
    "rawSpec": "0.9.41",
    "saveSpec": null,
    "fetchSpec": "0.9.41"
  },
  "_requiredBy": [
    "#USER",
    "/",
    "/webvr-boilerplate"
  ],
  "_resolved": "https://registry.npmjs.org/webvr-polyfill/-/webvr-polyfill-0.9.41.tgz",
  "_shasum": "dcaaed05ea8e14a44b629679ca32b9a35780e0e3",
  "_spec": "webvr-polyfill@0.9.41",
  "_where": "/Users/dee/Sites/vr-hosting/node_modules/vrview",
  "authors": [
    "Boris Smus <boris@smus.com>",
    "Brandon Jones <tojiro@gmail.com>",
    "Jordan Santell <jordan@jsantell.com>"
  ],
  "bugs": {
    "url": "https://github.com/googlevr/webvr-polyfill/issues"
  },
  "bundleDependencies": false,
  "deprecated": false,
  "description": "Use WebVR today, on mobile or desktop, without requiring a special browser build.",
  "devDependencies": {
    "chai": "^3.5.0",
    "jsdom": "^9.12.0",
    "mocha": "^3.2.0",
    "semver": "^5.3.0",
    "webpack": "^2.6.1",
    "webpack-dev-server": "2.7.1"
  },
  "homepage": "https://github.com/googlevr/webvr-polyfill",
  "keywords": [
    "vr",
    "webvr"
  ],
  "license": "Apache-2.0",
  "main": "src/node-entry",
  "name": "webvr-polyfill",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/googlevr/webvr-polyfill.git"
  },
  "scripts": {
    "build": "webpack",
    "start": "npm run watch",
    "test": "mocha",
    "watch": "webpack-dev-server"
  },
  "version": "0.9.41"
}

},{}],9:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var WakeLock = _dereq_('./wakelock.js');

// Start at a higher number to reduce chance of conflict.
var nextDisplayId = 1000;
var hasShowDeprecationWarning = false;

var defaultLeftBounds = [0, 0, 0.5, 1];
var defaultRightBounds = [0.5, 0, 0.5, 1];

/**
 * The base class for all VR frame data.
 */

function VRFrameData() {
  this.leftProjectionMatrix = new Float32Array(16);
  this.leftViewMatrix = new Float32Array(16);
  this.rightProjectionMatrix = new Float32Array(16);
  this.rightViewMatrix = new Float32Array(16);
  this.pose = null;
};

/**
 * The base class for all VR displays.
 */
function VRDisplay() {
  this.isPolyfilled = true;
  this.displayId = nextDisplayId++;
  this.displayName = 'webvr-polyfill displayName';

  this.depthNear = 0.01;
  this.depthFar = 10000.0;

  this.isConnected = true;
  this.isPresenting = false;
  this.capabilities = {
    hasPosition: false,
    hasOrientation: false,
    hasExternalDisplay: false,
    canPresent: false,
    maxLayers: 1
  };
  this.stageParameters = null;

  // "Private" members.
  this.waitingForPresent_ = false;
  this.layer_ = null;

  this.fullscreenElement_ = null;
  this.fullscreenWrapper_ = null;
  this.fullscreenElementCachedStyle_ = null;

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;

  this.wakelock_ = new WakeLock();
}

VRDisplay.prototype.getFrameData = function(frameData) {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return Util.frameDataFromPose(frameData, this.getPose(), this);
};

VRDisplay.prototype.getPose = function() {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return this.getImmediatePose();
};

VRDisplay.prototype.requestAnimationFrame = function(callback) {
  return window.requestAnimationFrame(callback);
};

VRDisplay.prototype.cancelAnimationFrame = function(id) {
  return window.cancelAnimationFrame(id);
};

VRDisplay.prototype.wrapForFullscreen = function(element) {
  // Don't wrap in iOS.
  if (Util.isIOS()) {
    return element;
  }
  if (!this.fullscreenWrapper_) {
    this.fullscreenWrapper_ = document.createElement('div');
    var cssProperties = [
      'height: ' + Math.min(screen.height, screen.width) + 'px !important',
      'top: 0 !important',
      'left: 0 !important',
      'right: 0 !important',
      'border: 0',
      'margin: 0',
      'padding: 0',
      'z-index: 999999 !important',
      'position: fixed',
    ];
    this.fullscreenWrapper_.setAttribute('style', cssProperties.join('; ') + ';');
    this.fullscreenWrapper_.classList.add('webvr-polyfill-fullscreen-wrapper');
  }

  if (this.fullscreenElement_ == element) {
    return this.fullscreenWrapper_;
  }

  // Remove any previously applied wrappers
  this.removeFullscreenWrapper();

  this.fullscreenElement_ = element;
  var parent = this.fullscreenElement_.parentElement;
  parent.insertBefore(this.fullscreenWrapper_, this.fullscreenElement_);
  parent.removeChild(this.fullscreenElement_);
  this.fullscreenWrapper_.insertBefore(this.fullscreenElement_, this.fullscreenWrapper_.firstChild);
  this.fullscreenElementCachedStyle_ = this.fullscreenElement_.getAttribute('style');

  var self = this;
  function applyFullscreenElementStyle() {
    if (!self.fullscreenElement_) {
      return;
    }

    var cssProperties = [
      'position: absolute',
      'top: 0',
      'left: 0',
      'width: ' + Math.max(screen.width, screen.height) + 'px',
      'height: ' + Math.min(screen.height, screen.width) + 'px',
      'border: 0',
      'margin: 0',
      'padding: 0',
    ];
    self.fullscreenElement_.setAttribute('style', cssProperties.join('; ') + ';');
  }

  applyFullscreenElementStyle();

  return this.fullscreenWrapper_;
};

VRDisplay.prototype.removeFullscreenWrapper = function() {
  if (!this.fullscreenElement_) {
    return;
  }

  var element = this.fullscreenElement_;
  if (this.fullscreenElementCachedStyle_) {
    element.setAttribute('style', this.fullscreenElementCachedStyle_);
  } else {
    element.removeAttribute('style');
  }
  this.fullscreenElement_ = null;
  this.fullscreenElementCachedStyle_ = null;

  var parent = this.fullscreenWrapper_.parentElement;
  this.fullscreenWrapper_.removeChild(element);
  parent.insertBefore(element, this.fullscreenWrapper_);
  parent.removeChild(this.fullscreenWrapper_);

  return element;
};

VRDisplay.prototype.requestPresent = function(layers) {
  var wasPresenting = this.isPresenting;
  var self = this;

  if (!(layers instanceof Array)) {
    if (!hasShowDeprecationWarning) {
      console.warn("Using a deprecated form of requestPresent. Should pass in an array of VRLayers.");
      hasShowDeprecationWarning = true;
    }
    layers = [layers];
  }

  return new Promise(function(resolve, reject) {
    if (!self.capabilities.canPresent) {
      reject(new Error('VRDisplay is not capable of presenting.'));
      return;
    }

    if (layers.length == 0 || layers.length > self.capabilities.maxLayers) {
      reject(new Error('Invalid number of layers.'));
      return;
    }

    var incomingLayer = layers[0];
    if (!incomingLayer.source) {
      /*
      todo: figure out the correct behavior if the source is not provided.
      see https://github.com/w3c/webvr/issues/58
      */
      resolve();
      return;
    }

    var leftBounds = incomingLayer.leftBounds || defaultLeftBounds;
    var rightBounds = incomingLayer.rightBounds || defaultRightBounds;
    if (wasPresenting) {
      // Already presenting, just changing configuration
      var layer = self.layer_;
      if (layer.source !== incomingLayer.source) {
        layer.source = incomingLayer.source;
      }

      for (var i = 0; i < 4; i++) {
        layer.leftBounds[i] = leftBounds[i];
        layer.rightBounds[i] = rightBounds[i];
      }

      resolve();
      return;
    }

    // Was not already presenting.
    self.layer_ = {
      predistorted: incomingLayer.predistorted,
      source: incomingLayer.source,
      leftBounds: leftBounds.slice(0),
      rightBounds: rightBounds.slice(0)
    };

    self.waitingForPresent_ = false;
    if (self.layer_ && self.layer_.source) {
      var fullscreenElement = self.wrapForFullscreen(self.layer_.source);

      var onFullscreenChange = function() {
        var actualFullscreenElement = Util.getFullscreenElement();

        self.isPresenting = (fullscreenElement === actualFullscreenElement);
        if (self.isPresenting) {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape-primary').catch(function(error){
                    console.error('screen.orientation.lock() failed due to', error.message)
            });
          }
          self.waitingForPresent_ = false;
          self.beginPresent_();
          resolve();
        } else {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          self.removeFullscreenWrapper();
          self.wakelock_.release();
          self.endPresent_();
          self.removeFullscreenListeners_();
        }
        self.fireVRDisplayPresentChange_();
      }
      var onFullscreenError = function() {
        if (!self.waitingForPresent_) {
          return;
        }

        self.removeFullscreenWrapper();
        self.removeFullscreenListeners_();

        self.wakelock_.release();
        self.waitingForPresent_ = false;
        self.isPresenting = false;

        reject(new Error('Unable to present.'));
      }

      self.addFullscreenListeners_(fullscreenElement,
          onFullscreenChange, onFullscreenError);

      if (Util.requestFullscreen(fullscreenElement)) {
        self.wakelock_.request();
        self.waitingForPresent_ = true;
      } else if (Util.isIOS() || Util.isWebViewAndroid()) {
        // *sigh* Just fake it.
        self.wakelock_.request();
        self.isPresenting = true;
        self.beginPresent_();
        self.fireVRDisplayPresentChange_();
        resolve();
      }
    }

    if (!self.waitingForPresent_ && !Util.isIOS()) {
      Util.exitFullscreen();
      reject(new Error('Unable to present.'));
    }
  });
};

VRDisplay.prototype.exitPresent = function() {
  var wasPresenting = this.isPresenting;
  var self = this;
  this.isPresenting = false;
  this.layer_ = null;
  this.wakelock_.release();

  return new Promise(function(resolve, reject) {
    if (wasPresenting) {
      if (!Util.exitFullscreen() && Util.isIOS()) {
        self.endPresent_();
        self.fireVRDisplayPresentChange_();
      }

      if (Util.isWebViewAndroid()) {
        self.removeFullscreenWrapper();
        self.removeFullscreenListeners_();
        self.endPresent_();
        self.fireVRDisplayPresentChange_();
      }

      resolve();
    } else {
      reject(new Error('Was not presenting to VRDisplay.'));
    }
  });
};

VRDisplay.prototype.getLayers = function() {
  if (this.layer_) {
    return [this.layer_];
  }
  return [];
};

VRDisplay.prototype.fireVRDisplayPresentChange_ = function() {
  // Important: unfortunately we cannot have full spec compliance here.
  // CustomEvent custom fields all go under e.detail (so the VRDisplay ends up
  // being e.detail.display, instead of e.display as per WebVR spec).
  var event = new CustomEvent('vrdisplaypresentchange', {detail: {display: this}});
  window.dispatchEvent(event);
};

VRDisplay.prototype.fireVRDisplayConnect_ = function() {
  // Important: unfortunately we cannot have full spec compliance here.
  // CustomEvent custom fields all go under e.detail (so the VRDisplay ends up
  // being e.detail.display, instead of e.display as per WebVR spec).
  var event = new CustomEvent('vrdisplayconnect', {detail: {display: this}});
  window.dispatchEvent(event);
};

VRDisplay.prototype.addFullscreenListeners_ = function(element, changeHandler, errorHandler) {
  this.removeFullscreenListeners_();

  this.fullscreenEventTarget_ = element;
  this.fullscreenChangeHandler_ = changeHandler;
  this.fullscreenErrorHandler_ = errorHandler;

  if (changeHandler) {
    if (document.fullscreenEnabled) {
      element.addEventListener('fullscreenchange', changeHandler, false);
    } else if (document.webkitFullscreenEnabled) {
      element.addEventListener('webkitfullscreenchange', changeHandler, false);
    } else if (document.mozFullScreenEnabled) {
      document.addEventListener('mozfullscreenchange', changeHandler, false);
    } else if (document.msFullscreenEnabled) {
      element.addEventListener('msfullscreenchange', changeHandler, false);
    }
  }

  if (errorHandler) {
    if (document.fullscreenEnabled) {
      element.addEventListener('fullscreenerror', errorHandler, false);
    } else if (document.webkitFullscreenEnabled) {
      element.addEventListener('webkitfullscreenerror', errorHandler, false);
    } else if (document.mozFullScreenEnabled) {
      document.addEventListener('mozfullscreenerror', errorHandler, false);
    } else if (document.msFullscreenEnabled) {
      element.addEventListener('msfullscreenerror', errorHandler, false);
    }
  }
};

VRDisplay.prototype.removeFullscreenListeners_ = function() {
  if (!this.fullscreenEventTarget_)
    return;

  var element = this.fullscreenEventTarget_;

  if (this.fullscreenChangeHandler_) {
    var changeHandler = this.fullscreenChangeHandler_;
    element.removeEventListener('fullscreenchange', changeHandler, false);
    element.removeEventListener('webkitfullscreenchange', changeHandler, false);
    document.removeEventListener('mozfullscreenchange', changeHandler, false);
    element.removeEventListener('msfullscreenchange', changeHandler, false);
  }

  if (this.fullscreenErrorHandler_) {
    var errorHandler = this.fullscreenErrorHandler_;
    element.removeEventListener('fullscreenerror', errorHandler, false);
    element.removeEventListener('webkitfullscreenerror', errorHandler, false);
    document.removeEventListener('mozfullscreenerror', errorHandler, false);
    element.removeEventListener('msfullscreenerror', errorHandler, false);
  }

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;
};

VRDisplay.prototype.beginPresent_ = function() {
  // Override to add custom behavior when presentation begins.
};

VRDisplay.prototype.endPresent_ = function() {
  // Override to add custom behavior when presentation ends.
};

VRDisplay.prototype.submitFrame = function(pose) {
  // Override to add custom behavior for frame submission.
};

VRDisplay.prototype.getEyeParameters = function(whichEye) {
  // Override to return accurate eye parameters if canPresent is true.
  return null;
};

/*
 * Deprecated classes
 */

/**
 * The base class for all VR devices. (Deprecated)
 */
function VRDevice() {
  this.isPolyfilled = true;
  this.hardwareUnitId = 'webvr-polyfill hardwareUnitId';
  this.deviceId = 'webvr-polyfill deviceId';
  this.deviceName = 'webvr-polyfill deviceName';
}

/**
 * The base class for all VR HMD devices. (Deprecated)
 */
function HMDVRDevice() {
}
HMDVRDevice.prototype = new VRDevice();

/**
 * The base class for all VR position sensor devices. (Deprecated)
 */
function PositionSensorVRDevice() {
}
PositionSensorVRDevice.prototype = new VRDevice();

module.exports.VRFrameData = VRFrameData;
module.exports.VRDisplay = VRDisplay;
module.exports.VRDevice = VRDevice;
module.exports.HMDVRDevice = HMDVRDevice;
module.exports.PositionSensorVRDevice = PositionSensorVRDevice;

},{"./util.js":29,"./wakelock.js":31}],10:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardUI = _dereq_('./cardboard-ui.js');
var Util = _dereq_('./util.js');
var WGLUPreserveGLState = _dereq_('./deps/wglu-preserve-state.js');

var distortionVS = [
  'attribute vec2 position;',
  'attribute vec3 texCoord;',

  'varying vec2 vTexCoord;',

  'uniform vec4 viewportOffsetScale[2];',

  'void main() {',
  '  vec4 viewport = viewportOffsetScale[int(texCoord.z)];',
  '  vTexCoord = (texCoord.xy * viewport.zw) + viewport.xy;',
  '  gl_Position = vec4( position, 1.0, 1.0 );',
  '}',
].join('\n');

var distortionFS = [
  'precision mediump float;',
  'uniform sampler2D diffuse;',

  'varying vec2 vTexCoord;',

  'void main() {',
  '  gl_FragColor = texture2D(diffuse, vTexCoord);',
  '}',
].join('\n');

/**
 * A mesh-based distorter.
 */
function CardboardDistorter(gl) {
  this.gl = gl;
  this.ctxAttribs = gl.getContextAttributes();

  this.meshWidth = 20;
  this.meshHeight = 20;

  this.bufferScale = window.WebVRConfig.BUFFER_SCALE;

  this.bufferWidth = gl.drawingBufferWidth;
  this.bufferHeight = gl.drawingBufferHeight;

  // Patching support
  this.realBindFramebuffer = gl.bindFramebuffer;
  this.realEnable = gl.enable;
  this.realDisable = gl.disable;
  this.realColorMask = gl.colorMask;
  this.realClearColor = gl.clearColor;
  this.realViewport = gl.viewport;

  if (!Util.isIOS()) {
    this.realCanvasWidth = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'width');
    this.realCanvasHeight = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'height');
  }

  this.isPatched = false;

  // State tracking
  this.lastBoundFramebuffer = null;
  this.cullFace = false;
  this.depthTest = false;
  this.blend = false;
  this.scissorTest = false;
  this.stencilTest = false;
  this.viewport = [0, 0, 0, 0];
  this.colorMask = [true, true, true, true];
  this.clearColor = [0, 0, 0, 0];

  this.attribs = {
    position: 0,
    texCoord: 1
  };
  this.program = Util.linkProgram(gl, distortionVS, distortionFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.viewportOffsetScale = new Float32Array(8);
  this.setTextureBounds();

  this.vertexBuffer = gl.createBuffer();
  this.indexBuffer = gl.createBuffer();
  this.indexCount = 0;

  this.renderTarget = gl.createTexture();
  this.framebuffer = gl.createFramebuffer();

  this.depthStencilBuffer = null;
  this.depthBuffer = null;
  this.stencilBuffer = null;

  if (this.ctxAttribs.depth && this.ctxAttribs.stencil) {
    this.depthStencilBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.depth) {
    this.depthBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.stencil) {
    this.stencilBuffer = gl.createRenderbuffer();
  }

  this.patch();

  this.onResize();

  if (!window.WebVRConfig.CARDBOARD_UI_DISABLED) {
    this.cardboardUI = new CardboardUI(gl);
  }
};

/**
 * Tears down all the resources created by the distorter and removes any
 * patches.
 */
CardboardDistorter.prototype.destroy = function() {
  var gl = this.gl;

  this.unpatch();

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
  gl.deleteBuffer(this.indexBuffer);
  gl.deleteTexture(this.renderTarget);
  gl.deleteFramebuffer(this.framebuffer);
  if (this.depthStencilBuffer) {
    gl.deleteRenderbuffer(this.depthStencilBuffer);
  }
  if (this.depthBuffer) {
    gl.deleteRenderbuffer(this.depthBuffer);
  }
  if (this.stencilBuffer) {
    gl.deleteRenderbuffer(this.stencilBuffer);
  }

  if (this.cardboardUI) {
    this.cardboardUI.destroy();
  }
};


/**
 * Resizes the backbuffer to match the canvas width and height.
 */
CardboardDistorter.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.RENDERBUFFER_BINDING,
    gl.TEXTURE_BINDING_2D, gl.TEXTURE0
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind real backbuffer and clear it once. We don't need to clear it again
    // after that because we're overwriting the same area every frame.
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Put things in a good state
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    self.realClearColor.call(gl, 0, 0, 0, 1);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Now bind and resize the fake backbuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.framebuffer);

    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);
    gl.texImage2D(gl.TEXTURE_2D, 0, self.ctxAttribs.alpha ? gl.RGBA : gl.RGB,
        self.bufferWidth, self.bufferHeight, 0,
        self.ctxAttribs.alpha ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, self.renderTarget, 0);

    if (self.ctxAttribs.depth && self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthStencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.depthStencilBuffer);
    } else if (self.ctxAttribs.depth) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER, self.depthBuffer);
    } else if (self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.stencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.stencilBuffer);
    }

    if (!gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer incomplete!');
    }

    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);

    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    self.realClearColor.apply(gl, self.clearColor);
  });

  if (this.cardboardUI) {
    this.cardboardUI.onResize();
  }
};

CardboardDistorter.prototype.patch = function() {
  if (this.isPatched) {
    return;
  }

  var self = this;
  var canvas = this.gl.canvas;
  var gl = this.gl;

  if (!Util.isIOS()) {
    canvas.width = Util.getScreenWidth() * this.bufferScale;
    canvas.height = Util.getScreenHeight() * this.bufferScale;

    Object.defineProperty(canvas, 'width', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferWidth;
      },
      set: function(value) {
        self.bufferWidth = value;
        self.realCanvasWidth.set.call(canvas, value);
        self.onResize();
      }
    });

    Object.defineProperty(canvas, 'height', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferHeight;
      },
      set: function(value) {
        self.bufferHeight = value;
        self.realCanvasHeight.set.call(canvas, value);
        self.onResize();
      }
    });
  }

  this.lastBoundFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  if (this.lastBoundFramebuffer == null) {
    this.lastBoundFramebuffer = this.framebuffer;
    this.gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }

  this.gl.bindFramebuffer = function(target, framebuffer) {
    self.lastBoundFramebuffer = framebuffer ? framebuffer : self.framebuffer;
    // Silently make calls to bind the default framebuffer bind ours instead.
    self.realBindFramebuffer.call(gl, target, self.lastBoundFramebuffer);
  };

  this.cullFace = gl.getParameter(gl.CULL_FACE);
  this.depthTest = gl.getParameter(gl.DEPTH_TEST);
  this.blend = gl.getParameter(gl.BLEND);
  this.scissorTest = gl.getParameter(gl.SCISSOR_TEST);
  this.stencilTest = gl.getParameter(gl.STENCIL_TEST);

  gl.enable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = true; break;
      case gl.DEPTH_TEST: self.depthTest = true; break;
      case gl.BLEND: self.blend = true; break;
      case gl.SCISSOR_TEST: self.scissorTest = true; break;
      case gl.STENCIL_TEST: self.stencilTest = true; break;
    }
    self.realEnable.call(gl, pname);
  };

  gl.disable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = false; break;
      case gl.DEPTH_TEST: self.depthTest = false; break;
      case gl.BLEND: self.blend = false; break;
      case gl.SCISSOR_TEST: self.scissorTest = false; break;
      case gl.STENCIL_TEST: self.stencilTest = false; break;
    }
    self.realDisable.call(gl, pname);
  };

  this.colorMask = gl.getParameter(gl.COLOR_WRITEMASK);
  gl.colorMask = function(r, g, b, a) {
    self.colorMask[0] = r;
    self.colorMask[1] = g;
    self.colorMask[2] = b;
    self.colorMask[3] = a;
    self.realColorMask.call(gl, r, g, b, a);
  };

  this.clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
  gl.clearColor = function(r, g, b, a) {
    self.clearColor[0] = r;
    self.clearColor[1] = g;
    self.clearColor[2] = b;
    self.clearColor[3] = a;
    self.realClearColor.call(gl, r, g, b, a);
  };

  this.viewport = gl.getParameter(gl.VIEWPORT);
  gl.viewport = function(x, y, w, h) {
    self.viewport[0] = x;
    self.viewport[1] = y;
    self.viewport[2] = w;
    self.viewport[3] = h;
    self.realViewport.call(gl, x, y, w, h);
  };

  this.isPatched = true;
  Util.safariCssSizeWorkaround(canvas);
};

CardboardDistorter.prototype.unpatch = function() {
  if (!this.isPatched) {
    return;
  }

  var gl = this.gl;
  var canvas = this.gl.canvas;

  if (!Util.isIOS()) {
    Object.defineProperty(canvas, 'width', this.realCanvasWidth);
    Object.defineProperty(canvas, 'height', this.realCanvasHeight);
  }
  canvas.width = this.bufferWidth;
  canvas.height = this.bufferHeight;

  gl.bindFramebuffer = this.realBindFramebuffer;
  gl.enable = this.realEnable;
  gl.disable = this.realDisable;
  gl.colorMask = this.realColorMask;
  gl.clearColor = this.realClearColor;
  gl.viewport = this.realViewport;

  // Check to see if our fake backbuffer is bound and bind the real backbuffer
  // if that's the case.
  if (this.lastBoundFramebuffer == this.framebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  this.isPatched = false;

  setTimeout(function() {
    Util.safariCssSizeWorkaround(canvas);
  }, 1);
};

CardboardDistorter.prototype.setTextureBounds = function(leftBounds, rightBounds) {
  if (!leftBounds) {
    leftBounds = [0, 0, 0.5, 1];
  }

  if (!rightBounds) {
    rightBounds = [0.5, 0, 0.5, 1];
  }

  // Left eye
  this.viewportOffsetScale[0] = leftBounds[0]; // X
  this.viewportOffsetScale[1] = leftBounds[1]; // Y
  this.viewportOffsetScale[2] = leftBounds[2]; // Width
  this.viewportOffsetScale[3] = leftBounds[3]; // Height

  // Right eye
  this.viewportOffsetScale[4] = rightBounds[0]; // X
  this.viewportOffsetScale[5] = rightBounds[1]; // Y
  this.viewportOffsetScale[6] = rightBounds[2]; // Width
  this.viewportOffsetScale[7] = rightBounds[3]; // Height
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardDistorter.prototype.submitFrame = function() {
  var gl = this.gl;
  var self = this;

  var glState = [];

  if (!window.WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
    glState.push(
      gl.CURRENT_PROGRAM,
      gl.ARRAY_BUFFER_BINDING,
      gl.ELEMENT_ARRAY_BUFFER_BINDING,
      gl.TEXTURE_BINDING_2D, gl.TEXTURE0
    );
  }

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind the real default framebuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Make sure the GL state is in a good place
    if (self.cullFace) { self.realDisable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realDisable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realDisable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realDisable.call(gl, gl.STENCIL_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // If the backbuffer has an alpha channel clear every frame so the page
    // doesn't show through.
    if (self.ctxAttribs.alpha || Util.isIOS()) {
      self.realClearColor.call(gl, 0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Bind distortion program and mesh
    gl.useProgram(self.program);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.enableVertexAttribArray(self.attribs.position);
    gl.enableVertexAttribArray(self.attribs.texCoord);
    gl.vertexAttribPointer(self.attribs.position, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(self.attribs.texCoord, 3, gl.FLOAT, false, 20, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(self.uniforms.diffuse, 0);
    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);

    gl.uniform4fv(self.uniforms.viewportOffsetScale, self.viewportOffsetScale);

    // Draws both eyes
    gl.drawElements(gl.TRIANGLES, self.indexCount, gl.UNSIGNED_SHORT, 0);

    if (self.cardboardUI) {
      self.cardboardUI.renderNoState();
    }

    // Bind the fake default framebuffer again
    self.realBindFramebuffer.call(self.gl, gl.FRAMEBUFFER, self.framebuffer);

    // If preserveDrawingBuffer == false clear the framebuffer
    if (!self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.call(gl, 0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (!window.WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
      self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);
    }

    // Restore state
    if (self.cullFace) { self.realEnable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realEnable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realEnable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realEnable.call(gl, gl.STENCIL_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    if (self.ctxAttribs.alpha || !self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.apply(gl, self.clearColor);
    }
  });

  // Workaround for the fact that Safari doesn't allow us to patch the canvas
  // width and height correctly. After each submit frame check to see what the
  // real backbuffer size has been set to and resize the fake backbuffer size
  // to match.
  if (Util.isIOS()) {
    var canvas = gl.canvas;
    if (canvas.width != self.bufferWidth || canvas.height != self.bufferHeight) {
      self.bufferWidth = canvas.width;
      self.bufferHeight = canvas.height;
      self.onResize();
    }
  }
};

/**
 * Call when the deviceInfo has changed. At this point we need
 * to re-calculate the distortion mesh.
 */
CardboardDistorter.prototype.updateDeviceInfo = function(deviceInfo) {
  var gl = this.gl;
  var self = this;

  var glState = [gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING];
  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = self.computeMeshVertices_(self.meshWidth, self.meshHeight, deviceInfo);
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Indices don't change based on device parameters, so only compute once.
    if (!self.indexCount) {
      var indices = self.computeMeshIndices_(self.meshWidth, self.meshHeight);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      self.indexCount = indices.length;
    }
  });
};

/**
 * Build the distortion mesh vertices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshVertices_ = function(width, height, deviceInfo) {
  var vertices = new Float32Array(2 * width * height * 5);

  var lensFrustum = deviceInfo.getLeftEyeVisibleTanAngles();
  var noLensFrustum = deviceInfo.getLeftEyeNoLensTanAngles();
  var viewport = deviceInfo.getLeftEyeVisibleScreenRect(noLensFrustum);
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        var u = i / (width - 1);
        var v = j / (height - 1);

        // Grid points regularly spaced in StreoScreen, and barrel distorted in
        // the mesh.
        var s = u;
        var t = v;
        var x = Util.lerp(lensFrustum[0], lensFrustum[2], u);
        var y = Util.lerp(lensFrustum[3], lensFrustum[1], v);
        var d = Math.sqrt(x * x + y * y);
        var r = deviceInfo.distortion.distortInverse(d);
        var p = x * r / d;
        var q = y * r / d;
        u = (p - noLensFrustum[0]) / (noLensFrustum[2] - noLensFrustum[0]);
        v = (q - noLensFrustum[3]) / (noLensFrustum[1] - noLensFrustum[3]);

        // Convert u,v to mesh screen coordinates.
        var aspect = deviceInfo.device.widthMeters / deviceInfo.device.heightMeters;

        // FIXME: The original Unity plugin multiplied U by the aspect ratio
        // and didn't multiply either value by 2, but that seems to get it
        // really close to correct looking for me. I hate this kind of "Don't
        // know why it works" code though, and wold love a more logical
        // explanation of what needs to happen here.
        u = (viewport.x + u * viewport.width - 0.5) * 2.0; //* aspect;
        v = (viewport.y + v * viewport.height - 0.5) * 2.0;

        vertices[(vidx * 5) + 0] = u; // position.x
        vertices[(vidx * 5) + 1] = v; // position.y
        vertices[(vidx * 5) + 2] = s; // texCoord.x
        vertices[(vidx * 5) + 3] = t; // texCoord.y
        vertices[(vidx * 5) + 4] = e; // texCoord.z (viewport index)
      }
    }
    var w = lensFrustum[2] - lensFrustum[0];
    lensFrustum[0] = -(w + lensFrustum[0]);
    lensFrustum[2] = w - lensFrustum[2];
    w = noLensFrustum[2] - noLensFrustum[0];
    noLensFrustum[0] = -(w + noLensFrustum[0]);
    noLensFrustum[2] = w - noLensFrustum[2];
    viewport.x = 1 - (viewport.x + viewport.width);
  }
  return vertices;
}

/**
 * Build the distortion mesh indices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshIndices_ = function(width, height) {
  var indices = new Uint16Array(2 * (width - 1) * (height - 1) * 6);
  var halfwidth = width / 2;
  var halfheight = height / 2;
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        if (i == 0 || j == 0)
          continue;
        // Build a quad.  Lower right and upper left quadrants have quads with
        // the triangle diagonal flipped to get the vignette to interpolate
        // correctly.
        if ((i <= halfwidth) == (j <= halfheight)) {
          // Quad diagonal lower left to upper right.
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - 1;
        } else {
          // Quad diagonal upper left to lower right.
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width - 1;
        }
      }
    }
  }
  return indices;
};

CardboardDistorter.prototype.getOwnPropertyDescriptor_ = function(proto, attrName) {
  var descriptor = Object.getOwnPropertyDescriptor(proto, attrName);
  // In some cases (ahem... Safari), the descriptor returns undefined get and
  // set fields. In this case, we need to create a synthetic property
  // descriptor. This works around some of the issues in
  // https://github.com/borismus/webvr-polyfill/issues/46
  if (descriptor.get === undefined || descriptor.set === undefined) {
    descriptor.configurable = true;
    descriptor.enumerable = true;
    descriptor.get = function() {
      return this.getAttribute(attrName);
    };
    descriptor.set = function(val) {
      this.setAttribute(attrName, val);
    };
  }
  return descriptor;
};

module.exports = CardboardDistorter;

},{"./cardboard-ui.js":11,"./deps/wglu-preserve-state.js":13,"./util.js":29}],11:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var WGLUPreserveGLState = _dereq_('./deps/wglu-preserve-state.js');

var uiVS = [
  'attribute vec2 position;',

  'uniform mat4 projectionMat;',

  'void main() {',
  '  gl_Position = projectionMat * vec4( position, -1.0, 1.0 );',
  '}',
].join('\n');

var uiFS = [
  'precision mediump float;',

  'uniform vec4 color;',

  'void main() {',
  '  gl_FragColor = color;',
  '}',
].join('\n');

var DEG2RAD = Math.PI/180.0;

// The gear has 6 identical sections, each spanning 60 degrees.
var kAnglePerGearSection = 60;

// Half-angle of the span of the outer rim.
var kOuterRimEndAngle = 12;

// Angle between the middle of the outer rim and the start of the inner rim.
var kInnerRimBeginAngle = 20;

// Distance from center to outer rim, normalized so that the entire model
// fits in a [-1, 1] x [-1, 1] square.
var kOuterRadius = 1;

// Distance from center to depressed rim, in model units.
var kMiddleRadius = 0.75;

// Radius of the inner hollow circle, in model units.
var kInnerRadius = 0.3125;

// Center line thickness in DP.
var kCenterLineThicknessDp = 4;

// Button width in DP.
var kButtonWidthDp = 28;

// Factor to scale the touch area that responds to the touch.
var kTouchSlopFactor = 1.5;

var Angles = [
  0, kOuterRimEndAngle, kInnerRimBeginAngle,
  kAnglePerGearSection - kInnerRimBeginAngle,
  kAnglePerGearSection - kOuterRimEndAngle
];

/**
 * Renders the alignment line and "options" gear. It is assumed that the canvas
 * this is rendered into covers the entire screen (or close to it.)
 */
function CardboardUI(gl) {
  this.gl = gl;

  this.attribs = {
    position: 0
  };
  this.program = Util.linkProgram(gl, uiVS, uiFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.vertexBuffer = gl.createBuffer();
  this.gearOffset = 0;
  this.gearVertexCount = 0;
  this.arrowOffset = 0;
  this.arrowVertexCount = 0;

  this.projMat = new Float32Array(16);

  this.listener = null;

  this.onResize();
};

/**
 * Tears down all the resources created by the UI renderer.
 */
CardboardUI.prototype.destroy = function() {
  var gl = this.gl;

  if (this.listener) {
    gl.canvas.removeEventListener('click', this.listener, false);
  }

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
};

/**
 * Adds a listener to clicks on the gear and back icons
 */
CardboardUI.prototype.listen = function(optionsCallback, backCallback) {
  var canvas = this.gl.canvas;
  this.listener = function(event) {
    var midline = canvas.clientWidth / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor;
    // Check to see if the user clicked on (or around) the gear icon
    if (event.clientX > midline - buttonSize &&
        event.clientX < midline + buttonSize &&
        event.clientY > canvas.clientHeight - buttonSize) {
      optionsCallback(event);
    }
    // Check to see if the user clicked on (or around) the back icon
    else if (event.clientX < buttonSize && event.clientY < buttonSize) {
      backCallback(event);
    }
  };
  canvas.addEventListener('click', this.listener, false);
};

/**
 * Builds the UI mesh.
 */
CardboardUI.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = [];

    var midline = gl.drawingBufferWidth / 2;

    // The gl buffer size will likely be smaller than the physical pixel count.
    // So we need to scale the dps down based on the actual buffer size vs physical pixel count.
    // This will properly size the ui elements no matter what the gl buffer resolution is
    var physicalPixels = Math.max(screen.width, screen.height) * window.devicePixelRatio;
    var scalingRatio = gl.drawingBufferWidth / physicalPixels;
    var dps = scalingRatio *  window.devicePixelRatio;

    var lineWidth = kCenterLineThicknessDp * dps / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor * dps;
    var buttonScale = kButtonWidthDp * dps / 2;
    var buttonBorder = ((kButtonWidthDp * kTouchSlopFactor) - kButtonWidthDp) * dps;

    // Build centerline
    vertices.push(midline - lineWidth, buttonSize);
    vertices.push(midline - lineWidth, gl.drawingBufferHeight);
    vertices.push(midline + lineWidth, buttonSize);
    vertices.push(midline + lineWidth, gl.drawingBufferHeight);

    // Build gear
    self.gearOffset = (vertices.length / 2);

    function addGearSegment(theta, r) {
      var angle = (90 - theta) * DEG2RAD;
      var x = Math.cos(angle);
      var y = Math.sin(angle);
      vertices.push(kInnerRadius * x * buttonScale + midline, kInnerRadius * y * buttonScale + buttonScale);
      vertices.push(r * x * buttonScale + midline, r * y * buttonScale + buttonScale);
    }

    for (var i = 0; i <= 6; i++) {
      var segmentTheta = i * kAnglePerGearSection;

      addGearSegment(segmentTheta, kOuterRadius);
      addGearSegment(segmentTheta + kOuterRimEndAngle, kOuterRadius);
      addGearSegment(segmentTheta + kInnerRimBeginAngle, kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kInnerRimBeginAngle), kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kOuterRimEndAngle), kOuterRadius);
    }

    self.gearVertexCount = (vertices.length / 2) - self.gearOffset;

    // Build back arrow
    self.arrowOffset = (vertices.length / 2);

    function addArrowVertex(x, y) {
      vertices.push(buttonBorder + x, gl.drawingBufferHeight - buttonBorder - y);
    }

    var angledLineWidth = lineWidth / Math.sin(45 * DEG2RAD);

    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, 0);
    addArrowVertex(buttonScale + angledLineWidth, angledLineWidth);
    addArrowVertex(angledLineWidth, buttonScale + angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, buttonScale * 2);
    addArrowVertex(buttonScale + angledLineWidth, (buttonScale * 2) - angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);

    addArrowVertex(angledLineWidth, buttonScale - lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale - lineWidth);
    addArrowVertex(angledLineWidth, buttonScale + lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale + lineWidth);

    self.arrowVertexCount = (vertices.length / 2) - self.arrowOffset;

    // Buffer data
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  });
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardUI.prototype.render = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.CULL_FACE,
    gl.DEPTH_TEST,
    gl.BLEND,
    gl.SCISSOR_TEST,
    gl.STENCIL_TEST,
    gl.COLOR_WRITEMASK,
    gl.VIEWPORT,

    gl.CURRENT_PROGRAM,
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Make sure the GL state is in a good place
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    self.renderNoState();
  });
};

CardboardUI.prototype.renderNoState = function() {
  var gl = this.gl;

  // Bind distortion program and mesh
  gl.useProgram(this.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.enableVertexAttribArray(this.attribs.position);
  gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 8, 0);

  gl.uniform4f(this.uniforms.color, 1.0, 1.0, 1.0, 1.0);

  Util.orthoMatrix(this.projMat, 0, gl.drawingBufferWidth, 0, gl.drawingBufferHeight, 0.1, 1024.0);
  gl.uniformMatrix4fv(this.uniforms.projectionMat, false, this.projMat);

  // Draws UI element
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.gearOffset, this.gearVertexCount);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.arrowOffset, this.arrowVertexCount);
};

module.exports = CardboardUI;

},{"./deps/wglu-preserve-state.js":13,"./util.js":29}],12:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardDistorter = _dereq_('./cardboard-distorter.js');
var CardboardUI = _dereq_('./cardboard-ui.js');
var DeviceInfo = _dereq_('./device-info.js');
var Dpdb = _dereq_('./dpdb/dpdb.js');
var FusionPoseSensor = _dereq_('./sensor-fusion/fusion-pose-sensor.js');
var RotateInstructions = _dereq_('./rotate-instructions.js');
var ViewerSelector = _dereq_('./viewer-selector.js');
var VRDisplay = _dereq_('./base.js').VRDisplay;
var Util = _dereq_('./util.js');

var Eye = {
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * VRDisplay based on mobile device parameters and DeviceMotion APIs.
 */
function CardboardVRDisplay() {
  this.displayName = 'Cardboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;
  this.capabilities.canPresent = true;

  // "Private" members.
  this.bufferScale_ = window.WebVRConfig.BUFFER_SCALE;
  this.poseSensor_ = new FusionPoseSensor();
  this.distorter_ = null;
  this.cardboardUI_ = null;

  this.dpdb_ = new Dpdb(true, this.onDeviceParamsUpdated_.bind(this));
  this.deviceInfo_ = new DeviceInfo(this.dpdb_.getDeviceParams());

  this.viewerSelector_ = new ViewerSelector();
  this.viewerSelector_.onChange(this.onViewerChanged_.bind(this));

  // Set the correct initial viewer.
  this.deviceInfo_.setViewer(this.viewerSelector_.getCurrentViewer());

  if (!window.WebVRConfig.ROTATE_INSTRUCTIONS_DISABLED) {
    this.rotateInstructions_ = new RotateInstructions();
  }

  if (Util.isIOS()) {
    // Listen for resize events to workaround this awful Safari bug.
    window.addEventListener('resize', this.onResize_.bind(this));
  }
}
CardboardVRDisplay.prototype = new VRDisplay();

CardboardVRDisplay.prototype.getImmediatePose = function() {
  return {
    position: this.poseSensor_.getPosition(),
    orientation: this.poseSensor_.getOrientation(),
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

CardboardVRDisplay.prototype.resetPose = function() {
  this.poseSensor_.resetPose();
};

CardboardVRDisplay.prototype.getEyeParameters = function(whichEye) {
  var offset = [this.deviceInfo_.viewer.interLensDistance * 0.5, 0.0, 0.0];
  var fieldOfView;

  // TODO: FoV can be a little expensive to compute. Cache when device params change.
  if (whichEye == Eye.LEFT) {
    offset[0] *= -1.0;
    fieldOfView = this.deviceInfo_.getFieldOfViewLeftEye();
  } else if (whichEye == Eye.RIGHT) {
    fieldOfView = this.deviceInfo_.getFieldOfViewRightEye();
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }

  return {
    fieldOfView: fieldOfView,
    offset: offset,
    // TODO: Should be able to provide better values than these.
    renderWidth: this.deviceInfo_.device.width * 0.5 * this.bufferScale_,
    renderHeight: this.deviceInfo_.device.height * this.bufferScale_,
  };
};

CardboardVRDisplay.prototype.onDeviceParamsUpdated_ = function(newParams) {
  if (Util.isDebug()) {
    console.log('DPDB reported that device params were updated.');
  }
  this.deviceInfo_.updateDeviceParams(newParams);

  if (this.distorter_) {
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
  }
};

CardboardVRDisplay.prototype.updateBounds_ = function () {
  if (this.layer_ && this.distorter_ && (this.layer_.leftBounds || this.layer_.rightBounds)) {
    this.distorter_.setTextureBounds(this.layer_.leftBounds, this.layer_.rightBounds);
  }
};

CardboardVRDisplay.prototype.beginPresent_ = function() {
  var gl = this.layer_.source.getContext('webgl');
  if (!gl)
    gl = this.layer_.source.getContext('experimental-webgl');
  if (!gl)
    gl = this.layer_.source.getContext('webgl2');

  if (!gl)
    return; // Can't do distortion without a WebGL context.

  // Provides a way to opt out of distortion
  if (this.layer_.predistorted) {
    if (!window.WebVRConfig.CARDBOARD_UI_DISABLED) {
      gl.canvas.width = Util.getScreenWidth() * this.bufferScale_;
      gl.canvas.height = Util.getScreenHeight() * this.bufferScale_;
      this.cardboardUI_ = new CardboardUI(gl);
    }
  } else {
    // Create a new distorter for the target context
    this.distorter_ = new CardboardDistorter(gl);
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
    this.cardboardUI_ = this.distorter_.cardboardUI;
  }

  if (this.cardboardUI_) {
    this.cardboardUI_.listen(function(e) {
      // Options clicked.
      this.viewerSelector_.show(this.layer_.source.parentElement);
      e.stopPropagation();
      e.preventDefault();
    }.bind(this), function(e) {
      // Back clicked.
      this.exitPresent();
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));
  }

  if (this.rotateInstructions_) {
    if (Util.isLandscapeMode() && Util.isMobile()) {
      // In landscape mode, temporarily show the "put into Cardboard"
      // interstitial. Otherwise, do the default thing.
      this.rotateInstructions_.showTemporarily(3000, this.layer_.source.parentElement);
    } else {
      this.rotateInstructions_.update();
    }
  }

  // Listen for orientation change events in order to show interstitial.
  this.orientationHandler = this.onOrientationChange_.bind(this);
  window.addEventListener('orientationchange', this.orientationHandler);

  // Listen for present display change events in order to update distorter dimensions
  this.vrdisplaypresentchangeHandler = this.updateBounds_.bind(this);
  window.addEventListener('vrdisplaypresentchange', this.vrdisplaypresentchangeHandler);

  // Fire this event initially, to give geometry-distortion clients the chance
  // to do something custom.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.endPresent_ = function() {
  if (this.distorter_) {
    this.distorter_.destroy();
    this.distorter_ = null;
  }
  if (this.cardboardUI_) {
    this.cardboardUI_.destroy();
    this.cardboardUI_ = null;
  }

  if (this.rotateInstructions_) {
    this.rotateInstructions_.hide();
  }
  this.viewerSelector_.hide();

  window.removeEventListener('orientationchange', this.orientationHandler);
  window.removeEventListener('vrdisplaypresentchange', this.vrdisplaypresentchangeHandler);
};

CardboardVRDisplay.prototype.submitFrame = function(pose) {
  if (this.distorter_) {
    this.updateBounds_();
    this.distorter_.submitFrame();
  } else if (this.cardboardUI_ && this.layer_) {
    // Hack for predistorted: true.
    var canvas = this.layer_.source.getContext('webgl').canvas;
    if (canvas.width != this.lastWidth || canvas.height != this.lastHeight) {
      this.cardboardUI_.onResize();
    }
    this.lastWidth = canvas.width;
    this.lastHeight = canvas.height;

    // Render the Cardboard UI.
    this.cardboardUI_.render();
  }
};

CardboardVRDisplay.prototype.onOrientationChange_ = function(e) {
  // Hide the viewer selector.
  this.viewerSelector_.hide();

  // Update the rotate instructions.
  if (this.rotateInstructions_) {
    this.rotateInstructions_.update();
  }

  this.onResize_();
};

CardboardVRDisplay.prototype.onResize_ = function(e) {
  if (this.layer_) {
    var gl = this.layer_.source.getContext('webgl');
    // Size the CSS canvas.
    // Added padding on right and bottom because iPhone 5 will not
    // hide the URL bar unless content is bigger than the screen.
    // This will not be visible as long as the container element (e.g. body)
    // is set to 'overflow: hidden'.
    // Additionally, 'box-sizing: content-box' ensures renderWidth = width + padding.
    // This is required when 'box-sizing: border-box' is used elsewhere in the page.
    var cssProperties = [
      'position: absolute',
      'top: 0',
      'left: 0',
      // Use vw/vh to handle implicitly devicePixelRatio; issue #282
      'width: 100vw',
      'height: 100vh',
      'border: 0',
      'margin: 0',
      // Set no padding in the case where you don't have control over
      // the content injection, like in Unity WebGL; issue #282
      'padding: 0px',
      'box-sizing: content-box',
    ];
    gl.canvas.setAttribute('style', cssProperties.join('; ') + ';');

    Util.safariCssSizeWorkaround(gl.canvas);
  }
};

CardboardVRDisplay.prototype.onViewerChanged_ = function(viewer) {
  this.deviceInfo_.setViewer(viewer);

  if (this.distorter_) {
    // Update the distortion appropriately.
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
  }

  // Fire a new event containing viewer and device parameters for clients that
  // want to implement their own geometry-based distortion.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.fireVRDisplayDeviceParamsChange_ = function() {
  var event = new CustomEvent('vrdisplaydeviceparamschange', {
    detail: {
      vrdisplay: this,
      deviceInfo: this.deviceInfo_,
    }
  });
  window.dispatchEvent(event);
};

module.exports = CardboardVRDisplay;

},{"./base.js":9,"./cardboard-distorter.js":10,"./cardboard-ui.js":11,"./device-info.js":14,"./dpdb/dpdb.js":18,"./rotate-instructions.js":23,"./sensor-fusion/fusion-pose-sensor.js":25,"./util.js":29,"./viewer-selector.js":30}],13:[function(_dereq_,module,exports){
/**
 * Copyright (c) 2016, Brandon Jones.
 * https://github.com/toji/webgl-utils/blob/master/src/wglu-preserve-state.js
 * LICENSE: https://github.com/toji/webgl-utils/blob/master/LICENSE.md
 */

function WGLUPreserveGLState(gl, bindings, callback) {
  if (!bindings) {
    callback(gl);
    return;
  }

  var boundValues = [];

  var activeTexture = null;
  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    switch (binding) {
      case gl.TEXTURE_BINDING_2D:
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31) {
          console.error("TEXTURE_BINDING_2D or TEXTURE_BINDING_CUBE_MAP must be followed by a valid texture unit");
          boundValues.push(null, null);
          break;
        }
        if (!activeTexture) {
          activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        }
        gl.activeTexture(textureUnit);
        boundValues.push(gl.getParameter(binding), null);
        break;
      case gl.ACTIVE_TEXTURE:
        activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        boundValues.push(null);
        break;
      default:
        boundValues.push(gl.getParameter(binding));
        break;
    }
  }

  callback(gl);

  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    var boundValue = boundValues[i];
    switch (binding) {
      case gl.ACTIVE_TEXTURE:
        break; // Ignore this binding, since we special-case it to happen last.
      case gl.ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ARRAY_BUFFER, boundValue);
        break;
      case gl.COLOR_CLEAR_VALUE:
        gl.clearColor(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.COLOR_WRITEMASK:
        gl.colorMask(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.CURRENT_PROGRAM:
        gl.useProgram(boundValue);
        break;
      case gl.ELEMENT_ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boundValue);
        break;
      case gl.FRAMEBUFFER_BINDING:
        gl.bindFramebuffer(gl.FRAMEBUFFER, boundValue);
        break;
      case gl.RENDERBUFFER_BINDING:
        gl.bindRenderbuffer(gl.RENDERBUFFER, boundValue);
        break;
      case gl.TEXTURE_BINDING_2D:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, boundValue);
        break;
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, boundValue);
        break;
      case gl.VIEWPORT:
        gl.viewport(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.BLEND:
      case gl.CULL_FACE:
      case gl.DEPTH_TEST:
      case gl.SCISSOR_TEST:
      case gl.STENCIL_TEST:
        if (boundValue) {
          gl.enable(binding);
        } else {
          gl.disable(binding);
        }
        break;
      default:
        console.log("No GL restore behavior for 0x" + binding.toString(16));
        break;
    }

    if (activeTexture) {
      gl.activeTexture(activeTexture);
    }
  }
}

module.exports = WGLUPreserveGLState;

},{}],14:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Distortion = _dereq_('./distortion/distortion.js');
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

function Device(params) {
  this.width = params.width || Util.getScreenWidth();
  this.height = params.height || Util.getScreenHeight();
  this.widthMeters = params.widthMeters;
  this.heightMeters = params.heightMeters;
  this.bevelMeters = params.bevelMeters;
}


// Fallback Android device (based on Nexus 5 measurements) for use when
// we can't recognize an Android device.
var DEFAULT_ANDROID = new Device({
  widthMeters: 0.110,
  heightMeters: 0.062,
  bevelMeters: 0.004
});

// Fallback iOS device (based on iPhone6) for use when
// we can't recognize an Android device.
var DEFAULT_IOS = new Device({
  widthMeters: 0.1038,
  heightMeters: 0.0584,
  bevelMeters: 0.004
});


var Viewers = {
  CardboardV1: new CardboardViewer({
    id: 'CardboardV1',
    label: 'Cardboard I/O 2014',
    fov: 40,
    interLensDistance: 0.060,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.042,
    distortionCoefficients: [0.441, 0.156],
    inverseCoefficients: [-0.4410035, 0.42756155, -0.4804439, 0.5460139,
      -0.58821183, 0.5733938, -0.48303202, 0.33299083, -0.17573841,
      0.0651772, -0.01488963, 0.001559834]
  }),
  CardboardV2: new CardboardViewer({
    id: 'CardboardV2',
    label: 'Cardboard I/O 2015',
    fov: 60,
    interLensDistance: 0.064,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.039,
    distortionCoefficients: [0.34, 0.55],
    inverseCoefficients: [-0.33836704, -0.18162185, 0.862655, -1.2462051,
      1.0560602, -0.58208317, 0.21609078, -0.05444823, 0.009177956,
      -9.904169E-4, 6.183535E-5, -1.6981803E-6]
  })
};


var DEFAULT_LEFT_CENTER = {x: 0.5, y: 0.5};
var DEFAULT_RIGHT_CENTER = {x: 0.5, y: 0.5};

/**
 * Manages information about the device and the viewer.
 *
 * deviceParams indicates the parameters of the device to use (generally
 * obtained from dpdb.getDeviceParams()). Can be null to mean no device
 * params were found.
 */
function DeviceInfo(deviceParams) {
  this.viewer = Viewers.CardboardV2;
  this.updateDeviceParams(deviceParams);
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
}

DeviceInfo.prototype.updateDeviceParams = function(deviceParams) {
  this.device = this.determineDevice_(deviceParams) || this.device;
};

DeviceInfo.prototype.getDevice = function() {
  return this.device;
};

DeviceInfo.prototype.setViewer = function(viewer) {
  this.viewer = viewer;
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
};

DeviceInfo.prototype.determineDevice_ = function(deviceParams) {
  if (!deviceParams) {
    // No parameters, so use a default.
    if (Util.isIOS()) {
      console.warn('Using fallback iOS device measurements.');
      return DEFAULT_IOS;
    } else {
      console.warn('Using fallback Android device measurements.');
      return DEFAULT_ANDROID;
    }
  }

  // Compute device screen dimensions based on deviceParams.
  var METERS_PER_INCH = 0.0254;
  var metersPerPixelX = METERS_PER_INCH / deviceParams.xdpi;
  var metersPerPixelY = METERS_PER_INCH / deviceParams.ydpi;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();
  return new Device({
    widthMeters: metersPerPixelX * width,
    heightMeters: metersPerPixelY * height,
    bevelMeters: deviceParams.bevelMm * 0.001,
  });
};

/**
 * Calculates field of view for the left eye.
 */
DeviceInfo.prototype.getDistortedFieldOfViewLeftEye = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Device.height and device.width for device in portrait mode, so transpose.
  var eyeToScreenDistance = viewer.screenLensDistance;

  var outerDist = (device.widthMeters - viewer.interLensDistance) / 2;
  var innerDist = viewer.interLensDistance / 2;
  var bottomDist = viewer.baselineLensDistance - device.bevelMeters;
  var topDist = device.heightMeters - bottomDist;

  var outerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(outerDist / eyeToScreenDistance));
  var innerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(innerDist / eyeToScreenDistance));
  var bottomAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(bottomDist / eyeToScreenDistance));
  var topAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(topDist / eyeToScreenDistance));

  return {
    leftDegrees: Math.min(outerAngle, viewer.fov),
    rightDegrees: Math.min(innerAngle, viewer.fov),
    downDegrees: Math.min(bottomAngle, viewer.fov),
    upDegrees: Math.min(topAngle, viewer.fov)
  };
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Tan-angles from the max FOV.
  var fovLeft = Math.tan(-MathUtil.degToRad * viewer.fov);
  var fovTop = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovRight = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovBottom = Math.tan(-MathUtil.degToRad * viewer.fov);
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = distortion.distort((centerX - halfWidth) / centerZ);
  var screenTop = distortion.distort((centerY + halfHeight) / centerZ);
  var screenRight = distortion.distort((centerX + halfWidth) / centerZ);
  var screenBottom = distortion.distort((centerY - halfHeight) / centerZ);
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  var result = new Float32Array(4);
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters, assuming no lenses.
 */
DeviceInfo.prototype.getLeftEyeNoLensTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  var result = new Float32Array(4);
  // Tan-angles from the max FOV.
  var fovLeft = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  var fovTop = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovRight = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovBottom = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = (centerX - halfWidth) / centerZ;
  var screenTop = (centerY + halfHeight) / centerZ;
  var screenRight = (centerX + halfWidth) / centerZ;
  var screenBottom = (centerY - halfHeight) / centerZ;
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the screen rectangle visible from the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleScreenRect = function(undistortedFrustum) {
  var viewer = this.viewer;
  var device = this.device;

  var dist = viewer.screenLensDistance;
  var eyeX = (device.widthMeters - viewer.interLensDistance) / 2;
  var eyeY = viewer.baselineLensDistance - device.bevelMeters;
  var left = (undistortedFrustum[0] * dist + eyeX) / device.widthMeters;
  var top = (undistortedFrustum[1] * dist + eyeY) / device.heightMeters;
  var right = (undistortedFrustum[2] * dist + eyeX) / device.widthMeters;
  var bottom = (undistortedFrustum[3] * dist + eyeY) / device.heightMeters;
  return {
    x: left,
    y: bottom,
    width: right - left,
    height: top - bottom
  };
};

DeviceInfo.prototype.getFieldOfViewLeftEye = function(opt_isUndistorted) {
  return opt_isUndistorted ? this.getUndistortedFieldOfViewLeftEye() :
      this.getDistortedFieldOfViewLeftEye();
};

DeviceInfo.prototype.getFieldOfViewRightEye = function(opt_isUndistorted) {
  var fov = this.getFieldOfViewLeftEye(opt_isUndistorted);
  return {
    leftDegrees: fov.rightDegrees,
    rightDegrees: fov.leftDegrees,
    upDegrees: fov.upDegrees,
    downDegrees: fov.downDegrees
  };
};

/**
 * Calculates undistorted field of view for the left eye.
 */
DeviceInfo.prototype.getUndistortedFieldOfViewLeftEye = function() {
  var p = this.getUndistortedParams_();

  return {
    leftDegrees: MathUtil.radToDeg * Math.atan(p.outerDist),
    rightDegrees: MathUtil.radToDeg * Math.atan(p.innerDist),
    downDegrees: MathUtil.radToDeg * Math.atan(p.bottomDist),
    upDegrees: MathUtil.radToDeg * Math.atan(p.topDist)
  };
};

DeviceInfo.prototype.getUndistortedViewportLeftEye = function() {
  var p = this.getUndistortedParams_();
  var viewer = this.viewer;
  var device = this.device;

  // Distances stored in local variables are in tan-angle units unless otherwise
  // noted.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;
  var xPxPerTanAngle = device.width / screenWidth;
  var yPxPerTanAngle = device.height / screenHeight;

  var x = Math.round((p.eyePosX - p.outerDist) * xPxPerTanAngle);
  var y = Math.round((p.eyePosY - p.bottomDist) * yPxPerTanAngle);
  return {
    x: x,
    y: y,
    width: Math.round((p.eyePosX + p.innerDist) * xPxPerTanAngle) - x,
    height: Math.round((p.eyePosY + p.topDist) * yPxPerTanAngle) - y
  };
};

DeviceInfo.prototype.getUndistortedParams_ = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Most of these variables in tan-angle units.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var halfLensDistance = viewer.interLensDistance / 2 / eyeToScreenDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;

  var eyePosX = screenWidth / 2 - halfLensDistance;
  var eyePosY = (viewer.baselineLensDistance - device.bevelMeters) / eyeToScreenDistance;

  var maxFov = viewer.fov;
  var viewerMax = distortion.distortInverse(Math.tan(MathUtil.degToRad * maxFov));
  var outerDist = Math.min(eyePosX, viewerMax);
  var innerDist = Math.min(halfLensDistance, viewerMax);
  var bottomDist = Math.min(eyePosY, viewerMax);
  var topDist = Math.min(screenHeight - eyePosY, viewerMax);

  return {
    outerDist: outerDist,
    innerDist: innerDist,
    topDist: topDist,
    bottomDist: bottomDist,
    eyePosX: eyePosX,
    eyePosY: eyePosY
  };
};


function CardboardViewer(params) {
  // A machine readable ID.
  this.id = params.id;
  // A human readable label.
  this.label = params.label;

  // Field of view in degrees (per side).
  this.fov = params.fov;

  // Distance between lens centers in meters.
  this.interLensDistance = params.interLensDistance;
  // Distance between viewer baseline and lens center in meters.
  this.baselineLensDistance = params.baselineLensDistance;
  // Screen-to-lens distance in meters.
  this.screenLensDistance = params.screenLensDistance;

  // Distortion coefficients.
  this.distortionCoefficients = params.distortionCoefficients;
  // Inverse distortion coefficients.
  // TODO: Calculate these from distortionCoefficients in the future.
  this.inverseCoefficients = params.inverseCoefficients;
}

// Export viewer information.
DeviceInfo.Viewers = Viewers;
module.exports = DeviceInfo;

},{"./distortion/distortion.js":16,"./math-util.js":20,"./util.js":29}],15:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var VRDisplay = _dereq_('./base.js').VRDisplay;
var HMDVRDevice = _dereq_('./base.js').HMDVRDevice;
var PositionSensorVRDevice = _dereq_('./base.js').PositionSensorVRDevice;

/**
 * Wraps a VRDisplay and exposes it as a HMDVRDevice
 */
function VRDisplayHMDDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:HMD:' + display.displayId;
  this.deviceName = display.displayName + ' (HMD)';
}
VRDisplayHMDDevice.prototype = new HMDVRDevice();

VRDisplayHMDDevice.prototype.getEyeParameters = function(whichEye) {
  var eyeParameters = this.display.getEyeParameters(whichEye);

  return {
    currentFieldOfView: eyeParameters.fieldOfView,
    maximumFieldOfView: eyeParameters.fieldOfView,
    minimumFieldOfView: eyeParameters.fieldOfView,
    recommendedFieldOfView: eyeParameters.fieldOfView,
    eyeTranslation: { x: eyeParameters.offset[0], y: eyeParameters.offset[1], z: eyeParameters.offset[2] },
    renderRect: {
      x: (whichEye == 'right') ? eyeParameters.renderWidth : 0,
      y: 0,
      width: eyeParameters.renderWidth,
      height: eyeParameters.renderHeight
    }
  };
};

VRDisplayHMDDevice.prototype.setFieldOfView =
    function(opt_fovLeft, opt_fovRight, opt_zNear, opt_zFar) {
  // Not supported. getEyeParameters reports that the min, max, and recommended
  // FoV is all the same, so no adjustment can be made.
};

// TODO: Need to hook requestFullscreen to see if a wrapped VRDisplay was passed
// in as an option. If so we should prevent the default fullscreen behavior and
// call VRDisplay.requestPresent instead.

/**
 * Wraps a VRDisplay and exposes it as a PositionSensorVRDevice
 */
function VRDisplayPositionSensorDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:PositionSensor: ' + display.displayId;
  this.deviceName = display.displayName + ' (PositionSensor)';
}
VRDisplayPositionSensorDevice.prototype = new PositionSensorVRDevice();

VRDisplayPositionSensorDevice.prototype.getState = function() {
  var pose = this.display.getPose();
  return {
    position: pose.position ? { x: pose.position[0], y: pose.position[1], z: pose.position[2] } : null,
    orientation: pose.orientation ? { x: pose.orientation[0], y: pose.orientation[1], z: pose.orientation[2], w: pose.orientation[3] } : null,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

VRDisplayPositionSensorDevice.prototype.resetState = function() {
  return this.positionDevice.resetPose();
};


module.exports.VRDisplayHMDDevice = VRDisplayHMDDevice;
module.exports.VRDisplayPositionSensorDevice = VRDisplayPositionSensorDevice;


},{"./base.js":9}],16:[function(_dereq_,module,exports){
/**
 * TODO(smus): Implement coefficient inversion.
 */
function Distortion(coefficients) {
  this.coefficients = coefficients;
}

/**
 * Calculates the inverse distortion for a radius.
 * </p><p>
 * Allows to compute the original undistorted radius from a distorted one.
 * See also getApproximateInverseDistortion() for a faster but potentially
 * less accurate method.
 *
 * @param {Number} radius Distorted radius from the lens center in tan-angle units.
 * @return {Number} The undistorted radius in tan-angle units.
 */
Distortion.prototype.distortInverse = function(radius) {
  // Secant method.
  var r0 = 0;
  var r1 = 1;
  var dr0 = radius - this.distort(r0);
  while (Math.abs(r1 - r0) > 0.0001 /** 0.1mm */) {
    var dr1 = radius - this.distort(r1);
    var r2 = r1 - dr1 * ((r1 - r0) / (dr1 - dr0));
    r0 = r1;
    r1 = r2;
    dr0 = dr1;
  }
  return r1;
};

/**
 * Distorts a radius by its distortion factor from the center of the lenses.
 *
 * @param {Number} radius Radius from the lens center in tan-angle units.
 * @return {Number} The distorted radius in tan-angle units.
 */
Distortion.prototype.distort = function(radius) {
  var r2 = radius * radius;
  var ret = 0;
  for (var i = 0; i < this.coefficients.length; i++) {
    ret = r2 * (ret + this.coefficients[i]);
  }
  return (ret + 1) * radius;
};

module.exports = Distortion;

},{}],17:[function(_dereq_,module,exports){
module.exports={
  "format": 1,
  "last_updated": "2017-08-27T14:39:31Z",
  "devices": [
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "asus/*/Nexus 7/*"
        },
        {
          "ua": "Nexus 7"
        }
      ],
      "dpi": [
        320.8,
        323
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "asus/*/ASUS_Z00AD/*"
        },
        {
          "ua": "ASUS_Z00AD"
        }
      ],
      "dpi": [
        403,
        404.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Google/*/Pixel XL/*"
        },
        {
          "ua": "Pixel XL"
        }
      ],
      "dpi": [
        537.9,
        533
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Google/*/Pixel/*"
        },
        {
          "ua": "Pixel"
        }
      ],
      "dpi": [
        432.6,
        436.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC6435LVW/*"
        },
        {
          "ua": "HTC6435LVW"
        }
      ],
      "dpi": [
        449.7,
        443.3
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC One XL/*"
        },
        {
          "ua": "HTC One XL"
        }
      ],
      "dpi": [
        315.3,
        314.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "htc/*/Nexus 9/*"
        },
        {
          "ua": "Nexus 9"
        }
      ],
      "dpi": 289,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC One M9/*"
        },
        {
          "ua": "HTC One M9"
        }
      ],
      "dpi": [
        442.5,
        443.3
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC One_M8/*"
        },
        {
          "ua": "HTC One_M8"
        }
      ],
      "dpi": [
        449.7,
        447.4
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "HTC/*/HTC One/*"
        },
        {
          "ua": "HTC One"
        }
      ],
      "dpi": 472.8,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Huawei/*/Nexus 6P/*"
        },
        {
          "ua": "Nexus 6P"
        }
      ],
      "dpi": [
        515.1,
        518
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LENOVO/*/Lenovo PB2-690Y/*"
        },
        {
          "ua": "Lenovo PB2-690Y"
        }
      ],
      "dpi": [
        457.2,
        454.713
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/Nexus 5X/*"
        },
        {
          "ua": "Nexus 5X"
        }
      ],
      "dpi": [
        422,
        419.9
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LGMS345/*"
        },
        {
          "ua": "LGMS345"
        }
      ],
      "dpi": [
        221.7,
        219.1
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LG-D800/*"
        },
        {
          "ua": "LG-D800"
        }
      ],
      "dpi": [
        422,
        424.1
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LG-D850/*"
        },
        {
          "ua": "LG-D850"
        }
      ],
      "dpi": [
        537.9,
        541.9
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/VS985 4G/*"
        },
        {
          "ua": "VS985 4G"
        }
      ],
      "dpi": [
        537.9,
        535.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/Nexus 5/*"
        },
        {
          "ua": "Nexus 5 B"
        }
      ],
      "dpi": [
        442.4,
        444.8
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/Nexus 4/*"
        },
        {
          "ua": "Nexus 4"
        }
      ],
      "dpi": [
        319.8,
        318.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LG-P769/*"
        },
        {
          "ua": "LG-P769"
        }
      ],
      "dpi": [
        240.6,
        247.5
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LGMS323/*"
        },
        {
          "ua": "LGMS323"
        }
      ],
      "dpi": [
        206.6,
        204.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "LGE/*/LGLS996/*"
        },
        {
          "ua": "LGLS996"
        }
      ],
      "dpi": [
        403.4,
        401.5
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Micromax/*/4560MMX/*"
        },
        {
          "ua": "4560MMX"
        }
      ],
      "dpi": [
        240,
        219.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Micromax/*/A250/*"
        },
        {
          "ua": "Micromax A250"
        }
      ],
      "dpi": [
        480,
        446.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Micromax/*/Micromax AQ4501/*"
        },
        {
          "ua": "Micromax AQ4501"
        }
      ],
      "dpi": 240,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/DROID RAZR/*"
        },
        {
          "ua": "DROID RAZR"
        }
      ],
      "dpi": [
        368.1,
        256.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT830C/*"
        },
        {
          "ua": "XT830C"
        }
      ],
      "dpi": [
        254,
        255.9
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1021/*"
        },
        {
          "ua": "XT1021"
        }
      ],
      "dpi": [
        254,
        256.7
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1023/*"
        },
        {
          "ua": "XT1023"
        }
      ],
      "dpi": [
        254,
        256.7
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1028/*"
        },
        {
          "ua": "XT1028"
        }
      ],
      "dpi": [
        326.6,
        327.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1034/*"
        },
        {
          "ua": "XT1034"
        }
      ],
      "dpi": [
        326.6,
        328.4
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1053/*"
        },
        {
          "ua": "XT1053"
        }
      ],
      "dpi": [
        315.3,
        316.1
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1562/*"
        },
        {
          "ua": "XT1562"
        }
      ],
      "dpi": [
        403.4,
        402.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/Nexus 6/*"
        },
        {
          "ua": "Nexus 6 B"
        }
      ],
      "dpi": [
        494.3,
        489.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1063/*"
        },
        {
          "ua": "XT1063"
        }
      ],
      "dpi": [
        295,
        296.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1064/*"
        },
        {
          "ua": "XT1064"
        }
      ],
      "dpi": [
        295,
        295.6
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1092/*"
        },
        {
          "ua": "XT1092"
        }
      ],
      "dpi": [
        422,
        424.1
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/XT1095/*"
        },
        {
          "ua": "XT1095"
        }
      ],
      "dpi": [
        422,
        423.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "motorola/*/G4/*"
        },
        {
          "ua": "Moto G (4)"
        }
      ],
      "dpi": 401,
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "OnePlus/*/A0001/*"
        },
        {
          "ua": "A0001"
        }
      ],
      "dpi": [
        403.4,
        401
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "OnePlus/*/ONE E1005/*"
        },
        {
          "ua": "ONE E1005"
        }
      ],
      "dpi": [
        442.4,
        441.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "OnePlus/*/ONE A2005/*"
        },
        {
          "ua": "ONE A2005"
        }
      ],
      "dpi": [
        391.9,
        405.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "OPPO/*/X909/*"
        },
        {
          "ua": "X909"
        }
      ],
      "dpi": [
        442.4,
        444.1
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9082/*"
        },
        {
          "ua": "GT-I9082"
        }
      ],
      "dpi": [
        184.7,
        185.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G360P/*"
        },
        {
          "ua": "SM-G360P"
        }
      ],
      "dpi": [
        196.7,
        205.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/Nexus S/*"
        },
        {
          "ua": "Nexus S"
        }
      ],
      "dpi": [
        234.5,
        229.8
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9300/*"
        },
        {
          "ua": "GT-I9300"
        }
      ],
      "dpi": [
        304.8,
        303.9
      ],
      "bw": 5,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-T230NU/*"
        },
        {
          "ua": "SM-T230NU"
        }
      ],
      "dpi": 216,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SGH-T399/*"
        },
        {
          "ua": "SGH-T399"
        }
      ],
      "dpi": [
        217.7,
        231.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SGH-M919/*"
        },
        {
          "ua": "SGH-M919"
        }
      ],
      "dpi": [
        440.8,
        437.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N9005/*"
        },
        {
          "ua": "SM-N9005"
        }
      ],
      "dpi": [
        386.4,
        387
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SAMSUNG-SM-N900A/*"
        },
        {
          "ua": "SAMSUNG-SM-N900A"
        }
      ],
      "dpi": [
        386.4,
        387.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9500/*"
        },
        {
          "ua": "GT-I9500"
        }
      ],
      "dpi": [
        442.5,
        443.3
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9505/*"
        },
        {
          "ua": "GT-I9505"
        }
      ],
      "dpi": 439.4,
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G900F/*"
        },
        {
          "ua": "SM-G900F"
        }
      ],
      "dpi": [
        415.6,
        431.6
      ],
      "bw": 5,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G900M/*"
        },
        {
          "ua": "SM-G900M"
        }
      ],
      "dpi": [
        415.6,
        431.6
      ],
      "bw": 5,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G800F/*"
        },
        {
          "ua": "SM-G800F"
        }
      ],
      "dpi": 326.8,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G906S/*"
        },
        {
          "ua": "SM-G906S"
        }
      ],
      "dpi": [
        562.7,
        572.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9300/*"
        },
        {
          "ua": "GT-I9300"
        }
      ],
      "dpi": [
        306.7,
        304.8
      ],
      "bw": 5,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-T535/*"
        },
        {
          "ua": "SM-T535"
        }
      ],
      "dpi": [
        142.6,
        136.4
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N920C/*"
        },
        {
          "ua": "SM-N920C"
        }
      ],
      "dpi": [
        515.1,
        518.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N920W8/*"
        },
        {
          "ua": "SM-N920W8"
        }
      ],
      "dpi": [
        515.1,
        518.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9300I/*"
        },
        {
          "ua": "GT-I9300I"
        }
      ],
      "dpi": [
        304.8,
        305.8
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-I9195/*"
        },
        {
          "ua": "GT-I9195"
        }
      ],
      "dpi": [
        249.4,
        256.7
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SPH-L520/*"
        },
        {
          "ua": "SPH-L520"
        }
      ],
      "dpi": [
        249.4,
        255.9
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SAMSUNG-SGH-I717/*"
        },
        {
          "ua": "SAMSUNG-SGH-I717"
        }
      ],
      "dpi": 285.8,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SPH-D710/*"
        },
        {
          "ua": "SPH-D710"
        }
      ],
      "dpi": [
        217.7,
        204.2
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/GT-N7100/*"
        },
        {
          "ua": "GT-N7100"
        }
      ],
      "dpi": 265.1,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SCH-I605/*"
        },
        {
          "ua": "SCH-I605"
        }
      ],
      "dpi": 265.1,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/Galaxy Nexus/*"
        },
        {
          "ua": "Galaxy Nexus"
        }
      ],
      "dpi": [
        315.3,
        314.2
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N910H/*"
        },
        {
          "ua": "SM-N910H"
        }
      ],
      "dpi": [
        515.1,
        518
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-N910C/*"
        },
        {
          "ua": "SM-N910C"
        }
      ],
      "dpi": [
        515.2,
        520.2
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G130M/*"
        },
        {
          "ua": "SM-G130M"
        }
      ],
      "dpi": [
        165.9,
        164.8
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G928I/*"
        },
        {
          "ua": "SM-G928I"
        }
      ],
      "dpi": [
        515.1,
        518.4
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G920F/*"
        },
        {
          "ua": "SM-G920F"
        }
      ],
      "dpi": 580.6,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G920P/*"
        },
        {
          "ua": "SM-G920P"
        }
      ],
      "dpi": [
        522.5,
        577
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G925F/*"
        },
        {
          "ua": "SM-G925F"
        }
      ],
      "dpi": 580.6,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G925V/*"
        },
        {
          "ua": "SM-G925V"
        }
      ],
      "dpi": [
        522.5,
        576.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G930F/*"
        },
        {
          "ua": "SM-G930F"
        }
      ],
      "dpi": 576.6,
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G935F/*"
        },
        {
          "ua": "SM-G935F"
        }
      ],
      "dpi": 533,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G950F/*"
        },
        {
          "ua": "SM-G950F"
        }
      ],
      "dpi": [
        562.707,
        565.293
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "samsung/*/SM-G955U/*"
        },
        {
          "ua": "SM-G955U"
        }
      ],
      "dpi": [
        522.514,
        525.762
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/C6903/*"
        },
        {
          "ua": "C6903"
        }
      ],
      "dpi": [
        442.5,
        443.3
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/D6653/*"
        },
        {
          "ua": "D6653"
        }
      ],
      "dpi": [
        428.6,
        427.6
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/E6653/*"
        },
        {
          "ua": "E6653"
        }
      ],
      "dpi": [
        428.6,
        425.7
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/E6853/*"
        },
        {
          "ua": "E6853"
        }
      ],
      "dpi": [
        403.4,
        401.9
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "Sony/*/SGP321/*"
        },
        {
          "ua": "SGP321"
        }
      ],
      "dpi": [
        224.7,
        224.1
      ],
      "bw": 3,
      "ac": 500
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "TCT/*/ALCATEL ONE TOUCH Fierce/*"
        },
        {
          "ua": "ALCATEL ONE TOUCH Fierce"
        }
      ],
      "dpi": [
        240,
        247.5
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "THL/*/thl 5000/*"
        },
        {
          "ua": "thl 5000"
        }
      ],
      "dpi": [
        480,
        443.3
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "android",
      "rules": [
        {
          "mdmh": "ZTE/*/ZTE Blade L2/*"
        },
        {
          "ua": "ZTE Blade L2"
        }
      ],
      "dpi": 240,
      "bw": 3,
      "ac": 500
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            640,
            960
          ]
        }
      ],
      "dpi": [
        325.1,
        328.4
      ],
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            640,
            1136
          ]
        }
      ],
      "dpi": [
        317.1,
        320.2
      ],
      "bw": 3,
      "ac": 1000
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            750,
            1334
          ]
        }
      ],
      "dpi": 326.4,
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            1242,
            2208
          ]
        }
      ],
      "dpi": [
        453.6,
        458.4
      ],
      "bw": 4,
      "ac": 1000
    },
    {
      "type": "ios",
      "rules": [
        {
          "res": [
            1125,
            2001
          ]
        }
      ],
      "dpi": [
        410.9,
        415.4
      ],
      "bw": 4,
      "ac": 1000
    }
  ]
}
},{}],18:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Offline cache of the DPDB, to be used until we load the online one (and
// as a fallback in case we can't load the online one).
var DPDB_CACHE = _dereq_('./dpdb.json');
var Util = _dereq_('../util.js');

// Online DPDB URL.
var ONLINE_DPDB_URL =
  'https://dpdb.webvr.rocks/dpdb.json';

/**
 * Calculates device parameters based on the DPDB (Device Parameter Database).
 * Initially, uses the cached DPDB values.
 *
 * If fetchOnline == true, then this object tries to fetch the online version
 * of the DPDB and updates the device info if a better match is found.
 * Calls the onDeviceParamsUpdated callback when there is an update to the
 * device information.
 */
function Dpdb(fetchOnline, onDeviceParamsUpdated) {
  // Start with the offline DPDB cache while we are loading the real one.
  this.dpdb = DPDB_CACHE;

  // Calculate device params based on the offline version of the DPDB.
  this.recalculateDeviceParams_();

  // XHR to fetch online DPDB file, if requested.
  if (fetchOnline) {
    // Set the callback.
    this.onDeviceParamsUpdated = onDeviceParamsUpdated;

    var xhr = new XMLHttpRequest();
    var obj = this;
    xhr.open('GET', ONLINE_DPDB_URL, true);
    xhr.addEventListener('load', function() {
      obj.loading = false;
      if (xhr.status >= 200 && xhr.status <= 299) {
        // Success.
        obj.dpdb = JSON.parse(xhr.response);
        obj.recalculateDeviceParams_();
      } else {
        // Error loading the DPDB.
        console.error('Error loading online DPDB!');
      }
    });
    xhr.send();
  }
}

// Returns the current device parameters.
Dpdb.prototype.getDeviceParams = function() {
  return this.deviceParams;
};

// Recalculates this device's parameters based on the DPDB.
Dpdb.prototype.recalculateDeviceParams_ = function() {
  var newDeviceParams = this.calcDeviceParams_();
  if (newDeviceParams) {
    this.deviceParams = newDeviceParams;
    // Invoke callback, if it is set.
    if (this.onDeviceParamsUpdated) {
      this.onDeviceParamsUpdated(this.deviceParams);
    }
  } else {
    console.error('Failed to recalculate device parameters.');
  }
};

// Returns a DeviceParams object that represents the best guess as to this
// device's parameters. Can return null if the device does not match any
// known devices.
Dpdb.prototype.calcDeviceParams_ = function() {
  var db = this.dpdb; // shorthand
  if (!db) {
    console.error('DPDB not available.');
    return null;
  }
  if (db.format != 1) {
    console.error('DPDB has unexpected format version.');
    return null;
  }
  if (!db.devices || !db.devices.length) {
    console.error('DPDB does not have a devices section.');
    return null;
  }

  // Get the actual user agent and screen dimensions in pixels.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();

  if (!db.devices) {
    console.error('DPDB has no devices section.');
    return null;
  }

  for (var i = 0; i < db.devices.length; i++) {
    var device = db.devices[i];
    if (!device.rules) {
      console.warn('Device[' + i + '] has no rules section.');
      continue;
    }

    if (device.type != 'ios' && device.type != 'android') {
      console.warn('Device[' + i + '] has invalid type.');
      continue;
    }

    // See if this device is of the appropriate type.
    if (Util.isIOS() != (device.type == 'ios')) continue;

    // See if this device matches any of the rules:
    var matched = false;
    for (var j = 0; j < device.rules.length; j++) {
      var rule = device.rules[j];
      if (this.matchRule_(rule, userAgent, width, height)) {
        matched = true;
        break;
      }
    }
    if (!matched) continue;

    // device.dpi might be an array of [ xdpi, ydpi] or just a scalar.
    var xdpi = device.dpi[0] || device.dpi;
    var ydpi = device.dpi[1] || device.dpi;

    return new DeviceParams({ xdpi: xdpi, ydpi: ydpi, bevelMm: device.bw });
  }

  console.warn('No DPDB device match.');
  return null;
};

Dpdb.prototype.matchRule_ = function(rule, ua, screenWidth, screenHeight) {
  // We can only match 'ua' and 'res' rules, not other types like 'mdmh'
  // (which are meant for native platforms).
  if (!rule.ua && !rule.res) return false;

  // If our user agent string doesn't contain the indicated user agent string,
  // the match fails.
  if (rule.ua && ua.indexOf(rule.ua) < 0) return false;

  // If the rule specifies screen dimensions that don't correspond to ours,
  // the match fails.
  if (rule.res) {
    if (!rule.res[0] || !rule.res[1]) return false;
    var resX = rule.res[0];
    var resY = rule.res[1];
    // Compare min and max so as to make the order not matter, i.e., it should
    // be true that 640x480 == 480x640.
    if (Math.min(screenWidth, screenHeight) != Math.min(resX, resY) ||
        (Math.max(screenWidth, screenHeight) != Math.max(resX, resY))) {
      return false;
    }
  }

  return true;
}

function DeviceParams(params) {
  this.xdpi = params.xdpi;
  this.ydpi = params.ydpi;
  this.bevelMm = params.bevelMm;
}

module.exports = Dpdb;

},{"../util.js":29,"./dpdb.json":17}],19:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Util = _dereq_('./util.js');
var WebVRPolyfill = _dereq_('./webvr-polyfill.js').WebVRPolyfill;

// Initialize a WebVRConfig just in case.
window.WebVRConfig = Util.extend({
  // Forces availability of VR mode, even for non-mobile devices.
  FORCE_ENABLE_VR: false,

  // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
  K_FILTER: 0.98,

  // How far into the future to predict during fast motion (in seconds).
  PREDICTION_TIME_S: 0.040,

  // Flag to enable touch panner. In case you have your own touch controls.
  TOUCH_PANNER_DISABLED: true,

  // Flag to disabled the UI in VR Mode.
  CARDBOARD_UI_DISABLED: false, // Default: false

  // Flag to disable the instructions to rotate your device.
  ROTATE_INSTRUCTIONS_DISABLED: false, // Default: false.

  // Enable yaw panning only, disabling roll and pitch. This can be useful
  // for panoramas with nothing interesting above or below.
  YAW_ONLY: false,

  // To disable keyboard and mouse controls, if you want to use your own
  // implementation.
  MOUSE_KEYBOARD_CONTROLS_DISABLED: false,

  // Prevent the polyfill from initializing immediately. Requires the app
  // to call InitializeWebVRPolyfill() before it can be used.
  DEFER_INITIALIZATION: false,

  // Enable the deprecated version of the API (navigator.getVRDevices).
  ENABLE_DEPRECATED_API: false,

  // Scales the recommended buffer size reported by WebVR, which can improve
  // performance.
  // UPDATE(2016-05-03): Setting this to 0.5 by default since 1.0 does not
  // perform well on many mobile devices.
  BUFFER_SCALE: 0.5,

  // Allow VRDisplay.submitFrame to change gl bindings, which is more
  // efficient if the application code will re-bind its resources on the
  // next frame anyway. This has been seen to cause rendering glitches with
  // THREE.js.
  // Dirty bindings include: gl.FRAMEBUFFER_BINDING, gl.CURRENT_PROGRAM,
  // gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING,
  // and gl.TEXTURE_BINDING_2D for texture unit 0.
  DIRTY_SUBMIT_FRAME_BINDINGS: false,

  // When set to true, this will cause a polyfilled VRDisplay to always be
  // appended to the list returned by navigator.getVRDisplays(), even if that
  // list includes a native VRDisplay.
  ALWAYS_APPEND_POLYFILL_DISPLAY: false,

  // There are versions of Chrome (M58-M60?) where the native WebVR API exists,
  // and instead of returning 0 VR displays when none are detected,
  // `navigator.getVRDisplays()`'s promise never resolves. This results
  // in the polyfill hanging and not being able to provide fallback
  // displays, so set a timeout in milliseconds to stop waiting for a response
  // and just use polyfilled displays.
  // https://bugs.chromium.org/p/chromium/issues/detail?id=727969
  GET_VR_DISPLAYS_TIMEOUT: 1000,
}, window.WebVRConfig);

if (!window.WebVRConfig.DEFER_INITIALIZATION) {
  new WebVRPolyfill();
} else {
  window.InitializeWebVRPolyfill = function() {
    new WebVRPolyfill();
  }
}

window.WebVRPolyfill = WebVRPolyfill;

},{"./util.js":29,"./webvr-polyfill.js":32}],20:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var MathUtil = window.MathUtil || {};

MathUtil.degToRad = Math.PI / 180;
MathUtil.radToDeg = 180 / Math.PI;

// Some minimal math functionality borrowed from THREE.Math and stripped down
// for the purposes of this library.


MathUtil.Vector2 = function ( x, y ) {
  this.x = x || 0;
  this.y = y || 0;
};

MathUtil.Vector2.prototype = {
  constructor: MathUtil.Vector2,

  set: function ( x, y ) {
    this.x = x;
    this.y = y;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;

    return this;
  },

  subVectors: function ( a, b ) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;
  },
};

MathUtil.Vector3 = function ( x, y, z ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
};

MathUtil.Vector3.prototype = {
  constructor: MathUtil.Vector3,

  set: function ( x, y, z ) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    return this;
  },

  length: function () {
    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
  },

  normalize: function () {
    var scalar = this.length();

    if ( scalar !== 0 ) {
      var invScalar = 1 / scalar;

      this.multiplyScalar(invScalar);
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }

    return this;
  },

  multiplyScalar: function ( scalar ) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
  },

  applyQuaternion: function ( q ) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var qx = q.x;
    var qy = q.y;
    var qz = q.z;
    var qw = q.w;

    // calculate quat * vector
    var ix =  qw * x + qy * z - qz * y;
    var iy =  qw * y + qz * x - qx * z;
    var iz =  qw * z + qx * y - qy * x;
    var iw = - qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
    this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
    this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

    return this;
  },

  dot: function ( v ) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  },

  crossVectors: function ( a, b ) {
    var ax = a.x, ay = a.y, az = a.z;
    var bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  },
};

MathUtil.Quaternion = function ( x, y, z, w ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = ( w !== undefined ) ? w : 1;
};

MathUtil.Quaternion.prototype = {
  constructor: MathUtil.Quaternion,

  set: function ( x, y, z, w ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  },

  copy: function ( quaternion ) {
    this.x = quaternion.x;
    this.y = quaternion.y;
    this.z = quaternion.z;
    this.w = quaternion.w;

    return this;
  },

  setFromEulerXYZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;

    return this;
  },

  setFromEulerYXZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 - s1 * s2 * c3;
    this.w = c1 * c2 * c3 + s1 * s2 * s3;

    return this;
  },

  setFromAxisAngle: function ( axis, angle ) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // assumes axis is normalized

    var halfAngle = angle / 2, s = Math.sin( halfAngle );

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos( halfAngle );

    return this;
  },

  multiply: function ( q ) {
    return this.multiplyQuaternions( this, q );
  },

  multiplyQuaternions: function ( a, b ) {
    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return this;
  },

  inverse: function () {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;

    this.normalize();

    return this;
  },

  normalize: function () {
    var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

    if ( l === 0 ) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;

      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }

    return this;
  },

  slerp: function ( qb, t ) {
    if ( t === 0 ) return this;
    if ( t === 1 ) return this.copy( qb );

    var x = this.x, y = this.y, z = this.z, w = this.w;

    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

    var cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

    if ( cosHalfTheta < 0 ) {
      this.w = - qb.w;
      this.x = - qb.x;
      this.y = - qb.y;
      this.z = - qb.z;

      cosHalfTheta = - cosHalfTheta;
    } else {
      this.copy( qb );
    }

    if ( cosHalfTheta >= 1.0 ) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;

      return this;
    }

    var halfTheta = Math.acos( cosHalfTheta );
    var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

    if ( Math.abs( sinHalfTheta ) < 0.001 ) {
      this.w = 0.5 * ( w + this.w );
      this.x = 0.5 * ( x + this.x );
      this.y = 0.5 * ( y + this.y );
      this.z = 0.5 * ( z + this.z );

      return this;
    }

    var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
    ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

    this.w = ( w * ratioA + this.w * ratioB );
    this.x = ( x * ratioA + this.x * ratioB );
    this.y = ( y * ratioA + this.y * ratioB );
    this.z = ( z * ratioA + this.z * ratioB );

    return this;
  },

  setFromUnitVectors: function () {
    // http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
    // assumes direction vectors vFrom and vTo are normalized

    var v1, r;
    var EPS = 0.000001;

    return function ( vFrom, vTo ) {
      if ( v1 === undefined ) v1 = new MathUtil.Vector3();

      r = vFrom.dot( vTo ) + 1;

      if ( r < EPS ) {
        r = 0;

        if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {
          v1.set( - vFrom.y, vFrom.x, 0 );
        } else {
          v1.set( 0, - vFrom.z, vFrom.y );
        }
      } else {
        v1.crossVectors( vFrom, vTo );
      }

      this.x = v1.x;
      this.y = v1.y;
      this.z = v1.z;
      this.w = r;

      this.normalize();

      return this;
    }
  }(),
};

module.exports = MathUtil;

},{}],21:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var VRDisplay = _dereq_('./base.js').VRDisplay;
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

// How much to rotate per key stroke.
var KEY_SPEED = 0.15;
var KEY_ANIMATION_DURATION = 80;

// How much to rotate for mouse events.
var MOUSE_SPEED_X = 0.5;
var MOUSE_SPEED_Y = 0.3;

/**
 * VRDisplay based on mouse and keyboard input. Designed for desktops/laptops
 * where orientation events aren't supported. Cannot present.
 */
function MouseKeyboardVRDisplay() {
  this.displayName = 'Mouse and Keyboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;

  this.onKeyDown_ = this.onKeyDown_.bind(this);
  this.onMouseDown_ = this.onMouseDown_.bind(this);
  this.onMouseMove_ = this.onMouseMove_.bind(this);
  this.onMouseUp_ = this.onMouseUp_.bind(this);

  // Attach to mouse and keyboard events.
  window.addEventListener('keydown', this.onKeyDown_);
  window.addEventListener('mousemove', this.onMouseMove_);
  window.addEventListener('mousedown', this.onMouseDown_);
  window.addEventListener('mouseup', this.onMouseUp_);

  // "Private" members.
  this.phi_ = 0;
  this.theta_ = 0;

  // Variables for keyboard-based rotation animation.
  this.targetAngle_ = null;
  this.angleAnimation_ = null;

  // State variables for calculations.
  this.orientation_ = new MathUtil.Quaternion();

  // Variables for mouse-based rotation.
  this.rotateStart_ = new MathUtil.Vector2();
  this.rotateEnd_ = new MathUtil.Vector2();
  this.rotateDelta_ = new MathUtil.Vector2();
  this.isDragging_ = false;

  this.orientationOut_ = new Float32Array(4);
}
MouseKeyboardVRDisplay.prototype = new VRDisplay();

MouseKeyboardVRDisplay.prototype.getImmediatePose = function() {
  this.orientation_.setFromEulerYXZ(this.phi_, this.theta_, 0);

  this.orientationOut_[0] = this.orientation_.x;
  this.orientationOut_[1] = this.orientation_.y;
  this.orientationOut_[2] = this.orientation_.z;
  this.orientationOut_[3] = this.orientation_.w;

  return {
    position: null,
    orientation: this.orientationOut_,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

MouseKeyboardVRDisplay.prototype.onKeyDown_ = function(e) {
  // Track WASD and arrow keys.
  if (e.keyCode == 38) { // Up key.
    this.animatePhi_(this.phi_ + KEY_SPEED);
  } else if (e.keyCode == 39) { // Right key.
    this.animateTheta_(this.theta_ - KEY_SPEED);
  } else if (e.keyCode == 40) { // Down key.
    this.animatePhi_(this.phi_ - KEY_SPEED);
  } else if (e.keyCode == 37) { // Left key.
    this.animateTheta_(this.theta_ + KEY_SPEED);
  }
};

MouseKeyboardVRDisplay.prototype.animateTheta_ = function(targetAngle) {
  this.animateKeyTransitions_('theta_', targetAngle);
};

MouseKeyboardVRDisplay.prototype.animatePhi_ = function(targetAngle) {
  // Prevent looking too far up or down.
  targetAngle = Util.clamp(targetAngle, -Math.PI/2, Math.PI/2);
  this.animateKeyTransitions_('phi_', targetAngle);
};

/**
 * Start an animation to transition an angle from one value to another.
 */
MouseKeyboardVRDisplay.prototype.animateKeyTransitions_ = function(angleName, targetAngle) {
  // If an animation is currently running, cancel it.
  if (this.angleAnimation_) {
    cancelAnimationFrame(this.angleAnimation_);
  }
  var startAngle = this[angleName];
  var startTime = new Date();
  // Set up an interval timer to perform the animation.
  this.angleAnimation_ = requestAnimationFrame(function animate() {
    // Once we're finished the animation, we're done.
    var elapsed = new Date() - startTime;
    if (elapsed >= KEY_ANIMATION_DURATION) {
      this[angleName] = targetAngle;
      cancelAnimationFrame(this.angleAnimation_);
      return;
    }
    // loop with requestAnimationFrame
    this.angleAnimation_ = requestAnimationFrame(animate.bind(this))
    // Linearly interpolate the angle some amount.
    var percent = elapsed / KEY_ANIMATION_DURATION;
    this[angleName] = startAngle + (targetAngle - startAngle) * percent;
  }.bind(this));
};

MouseKeyboardVRDisplay.prototype.onMouseDown_ = function(e) {
  this.rotateStart_.set(e.clientX, e.clientY);
  this.isDragging_ = true;
};

// Very similar to https://gist.github.com/mrflix/8351020
MouseKeyboardVRDisplay.prototype.onMouseMove_ = function(e) {
  if (!this.isDragging_ && !this.isPointerLocked_()) {
    return;
  }
  // Support pointer lock API.
  if (this.isPointerLocked_()) {
    var movementX = e.movementX || e.mozMovementX || 0;
    var movementY = e.movementY || e.mozMovementY || 0;
    this.rotateEnd_.set(this.rotateStart_.x - movementX, this.rotateStart_.y - movementY);
  } else {
    this.rotateEnd_.set(e.clientX, e.clientY);
  }
  // Calculate how much we moved in mouse space.
  this.rotateDelta_.subVectors(this.rotateEnd_, this.rotateStart_);
  this.rotateStart_.copy(this.rotateEnd_);

  // Keep track of the cumulative euler angles.
  this.phi_ += 2 * Math.PI * this.rotateDelta_.y / screen.height * MOUSE_SPEED_Y;
  this.theta_ += 2 * Math.PI * this.rotateDelta_.x / screen.width * MOUSE_SPEED_X;

  // Prevent looking too far up or down.
  this.phi_ = Util.clamp(this.phi_, -Math.PI/2, Math.PI/2);
};

MouseKeyboardVRDisplay.prototype.onMouseUp_ = function(e) {
  this.isDragging_ = false;
};

MouseKeyboardVRDisplay.prototype.isPointerLocked_ = function() {
  var el = document.pointerLockElement || document.mozPointerLockElement ||
      document.webkitPointerLockElement;
  return el !== undefined;
};

MouseKeyboardVRDisplay.prototype.resetPose = function() {
  this.phi_ = 0;
  this.theta_ = 0;
};

module.exports = MouseKeyboardVRDisplay;

},{"./base.js":9,"./math-util.js":20,"./util.js":29}],22:[function(_dereq_,module,exports){
(function (global){
// This is the entry point if requiring/importing via node, or
// a build tool that uses package.json entry (like browserify, webpack).
// If running in node with a window mock available, globalize its members
// if needed. Otherwise, just continue to `./main`
if (typeof global !== 'undefined' && global.window) {
  if (!global.document) {
    global.document = global.window.document;
  }
  if (!global.navigator) {
    global.navigator = global.window.navigator;
  }
}

_dereq_('./main');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./main":19}],23:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');

function RotateInstructions() {
  this.loadIcon_();

  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.top = 0;
  s.right = 0;
  s.bottom = 0;
  s.left = 0;
  s.backgroundColor = 'gray';
  s.fontFamily = 'sans-serif';
  // Force this to be above the fullscreen canvas, which is at zIndex: 999999.
  s.zIndex = 1000000;

  var img = document.createElement('img');
  img.src = this.icon;
  var s = img.style;
  s.marginLeft = '25%';
  s.marginTop = '25%';
  s.width = '50%';
  overlay.appendChild(img);

  var text = document.createElement('div');
  var s = text.style;
  s.textAlign = 'center';
  s.fontSize = '16px';
  s.lineHeight = '24px';
  s.margin = '24px 25%';
  s.width = '50%';
  text.innerHTML = 'Place your phone into your Cardboard viewer.';
  overlay.appendChild(text);

  var snackbar = document.createElement('div');
  var s = snackbar.style;
  s.backgroundColor = '#CFD8DC';
  s.position = 'fixed';
  s.bottom = 0;
  s.width = '100%';
  s.height = '48px';
  s.padding = '14px 24px';
  s.boxSizing = 'border-box';
  s.color = '#656A6B';
  overlay.appendChild(snackbar);

  var snackbarText = document.createElement('div');
  snackbarText.style.float = 'left';
  snackbarText.innerHTML = 'No Cardboard viewer?';

  var snackbarButton = document.createElement('a');
  snackbarButton.href = 'https://www.google.com/get/cardboard/get-cardboard/';
  snackbarButton.innerHTML = 'get one';
  snackbarButton.target = '_blank';
  var s = snackbarButton.style;
  s.float = 'right';
  s.fontWeight = 600;
  s.textTransform = 'uppercase';
  s.borderLeft = '1px solid gray';
  s.paddingLeft = '24px';
  s.textDecoration = 'none';
  s.color = '#656A6B';

  snackbar.appendChild(snackbarText);
  snackbar.appendChild(snackbarButton);

  this.overlay = overlay;
  this.text = text;

  this.hide();
}

RotateInstructions.prototype.show = function(parent) {
  if (!parent && !this.overlay.parentElement) {
    document.body.appendChild(this.overlay);
  } else if (parent) {
    if (this.overlay.parentElement && this.overlay.parentElement != parent)
      this.overlay.parentElement.removeChild(this.overlay);

    parent.appendChild(this.overlay);
  }

  this.overlay.style.display = 'block';

  var img = this.overlay.querySelector('img');
  var s = img.style;

  if (Util.isLandscapeMode()) {
    s.width = '20%';
    s.marginLeft = '40%';
    s.marginTop = '3%';
  } else {
    s.width = '50%';
    s.marginLeft = '25%';
    s.marginTop = '25%';
  }
};

RotateInstructions.prototype.hide = function() {
  this.overlay.style.display = 'none';
};

RotateInstructions.prototype.showTemporarily = function(ms, parent) {
  this.show(parent);
  this.timer = setTimeout(this.hide.bind(this), ms);
};

RotateInstructions.prototype.disableShowTemporarily = function() {
  clearTimeout(this.timer);
};

RotateInstructions.prototype.update = function() {
  this.disableShowTemporarily();
  // In portrait VR mode, tell the user to rotate to landscape. Otherwise, hide
  // the instructions.
  if (!Util.isLandscapeMode() && Util.isMobile()) {
    this.show();
  } else {
    this.hide();
  }
};

RotateInstructions.prototype.loadIcon_ = function() {
  // Encoded asset_src/rotate-instructions.svg
  this.icon = Util.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjE5OHB4IiBoZWlnaHQ9IjI0MHB4IiB2aWV3Qm94PSIwIDAgMTk4IDI0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpza2V0Y2g9Imh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaC9ucyI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDMuMy4zICgxMjA4MSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dHJhbnNpdGlvbjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHNrZXRjaDp0eXBlPSJNU1BhZ2UiPgogICAgICAgIDxnIGlkPSJ0cmFuc2l0aW9uIiBza2V0Y2g6dHlwZT0iTVNBcnRib2FyZEdyb3VwIj4KICAgICAgICAgICAgPGcgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTQtKy1JbXBvcnRlZC1MYXllcnMtQ29weS0rLUltcG9ydGVkLUxheWVycy1Db3B5LTItQ29weSIgc2tldGNoOnR5cGU9Ik1TTGF5ZXJHcm91cCI+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHktNCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsIDEwNy4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjYyNSwyLjUyNyBDMTQ5LjYyNSwyLjUyNyAxNTUuODA1LDYuMDk2IDE1Ni4zNjIsNi40MTggTDE1Ni4zNjIsNy4zMDQgQzE1Ni4zNjIsNy40ODEgMTU2LjM3NSw3LjY2NCAxNTYuNCw3Ljg1MyBDMTU2LjQxLDcuOTM0IDE1Ni40Miw4LjAxNSAxNTYuNDI3LDguMDk1IEMxNTYuNTY3LDkuNTEgMTU3LjQwMSwxMS4wOTMgMTU4LjUzMiwxMi4wOTQgTDE2NC4yNTIsMTcuMTU2IEwxNjQuMzMzLDE3LjA2NiBDMTY0LjMzMywxNy4wNjYgMTY4LjcxNSwxNC41MzYgMTY5LjU2OCwxNC4wNDIgQzE3MS4wMjUsMTQuODgzIDE5NS41MzgsMjkuMDM1IDE5NS41MzgsMjkuMDM1IEwxOTUuNTM4LDgzLjAzNiBDMTk1LjUzOCw4My44MDcgMTk1LjE1Miw4NC4yNTMgMTk0LjU5LDg0LjI1MyBDMTk0LjM1Nyw4NC4yNTMgMTk0LjA5NSw4NC4xNzcgMTkzLjgxOCw4NC4wMTcgTDE2OS44NTEsNzAuMTc5IEwxNjkuODM3LDcwLjIwMyBMMTQyLjUxNSw4NS45NzggTDE0MS42NjUsODQuNjU1IEMxMzYuOTM0LDgzLjEyNiAxMzEuOTE3LDgxLjkxNSAxMjYuNzE0LDgxLjA0NSBDMTI2LjcwOSw4MS4wNiAxMjYuNzA3LDgxLjA2OSAxMjYuNzA3LDgxLjA2OSBMMTIxLjY0LDk4LjAzIEwxMTMuNzQ5LDEwMi41ODYgTDExMy43MTIsMTAyLjUyMyBMMTEzLjcxMiwxMzAuMTEzIEMxMTMuNzEyLDEzMC44ODUgMTEzLjMyNiwxMzEuMzMgMTEyLjc2NCwxMzEuMzMgQzExMi41MzIsMTMxLjMzIDExMi4yNjksMTMxLjI1NCAxMTEuOTkyLDEzMS4wOTQgTDY5LjUxOSwxMDYuNTcyIEM2OC41NjksMTA2LjAyMyA2Ny43OTksMTA0LjY5NSA2Ny43OTksMTAzLjYwNSBMNjcuNzk5LDEwMi41NyBMNjcuNzc4LDEwMi42MTcgQzY3LjI3LDEwMi4zOTMgNjYuNjQ4LDEwMi4yNDkgNjUuOTYyLDEwMi4yMTggQzY1Ljg3NSwxMDIuMjE0IDY1Ljc4OCwxMDIuMjEyIDY1LjcwMSwxMDIuMjEyIEM2NS42MDYsMTAyLjIxMiA2NS41MTEsMTAyLjIxNSA2NS40MTYsMTAyLjIxOSBDNjUuMTk1LDEwMi4yMjkgNjQuOTc0LDEwMi4yMzUgNjQuNzU0LDEwMi4yMzUgQzY0LjMzMSwxMDIuMjM1IDYzLjkxMSwxMDIuMjE2IDYzLjQ5OCwxMDIuMTc4IEM2MS44NDMsMTAyLjAyNSA2MC4yOTgsMTAxLjU3OCA1OS4wOTQsMTAwLjg4MiBMMTIuNTE4LDczLjk5MiBMMTIuNTIzLDc0LjAwNCBMMi4yNDUsNTUuMjU0IEMxLjI0NCw1My40MjcgMi4wMDQsNTEuMDM4IDMuOTQzLDQ5LjkxOCBMNTkuOTU0LDE3LjU3MyBDNjAuNjI2LDE3LjE4NSA2MS4zNSwxNy4wMDEgNjIuMDUzLDE3LjAwMSBDNjMuMzc5LDE3LjAwMSA2NC42MjUsMTcuNjYgNjUuMjgsMTguODU0IEw2NS4yODUsMTguODUxIEw2NS41MTIsMTkuMjY0IEw2NS41MDYsMTkuMjY4IEM2NS45MDksMjAuMDAzIDY2LjQwNSwyMC42OCA2Ni45ODMsMjEuMjg2IEw2Ny4yNiwyMS41NTYgQzY5LjE3NCwyMy40MDYgNzEuNzI4LDI0LjM1NyA3NC4zNzMsMjQuMzU3IEM3Ni4zMjIsMjQuMzU3IDc4LjMyMSwyMy44NCA4MC4xNDgsMjIuNzg1IEM4MC4xNjEsMjIuNzg1IDg3LjQ2NywxOC41NjYgODcuNDY3LDE4LjU2NiBDODguMTM5LDE4LjE3OCA4OC44NjMsMTcuOTk0IDg5LjU2NiwxNy45OTQgQzkwLjg5MiwxNy45OTQgOTIuMTM4LDE4LjY1MiA5Mi43OTIsMTkuODQ3IEw5Ni4wNDIsMjUuNzc1IEw5Ni4wNjQsMjUuNzU3IEwxMDIuODQ5LDI5LjY3NCBMMTAyLjc0NCwyOS40OTIgTDE0OS42MjUsMi41MjcgTTE0OS42MjUsMC44OTIgQzE0OS4zNDMsMC44OTIgMTQ5LjA2MiwwLjk2NSAxNDguODEsMS4xMSBMMTAyLjY0MSwyNy42NjYgTDk3LjIzMSwyNC41NDIgTDk0LjIyNiwxOS4wNjEgQzkzLjMxMywxNy4zOTQgOTEuNTI3LDE2LjM1OSA4OS41NjYsMTYuMzU4IEM4OC41NTUsMTYuMzU4IDg3LjU0NiwxNi42MzIgODYuNjQ5LDE3LjE1IEM4My44NzgsMTguNzUgNzkuNjg3LDIxLjE2OSA3OS4zNzQsMjEuMzQ1IEM3OS4zNTksMjEuMzUzIDc5LjM0NSwyMS4zNjEgNzkuMzMsMjEuMzY5IEM3Ny43OTgsMjIuMjU0IDc2LjA4NCwyMi43MjIgNzQuMzczLDIyLjcyMiBDNzIuMDgxLDIyLjcyMiA2OS45NTksMjEuODkgNjguMzk3LDIwLjM4IEw2OC4xNDUsMjAuMTM1IEM2Ny43MDYsMTkuNjcyIDY3LjMyMywxOS4xNTYgNjcuMDA2LDE4LjYwMSBDNjYuOTg4LDE4LjU1OSA2Ni45NjgsMTguNTE5IDY2Ljk0NiwxOC40NzkgTDY2LjcxOSwxOC4wNjUgQzY2LjY5LDE4LjAxMiA2Ni42NTgsMTcuOTYgNjYuNjI0LDE3LjkxMSBDNjUuNjg2LDE2LjMzNyA2My45NTEsMTUuMzY2IDYyLjA1MywxNS4zNjYgQzYxLjA0MiwxNS4zNjYgNjAuMDMzLDE1LjY0IDU5LjEzNiwxNi4xNTggTDMuMTI1LDQ4LjUwMiBDMC40MjYsNTAuMDYxIC0wLjYxMyw1My40NDIgMC44MTEsNTYuMDQgTDExLjA4OSw3NC43OSBDMTEuMjY2LDc1LjExMyAxMS41MzcsNzUuMzUzIDExLjg1LDc1LjQ5NCBMNTguMjc2LDEwMi4yOTggQzU5LjY3OSwxMDMuMTA4IDYxLjQzMywxMDMuNjMgNjMuMzQ4LDEwMy44MDYgQzYzLjgxMiwxMDMuODQ4IDY0LjI4NSwxMDMuODcgNjQuNzU0LDEwMy44NyBDNjUsMTAzLjg3IDY1LjI0OSwxMDMuODY0IDY1LjQ5NCwxMDMuODUyIEM2NS41NjMsMTAzLjg0OSA2NS42MzIsMTAzLjg0NyA2NS43MDEsMTAzLjg0NyBDNjUuNzY0LDEwMy44NDcgNjUuODI4LDEwMy44NDkgNjUuODksMTAzLjg1MiBDNjUuOTg2LDEwMy44NTYgNjYuMDgsMTAzLjg2MyA2Ni4xNzMsMTAzLjg3NCBDNjYuMjgyLDEwNS40NjcgNjcuMzMyLDEwNy4xOTcgNjguNzAyLDEwNy45ODggTDExMS4xNzQsMTMyLjUxIEMxMTEuNjk4LDEzMi44MTIgMTEyLjIzMiwxMzIuOTY1IDExMi43NjQsMTMyLjk2NSBDMTE0LjI2MSwxMzIuOTY1IDExNS4zNDcsMTMxLjc2NSAxMTUuMzQ3LDEzMC4xMTMgTDExNS4zNDcsMTAzLjU1MSBMMTIyLjQ1OCw5OS40NDYgQzEyMi44MTksOTkuMjM3IDEyMy4wODcsOTguODk4IDEyMy4yMDcsOTguNDk4IEwxMjcuODY1LDgyLjkwNSBDMTMyLjI3OSw4My43MDIgMTM2LjU1Nyw4NC43NTMgMTQwLjYwNyw4Ni4wMzMgTDE0MS4xNCw4Ni44NjIgQzE0MS40NTEsODcuMzQ2IDE0MS45NzcsODcuNjEzIDE0Mi41MTYsODcuNjEzIEMxNDIuNzk0LDg3LjYxMyAxNDMuMDc2LDg3LjU0MiAxNDMuMzMzLDg3LjM5MyBMMTY5Ljg2NSw3Mi4wNzYgTDE5Myw4NS40MzMgQzE5My41MjMsODUuNzM1IDE5NC4wNTgsODUuODg4IDE5NC41OSw4NS44ODggQzE5Ni4wODcsODUuODg4IDE5Ny4xNzMsODQuNjg5IDE5Ny4xNzMsODMuMDM2IEwxOTcuMTczLDI5LjAzNSBDMTk3LjE3MywyOC40NTEgMTk2Ljg2MSwyNy45MTEgMTk2LjM1NSwyNy42MTkgQzE5Ni4zNTUsMjcuNjE5IDE3MS44NDMsMTMuNDY3IDE3MC4zODUsMTIuNjI2IEMxNzAuMTMyLDEyLjQ4IDE2OS44NSwxMi40MDcgMTY5LjU2OCwxMi40MDcgQzE2OS4yODUsMTIuNDA3IDE2OS4wMDIsMTIuNDgxIDE2OC43NDksMTIuNjI3IEMxNjguMTQzLDEyLjk3OCAxNjUuNzU2LDE0LjM1NyAxNjQuNDI0LDE1LjEyNSBMMTU5LjYxNSwxMC44NyBDMTU4Ljc5NiwxMC4xNDUgMTU4LjE1NCw4LjkzNyAxNTguMDU0LDcuOTM0IEMxNTguMDQ1LDcuODM3IDE1OC4wMzQsNy43MzkgMTU4LjAyMSw3LjY0IEMxNTguMDA1LDcuNTIzIDE1Ny45OTgsNy40MSAxNTcuOTk4LDcuMzA0IEwxNTcuOTk4LDYuNDE4IEMxNTcuOTk4LDUuODM0IDE1Ny42ODYsNS4yOTUgMTU3LjE4MSw1LjAwMiBDMTU2LjYyNCw0LjY4IDE1MC40NDIsMS4xMTEgMTUwLjQ0MiwxLjExMSBDMTUwLjE4OSwwLjk2NSAxNDkuOTA3LDAuODkyIDE0OS42MjUsMC44OTIiIGlkPSJGaWxsLTEiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTYuMDI3LDI1LjYzNiBMMTQyLjYwMyw1Mi41MjcgQzE0My44MDcsNTMuMjIyIDE0NC41ODIsNTQuMTE0IDE0NC44NDUsNTUuMDY4IEwxNDQuODM1LDU1LjA3NSBMNjMuNDYxLDEwMi4wNTcgTDYzLjQ2LDEwMi4wNTcgQzYxLjgwNiwxMDEuOTA1IDYwLjI2MSwxMDEuNDU3IDU5LjA1NywxMDAuNzYyIEwxMi40ODEsNzMuODcxIEw5Ni4wMjcsMjUuNjM2IiBpZD0iRmlsbC0yIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYzLjQ2MSwxMDIuMTc0IEM2My40NTMsMTAyLjE3NCA2My40NDYsMTAyLjE3NCA2My40MzksMTAyLjE3MiBDNjEuNzQ2LDEwMi4wMTYgNjAuMjExLDEwMS41NjMgNTguOTk4LDEwMC44NjMgTDEyLjQyMiw3My45NzMgQzEyLjM4Niw3My45NTIgMTIuMzY0LDczLjkxNCAxMi4zNjQsNzMuODcxIEMxMi4zNjQsNzMuODMgMTIuMzg2LDczLjc5MSAxMi40MjIsNzMuNzcgTDk1Ljk2OCwyNS41MzUgQzk2LjAwNCwyNS41MTQgOTYuMDQ5LDI1LjUxNCA5Ni4wODUsMjUuNTM1IEwxNDIuNjYxLDUyLjQyNiBDMTQzLjg4OCw1My4xMzQgMTQ0LjY4Miw1NC4wMzggMTQ0Ljk1Nyw1NS4wMzcgQzE0NC45Nyw1NS4wODMgMTQ0Ljk1Myw1NS4xMzMgMTQ0LjkxNSw1NS4xNjEgQzE0NC45MTEsNTUuMTY1IDE0NC44OTgsNTUuMTc0IDE0NC44OTQsNTUuMTc3IEw2My41MTksMTAyLjE1OCBDNjMuNTAxLDEwMi4xNjkgNjMuNDgxLDEwMi4xNzQgNjMuNDYxLDEwMi4xNzQgTDYzLjQ2MSwxMDIuMTc0IFogTTEyLjcxNCw3My44NzEgTDU5LjExNSwxMDAuNjYxIEM2MC4yOTMsMTAxLjM0MSA2MS43ODYsMTAxLjc4MiA2My40MzUsMTAxLjkzNyBMMTQ0LjcwNyw1NS4wMTUgQzE0NC40MjgsNTQuMTA4IDE0My42ODIsNTMuMjg1IDE0Mi41NDQsNTIuNjI4IEw5Ni4wMjcsMjUuNzcxIEwxMi43MTQsNzMuODcxIEwxMi43MTQsNzMuODcxIFoiIGlkPSJGaWxsLTMiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ4LjMyNyw1OC40NzEgQzE0OC4xNDUsNTguNDggMTQ3Ljk2Miw1OC40OCAxNDcuNzgxLDU4LjQ3MiBDMTQ1Ljg4Nyw1OC4zODkgMTQ0LjQ3OSw1Ny40MzQgMTQ0LjYzNiw1Ni4zNCBDMTQ0LjY4OSw1NS45NjcgMTQ0LjY2NCw1NS41OTcgMTQ0LjU2NCw1NS4yMzUgTDYzLjQ2MSwxMDIuMDU3IEM2NC4wODksMTAyLjExNSA2NC43MzMsMTAyLjEzIDY1LjM3OSwxMDIuMDk5IEM2NS41NjEsMTAyLjA5IDY1Ljc0MywxMDIuMDkgNjUuOTI1LDEwMi4wOTggQzY3LjgxOSwxMDIuMTgxIDY5LjIyNywxMDMuMTM2IDY5LjA3LDEwNC4yMyBMMTQ4LjMyNyw1OC40NzEiIGlkPSJGaWxsLTQiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNjkuMDcsMTA0LjM0NyBDNjkuMDQ4LDEwNC4zNDcgNjkuMDI1LDEwNC4zNCA2OS4wMDUsMTA0LjMyNyBDNjguOTY4LDEwNC4zMDEgNjguOTQ4LDEwNC4yNTcgNjguOTU1LDEwNC4yMTMgQzY5LDEwMy44OTYgNjguODk4LDEwMy41NzYgNjguNjU4LDEwMy4yODggQzY4LjE1MywxMDIuNjc4IDY3LjEwMywxMDIuMjY2IDY1LjkyLDEwMi4yMTQgQzY1Ljc0MiwxMDIuMjA2IDY1LjU2MywxMDIuMjA3IDY1LjM4NSwxMDIuMjE1IEM2NC43NDIsMTAyLjI0NiA2NC4wODcsMTAyLjIzMiA2My40NSwxMDIuMTc0IEM2My4zOTksMTAyLjE2OSA2My4zNTgsMTAyLjEzMiA2My4zNDcsMTAyLjA4MiBDNjMuMzM2LDEwMi4wMzMgNjMuMzU4LDEwMS45ODEgNjMuNDAyLDEwMS45NTYgTDE0NC41MDYsNTUuMTM0IEMxNDQuNTM3LDU1LjExNiAxNDQuNTc1LDU1LjExMyAxNDQuNjA5LDU1LjEyNyBDMTQ0LjY0Miw1NS4xNDEgMTQ0LjY2OCw1NS4xNyAxNDQuNjc3LDU1LjIwNCBDMTQ0Ljc4MSw1NS41ODUgMTQ0LjgwNiw1NS45NzIgMTQ0Ljc1MSw1Ni4zNTcgQzE0NC43MDYsNTYuNjczIDE0NC44MDgsNTYuOTk0IDE0NS4wNDcsNTcuMjgyIEMxNDUuNTUzLDU3Ljg5MiAxNDYuNjAyLDU4LjMwMyAxNDcuNzg2LDU4LjM1NSBDMTQ3Ljk2NCw1OC4zNjMgMTQ4LjE0Myw1OC4zNjMgMTQ4LjMyMSw1OC4zNTQgQzE0OC4zNzcsNTguMzUyIDE0OC40MjQsNTguMzg3IDE0OC40MzksNTguNDM4IEMxNDguNDU0LDU4LjQ5IDE0OC40MzIsNTguNTQ1IDE0OC4zODUsNTguNTcyIEw2OS4xMjksMTA0LjMzMSBDNjkuMTExLDEwNC4zNDIgNjkuMDksMTA0LjM0NyA2OS4wNywxMDQuMzQ3IEw2OS4wNywxMDQuMzQ3IFogTTY1LjY2NSwxMDEuOTc1IEM2NS43NTQsMTAxLjk3NSA2NS44NDIsMTAxLjk3NyA2NS45MywxMDEuOTgxIEM2Ny4xOTYsMTAyLjAzNyA2OC4yODMsMTAyLjQ2OSA2OC44MzgsMTAzLjEzOSBDNjkuMDY1LDEwMy40MTMgNjkuMTg4LDEwMy43MTQgNjkuMTk4LDEwNC4wMjEgTDE0Ny44ODMsNTguNTkyIEMxNDcuODQ3LDU4LjU5MiAxNDcuODExLDU4LjU5MSAxNDcuNzc2LDU4LjU4OSBDMTQ2LjUwOSw1OC41MzMgMTQ1LjQyMiw1OC4xIDE0NC44NjcsNTcuNDMxIEMxNDQuNTg1LDU3LjA5MSAxNDQuNDY1LDU2LjcwNyAxNDQuNTIsNTYuMzI0IEMxNDQuNTYzLDU2LjAyMSAxNDQuNTUyLDU1LjcxNiAxNDQuNDg4LDU1LjQxNCBMNjMuODQ2LDEwMS45NyBDNjQuMzUzLDEwMi4wMDIgNjQuODY3LDEwMi4wMDYgNjUuMzc0LDEwMS45ODIgQzY1LjQ3MSwxMDEuOTc3IDY1LjU2OCwxMDEuOTc1IDY1LjY2NSwxMDEuOTc1IEw2NS42NjUsMTAxLjk3NSBaIiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTIuMjA4LDU1LjEzNCBDMS4yMDcsNTMuMzA3IDEuOTY3LDUwLjkxNyAzLjkwNiw0OS43OTcgTDU5LjkxNywxNy40NTMgQzYxLjg1NiwxNi4zMzMgNjQuMjQxLDE2LjkwNyA2NS4yNDMsMTguNzM0IEw2NS40NzUsMTkuMTQ0IEM2NS44NzIsMTkuODgyIDY2LjM2OCwyMC41NiA2Ni45NDUsMjEuMTY1IEw2Ny4yMjMsMjEuNDM1IEM3MC41NDgsMjQuNjQ5IDc1LjgwNiwyNS4xNTEgODAuMTExLDIyLjY2NSBMODcuNDMsMTguNDQ1IEM4OS4zNywxNy4zMjYgOTEuNzU0LDE3Ljg5OSA5Mi43NTUsMTkuNzI3IEw5Ni4wMDUsMjUuNjU1IEwxMi40ODYsNzMuODg0IEwyLjIwOCw1NS4xMzQgWiIgaWQ9IkZpbGwtNiIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMi40ODYsNzQuMDAxIEMxMi40NzYsNzQuMDAxIDEyLjQ2NSw3My45OTkgMTIuNDU1LDczLjk5NiBDMTIuNDI0LDczLjk4OCAxMi4zOTksNzMuOTY3IDEyLjM4NCw3My45NCBMMi4xMDYsNTUuMTkgQzEuMDc1LDUzLjMxIDEuODU3LDUwLjg0NSAzLjg0OCw0OS42OTYgTDU5Ljg1OCwxNy4zNTIgQzYwLjUyNSwxNi45NjcgNjEuMjcxLDE2Ljc2NCA2Mi4wMTYsMTYuNzY0IEM2My40MzEsMTYuNzY0IDY0LjY2NiwxNy40NjYgNjUuMzI3LDE4LjY0NiBDNjUuMzM3LDE4LjY1NCA2NS4zNDUsMTguNjYzIDY1LjM1MSwxOC42NzQgTDY1LjU3OCwxOS4wODggQzY1LjU4NCwxOS4xIDY1LjU4OSwxOS4xMTIgNjUuNTkxLDE5LjEyNiBDNjUuOTg1LDE5LjgzOCA2Ni40NjksMjAuNDk3IDY3LjAzLDIxLjA4NSBMNjcuMzA1LDIxLjM1MSBDNjkuMTUxLDIzLjEzNyA3MS42NDksMjQuMTIgNzQuMzM2LDI0LjEyIEM3Ni4zMTMsMjQuMTIgNzguMjksMjMuNTgyIDgwLjA1MywyMi41NjMgQzgwLjA2NCwyMi41NTcgODAuMDc2LDIyLjU1MyA4MC4wODgsMjIuNTUgTDg3LjM3MiwxOC4zNDQgQzg4LjAzOCwxNy45NTkgODguNzg0LDE3Ljc1NiA4OS41MjksMTcuNzU2IEM5MC45NTYsMTcuNzU2IDkyLjIwMSwxOC40NzIgOTIuODU4LDE5LjY3IEw5Ni4xMDcsMjUuNTk5IEM5Ni4xMzgsMjUuNjU0IDk2LjExOCwyNS43MjQgOTYuMDYzLDI1Ljc1NiBMMTIuNTQ1LDczLjk4NSBDMTIuNTI2LDczLjk5NiAxMi41MDYsNzQuMDAxIDEyLjQ4Niw3NC4wMDEgTDEyLjQ4Niw3NC4wMDEgWiBNNjIuMDE2LDE2Ljk5NyBDNjEuMzEyLDE2Ljk5NyA2MC42MDYsMTcuMTkgNTkuOTc1LDE3LjU1NCBMMy45NjUsNDkuODk5IEMyLjA4Myw1MC45ODUgMS4zNDEsNTMuMzA4IDIuMzEsNTUuMDc4IEwxMi41MzEsNzMuNzIzIEw5NS44NDgsMjUuNjExIEw5Mi42NTMsMTkuNzgyIEM5Mi4wMzgsMTguNjYgOTAuODcsMTcuOTkgODkuNTI5LDE3Ljk5IEM4OC44MjUsMTcuOTkgODguMTE5LDE4LjE4MiA4Ny40ODksMTguNTQ3IEw4MC4xNzIsMjIuNzcyIEM4MC4xNjEsMjIuNzc4IDgwLjE0OSwyMi43ODIgODAuMTM3LDIyLjc4NSBDNzguMzQ2LDIzLjgxMSA3Ni4zNDEsMjQuMzU0IDc0LjMzNiwyNC4zNTQgQzcxLjU4OCwyNC4zNTQgNjkuMDMzLDIzLjM0NyA2Ny4xNDIsMjEuNTE5IEw2Ni44NjQsMjEuMjQ5IEM2Ni4yNzcsMjAuNjM0IDY1Ljc3NCwxOS45NDcgNjUuMzY3LDE5LjIwMyBDNjUuMzYsMTkuMTkyIDY1LjM1NiwxOS4xNzkgNjUuMzU0LDE5LjE2NiBMNjUuMTYzLDE4LjgxOSBDNjUuMTU0LDE4LjgxMSA2NS4xNDYsMTguODAxIDY1LjE0LDE4Ljc5IEM2NC41MjUsMTcuNjY3IDYzLjM1NywxNi45OTcgNjIuMDE2LDE2Ljk5NyBMNjIuMDE2LDE2Ljk5NyBaIiBpZD0iRmlsbC03IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTQyLjQzNCw0OC44MDggTDQyLjQzNCw0OC44MDggQzM5LjkyNCw0OC44MDcgMzcuNzM3LDQ3LjU1IDM2LjU4Miw0NS40NDMgQzM0Ljc3MSw0Mi4xMzkgMzYuMTQ0LDM3LjgwOSAzOS42NDEsMzUuNzg5IEw1MS45MzIsMjguNjkxIEM1My4xMDMsMjguMDE1IDU0LjQxMywyNy42NTggNTUuNzIxLDI3LjY1OCBDNTguMjMxLDI3LjY1OCA2MC40MTgsMjguOTE2IDYxLjU3MywzMS4wMjMgQzYzLjM4NCwzNC4zMjcgNjIuMDEyLDM4LjY1NyA1OC41MTQsNDAuNjc3IEw0Ni4yMjMsNDcuNzc1IEM0NS4wNTMsNDguNDUgNDMuNzQyLDQ4LjgwOCA0Mi40MzQsNDguODA4IEw0Mi40MzQsNDguODA4IFogTTU1LjcyMSwyOC4xMjUgQzU0LjQ5NSwyOC4xMjUgNTMuMjY1LDI4LjQ2MSA1Mi4xNjYsMjkuMDk2IEwzOS44NzUsMzYuMTk0IEMzNi41OTYsMzguMDg3IDM1LjMwMiw0Mi4xMzYgMzYuOTkyLDQ1LjIxOCBDMzguMDYzLDQ3LjE3MyA0MC4wOTgsNDguMzQgNDIuNDM0LDQ4LjM0IEM0My42NjEsNDguMzQgNDQuODksNDguMDA1IDQ1Ljk5LDQ3LjM3IEw1OC4yODEsNDAuMjcyIEM2MS41NiwzOC4zNzkgNjIuODUzLDM0LjMzIDYxLjE2NCwzMS4yNDggQzYwLjA5MiwyOS4yOTMgNTguMDU4LDI4LjEyNSA1NS43MjEsMjguMTI1IEw1NS43MjEsMjguMTI1IFoiIGlkPSJGaWxsLTgiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjU4OCwyLjQwNyBDMTQ5LjU4OCwyLjQwNyAxNTUuNzY4LDUuOTc1IDE1Ni4zMjUsNi4yOTcgTDE1Ni4zMjUsNy4xODQgQzE1Ni4zMjUsNy4zNiAxNTYuMzM4LDcuNTQ0IDE1Ni4zNjIsNy43MzMgQzE1Ni4zNzMsNy44MTQgMTU2LjM4Miw3Ljg5NCAxNTYuMzksNy45NzUgQzE1Ni41Myw5LjM5IDE1Ny4zNjMsMTAuOTczIDE1OC40OTUsMTEuOTc0IEwxNjUuODkxLDE4LjUxOSBDMTY2LjA2OCwxOC42NzUgMTY2LjI0OSwxOC44MTQgMTY2LjQzMiwxOC45MzQgQzE2OC4wMTEsMTkuOTc0IDE2OS4zODIsMTkuNCAxNjkuNDk0LDE3LjY1MiBDMTY5LjU0MywxNi44NjggMTY5LjU1MSwxNi4wNTcgMTY5LjUxNywxNS4yMjMgTDE2OS41MTQsMTUuMDYzIEwxNjkuNTE0LDEzLjkxMiBDMTcwLjc4LDE0LjY0MiAxOTUuNTAxLDI4LjkxNSAxOTUuNTAxLDI4LjkxNSBMMTk1LjUwMSw4Mi45MTUgQzE5NS41MDEsODQuMDA1IDE5NC43MzEsODQuNDQ1IDE5My43ODEsODMuODk3IEwxNTEuMzA4LDU5LjM3NCBDMTUwLjM1OCw1OC44MjYgMTQ5LjU4OCw1Ny40OTcgMTQ5LjU4OCw1Ni40MDggTDE0OS41ODgsMjIuMzc1IiBpZD0iRmlsbC05IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5NC41NTMsODQuMjUgQzE5NC4yOTYsODQuMjUgMTk0LjAxMyw4NC4xNjUgMTkzLjcyMiw4My45OTcgTDE1MS4yNSw1OS40NzYgQzE1MC4yNjksNTguOTA5IDE0OS40NzEsNTcuNTMzIDE0OS40NzEsNTYuNDA4IEwxNDkuNDcxLDIyLjM3NSBMMTQ5LjcwNSwyMi4zNzUgTDE0OS43MDUsNTYuNDA4IEMxNDkuNzA1LDU3LjQ1OSAxNTAuNDUsNTguNzQ0IDE1MS4zNjYsNTkuMjc0IEwxOTMuODM5LDgzLjc5NSBDMTk0LjI2Myw4NC4wNCAxOTQuNjU1LDg0LjA4MyAxOTQuOTQyLDgzLjkxNyBDMTk1LjIyNyw4My43NTMgMTk1LjM4NCw4My4zOTcgMTk1LjM4NCw4Mi45MTUgTDE5NS4zODQsMjguOTgyIEMxOTQuMTAyLDI4LjI0MiAxNzIuMTA0LDE1LjU0MiAxNjkuNjMxLDE0LjExNCBMMTY5LjYzNCwxNS4yMiBDMTY5LjY2OCwxNi4wNTIgMTY5LjY2LDE2Ljg3NCAxNjkuNjEsMTcuNjU5IEMxNjkuNTU2LDE4LjUwMyAxNjkuMjE0LDE5LjEyMyAxNjguNjQ3LDE5LjQwNSBDMTY4LjAyOCwxOS43MTQgMTY3LjE5NywxOS41NzggMTY2LjM2NywxOS4wMzIgQzE2Ni4xODEsMTguOTA5IDE2NS45OTUsMTguNzY2IDE2NS44MTQsMTguNjA2IEwxNTguNDE3LDEyLjA2MiBDMTU3LjI1OSwxMS4wMzYgMTU2LjQxOCw5LjQzNyAxNTYuMjc0LDcuOTg2IEMxNTYuMjY2LDcuOTA3IDE1Ni4yNTcsNy44MjcgMTU2LjI0Nyw3Ljc0OCBDMTU2LjIyMSw3LjU1NSAxNTYuMjA5LDcuMzY1IDE1Ni4yMDksNy4xODQgTDE1Ni4yMDksNi4zNjQgQzE1NS4zNzUsNS44ODMgMTQ5LjUyOSwyLjUwOCAxNDkuNTI5LDIuNTA4IEwxNDkuNjQ2LDIuMzA2IEMxNDkuNjQ2LDIuMzA2IDE1NS44MjcsNS44NzQgMTU2LjM4NCw2LjE5NiBMMTU2LjQ0Miw2LjIzIEwxNTYuNDQyLDcuMTg0IEMxNTYuNDQyLDcuMzU1IDE1Ni40NTQsNy41MzUgMTU2LjQ3OCw3LjcxNyBDMTU2LjQ4OSw3LjggMTU2LjQ5OSw3Ljg4MiAxNTYuNTA3LDcuOTYzIEMxNTYuNjQ1LDkuMzU4IDE1Ny40NTUsMTAuODk4IDE1OC41NzIsMTEuODg2IEwxNjUuOTY5LDE4LjQzMSBDMTY2LjE0MiwxOC41ODQgMTY2LjMxOSwxOC43MiAxNjYuNDk2LDE4LjgzNyBDMTY3LjI1NCwxOS4zMzYgMTY4LDE5LjQ2NyAxNjguNTQzLDE5LjE5NiBDMTY5LjAzMywxOC45NTMgMTY5LjMyOSwxOC40MDEgMTY5LjM3NywxNy42NDUgQzE2OS40MjcsMTYuODY3IDE2OS40MzQsMTYuMDU0IDE2OS40MDEsMTUuMjI4IEwxNjkuMzk3LDE1LjA2NSBMMTY5LjM5NywxMy43MSBMMTY5LjU3MiwxMy44MSBDMTcwLjgzOSwxNC41NDEgMTk1LjU1OSwyOC44MTQgMTk1LjU1OSwyOC44MTQgTDE5NS42MTgsMjguODQ3IEwxOTUuNjE4LDgyLjkxNSBDMTk1LjYxOCw4My40ODQgMTk1LjQyLDgzLjkxMSAxOTUuMDU5LDg0LjExOSBDMTk0LjkwOCw4NC4yMDYgMTk0LjczNyw4NC4yNSAxOTQuNTUzLDg0LjI1IiBpZD0iRmlsbC0xMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDUuNjg1LDU2LjE2MSBMMTY5LjgsNzAuMDgzIEwxNDMuODIyLDg1LjA4MSBMMTQyLjM2LDg0Ljc3NCBDMTM1LjgyNiw4Mi42MDQgMTI4LjczMiw4MS4wNDYgMTIxLjM0MSw4MC4xNTggQzExNi45NzYsNzkuNjM0IDExMi42NzgsODEuMjU0IDExMS43NDMsODMuNzc4IEMxMTEuNTA2LDg0LjQxNCAxMTEuNTAzLDg1LjA3MSAxMTEuNzMyLDg1LjcwNiBDMTEzLjI3LDg5Ljk3MyAxMTUuOTY4LDk0LjA2OSAxMTkuNzI3LDk3Ljg0MSBMMTIwLjI1OSw5OC42ODYgQzEyMC4yNiw5OC42ODUgOTQuMjgyLDExMy42ODMgOTQuMjgyLDExMy42ODMgTDcwLjE2Nyw5OS43NjEgTDE0NS42ODUsNTYuMTYxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik05NC4yODIsMTEzLjgxOCBMOTQuMjIzLDExMy43ODUgTDY5LjkzMyw5OS43NjEgTDcwLjEwOCw5OS42NiBMMTQ1LjY4NSw1Ni4wMjYgTDE0NS43NDMsNTYuMDU5IEwxNzAuMDMzLDcwLjA4MyBMMTQzLjg0Miw4NS4yMDUgTDE0My43OTcsODUuMTk1IEMxNDMuNzcyLDg1LjE5IDE0Mi4zMzYsODQuODg4IDE0Mi4zMzYsODQuODg4IEMxMzUuNzg3LDgyLjcxNCAxMjguNzIzLDgxLjE2MyAxMjEuMzI3LDgwLjI3NCBDMTIwLjc4OCw4MC4yMDkgMTIwLjIzNiw4MC4xNzcgMTE5LjY4OSw4MC4xNzcgQzExNS45MzEsODAuMTc3IDExMi42MzUsODEuNzA4IDExMS44NTIsODMuODE5IEMxMTEuNjI0LDg0LjQzMiAxMTEuNjIxLDg1LjA1MyAxMTEuODQyLDg1LjY2NyBDMTEzLjM3Nyw4OS45MjUgMTE2LjA1OCw5My45OTMgMTE5LjgxLDk3Ljc1OCBMMTE5LjgyNiw5Ny43NzkgTDEyMC4zNTIsOTguNjE0IEMxMjAuMzU0LDk4LjYxNyAxMjAuMzU2LDk4LjYyIDEyMC4zNTgsOTguNjI0IEwxMjAuNDIyLDk4LjcyNiBMMTIwLjMxNyw5OC43ODcgQzEyMC4yNjQsOTguODE4IDk0LjU5OSwxMTMuNjM1IDk0LjM0LDExMy43ODUgTDk0LjI4MiwxMTMuODE4IEw5NC4yODIsMTEzLjgxOCBaIE03MC40MDEsOTkuNzYxIEw5NC4yODIsMTEzLjU0OSBMMTE5LjA4NCw5OS4yMjkgQzExOS42Myw5OC45MTQgMTE5LjkzLDk4Ljc0IDEyMC4xMDEsOTguNjU0IEwxMTkuNjM1LDk3LjkxNCBDMTE1Ljg2NCw5NC4xMjcgMTEzLjE2OCw5MC4wMzMgMTExLjYyMiw4NS43NDYgQzExMS4zODIsODUuMDc5IDExMS4zODYsODQuNDA0IDExMS42MzMsODMuNzM4IEMxMTIuNDQ4LDgxLjUzOSAxMTUuODM2LDc5Ljk0MyAxMTkuNjg5LDc5Ljk0MyBDMTIwLjI0Niw3OS45NDMgMTIwLjgwNiw3OS45NzYgMTIxLjM1NSw4MC4wNDIgQzEyOC43NjcsODAuOTMzIDEzNS44NDYsODIuNDg3IDE0Mi4zOTYsODQuNjYzIEMxNDMuMjMyLDg0LjgzOCAxNDMuNjExLDg0LjkxNyAxNDMuNzg2LDg0Ljk2NyBMMTY5LjU2Niw3MC4wODMgTDE0NS42ODUsNTYuMjk1IEw3MC40MDEsOTkuNzYxIEw3MC40MDEsOTkuNzYxIFoiIGlkPSJGaWxsLTEyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2Ny4yMywxOC45NzkgTDE2Ny4yMyw2OS44NSBMMTM5LjkwOSw4NS42MjMgTDEzMy40NDgsNzEuNDU2IEMxMzIuNTM4LDY5LjQ2IDEzMC4wMiw2OS43MTggMTI3LjgyNCw3Mi4wMyBDMTI2Ljc2OSw3My4xNCAxMjUuOTMxLDc0LjU4NSAxMjUuNDk0LDc2LjA0OCBMMTE5LjAzNCw5Ny42NzYgTDkxLjcxMiwxMTMuNDUgTDkxLjcxMiw2Mi41NzkgTDE2Ny4yMywxOC45NzkiIGlkPSJGaWxsLTEzIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTkxLjcxMiwxMTMuNTY3IEM5MS42OTIsMTEzLjU2NyA5MS42NzIsMTEzLjU2MSA5MS42NTMsMTEzLjU1MSBDOTEuNjE4LDExMy41MyA5MS41OTUsMTEzLjQ5MiA5MS41OTUsMTEzLjQ1IEw5MS41OTUsNjIuNTc5IEM5MS41OTUsNjIuNTM3IDkxLjYxOCw2Mi40OTkgOTEuNjUzLDYyLjQ3OCBMMTY3LjE3MiwxOC44NzggQzE2Ny4yMDgsMTguODU3IDE2Ny4yNTIsMTguODU3IDE2Ny4yODgsMTguODc4IEMxNjcuMzI0LDE4Ljg5OSAxNjcuMzQ3LDE4LjkzNyAxNjcuMzQ3LDE4Ljk3OSBMMTY3LjM0Nyw2OS44NSBDMTY3LjM0Nyw2OS44OTEgMTY3LjMyNCw2OS45MyAxNjcuMjg4LDY5Ljk1IEwxMzkuOTY3LDg1LjcyNSBDMTM5LjkzOSw4NS43NDEgMTM5LjkwNSw4NS43NDUgMTM5Ljg3Myw4NS43MzUgQzEzOS44NDIsODUuNzI1IDEzOS44MTYsODUuNzAyIDEzOS44MDIsODUuNjcyIEwxMzMuMzQyLDcxLjUwNCBDMTMyLjk2Nyw3MC42ODIgMTMyLjI4LDcwLjIyOSAxMzEuNDA4LDcwLjIyOSBDMTMwLjMxOSw3MC4yMjkgMTI5LjA0NCw3MC45MTUgMTI3LjkwOCw3Mi4xMSBDMTI2Ljg3NCw3My4yIDEyNi4wMzQsNzQuNjQ3IDEyNS42MDYsNzYuMDgyIEwxMTkuMTQ2LDk3LjcwOSBDMTE5LjEzNyw5Ny43MzggMTE5LjExOCw5Ny43NjIgMTE5LjA5Miw5Ny43NzcgTDkxLjc3LDExMy41NTEgQzkxLjc1MiwxMTMuNTYxIDkxLjczMiwxMTMuNTY3IDkxLjcxMiwxMTMuNTY3IEw5MS43MTIsMTEzLjU2NyBaIE05MS44MjksNjIuNjQ3IEw5MS44MjksMTEzLjI0OCBMMTE4LjkzNSw5Ny41OTggTDEyNS4zODIsNzYuMDE1IEMxMjUuODI3LDc0LjUyNSAxMjYuNjY0LDczLjA4MSAxMjcuNzM5LDcxLjk1IEMxMjguOTE5LDcwLjcwOCAxMzAuMjU2LDY5Ljk5NiAxMzEuNDA4LDY5Ljk5NiBDMTMyLjM3Nyw2OS45OTYgMTMzLjEzOSw3MC40OTcgMTMzLjU1NCw3MS40MDcgTDEzOS45NjEsODUuNDU4IEwxNjcuMTEzLDY5Ljc4MiBMMTY3LjExMywxOS4xODEgTDkxLjgyOSw2Mi42NDcgTDkxLjgyOSw2Mi42NDcgWiIgaWQ9IkZpbGwtMTQiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTY4LjU0MywxOS4yMTMgTDE2OC41NDMsNzAuMDgzIEwxNDEuMjIxLDg1Ljg1NyBMMTM0Ljc2MSw3MS42ODkgQzEzMy44NTEsNjkuNjk0IDEzMS4zMzMsNjkuOTUxIDEyOS4xMzcsNzIuMjYzIEMxMjguMDgyLDczLjM3NCAxMjcuMjQ0LDc0LjgxOSAxMjYuODA3LDc2LjI4MiBMMTIwLjM0Niw5Ny45MDkgTDkzLjAyNSwxMTMuNjgzIEw5My4wMjUsNjIuODEzIEwxNjguNTQzLDE5LjIxMyIgaWQ9IkZpbGwtMTUiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTMuMDI1LDExMy44IEM5My4wMDUsMTEzLjggOTIuOTg0LDExMy43OTUgOTIuOTY2LDExMy43ODUgQzkyLjkzMSwxMTMuNzY0IDkyLjkwOCwxMTMuNzI1IDkyLjkwOCwxMTMuNjg0IEw5Mi45MDgsNjIuODEzIEM5Mi45MDgsNjIuNzcxIDkyLjkzMSw2Mi43MzMgOTIuOTY2LDYyLjcxMiBMMTY4LjQ4NCwxOS4xMTIgQzE2OC41MiwxOS4wOSAxNjguNTY1LDE5LjA5IDE2OC42MDEsMTkuMTEyIEMxNjguNjM3LDE5LjEzMiAxNjguNjYsMTkuMTcxIDE2OC42NiwxOS4yMTIgTDE2OC42Niw3MC4wODMgQzE2OC42Niw3MC4xMjUgMTY4LjYzNyw3MC4xNjQgMTY4LjYwMSw3MC4xODQgTDE0MS4yOCw4NS45NTggQzE0MS4yNTEsODUuOTc1IDE0MS4yMTcsODUuOTc5IDE0MS4xODYsODUuOTY4IEMxNDEuMTU0LDg1Ljk1OCAxNDEuMTI5LDg1LjkzNiAxNDEuMTE1LDg1LjkwNiBMMTM0LjY1NSw3MS43MzggQzEzNC4yOCw3MC45MTUgMTMzLjU5Myw3MC40NjMgMTMyLjcyLDcwLjQ2MyBDMTMxLjYzMiw3MC40NjMgMTMwLjM1Nyw3MS4xNDggMTI5LjIyMSw3Mi4zNDQgQzEyOC4xODYsNzMuNDMzIDEyNy4zNDcsNzQuODgxIDEyNi45MTksNzYuMzE1IEwxMjAuNDU4LDk3Ljk0MyBDMTIwLjQ1LDk3Ljk3MiAxMjAuNDMxLDk3Ljk5NiAxMjAuNDA1LDk4LjAxIEw5My4wODMsMTEzLjc4NSBDOTMuMDY1LDExMy43OTUgOTMuMDQ1LDExMy44IDkzLjAyNSwxMTMuOCBMOTMuMDI1LDExMy44IFogTTkzLjE0Miw2Mi44ODEgTDkzLjE0MiwxMTMuNDgxIEwxMjAuMjQ4LDk3LjgzMiBMMTI2LjY5NSw3Ni4yNDggQzEyNy4xNCw3NC43NTggMTI3Ljk3Nyw3My4zMTUgMTI5LjA1Miw3Mi4xODMgQzEzMC4yMzEsNzAuOTQyIDEzMS41NjgsNzAuMjI5IDEzMi43Miw3MC4yMjkgQzEzMy42ODksNzAuMjI5IDEzNC40NTIsNzAuNzMxIDEzNC44NjcsNzEuNjQxIEwxNDEuMjc0LDg1LjY5MiBMMTY4LjQyNiw3MC4wMTYgTDE2OC40MjYsMTkuNDE1IEw5My4xNDIsNjIuODgxIEw5My4xNDIsNjIuODgxIFoiIGlkPSJGaWxsLTE2IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS44LDcwLjA4MyBMMTQyLjQ3OCw4NS44NTcgTDEzNi4wMTgsNzEuNjg5IEMxMzUuMTA4LDY5LjY5NCAxMzIuNTksNjkuOTUxIDEzMC4zOTMsNzIuMjYzIEMxMjkuMzM5LDczLjM3NCAxMjguNSw3NC44MTkgMTI4LjA2NCw3Ni4yODIgTDEyMS42MDMsOTcuOTA5IEw5NC4yODIsMTEzLjY4MyBMOTQuMjgyLDYyLjgxMyBMMTY5LjgsMTkuMjEzIEwxNjkuOCw3MC4wODMgWiIgaWQ9IkZpbGwtMTciIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTQuMjgyLDExMy45MTcgQzk0LjI0MSwxMTMuOTE3IDk0LjIwMSwxMTMuOTA3IDk0LjE2NSwxMTMuODg2IEM5NC4wOTMsMTEzLjg0NSA5NC4wNDgsMTEzLjc2NyA5NC4wNDgsMTEzLjY4NCBMOTQuMDQ4LDYyLjgxMyBDOTQuMDQ4LDYyLjczIDk0LjA5Myw2Mi42NTIgOTQuMTY1LDYyLjYxMSBMMTY5LjY4MywxOS4wMSBDMTY5Ljc1NSwxOC45NjkgMTY5Ljg0NCwxOC45NjkgMTY5LjkxNywxOS4wMSBDMTY5Ljk4OSwxOS4wNTIgMTcwLjAzMywxOS4xMjkgMTcwLjAzMywxOS4yMTIgTDE3MC4wMzMsNzAuMDgzIEMxNzAuMDMzLDcwLjE2NiAxNjkuOTg5LDcwLjI0NCAxNjkuOTE3LDcwLjI4NSBMMTQyLjU5NSw4Ni4wNiBDMTQyLjUzOCw4Ni4wOTIgMTQyLjQ2OSw4Ni4xIDE0Mi40MDcsODYuMDggQzE0Mi4zNDQsODYuMDYgMTQyLjI5Myw4Ni4wMTQgMTQyLjI2Niw4NS45NTQgTDEzNS44MDUsNzEuNzg2IEMxMzUuNDQ1LDcwLjk5NyAxMzQuODEzLDcwLjU4IDEzMy45NzcsNzAuNTggQzEzMi45MjEsNzAuNTggMTMxLjY3Niw3MS4yNTIgMTMwLjU2Miw3Mi40MjQgQzEyOS41NCw3My41MDEgMTI4LjcxMSw3NC45MzEgMTI4LjI4Nyw3Ni4zNDggTDEyMS44MjcsOTcuOTc2IEMxMjEuODEsOTguMDM0IDEyMS43NzEsOTguMDgyIDEyMS43Miw5OC4xMTIgTDk0LjM5OCwxMTMuODg2IEM5NC4zNjIsMTEzLjkwNyA5NC4zMjIsMTEzLjkxNyA5NC4yODIsMTEzLjkxNyBMOTQuMjgyLDExMy45MTcgWiBNOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDExMy4yNzkgTDEyMS40MDYsOTcuNzU0IEwxMjcuODQsNzYuMjE1IEMxMjguMjksNzQuNzA4IDEyOS4xMzcsNzMuMjQ3IDEzMC4yMjQsNzIuMTAzIEMxMzEuNDI1LDcwLjgzOCAxMzIuNzkzLDcwLjExMiAxMzMuOTc3LDcwLjExMiBDMTM0Ljk5NSw3MC4xMTIgMTM1Ljc5NSw3MC42MzggMTM2LjIzLDcxLjU5MiBMMTQyLjU4NCw4NS41MjYgTDE2OS41NjYsNjkuOTQ4IEwxNjkuNTY2LDE5LjYxNyBMOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDYyLjk0OCBaIiBpZD0iRmlsbC0xOCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMDkuODk0LDkyLjk0MyBMMTA5Ljg5NCw5Mi45NDMgQzEwOC4xMiw5Mi45NDMgMTA2LjY1Myw5Mi4yMTggMTA1LjY1LDkwLjgyMyBDMTA1LjU4Myw5MC43MzEgMTA1LjU5Myw5MC42MSAxMDUuNjczLDkwLjUyOSBDMTA1Ljc1Myw5MC40NDggMTA1Ljg4LDkwLjQ0IDEwNS45NzQsOTAuNTA2IEMxMDYuNzU0LDkxLjA1MyAxMDcuNjc5LDkxLjMzMyAxMDguNzI0LDkxLjMzMyBDMTEwLjA0Nyw5MS4zMzMgMTExLjQ3OCw5MC44OTQgMTEyLjk4LDkwLjAyNyBDMTE4LjI5MSw4Ni45NiAxMjIuNjExLDc5LjUwOSAxMjIuNjExLDczLjQxNiBDMTIyLjYxMSw3MS40ODkgMTIyLjE2OSw2OS44NTYgMTIxLjMzMyw2OC42OTIgQzEyMS4yNjYsNjguNiAxMjEuMjc2LDY4LjQ3MyAxMjEuMzU2LDY4LjM5MiBDMTIxLjQzNiw2OC4zMTEgMTIxLjU2Myw2OC4yOTkgMTIxLjY1Niw2OC4zNjUgQzEyMy4zMjcsNjkuNTM3IDEyNC4yNDcsNzEuNzQ2IDEyNC4yNDcsNzQuNTg0IEMxMjQuMjQ3LDgwLjgyNiAxMTkuODIxLDg4LjQ0NyAxMTQuMzgyLDkxLjU4NyBDMTEyLjgwOCw5Mi40OTUgMTExLjI5OCw5Mi45NDMgMTA5Ljg5NCw5Mi45NDMgTDEwOS44OTQsOTIuOTQzIFogTTEwNi45MjUsOTEuNDAxIEMxMDcuNzM4LDkyLjA1MiAxMDguNzQ1LDkyLjI3OCAxMDkuODkzLDkyLjI3OCBMMTA5Ljg5NCw5Mi4yNzggQzExMS4yMTUsOTIuMjc4IDExMi42NDcsOTEuOTUxIDExNC4xNDgsOTEuMDg0IEMxMTkuNDU5LDg4LjAxNyAxMjMuNzgsODAuNjIxIDEyMy43OCw3NC41MjggQzEyMy43OCw3Mi41NDkgMTIzLjMxNyw3MC45MjkgMTIyLjQ1NCw2OS43NjcgQzEyMi44NjUsNzAuODAyIDEyMy4wNzksNzIuMDQyIDEyMy4wNzksNzMuNDAyIEMxMjMuMDc5LDc5LjY0NSAxMTguNjUzLDg3LjI4NSAxMTMuMjE0LDkwLjQyNSBDMTExLjY0LDkxLjMzNCAxMTAuMTMsOTEuNzQyIDEwOC43MjQsOTEuNzQyIEMxMDguMDgzLDkxLjc0MiAxMDcuNDgxLDkxLjU5MyAxMDYuOTI1LDkxLjQwMSBMMTA2LjkyNSw5MS40MDEgWiIgaWQ9IkZpbGwtMTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjA5Nyw5MC4yMyBDMTE4LjQ4MSw4Ny4xMjIgMTIyLjg0NSw3OS41OTQgMTIyLjg0NSw3My40MTYgQzEyMi44NDUsNzEuMzY1IDEyMi4zNjIsNjkuNzI0IDEyMS41MjIsNjguNTU2IEMxMTkuNzM4LDY3LjMwNCAxMTcuMTQ4LDY3LjM2MiAxMTQuMjY1LDY5LjAyNiBDMTA4Ljg4MSw3Mi4xMzQgMTA0LjUxNyw3OS42NjIgMTA0LjUxNyw4NS44NCBDMTA0LjUxNyw4Ny44OTEgMTA1LDg5LjUzMiAxMDUuODQsOTAuNyBDMTA3LjYyNCw5MS45NTIgMTEwLjIxNCw5MS44OTQgMTEzLjA5Nyw5MC4yMyIgaWQ9IkZpbGwtMjAiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTA4LjcyNCw5MS42MTQgTDEwOC43MjQsOTEuNjE0IEMxMDcuNTgyLDkxLjYxNCAxMDYuNTY2LDkxLjQwMSAxMDUuNzA1LDkwLjc5NyBDMTA1LjY4NCw5MC43ODMgMTA1LjY2NSw5MC44MTEgMTA1LjY1LDkwLjc5IEMxMDQuNzU2LDg5LjU0NiAxMDQuMjgzLDg3Ljg0MiAxMDQuMjgzLDg1LjgxNyBDMTA0LjI4Myw3OS41NzUgMTA4LjcwOSw3MS45NTMgMTE0LjE0OCw2OC44MTIgQzExNS43MjIsNjcuOTA0IDExNy4yMzIsNjcuNDQ5IDExOC42MzgsNjcuNDQ5IEMxMTkuNzgsNjcuNDQ5IDEyMC43OTYsNjcuNzU4IDEyMS42NTYsNjguMzYyIEMxMjEuNjc4LDY4LjM3NyAxMjEuNjk3LDY4LjM5NyAxMjEuNzEyLDY4LjQxOCBDMTIyLjYwNiw2OS42NjIgMTIzLjA3OSw3MS4zOSAxMjMuMDc5LDczLjQxNSBDMTIzLjA3OSw3OS42NTggMTE4LjY1Myw4Ny4xOTggMTEzLjIxNCw5MC4zMzggQzExMS42NCw5MS4yNDcgMTEwLjEzLDkxLjYxNCAxMDguNzI0LDkxLjYxNCBMMTA4LjcyNCw5MS42MTQgWiBNMTA2LjAwNiw5MC41MDUgQzEwNi43OCw5MS4wMzcgMTA3LjY5NCw5MS4yODEgMTA4LjcyNCw5MS4yODEgQzExMC4wNDcsOTEuMjgxIDExMS40NzgsOTAuODY4IDExMi45OCw5MC4wMDEgQzExOC4yOTEsODYuOTM1IDEyMi42MTEsNzkuNDk2IDEyMi42MTEsNzMuNDAzIEMxMjIuNjExLDcxLjQ5NCAxMjIuMTc3LDY5Ljg4IDEyMS4zNTYsNjguNzE4IEMxMjAuNTgyLDY4LjE4NSAxMTkuNjY4LDY3LjkxOSAxMTguNjM4LDY3LjkxOSBDMTE3LjMxNSw2Ny45MTkgMTE1Ljg4Myw2OC4zNiAxMTQuMzgyLDY5LjIyNyBDMTA5LjA3MSw3Mi4yOTMgMTA0Ljc1MSw3OS43MzMgMTA0Ljc1MSw4NS44MjYgQzEwNC43NTEsODcuNzM1IDEwNS4xODUsODkuMzQzIDEwNi4wMDYsOTAuNTA1IEwxMDYuMDA2LDkwLjUwNSBaIiBpZD0iRmlsbC0yMSIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDkuMzE4LDcuMjYyIEwxMzkuMzM0LDE2LjE0IEwxNTUuMjI3LDI3LjE3MSBMMTYwLjgxNiwyMS4wNTkgTDE0OS4zMTgsNy4yNjIiIGlkPSJGaWxsLTIyIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS42NzYsMTMuODQgTDE1OS45MjgsMTkuNDY3IEMxNTYuMjg2LDIxLjU3IDE1MC40LDIxLjU4IDE0Ni43ODEsMTkuNDkxIEMxNDMuMTYxLDE3LjQwMiAxNDMuMTgsMTQuMDAzIDE0Ni44MjIsMTEuOSBMMTU2LjMxNyw2LjI5MiBMMTQ5LjU4OCwyLjQwNyBMNjcuNzUyLDQ5LjQ3OCBMMTEzLjY3NSw3NS45OTIgTDExNi43NTYsNzQuMjEzIEMxMTcuMzg3LDczLjg0OCAxMTcuNjI1LDczLjMxNSAxMTcuMzc0LDcyLjgyMyBDMTE1LjAxNyw2OC4xOTEgMTE0Ljc4MSw2My4yNzcgMTE2LjY5MSw1OC41NjEgQzEyMi4zMjksNDQuNjQxIDE0MS4yLDMzLjc0NiAxNjUuMzA5LDMwLjQ5MSBDMTczLjQ3OCwyOS4zODggMTgxLjk4OSwyOS41MjQgMTkwLjAxMywzMC44ODUgQzE5MC44NjUsMzEuMDMgMTkxLjc4OSwzMC44OTMgMTkyLjQyLDMwLjUyOCBMMTk1LjUwMSwyOC43NSBMMTY5LjY3NiwxMy44NCIgaWQ9IkZpbGwtMjMiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3Ni40NTkgQzExMy41OTQsNzYuNDU5IDExMy41MTQsNzYuNDM4IDExMy40NDIsNzYuMzk3IEw2Ny41MTgsNDkuODgyIEM2Ny4zNzQsNDkuNzk5IDY3LjI4NCw0OS42NDUgNjcuMjg1LDQ5LjQ3OCBDNjcuMjg1LDQ5LjMxMSA2Ny4zNzQsNDkuMTU3IDY3LjUxOSw0OS4wNzMgTDE0OS4zNTUsMi4wMDIgQzE0OS40OTksMS45MTkgMTQ5LjY3NywxLjkxOSAxNDkuODIxLDIuMDAyIEwxNTYuNTUsNS44ODcgQzE1Ni43NzQsNi4wMTcgMTU2Ljg1LDYuMzAyIDE1Ni43MjIsNi41MjYgQzE1Ni41OTIsNi43NDkgMTU2LjMwNyw2LjgyNiAxNTYuMDgzLDYuNjk2IEwxNDkuNTg3LDIuOTQ2IEw2OC42ODcsNDkuNDc5IEwxMTMuNjc1LDc1LjQ1MiBMMTE2LjUyMyw3My44MDggQzExNi43MTUsNzMuNjk3IDExNy4xNDMsNzMuMzk5IDExNi45NTgsNzMuMDM1IEMxMTQuNTQyLDY4LjI4NyAxMTQuMyw2My4yMjEgMTE2LjI1OCw1OC4zODUgQzExOS4wNjQsNTEuNDU4IDEyNS4xNDMsNDUuMTQzIDEzMy44NCw0MC4xMjIgQzE0Mi40OTcsMzUuMTI0IDE1My4zNTgsMzEuNjMzIDE2NS4yNDcsMzAuMDI4IEMxNzMuNDQ1LDI4LjkyMSAxODIuMDM3LDI5LjA1OCAxOTAuMDkxLDMwLjQyNSBDMTkwLjgzLDMwLjU1IDE5MS42NTIsMzAuNDMyIDE5Mi4xODYsMzAuMTI0IEwxOTQuNTY3LDI4Ljc1IEwxNjkuNDQyLDE0LjI0NCBDMTY5LjIxOSwxNC4xMTUgMTY5LjE0MiwxMy44MjkgMTY5LjI3MSwxMy42MDYgQzE2OS40LDEzLjM4MiAxNjkuNjg1LDEzLjMwNiAxNjkuOTA5LDEzLjQzNSBMMTk1LjczNCwyOC4zNDUgQzE5NS44NzksMjguNDI4IDE5NS45NjgsMjguNTgzIDE5NS45NjgsMjguNzUgQzE5NS45NjgsMjguOTE2IDE5NS44NzksMjkuMDcxIDE5NS43MzQsMjkuMTU0IEwxOTIuNjUzLDMwLjkzMyBDMTkxLjkzMiwzMS4zNSAxOTAuODksMzEuNTA4IDE4OS45MzUsMzEuMzQ2IEMxODEuOTcyLDI5Ljk5NSAxNzMuNDc4LDI5Ljg2IDE2NS4zNzIsMzAuOTU0IEMxNTMuNjAyLDMyLjU0MyAxNDIuODYsMzUuOTkzIDEzNC4zMDcsNDAuOTMxIEMxMjUuNzkzLDQ1Ljg0NyAxMTkuODUxLDUyLjAwNCAxMTcuMTI0LDU4LjczNiBDMTE1LjI3LDYzLjMxNCAxMTUuNTAxLDY4LjExMiAxMTcuNzksNzIuNjExIEMxMTguMTYsNzMuMzM2IDExNy44NDUsNzQuMTI0IDExNi45OSw3NC42MTcgTDExMy45MDksNzYuMzk3IEMxMTMuODM2LDc2LjQzOCAxMTMuNzU2LDc2LjQ1OSAxMTMuNjc1LDc2LjQ1OSIgaWQ9IkZpbGwtMjQiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUzLjMxNiwyMS4yNzkgQzE1MC45MDMsMjEuMjc5IDE0OC40OTUsMjAuNzUxIDE0Ni42NjQsMTkuNjkzIEMxNDQuODQ2LDE4LjY0NCAxNDMuODQ0LDE3LjIzMiAxNDMuODQ0LDE1LjcxOCBDMTQzLjg0NCwxNC4xOTEgMTQ0Ljg2LDEyLjc2MyAxNDYuNzA1LDExLjY5OCBMMTU2LjE5OCw2LjA5MSBDMTU2LjMwOSw2LjAyNSAxNTYuNDUyLDYuMDYyIDE1Ni41MTgsNi4xNzMgQzE1Ni41ODMsNi4yODQgMTU2LjU0Nyw2LjQyNyAxNTYuNDM2LDYuNDkzIEwxNDYuOTQsMTIuMTAyIEMxNDUuMjQ0LDEzLjA4MSAxNDQuMzEyLDE0LjM2NSAxNDQuMzEyLDE1LjcxOCBDMTQ0LjMxMiwxNy4wNTggMTQ1LjIzLDE4LjMyNiAxNDYuODk3LDE5LjI4OSBDMTUwLjQ0NiwyMS4zMzggMTU2LjI0LDIxLjMyNyAxNTkuODExLDE5LjI2NSBMMTY5LjU1OSwxMy42MzcgQzE2OS42NywxMy41NzMgMTY5LjgxMywxMy42MTEgMTY5Ljg3OCwxMy43MjMgQzE2OS45NDMsMTMuODM0IDE2OS45MDQsMTMuOTc3IDE2OS43OTMsMTQuMDQyIEwxNjAuMDQ1LDE5LjY3IEMxNTguMTg3LDIwLjc0MiAxNTUuNzQ5LDIxLjI3OSAxNTMuMzE2LDIxLjI3OSIgaWQ9IkZpbGwtMjUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3NS45OTIgTDY3Ljc2Miw0OS40ODQiIGlkPSJGaWxsLTI2IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMy42NzUsNzYuMzQyIEMxMTMuNjE1LDc2LjM0MiAxMTMuNTU1LDc2LjMyNyAxMTMuNSw3Ni4yOTUgTDY3LjU4Nyw0OS43ODcgQzY3LjQxOSw0OS42OSA2Ny4zNjIsNDkuNDc2IDY3LjQ1OSw0OS4zMDkgQzY3LjU1Niw0OS4xNDEgNjcuNzcsNDkuMDgzIDY3LjkzNyw0OS4xOCBMMTEzLjg1LDc1LjY4OCBDMTE0LjAxOCw3NS43ODUgMTE0LjA3NSw3NiAxMTMuOTc4LDc2LjE2NyBDMTEzLjkxNCw3Ni4yNzkgMTEzLjc5Niw3Ni4zNDIgMTEzLjY3NSw3Ni4zNDIiIGlkPSJGaWxsLTI3IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY3Ljc2Miw0OS40ODQgTDY3Ljc2MiwxMDMuNDg1IEM2Ny43NjIsMTA0LjU3NSA2OC41MzIsMTA1LjkwMyA2OS40ODIsMTA2LjQ1MiBMMTExLjk1NSwxMzAuOTczIEMxMTIuOTA1LDEzMS41MjIgMTEzLjY3NSwxMzEuMDgzIDExMy42NzUsMTI5Ljk5MyBMMTEzLjY3NSw3NS45OTIiIGlkPSJGaWxsLTI4IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMi43MjcsMTMxLjU2MSBDMTEyLjQzLDEzMS41NjEgMTEyLjEwNywxMzEuNDY2IDExMS43OCwxMzEuMjc2IEw2OS4zMDcsMTA2Ljc1NSBDNjguMjQ0LDEwNi4xNDIgNjcuNDEyLDEwNC43MDUgNjcuNDEyLDEwMy40ODUgTDY3LjQxMiw0OS40ODQgQzY3LjQxMiw0OS4yOSA2Ny41NjksNDkuMTM0IDY3Ljc2Miw0OS4xMzQgQzY3Ljk1Niw0OS4xMzQgNjguMTEzLDQ5LjI5IDY4LjExMyw0OS40ODQgTDY4LjExMywxMDMuNDg1IEM2OC4xMTMsMTA0LjQ0NSA2OC44MiwxMDUuNjY1IDY5LjY1NywxMDYuMTQ4IEwxMTIuMTMsMTMwLjY3IEMxMTIuNDc0LDEzMC44NjggMTEyLjc5MSwxMzAuOTEzIDExMywxMzAuNzkyIEMxMTMuMjA2LDEzMC42NzMgMTEzLjMyNSwxMzAuMzgxIDExMy4zMjUsMTI5Ljk5MyBMMTEzLjMyNSw3NS45OTIgQzExMy4zMjUsNzUuNzk4IDExMy40ODIsNzUuNjQxIDExMy42NzUsNzUuNjQxIEMxMTMuODY5LDc1LjY0MSAxMTQuMDI1LDc1Ljc5OCAxMTQuMDI1LDc1Ljk5MiBMMTE0LjAyNSwxMjkuOTkzIEMxMTQuMDI1LDEzMC42NDggMTEzLjc4NiwxMzEuMTQ3IDExMy4zNSwxMzEuMzk5IEMxMTMuMTYyLDEzMS41MDcgMTEyLjk1MiwxMzEuNTYxIDExMi43MjcsMTMxLjU2MSIgaWQ9IkZpbGwtMjkiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEyLjg2LDQwLjUxMiBDMTEyLjg2LDQwLjUxMiAxMTIuODYsNDAuNTEyIDExMi44NTksNDAuNTEyIEMxMTAuNTQxLDQwLjUxMiAxMDguMzYsMzkuOTkgMTA2LjcxNywzOS4wNDEgQzEwNS4wMTIsMzguMDU3IDEwNC4wNzQsMzYuNzI2IDEwNC4wNzQsMzUuMjkyIEMxMDQuMDc0LDMzLjg0NyAxMDUuMDI2LDMyLjUwMSAxMDYuNzU0LDMxLjUwNCBMMTE4Ljc5NSwyNC41NTEgQzEyMC40NjMsMjMuNTg5IDEyMi42NjksMjMuMDU4IDEyNS4wMDcsMjMuMDU4IEMxMjcuMzI1LDIzLjA1OCAxMjkuNTA2LDIzLjU4MSAxMzEuMTUsMjQuNTMgQzEzMi44NTQsMjUuNTE0IDEzMy43OTMsMjYuODQ1IDEzMy43OTMsMjguMjc4IEMxMzMuNzkzLDI5LjcyNCAxMzIuODQxLDMxLjA2OSAxMzEuMTEzLDMyLjA2NyBMMTE5LjA3MSwzOS4wMTkgQzExNy40MDMsMzkuOTgyIDExNS4xOTcsNDAuNTEyIDExMi44Niw0MC41MTIgTDExMi44Niw0MC41MTIgWiBNMTI1LjAwNywyMy43NTkgQzEyMi43OSwyMy43NTkgMTIwLjcwOSwyNC4yNTYgMTE5LjE0NiwyNS4xNTggTDEwNy4xMDQsMzIuMTEgQzEwNS42MDIsMzIuOTc4IDEwNC43NzQsMzQuMTA4IDEwNC43NzQsMzUuMjkyIEMxMDQuNzc0LDM2LjQ2NSAxMDUuNTg5LDM3LjU4MSAxMDcuMDY3LDM4LjQzNCBDMTA4LjYwNSwzOS4zMjMgMTEwLjY2MywzOS44MTIgMTEyLjg1OSwzOS44MTIgTDExMi44NiwzOS44MTIgQzExNS4wNzYsMzkuODEyIDExNy4xNTgsMzkuMzE1IDExOC43MjEsMzguNDEzIEwxMzAuNzYyLDMxLjQ2IEMxMzIuMjY0LDMwLjU5MyAxMzMuMDkyLDI5LjQ2MyAxMzMuMDkyLDI4LjI3OCBDMTMzLjA5MiwyNy4xMDYgMTMyLjI3OCwyNS45OSAxMzAuOCwyNS4xMzYgQzEyOS4yNjEsMjQuMjQ4IDEyNy4yMDQsMjMuNzU5IDEyNS4wMDcsMjMuNzU5IEwxMjUuMDA3LDIzLjc1OSBaIiBpZD0iRmlsbC0zMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNjUuNjMsMTYuMjE5IEwxNTkuODk2LDE5LjUzIEMxNTYuNzI5LDIxLjM1OCAxNTEuNjEsMjEuMzY3IDE0OC40NjMsMTkuNTUgQzE0NS4zMTYsMTcuNzMzIDE0NS4zMzIsMTQuNzc4IDE0OC40OTksMTIuOTQ5IEwxNTQuMjMzLDkuNjM5IEwxNjUuNjMsMTYuMjE5IiBpZD0iRmlsbC0zMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNTQuMjMzLDEwLjQ0OCBMMTY0LjIyOCwxNi4yMTkgTDE1OS41NDYsMTguOTIzIEMxNTguMTEyLDE5Ljc1IDE1Ni4xOTQsMjAuMjA2IDE1NC4xNDcsMjAuMjA2IEMxNTIuMTE4LDIwLjIwNiAxNTAuMjI0LDE5Ljc1NyAxNDguODE0LDE4Ljk0MyBDMTQ3LjUyNCwxOC4xOTkgMTQ2LjgxNCwxNy4yNDkgMTQ2LjgxNCwxNi4yNjkgQzE0Ni44MTQsMTUuMjc4IDE0Ny41MzcsMTQuMzE0IDE0OC44NSwxMy41NTYgTDE1NC4yMzMsMTAuNDQ4IE0xNTQuMjMzLDkuNjM5IEwxNDguNDk5LDEyLjk0OSBDMTQ1LjMzMiwxNC43NzggMTQ1LjMxNiwxNy43MzMgMTQ4LjQ2MywxOS41NSBDMTUwLjAzMSwyMC40NTUgMTUyLjA4NiwyMC45MDcgMTU0LjE0NywyMC45MDcgQzE1Ni4yMjQsMjAuOTA3IDE1OC4zMDYsMjAuNDQ3IDE1OS44OTYsMTkuNTMgTDE2NS42MywxNi4yMTkgTDE1NC4yMzMsOS42MzkiIGlkPSJGaWxsLTMyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NS40NDUsNzIuNjY3IEwxNDUuNDQ1LDcyLjY2NyBDMTQzLjY3Miw3Mi42NjcgMTQyLjIwNCw3MS44MTcgMTQxLjIwMiw3MC40MjIgQzE0MS4xMzUsNzAuMzMgMTQxLjE0NSw3MC4xNDcgMTQxLjIyNSw3MC4wNjYgQzE0MS4zMDUsNjkuOTg1IDE0MS40MzIsNjkuOTQ2IDE0MS41MjUsNzAuMDExIEMxNDIuMzA2LDcwLjU1OSAxNDMuMjMxLDcwLjgyMyAxNDQuMjc2LDcwLjgyMiBDMTQ1LjU5OCw3MC44MjIgMTQ3LjAzLDcwLjM3NiAxNDguNTMyLDY5LjUwOSBDMTUzLjg0Miw2Ni40NDMgMTU4LjE2Myw1OC45ODcgMTU4LjE2Myw1Mi44OTQgQzE1OC4xNjMsNTAuOTY3IDE1Ny43MjEsNDkuMzMyIDE1Ni44ODQsNDguMTY4IEMxNTYuODE4LDQ4LjA3NiAxNTYuODI4LDQ3Ljk0OCAxNTYuOTA4LDQ3Ljg2NyBDMTU2Ljk4OCw0Ny43ODYgMTU3LjExNCw0Ny43NzQgMTU3LjIwOCw0Ny44NCBDMTU4Ljg3OCw0OS4wMTIgMTU5Ljc5OCw1MS4yMiAxNTkuNzk4LDU0LjA1OSBDMTU5Ljc5OCw2MC4zMDEgMTU1LjM3Myw2OC4wNDYgMTQ5LjkzMyw3MS4xODYgQzE0OC4zNiw3Mi4wOTQgMTQ2Ljg1LDcyLjY2NyAxNDUuNDQ1LDcyLjY2NyBMMTQ1LjQ0NSw3Mi42NjcgWiBNMTQyLjQ3Niw3MSBDMTQzLjI5LDcxLjY1MSAxNDQuMjk2LDcyLjAwMiAxNDUuNDQ1LDcyLjAwMiBDMTQ2Ljc2Nyw3Mi4wMDIgMTQ4LjE5OCw3MS41NSAxNDkuNyw3MC42ODIgQzE1NS4wMSw2Ny42MTcgMTU5LjMzMSw2MC4xNTkgMTU5LjMzMSw1NC4wNjUgQzE1OS4zMzEsNTIuMDg1IDE1OC44NjgsNTAuNDM1IDE1OC4wMDYsNDkuMjcyIEMxNTguNDE3LDUwLjMwNyAxNTguNjMsNTEuNTMyIDE1OC42Myw1Mi44OTIgQzE1OC42Myw1OS4xMzQgMTU0LjIwNSw2Ni43NjcgMTQ4Ljc2NSw2OS45MDcgQzE0Ny4xOTIsNzAuODE2IDE0NS42ODEsNzEuMjgzIDE0NC4yNzYsNzEuMjgzIEMxNDMuNjM0LDcxLjI4MyAxNDMuMDMzLDcxLjE5MiAxNDIuNDc2LDcxIEwxNDIuNDc2LDcxIFoiIGlkPSJGaWxsLTMzIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0OC42NDgsNjkuNzA0IEMxNTQuMDMyLDY2LjU5NiAxNTguMzk2LDU5LjA2OCAxNTguMzk2LDUyLjg5MSBDMTU4LjM5Niw1MC44MzkgMTU3LjkxMyw0OS4xOTggMTU3LjA3NCw0OC4wMyBDMTU1LjI4OSw0Ni43NzggMTUyLjY5OSw0Ni44MzYgMTQ5LjgxNiw0OC41MDEgQzE0NC40MzMsNTEuNjA5IDE0MC4wNjgsNTkuMTM3IDE0MC4wNjgsNjUuMzE0IEMxNDAuMDY4LDY3LjM2NSAxNDAuNTUyLDY5LjAwNiAxNDEuMzkxLDcwLjE3NCBDMTQzLjE3Niw3MS40MjcgMTQ1Ljc2NSw3MS4zNjkgMTQ4LjY0OCw2OS43MDQiIGlkPSJGaWxsLTM0IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NC4yNzYsNzEuMjc2IEwxNDQuMjc2LDcxLjI3NiBDMTQzLjEzMyw3MS4yNzYgMTQyLjExOCw3MC45NjkgMTQxLjI1Nyw3MC4zNjUgQzE0MS4yMzYsNzAuMzUxIDE0MS4yMTcsNzAuMzMyIDE0MS4yMDIsNzAuMzExIEMxNDAuMzA3LDY5LjA2NyAxMzkuODM1LDY3LjMzOSAxMzkuODM1LDY1LjMxNCBDMTM5LjgzNSw1OS4wNzMgMTQ0LjI2LDUxLjQzOSAxNDkuNyw0OC4yOTggQzE1MS4yNzMsNDcuMzkgMTUyLjc4NCw0Ni45MjkgMTU0LjE4OSw0Ni45MjkgQzE1NS4zMzIsNDYuOTI5IDE1Ni4zNDcsNDcuMjM2IDE1Ny4yMDgsNDcuODM5IEMxNTcuMjI5LDQ3Ljg1NCAxNTcuMjQ4LDQ3Ljg3MyAxNTcuMjYzLDQ3Ljg5NCBDMTU4LjE1Nyw0OS4xMzggMTU4LjYzLDUwLjg2NSAxNTguNjMsNTIuODkxIEMxNTguNjMsNTkuMTMyIDE1NC4yMDUsNjYuNzY2IDE0OC43NjUsNjkuOTA3IEMxNDcuMTkyLDcwLjgxNSAxNDUuNjgxLDcxLjI3NiAxNDQuMjc2LDcxLjI3NiBMMTQ0LjI3Niw3MS4yNzYgWiBNMTQxLjU1OCw3MC4xMDQgQzE0Mi4zMzEsNzAuNjM3IDE0My4yNDUsNzEuMDA1IDE0NC4yNzYsNzEuMDA1IEMxNDUuNTk4LDcxLjAwNSAxNDcuMDMsNzAuNDY3IDE0OC41MzIsNjkuNiBDMTUzLjg0Miw2Ni41MzQgMTU4LjE2Myw1OS4wMzMgMTU4LjE2Myw1Mi45MzkgQzE1OC4xNjMsNTEuMDMxIDE1Ny43MjksNDkuMzg1IDE1Ni45MDcsNDguMjIzIEMxNTYuMTMzLDQ3LjY5MSAxNTUuMjE5LDQ3LjQwOSAxNTQuMTg5LDQ3LjQwOSBDMTUyLjg2Nyw0Ny40MDkgMTUxLjQzNSw0Ny44NDIgMTQ5LjkzMyw0OC43MDkgQzE0NC42MjMsNTEuNzc1IDE0MC4zMDIsNTkuMjczIDE0MC4zMDIsNjUuMzY2IEMxNDAuMzAyLDY3LjI3NiAxNDAuNzM2LDY4Ljk0MiAxNDEuNTU4LDcwLjEwNCBMMTQxLjU1OCw3MC4xMDQgWiIgaWQ9IkZpbGwtMzUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUwLjcyLDY1LjM2MSBMMTUwLjM1Nyw2NS4wNjYgQzE1MS4xNDcsNjQuMDkyIDE1MS44NjksNjMuMDQgMTUyLjUwNSw2MS45MzggQzE1My4zMTMsNjAuNTM5IDE1My45NzgsNTkuMDY3IDE1NC40ODIsNTcuNTYzIEwxNTQuOTI1LDU3LjcxMiBDMTU0LjQxMiw1OS4yNDUgMTUzLjczMyw2MC43NDUgMTUyLjkxLDYyLjE3MiBDMTUyLjI2Miw2My4yOTUgMTUxLjUyNSw2NC4zNjggMTUwLjcyLDY1LjM2MSIgaWQ9IkZpbGwtMzYiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE1LjkxNyw4NC41MTQgTDExNS41NTQsODQuMjIgQzExNi4zNDQsODMuMjQ1IDExNy4wNjYsODIuMTk0IDExNy43MDIsODEuMDkyIEMxMTguNTEsNzkuNjkyIDExOS4xNzUsNzguMjIgMTE5LjY3OCw3Ni43MTcgTDEyMC4xMjEsNzYuODY1IEMxMTkuNjA4LDc4LjM5OCAxMTguOTMsNzkuODk5IDExOC4xMDYsODEuMzI2IEMxMTcuNDU4LDgyLjQ0OCAxMTYuNzIyLDgzLjUyMSAxMTUuOTE3LDg0LjUxNCIgaWQ9IkZpbGwtMzciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE0LDEzMC40NzYgTDExNCwxMzAuMDA4IEwxMTQsNzYuMDUyIEwxMTQsNzUuNTg0IEwxMTQsNzYuMDUyIEwxMTQsMTMwLjAwOCBMMTE0LDEzMC40NzYiIGlkPSJGaWxsLTM4IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYyLjAwMDAwMCwgMC4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTkuODIyLDM3LjQ3NCBDMTkuODM5LDM3LjMzOSAxOS43NDcsMzcuMTk0IDE5LjU1NSwzNy4wODIgQzE5LjIyOCwzNi44OTQgMTguNzI5LDM2Ljg3MiAxOC40NDYsMzcuMDM3IEwxMi40MzQsNDAuNTA4IEMxMi4zMDMsNDAuNTg0IDEyLjI0LDQwLjY4NiAxMi4yNDMsNDAuNzkzIEMxMi4yNDUsNDAuOTI1IDEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQxLjM3MSBMMTIuMjQ1LDQxLjQxNCBMMTIuMjM4LDQxLjU0MiBDOC4xNDgsNDMuODg3IDUuNjQ3LDQ1LjMyMSA1LjY0Nyw0NS4zMjEgQzUuNjQ2LDQ1LjMyMSAzLjU3LDQ2LjM2NyAyLjg2LDUwLjUxMyBDMi44Niw1MC41MTMgMS45NDgsNTcuNDc0IDEuOTYyLDcwLjI1OCBDMS45NzcsODIuODI4IDIuNTY4LDg3LjMyOCAzLjEyOSw5MS42MDkgQzMuMzQ5LDkzLjI5MyA2LjEzLDkzLjczNCA2LjEzLDkzLjczNCBDNi40NjEsOTMuNzc0IDYuODI4LDkzLjcwNyA3LjIxLDkzLjQ4NiBMODIuNDgzLDQ5LjkzNSBDODQuMjkxLDQ4Ljg2NiA4NS4xNSw0Ni4yMTYgODUuNTM5LDQzLjY1MSBDODYuNzUyLDM1LjY2MSA4Ny4yMTQsMTAuNjczIDg1LjI2NCwzLjc3MyBDODUuMDY4LDMuMDggODQuNzU0LDIuNjkgODQuMzk2LDIuNDkxIEw4Mi4zMSwxLjcwMSBDODEuNTgzLDEuNzI5IDgwLjg5NCwyLjE2OCA4MC43NzYsMi4yMzYgQzgwLjYzNiwyLjMxNyA0MS44MDcsMjQuNTg1IDIwLjAzMiwzNy4wNzIgTDE5LjgyMiwzNy40NzQiIGlkPSJGaWxsLTEiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNODIuMzExLDEuNzAxIEw4NC4zOTYsMi40OTEgQzg0Ljc1NCwyLjY5IDg1LjA2OCwzLjA4IDg1LjI2NCwzLjc3MyBDODcuMjEzLDEwLjY3MyA4Ni43NTEsMzUuNjYgODUuNTM5LDQzLjY1MSBDODUuMTQ5LDQ2LjIxNiA4NC4yOSw0OC44NjYgODIuNDgzLDQ5LjkzNSBMNy4yMSw5My40ODYgQzYuODk3LDkzLjY2NyA2LjU5NSw5My43NDQgNi4zMTQsOTMuNzQ0IEw2LjEzMSw5My43MzMgQzYuMTMxLDkzLjczNCAzLjM0OSw5My4yOTMgMy4xMjgsOTEuNjA5IEMyLjU2OCw4Ny4zMjcgMS45NzcsODIuODI4IDEuOTYzLDcwLjI1OCBDMS45NDgsNTcuNDc0IDIuODYsNTAuNTEzIDIuODYsNTAuNTEzIEMzLjU3LDQ2LjM2NyA1LjY0Nyw0NS4zMjEgNS42NDcsNDUuMzIxIEM1LjY0Nyw0NS4zMjEgOC4xNDgsNDMuODg3IDEyLjIzOCw0MS41NDIgTDEyLjI0NSw0MS40MTQgTDEyLjI0NSw0MS4zNzEgQzEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQwLjkyNSAxMi4yNDMsNDAuNzkzIEMxMi4yNCw0MC42ODYgMTIuMzAyLDQwLjU4MyAxMi40MzQsNDAuNTA4IEwxOC40NDYsMzcuMDM2IEMxOC41NzQsMzYuOTYyIDE4Ljc0NiwzNi45MjYgMTguOTI3LDM2LjkyNiBDMTkuMTQ1LDM2LjkyNiAxOS4zNzYsMzYuOTc5IDE5LjU1NCwzNy4wODIgQzE5Ljc0NywzNy4xOTQgMTkuODM5LDM3LjM0IDE5LjgyMiwzNy40NzQgTDIwLjAzMywzNy4wNzIgQzQxLjgwNiwyNC41ODUgODAuNjM2LDIuMzE4IDgwLjc3NywyLjIzNiBDODAuODk0LDIuMTY4IDgxLjU4MywxLjcyOSA4Mi4zMTEsMS43MDEgTTgyLjMxMSwwLjcwNCBMODIuMjcyLDAuNzA1IEM4MS42NTQsMC43MjggODAuOTg5LDAuOTQ5IDgwLjI5OCwxLjM2MSBMODAuMjc3LDEuMzczIEM4MC4xMjksMS40NTggNTkuNzY4LDEzLjEzNSAxOS43NTgsMzYuMDc5IEMxOS41LDM1Ljk4MSAxOS4yMTQsMzUuOTI5IDE4LjkyNywzNS45MjkgQzE4LjU2MiwzNS45MjkgMTguMjIzLDM2LjAxMyAxNy45NDcsMzYuMTczIEwxMS45MzUsMzkuNjQ0IEMxMS40OTMsMzkuODk5IDExLjIzNiw0MC4zMzQgMTEuMjQ2LDQwLjgxIEwxMS4yNDcsNDAuOTYgTDUuMTY3LDQ0LjQ0NyBDNC43OTQsNDQuNjQ2IDIuNjI1LDQ1Ljk3OCAxLjg3Nyw1MC4zNDUgTDEuODcxLDUwLjM4NCBDMS44NjIsNTAuNDU0IDAuOTUxLDU3LjU1NyAwLjk2NSw3MC4yNTkgQzAuOTc5LDgyLjg3OSAxLjU2OCw4Ny4zNzUgMi4xMzcsOTEuNzI0IEwyLjEzOSw5MS43MzkgQzIuNDQ3LDk0LjA5NCA1LjYxNCw5NC42NjIgNS45NzUsOTQuNzE5IEw2LjAwOSw5NC43MjMgQzYuMTEsOTQuNzM2IDYuMjEzLDk0Ljc0MiA2LjMxNCw5NC43NDIgQzYuNzksOTQuNzQyIDcuMjYsOTQuNjEgNy43MSw5NC4zNSBMODIuOTgzLDUwLjc5OCBDODQuNzk0LDQ5LjcyNyA4NS45ODIsNDcuMzc1IDg2LjUyNSw0My44MDEgQzg3LjcxMSwzNS45ODcgODguMjU5LDEwLjcwNSA4Ni4yMjQsMy41MDIgQzg1Ljk3MSwyLjYwOSA4NS41MiwxLjk3NSA4NC44ODEsMS42MiBMODQuNzQ5LDEuNTU4IEw4Mi42NjQsMC43NjkgQzgyLjU1MSwwLjcyNSA4Mi40MzEsMC43MDQgODIuMzExLDAuNzA0IiBpZD0iRmlsbC0yIiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY2LjI2NywxMS41NjUgTDY3Ljc2MiwxMS45OTkgTDExLjQyMyw0NC4zMjUiIGlkPSJGaWxsLTMiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMjAyLDkwLjU0NSBDMTIuMDI5LDkwLjU0NSAxMS44NjIsOTAuNDU1IDExLjc2OSw5MC4yOTUgQzExLjYzMiw5MC4wNTcgMTEuNzEzLDg5Ljc1MiAxMS45NTIsODkuNjE0IEwzMC4zODksNzguOTY5IEMzMC42MjgsNzguODMxIDMwLjkzMyw3OC45MTMgMzEuMDcxLDc5LjE1MiBDMzEuMjA4LDc5LjM5IDMxLjEyNyw3OS42OTYgMzAuODg4LDc5LjgzMyBMMTIuNDUxLDkwLjQ3OCBMMTIuMjAyLDkwLjU0NSIgaWQ9IkZpbGwtNCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMy43NjQsNDIuNjU0IEwxMy42NTYsNDIuNTkyIEwxMy43MDIsNDIuNDIxIEwxOC44MzcsMzkuNDU3IEwxOS4wMDcsMzkuNTAyIEwxOC45NjIsMzkuNjczIEwxMy44MjcsNDIuNjM3IEwxMy43NjQsNDIuNjU0IiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTguNTIsOTAuMzc1IEw4LjUyLDQ2LjQyMSBMOC41ODMsNDYuMzg1IEw3NS44NCw3LjU1NCBMNzUuODQsNTEuNTA4IEw3NS43NzgsNTEuNTQ0IEw4LjUyLDkwLjM3NSBMOC41Miw5MC4zNzUgWiBNOC43Nyw0Ni41NjQgTDguNzcsODkuOTQ0IEw3NS41OTEsNTEuMzY1IEw3NS41OTEsNy45ODUgTDguNzcsNDYuNTY0IEw4Ljc3LDQ2LjU2NCBaIiBpZD0iRmlsbC02IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTI0Ljk4Niw4My4xODIgQzI0Ljc1Niw4My4zMzEgMjQuMzc0LDgzLjU2NiAyNC4xMzcsODMuNzA1IEwxMi42MzIsOTAuNDA2IEMxMi4zOTUsOTAuNTQ1IDEyLjQyNiw5MC42NTggMTIuNyw5MC42NTggTDEzLjI2NSw5MC42NTggQzEzLjU0LDkwLjY1OCAxMy45NTgsOTAuNTQ1IDE0LjE5NSw5MC40MDYgTDI1LjcsODMuNzA1IEMyNS45MzcsODMuNTY2IDI2LjEyOCw4My40NTIgMjYuMTI1LDgzLjQ0OSBDMjYuMTIyLDgzLjQ0NyAyNi4xMTksODMuMjIgMjYuMTE5LDgyLjk0NiBDMjYuMTE5LDgyLjY3MiAyNS45MzEsODIuNTY5IDI1LjcwMSw4Mi43MTkgTDI0Ljk4Niw4My4xODIiIGlkPSJGaWxsLTciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMjY2LDkwLjc4MiBMMTIuNyw5MC43ODIgQzEyLjUsOTAuNzgyIDEyLjM4NCw5MC43MjYgMTIuMzU0LDkwLjYxNiBDMTIuMzI0LDkwLjUwNiAxMi4zOTcsOTAuMzk5IDEyLjU2OSw5MC4yOTkgTDI0LjA3NCw4My41OTcgQzI0LjMxLDgzLjQ1OSAyNC42ODksODMuMjI2IDI0LjkxOCw4My4wNzggTDI1LjYzMyw4Mi42MTQgQzI1LjcyMyw4Mi41NTUgMjUuODEzLDgyLjUyNSAyNS44OTksODIuNTI1IEMyNi4wNzEsODIuNTI1IDI2LjI0NCw4Mi42NTUgMjYuMjQ0LDgyLjk0NiBDMjYuMjQ0LDgzLjE2IDI2LjI0NSw4My4zMDkgMjYuMjQ3LDgzLjM4MyBMMjYuMjUzLDgzLjM4NyBMMjYuMjQ5LDgzLjQ1NiBDMjYuMjQ2LDgzLjUzMSAyNi4yNDYsODMuNTMxIDI1Ljc2Myw4My44MTIgTDE0LjI1OCw5MC41MTQgQzE0LDkwLjY2NSAxMy41NjQsOTAuNzgyIDEzLjI2Niw5MC43ODIgTDEzLjI2Niw5MC43ODIgWiBNMTIuNjY2LDkwLjUzMiBMMTIuNyw5MC41MzMgTDEzLjI2Niw5MC41MzMgQzEzLjUxOCw5MC41MzMgMTMuOTE1LDkwLjQyNSAxNC4xMzIsOTAuMjk5IEwyNS42MzcsODMuNTk3IEMyNS44MDUsODMuNDk5IDI1LjkzMSw4My40MjQgMjUuOTk4LDgzLjM4MyBDMjUuOTk0LDgzLjI5OSAyNS45OTQsODMuMTY1IDI1Ljk5NCw4Mi45NDYgTDI1Ljg5OSw4Mi43NzUgTDI1Ljc2OCw4Mi44MjQgTDI1LjA1NCw4My4yODcgQzI0LjgyMiw4My40MzcgMjQuNDM4LDgzLjY3MyAyNC4yLDgzLjgxMiBMMTIuNjk1LDkwLjUxNCBMMTIuNjY2LDkwLjUzMiBMMTIuNjY2LDkwLjUzMiBaIiBpZD0iRmlsbC04IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEzLjI2Niw4OS44NzEgTDEyLjcsODkuODcxIEMxMi41LDg5Ljg3MSAxMi4zODQsODkuODE1IDEyLjM1NCw4OS43MDUgQzEyLjMyNCw4OS41OTUgMTIuMzk3LDg5LjQ4OCAxMi41NjksODkuMzg4IEwyNC4wNzQsODIuNjg2IEMyNC4zMzIsODIuNTM1IDI0Ljc2OCw4Mi40MTggMjUuMDY3LDgyLjQxOCBMMjUuNjMyLDgyLjQxOCBDMjUuODMyLDgyLjQxOCAyNS45NDgsODIuNDc0IDI1Ljk3OCw4Mi41ODQgQzI2LjAwOCw4Mi42OTQgMjUuOTM1LDgyLjgwMSAyNS43NjMsODIuOTAxIEwxNC4yNTgsODkuNjAzIEMxNCw4OS43NTQgMTMuNTY0LDg5Ljg3MSAxMy4yNjYsODkuODcxIEwxMy4yNjYsODkuODcxIFogTTEyLjY2Niw4OS42MjEgTDEyLjcsODkuNjIyIEwxMy4yNjYsODkuNjIyIEMxMy41MTgsODkuNjIyIDEzLjkxNSw4OS41MTUgMTQuMTMyLDg5LjM4OCBMMjUuNjM3LDgyLjY4NiBMMjUuNjY3LDgyLjY2OCBMMjUuNjMyLDgyLjY2NyBMMjUuMDY3LDgyLjY2NyBDMjQuODE1LDgyLjY2NyAyNC40MTgsODIuNzc1IDI0LjIsODIuOTAxIEwxMi42OTUsODkuNjAzIEwxMi42NjYsODkuNjIxIEwxMi42NjYsODkuNjIxIFoiIGlkPSJGaWxsLTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMzcsOTAuODAxIEwxMi4zNyw4OS41NTQgTDEyLjM3LDkwLjgwMSIgaWQ9IkZpbGwtMTAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNi4xMyw5My45MDEgQzUuMzc5LDkzLjgwOCA0LjgxNiw5My4xNjQgNC42OTEsOTIuNTI1IEMzLjg2LDg4LjI4NyAzLjU0LDgzLjc0MyAzLjUyNiw3MS4xNzMgQzMuNTExLDU4LjM4OSA0LjQyMyw1MS40MjggNC40MjMsNTEuNDI4IEM1LjEzNCw0Ny4yODIgNy4yMSw0Ni4yMzYgNy4yMSw0Ni4yMzYgQzcuMjEsNDYuMjM2IDgxLjY2NywzLjI1IDgyLjA2OSwzLjAxNyBDODIuMjkyLDIuODg4IDg0LjU1NiwxLjQzMyA4NS4yNjQsMy45NCBDODcuMjE0LDEwLjg0IDg2Ljc1MiwzNS44MjcgODUuNTM5LDQzLjgxOCBDODUuMTUsNDYuMzgzIDg0LjI5MSw0OS4wMzMgODIuNDgzLDUwLjEwMSBMNy4yMSw5My42NTMgQzYuODI4LDkzLjg3NCA2LjQ2MSw5My45NDEgNi4xMyw5My45MDEgQzYuMTMsOTMuOTAxIDMuMzQ5LDkzLjQ2IDMuMTI5LDkxLjc3NiBDMi41NjgsODcuNDk1IDEuOTc3LDgyLjk5NSAxLjk2Miw3MC40MjUgQzEuOTQ4LDU3LjY0MSAyLjg2LDUwLjY4IDIuODYsNTAuNjggQzMuNTcsNDYuNTM0IDUuNjQ3LDQ1LjQ4OSA1LjY0Nyw0NS40ODkgQzUuNjQ2LDQ1LjQ4OSA4LjA2NSw0NC4wOTIgMTIuMjQ1LDQxLjY3OSBMMTMuMTE2LDQxLjU2IEwxOS43MTUsMzcuNzMgTDE5Ljc2MSwzNy4yNjkgTDYuMTMsOTMuOTAxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjMxNyw5NC4xNjEgTDYuMTAyLDk0LjE0OCBMNi4xMDEsOTQuMTQ4IEw1Ljg1Nyw5NC4xMDEgQzUuMTM4LDkzLjk0NSAzLjA4NSw5My4zNjUgMi44ODEsOTEuODA5IEMyLjMxMyw4Ny40NjkgMS43MjcsODIuOTk2IDEuNzEzLDcwLjQyNSBDMS42OTksNTcuNzcxIDIuNjA0LDUwLjcxOCAyLjYxMyw1MC42NDggQzMuMzM4LDQ2LjQxNyA1LjQ0NSw0NS4zMSA1LjUzNSw0NS4yNjYgTDEyLjE2Myw0MS40MzkgTDEzLjAzMyw0MS4zMiBMMTkuNDc5LDM3LjU3OCBMMTkuNTEzLDM3LjI0NCBDMTkuNTI2LDM3LjEwNyAxOS42NDcsMzcuMDA4IDE5Ljc4NiwzNy4wMjEgQzE5LjkyMiwzNy4wMzQgMjAuMDIzLDM3LjE1NiAyMC4wMDksMzcuMjkzIEwxOS45NSwzNy44ODIgTDEzLjE5OCw0MS44MDEgTDEyLjMyOCw0MS45MTkgTDUuNzcyLDQ1LjcwNCBDNS43NDEsNDUuNzIgMy43ODIsNDYuNzcyIDMuMTA2LDUwLjcyMiBDMy4wOTksNTAuNzgyIDIuMTk4LDU3LjgwOCAyLjIxMiw3MC40MjQgQzIuMjI2LDgyLjk2MyAyLjgwOSw4Ny40MiAzLjM3Myw5MS43MjkgQzMuNDY0LDkyLjQyIDQuMDYyLDkyLjg4MyA0LjY4Miw5My4xODEgQzQuNTY2LDkyLjk4NCA0LjQ4Niw5Mi43NzYgNC40NDYsOTIuNTcyIEMzLjY2NSw4OC41ODggMy4yOTEsODQuMzcgMy4yNzYsNzEuMTczIEMzLjI2Miw1OC41MiA0LjE2Nyw1MS40NjYgNC4xNzYsNTEuMzk2IEM0LjkwMSw0Ny4xNjUgNy4wMDgsNDYuMDU5IDcuMDk4LDQ2LjAxNCBDNy4wOTQsNDYuMDE1IDgxLjU0MiwzLjAzNCA4MS45NDQsMi44MDIgTDgxLjk3MiwyLjc4NSBDODIuODc2LDIuMjQ3IDgzLjY5MiwyLjA5NyA4NC4zMzIsMi4zNTIgQzg0Ljg4NywyLjU3MyA4NS4yODEsMy4wODUgODUuNTA0LDMuODcyIEM4Ny41MTgsMTEgODYuOTY0LDM2LjA5MSA4NS43ODUsNDMuODU1IEM4NS4yNzgsNDcuMTk2IDg0LjIxLDQ5LjM3IDgyLjYxLDUwLjMxNyBMNy4zMzUsOTMuODY5IEM2Ljk5OSw5NC4wNjMgNi42NTgsOTQuMTYxIDYuMzE3LDk0LjE2MSBMNi4zMTcsOTQuMTYxIFogTTYuMTcsOTMuNjU0IEM2LjQ2Myw5My42OSA2Ljc3NCw5My42MTcgNy4wODUsOTMuNDM3IEw4Mi4zNTgsNDkuODg2IEM4NC4xODEsNDguODA4IDg0Ljk2LDQ1Ljk3MSA4NS4yOTIsNDMuNzggQzg2LjQ2NiwzNi4wNDkgODcuMDIzLDExLjA4NSA4NS4wMjQsNC4wMDggQzg0Ljg0NiwzLjM3NyA4NC41NTEsMi45NzYgODQuMTQ4LDIuODE2IEM4My42NjQsMi42MjMgODIuOTgyLDIuNzY0IDgyLjIyNywzLjIxMyBMODIuMTkzLDMuMjM0IEM4MS43OTEsMy40NjYgNy4zMzUsNDYuNDUyIDcuMzM1LDQ2LjQ1MiBDNy4zMDQsNDYuNDY5IDUuMzQ2LDQ3LjUyMSA0LjY2OSw1MS40NzEgQzQuNjYyLDUxLjUzIDMuNzYxLDU4LjU1NiAzLjc3NSw3MS4xNzMgQzMuNzksODQuMzI4IDQuMTYxLDg4LjUyNCA0LjkzNiw5Mi40NzYgQzUuMDI2LDkyLjkzNyA1LjQxMiw5My40NTkgNS45NzMsOTMuNjE1IEM2LjA4Nyw5My42NCA2LjE1OCw5My42NTIgNi4xNjksOTMuNjU0IEw2LjE3LDkzLjY1NCBMNi4xNyw5My42NTQgWiIgaWQ9IkZpbGwtMTIiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4zMTcsNjguOTgyIEM3LjgwNiw2OC43MDEgOC4yMDIsNjguOTI2IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNi44MjksNzEuMjk0IDYuNDMzLDcxLjA2OSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIiBpZD0iRmlsbC0xMyIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjkyLDcxLjEzMyBDNi42MzEsNzEuMTMzIDYuNDMzLDcwLjkwNSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIEM3LjQ2LDY4LjkgNy41OTUsNjguODYxIDcuNzE0LDY4Ljg2MSBDOC4wMDMsNjguODYxIDguMjAyLDY5LjA5IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNy4xNzQsNzEuMDk0IDcuMDM5LDcxLjEzMyA2LjkyLDcxLjEzMyBNNy43MTQsNjguNjc0IEM3LjU1Nyw2OC42NzQgNy4zOTIsNjguNzIzIDcuMjI0LDY4LjgyMSBDNi42NzYsNjkuMTM4IDYuMjQ2LDY5Ljg3OSA2LjI0Niw3MC41MDggQzYuMjQ2LDcwLjk5NCA2LjUxNyw3MS4zMiA2LjkyLDcxLjMyIEM3LjA3OCw3MS4zMiA3LjI0Myw3MS4yNzEgNy40MTEsNzEuMTc0IEM3Ljk1OSw3MC44NTcgOC4zODksNzAuMTE3IDguMzg5LDY5LjQ4NyBDOC4zODksNjkuMDAxIDguMTE3LDY4LjY3NCA3LjcxNCw2OC42NzQiIGlkPSJGaWxsLTE0IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYuOTIsNzAuOTQ3IEM2LjY0OSw3MC45NDcgNi42MjEsNzAuNjQgNi42MjEsNzAuNTA4IEM2LjYyMSw3MC4wMTcgNi45ODIsNjkuMzkyIDcuNDExLDY5LjE0NSBDNy41MjEsNjkuMDgyIDcuNjI1LDY5LjA0OSA3LjcxNCw2OS4wNDkgQzcuOTg2LDY5LjA0OSA4LjAxNSw2OS4zNTUgOC4wMTUsNjkuNDg3IEM4LjAxNSw2OS45NzggNy42NTIsNzAuNjAzIDcuMjI0LDcwLjg1MSBDNy4xMTUsNzAuOTE0IDcuMDEsNzAuOTQ3IDYuOTIsNzAuOTQ3IE03LjcxNCw2OC44NjEgQzcuNTk1LDY4Ljg2MSA3LjQ2LDY4LjkgNy4zMTcsNjguOTgyIEM2LjgyOSw2OS4yNjUgNi40MzMsNjkuOTQ4IDYuNDMzLDcwLjUwOCBDNi40MzMsNzAuOTA1IDYuNjMxLDcxLjEzMyA2LjkyLDcxLjEzMyBDNy4wMzksNzEuMTMzIDcuMTc0LDcxLjA5NCA3LjMxNyw3MS4wMTIgQzcuODA2LDcwLjczIDguMjAyLDcwLjA0NyA4LjIwMiw2OS40ODcgQzguMjAyLDY5LjA5IDguMDAzLDY4Ljg2MSA3LjcxNCw2OC44NjEiIGlkPSJGaWxsLTE1IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTcuNDQ0LDg1LjM1IEM3LjcwOCw4NS4xOTggNy45MjEsODUuMzE5IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuOTI1IDcuNzA4LDg2LjI5MiA3LjQ0NCw4Ni40NDQgQzcuMTgxLDg2LjU5NyA2Ljk2Nyw4Ni40NzUgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IiBpZD0iRmlsbC0xNiIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik03LjIzLDg2LjUxIEM3LjA3NCw4Ni41MSA2Ljk2Nyw4Ni4zODcgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IEM3LjUyMSw4NS4zMDUgNy41OTQsODUuMjg0IDcuNjU4LDg1LjI4NCBDNy44MTQsODUuMjg0IDcuOTIxLDg1LjQwOCA3LjkyMSw4NS42MjIgQzcuOTIxLDg1LjkyNSA3LjcwOCw4Ni4yOTIgNy40NDQsODYuNDQ0IEM3LjM2Nyw4Ni40ODkgNy4yOTQsODYuNTEgNy4yMyw4Ni41MSBNNy42NTgsODUuMDk4IEM3LjU1OCw4NS4wOTggNy40NTUsODUuMTI3IDcuMzUxLDg1LjE4OCBDNy4wMzEsODUuMzczIDYuNzgxLDg1LjgwNiA2Ljc4MSw4Ni4xNzMgQzYuNzgxLDg2LjQ4MiA2Ljk2Niw4Ni42OTcgNy4yMyw4Ni42OTcgQzcuMzMsODYuNjk3IDcuNDMzLDg2LjY2NiA3LjUzOCw4Ni42MDcgQzcuODU4LDg2LjQyMiA4LjEwOCw4NS45ODkgOC4xMDgsODUuNjIyIEM4LjEwOCw4NS4zMTMgNy45MjMsODUuMDk4IDcuNjU4LDg1LjA5OCIgaWQ9IkZpbGwtMTciIGZpbGw9IiM4MDk3QTIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4yMyw4Ni4zMjIgTDcuMTU0LDg2LjE3MyBDNy4xNTQsODUuOTM4IDcuMzMzLDg1LjYyOSA3LjUzOCw4NS41MTIgTDcuNjU4LDg1LjQ3MSBMNy43MzQsODUuNjIyIEM3LjczNCw4NS44NTYgNy41NTUsODYuMTY0IDcuMzUxLDg2LjI4MiBMNy4yMyw4Ni4zMjIgTTcuNjU4LDg1LjI4NCBDNy41OTQsODUuMjg0IDcuNTIxLDg1LjMwNSA3LjQ0NCw4NS4zNSBDNy4xODEsODUuNTAyIDYuOTY3LDg1Ljg3MSA2Ljk2Nyw4Ni4xNzMgQzYuOTY3LDg2LjM4NyA3LjA3NCw4Ni41MSA3LjIzLDg2LjUxIEM3LjI5NCw4Ni41MSA3LjM2Nyw4Ni40ODkgNy40NDQsODYuNDQ0IEM3LjcwOCw4Ni4yOTIgNy45MjEsODUuOTI1IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuNDA4IDcuODE0LDg1LjI4NCA3LjY1OCw4NS4yODQiIGlkPSJGaWxsLTE4IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTc3LjI3OCw3Ljc2OSBMNzcuMjc4LDUxLjQzNiBMMTAuMjA4LDkwLjE2IEwxMC4yMDgsNDYuNDkzIEw3Ny4yNzgsNy43NjkiIGlkPSJGaWxsLTE5IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEwLjA4Myw5MC4zNzUgTDEwLjA4Myw0Ni40MjEgTDEwLjE0Niw0Ni4zODUgTDc3LjQwMyw3LjU1NCBMNzcuNDAzLDUxLjUwOCBMNzcuMzQxLDUxLjU0NCBMMTAuMDgzLDkwLjM3NSBMMTAuMDgzLDkwLjM3NSBaIE0xMC4zMzMsNDYuNTY0IEwxMC4zMzMsODkuOTQ0IEw3Ny4xNTQsNTEuMzY1IEw3Ny4xNTQsNy45ODUgTDEwLjMzMyw0Ni41NjQgTDEwLjMzMyw0Ni41NjQgWiIgaWQ9IkZpbGwtMjAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMjUuNzM3LDg4LjY0NyBMMTE4LjA5OCw5MS45ODEgTDExOC4wOTgsODQgTDEwNi42MzksODguNzEzIEwxMDYuNjM5LDk2Ljk4MiBMOTksMTAwLjMxNSBMMTEyLjM2OSwxMDMuOTYxIEwxMjUuNzM3LDg4LjY0NyIgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTIiIGZpbGw9IiM0NTVBNjQiIHNrZXRjaDp0eXBlPSJNU1NoYXBlR3JvdXAiPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+');
};

module.exports = RotateInstructions;

},{"./util.js":29}],24:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var SensorSample = _dereq_('./sensor-sample.js');
var MathUtil = _dereq_('../math-util.js');
var Util = _dereq_('../util.js');

/**
 * An implementation of a simple complementary filter, which fuses gyroscope and
 * accelerometer data from the 'devicemotion' event.
 *
 * Accelerometer data is very noisy, but stable over the long term.
 * Gyroscope data is smooth, but tends to drift over the long term.
 *
 * This fusion is relatively simple:
 * 1. Get orientation estimates from accelerometer by applying a low-pass filter
 *    on that data.
 * 2. Get orientation estimates from gyroscope by integrating over time.
 * 3. Combine the two estimates, weighing (1) in the long term, but (2) for the
 *    short term.
 */
function ComplementaryFilter(kFilter) {
  this.kFilter = kFilter;

  // Raw sensor measurements.
  this.currentAccelMeasurement = new SensorSample();
  this.currentGyroMeasurement = new SensorSample();
  this.previousGyroMeasurement = new SensorSample();

  // Set default look direction to be in the correct direction.
  if (Util.isIOS()) {
    this.filterQ = new MathUtil.Quaternion(-1, 0, 0, 1);
  } else {
    this.filterQ = new MathUtil.Quaternion(1, 0, 0, 1);
  }
  this.previousFilterQ = new MathUtil.Quaternion();
  this.previousFilterQ.copy(this.filterQ);

  // Orientation based on the accelerometer.
  this.accelQ = new MathUtil.Quaternion();
  // Whether or not the orientation has been initialized.
  this.isOrientationInitialized = false;
  // Running estimate of gravity based on the current orientation.
  this.estimatedGravity = new MathUtil.Vector3();
  // Measured gravity based on accelerometer.
  this.measuredGravity = new MathUtil.Vector3();

  // Debug only quaternion of gyro-based orientation.
  this.gyroIntegralQ = new MathUtil.Quaternion();
}

ComplementaryFilter.prototype.addAccelMeasurement = function(vector, timestampS) {
  this.currentAccelMeasurement.set(vector, timestampS);
};

ComplementaryFilter.prototype.addGyroMeasurement = function(vector, timestampS) {
  this.currentGyroMeasurement.set(vector, timestampS);

  var deltaT = timestampS - this.previousGyroMeasurement.timestampS;
  if (Util.isTimestampDeltaValid(deltaT)) {
    this.run_();
  }

  this.previousGyroMeasurement.copy(this.currentGyroMeasurement);
};

ComplementaryFilter.prototype.run_ = function() {

  if (!this.isOrientationInitialized) {
    this.accelQ = this.accelToQuaternion_(this.currentAccelMeasurement.sample);
    this.previousFilterQ.copy(this.accelQ);
    this.isOrientationInitialized = true;
    return;
  }

  var deltaT = this.currentGyroMeasurement.timestampS -
      this.previousGyroMeasurement.timestampS;

  // Convert gyro rotation vector to a quaternion delta.
  var gyroDeltaQ = this.gyroToQuaternionDelta_(this.currentGyroMeasurement.sample, deltaT);
  this.gyroIntegralQ.multiply(gyroDeltaQ);

  // filter_1 = K * (filter_0 + gyro * dT) + (1 - K) * accel.
  this.filterQ.copy(this.previousFilterQ);
  this.filterQ.multiply(gyroDeltaQ);

  // Calculate the delta between the current estimated gravity and the real
  // gravity vector from accelerometer.
  var invFilterQ = new MathUtil.Quaternion();
  invFilterQ.copy(this.filterQ);
  invFilterQ.inverse();

  this.estimatedGravity.set(0, 0, -1);
  this.estimatedGravity.applyQuaternion(invFilterQ);
  this.estimatedGravity.normalize();

  this.measuredGravity.copy(this.currentAccelMeasurement.sample);
  this.measuredGravity.normalize();

  // Compare estimated gravity with measured gravity, get the delta quaternion
  // between the two.
  var deltaQ = new MathUtil.Quaternion();
  deltaQ.setFromUnitVectors(this.estimatedGravity, this.measuredGravity);
  deltaQ.inverse();

  if (Util.isDebug()) {
    console.log('Delta: %d deg, G_est: (%s, %s, %s), G_meas: (%s, %s, %s)',
                MathUtil.radToDeg * Util.getQuaternionAngle(deltaQ),
                (this.estimatedGravity.x).toFixed(1),
                (this.estimatedGravity.y).toFixed(1),
                (this.estimatedGravity.z).toFixed(1),
                (this.measuredGravity.x).toFixed(1),
                (this.measuredGravity.y).toFixed(1),
                (this.measuredGravity.z).toFixed(1));
  }

  // Calculate the SLERP target: current orientation plus the measured-estimated
  // quaternion delta.
  var targetQ = new MathUtil.Quaternion();
  targetQ.copy(this.filterQ);
  targetQ.multiply(deltaQ);

  // SLERP factor: 0 is pure gyro, 1 is pure accel.
  this.filterQ.slerp(targetQ, 1 - this.kFilter);

  this.previousFilterQ.copy(this.filterQ);
};

ComplementaryFilter.prototype.getOrientation = function() {
  return this.filterQ;
};

ComplementaryFilter.prototype.accelToQuaternion_ = function(accel) {
  var normAccel = new MathUtil.Vector3();
  normAccel.copy(accel);
  normAccel.normalize();
  var quat = new MathUtil.Quaternion();
  quat.setFromUnitVectors(new MathUtil.Vector3(0, 0, -1), normAccel);
  quat.inverse();
  return quat;
};

ComplementaryFilter.prototype.gyroToQuaternionDelta_ = function(gyro, dt) {
  // Extract axis and angle from the gyroscope data.
  var quat = new MathUtil.Quaternion();
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();
  quat.setFromAxisAngle(axis, gyro.length() * dt);
  return quat;
};


module.exports = ComplementaryFilter;

},{"../math-util.js":20,"../util.js":29,"./sensor-sample.js":27}],25:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ComplementaryFilter = _dereq_('./complementary-filter.js');
var PosePredictor = _dereq_('./pose-predictor.js');
var TouchPanner = _dereq_('../touch-panner.js');
var MathUtil = _dereq_('../math-util.js');
var Util = _dereq_('../util.js');

/**
 * The pose sensor, implemented using DeviceMotion APIs.
 */
function FusionPoseSensor() {
  this.deviceId = 'webvr-polyfill:fused';
  this.deviceName = 'VR Position Device (webvr-polyfill:fused)';

  this.accelerometer = new MathUtil.Vector3();
  this.gyroscope = new MathUtil.Vector3();

  this.start();

  this.filter = new ComplementaryFilter(window.WebVRConfig.K_FILTER);
  this.posePredictor = new PosePredictor(window.WebVRConfig.PREDICTION_TIME_S);
  this.touchPanner = new TouchPanner();

  this.filterToWorldQ = new MathUtil.Quaternion();

  // Set the filter to world transform, depending on OS.
  if (Util.isIOS()) {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), Math.PI / 2);
  } else {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), -Math.PI / 2);
  }

  this.inverseWorldToScreenQ = new MathUtil.Quaternion();
  this.worldToScreenQ = new MathUtil.Quaternion();
  this.originalPoseAdjustQ = new MathUtil.Quaternion();
  this.originalPoseAdjustQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1),
                                           -window.orientation * Math.PI / 180);

  this.setScreenTransform_();
  // Adjust this filter for being in landscape mode.
  if (Util.isLandscapeMode()) {
    this.filterToWorldQ.multiply(this.inverseWorldToScreenQ);
  }

  // Keep track of a reset transform for resetSensor.
  this.resetQ = new MathUtil.Quaternion();

  this.isAndroid = Util.isAndroid();
  this.isIOS = Util.isIOS();

  this.orientationOut_ = new Float32Array(4);
}

FusionPoseSensor.prototype.getPosition = function() {
  // This PoseSensor doesn't support position
  return null;
};

FusionPoseSensor.prototype.getOrientation = function() {
  // Convert from filter space to the the same system used by the
  // deviceorientation event.
  var orientation = this.filter.getOrientation();

  // Predict orientation.
  this.predictedQ = this.posePredictor.getPrediction(orientation, this.gyroscope, this.previousTimestampS);

  // Convert to THREE coordinate system: -Z forward, Y up, X right.
  var out = new MathUtil.Quaternion();
  out.copy(this.filterToWorldQ);
  out.multiply(this.resetQ);
  if (!window.WebVRConfig.TOUCH_PANNER_DISABLED) {
    out.multiply(this.touchPanner.getOrientation());
  }
  out.multiply(this.predictedQ);
  out.multiply(this.worldToScreenQ);

  // Handle the yaw-only case.
  if (window.WebVRConfig.YAW_ONLY) {
    // Make a quaternion that only turns around the Y-axis.
    out.x = 0;
    out.z = 0;
    out.normalize();
  }

  this.orientationOut_[0] = out.x;
  this.orientationOut_[1] = out.y;
  this.orientationOut_[2] = out.z;
  this.orientationOut_[3] = out.w;
  return this.orientationOut_;
};

FusionPoseSensor.prototype.resetPose = function() {
  // Reduce to inverted yaw-only.
  this.resetQ.copy(this.filter.getOrientation());
  this.resetQ.x = 0;
  this.resetQ.y = 0;
  this.resetQ.z *= -1;
  this.resetQ.normalize();

  // Take into account extra transformations in landscape mode.
  if (Util.isLandscapeMode()) {
    this.resetQ.multiply(this.inverseWorldToScreenQ);
  }

  // Take into account original pose.
  this.resetQ.multiply(this.originalPoseAdjustQ);

  if (!window.WebVRConfig.TOUCH_PANNER_DISABLED) {
    this.touchPanner.resetSensor();
  }
};

FusionPoseSensor.prototype.onDeviceMotion_ = function(deviceMotion) {
  this.updateDeviceMotion_(deviceMotion);
};

FusionPoseSensor.prototype.updateDeviceMotion_ = function(deviceMotion) {
  var accGravity = deviceMotion.accelerationIncludingGravity;
  var rotRate = deviceMotion.rotationRate;
  var timestampS = deviceMotion.timeStamp / 1000;

  var deltaS = timestampS - this.previousTimestampS;
  if (deltaS <= Util.MIN_TIMESTEP || deltaS > Util.MAX_TIMESTEP) {
    console.warn('Invalid timestamps detected. Time step between successive ' +
                 'gyroscope sensor samples is very small or not monotonic');
    this.previousTimestampS = timestampS;
    return;
  }

  this.accelerometer.set(-accGravity.x, -accGravity.y, -accGravity.z);
  if (Util.isR7()) {
    this.gyroscope.set(-rotRate.beta, rotRate.alpha, rotRate.gamma);
  } else {
    this.gyroscope.set(rotRate.alpha, rotRate.beta, rotRate.gamma);
  }

  // With iOS and Firefox Android, rotationRate is reported in degrees,
  // so we first convert to radians.
  if (this.isIOS || this.isAndroid) {
    this.gyroscope.multiplyScalar(Math.PI / 180);
  }

  this.filter.addAccelMeasurement(this.accelerometer, timestampS);
  this.filter.addGyroMeasurement(this.gyroscope, timestampS);

  this.previousTimestampS = timestampS;
};

FusionPoseSensor.prototype.onOrientationChange_ = function(screenOrientation) {
  this.setScreenTransform_();
};

/**
 * This is only needed if we are in an cross origin iframe on iOS to work around
 * this issue: https://bugs.webkit.org/show_bug.cgi?id=152299.
 */
FusionPoseSensor.prototype.onMessage_ = function(event) {
  var message = event.data;

  // If there's no message type, ignore it.
  if (!message || !message.type) {
    return;
  }

  // Ignore all messages that aren't devicemotion.
  var type = message.type.toLowerCase();
  if (type !== 'devicemotion') {
    return;
  }

  // Update device motion.
  this.updateDeviceMotion_(message.deviceMotionEvent);
};

FusionPoseSensor.prototype.setScreenTransform_ = function() {
  this.worldToScreenQ.set(0, 0, 0, 1);
  switch (window.orientation) {
    case 0:
      break;
    case 90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), -Math.PI / 2);
      break;
    case -90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), Math.PI / 2);
      break;
    case 180:
      // TODO.
      break;
  }
  this.inverseWorldToScreenQ.copy(this.worldToScreenQ);
  this.inverseWorldToScreenQ.inverse();
};

FusionPoseSensor.prototype.start = function() {
  this.onDeviceMotionCallback_ = this.onDeviceMotion_.bind(this);
  this.onOrientationChangeCallback_ = this.onOrientationChange_.bind(this);
  this.onMessageCallback_ = this.onMessage_.bind(this);

  // Only listen for postMessages if we're in an iOS and embedded inside a cross
  // domain IFrame. In this case, the polyfill can still work if the containing
  // page sends synthetic devicemotion events. For an example of this, see
  // iframe-message-sender.js in VR View: https://goo.gl/XDtvFZ
  if (Util.isIOS() && Util.isInsideCrossDomainIFrame()) {
    window.addEventListener('message', this.onMessageCallback_);
  }
  window.addEventListener('orientationchange', this.onOrientationChangeCallback_);
  window.addEventListener('devicemotion', this.onDeviceMotionCallback_);
};

FusionPoseSensor.prototype.stop = function() {
  window.removeEventListener('devicemotion', this.onDeviceMotionCallback_);
  window.removeEventListener('orientationchange', this.onOrientationChangeCallback_);
  window.removeEventListener('message', this.onMessageCallback_);
};

module.exports = FusionPoseSensor;

},{"../math-util.js":20,"../touch-panner.js":28,"../util.js":29,"./complementary-filter.js":24,"./pose-predictor.js":26}],26:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = _dereq_('../math-util');
var Util = _dereq_('../util');

/**
 * Given an orientation and the gyroscope data, predicts the future orientation
 * of the head. This makes rendering appear faster.
 *
 * Also see: http://msl.cs.uiuc.edu/~lavalle/papers/LavYerKatAnt14.pdf
 *
 * @param {Number} predictionTimeS time from head movement to the appearance of
 * the corresponding image.
 */
function PosePredictor(predictionTimeS) {
  this.predictionTimeS = predictionTimeS;

  // The quaternion corresponding to the previous state.
  this.previousQ = new MathUtil.Quaternion();
  // Previous time a prediction occurred.
  this.previousTimestampS = null;

  // The delta quaternion that adjusts the current pose.
  this.deltaQ = new MathUtil.Quaternion();
  // The output quaternion.
  this.outQ = new MathUtil.Quaternion();
}

PosePredictor.prototype.getPrediction = function(currentQ, gyro, timestampS) {
  if (!this.previousTimestampS) {
    this.previousQ.copy(currentQ);
    this.previousTimestampS = timestampS;
    return currentQ;
  }

  // Calculate axis and angle based on gyroscope rotation rate data.
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();

  var angularSpeed = gyro.length();

  // If we're rotating slowly, don't do prediction.
  if (angularSpeed < MathUtil.degToRad * 20) {
    if (Util.isDebug()) {
      console.log('Moving slowly, at %s deg/s: no prediction',
                  (MathUtil.radToDeg * angularSpeed).toFixed(1));
    }
    this.outQ.copy(currentQ);
    this.previousQ.copy(currentQ);
    return this.outQ;
  }

  // Get the predicted angle based on the time delta and latency.
  var deltaT = timestampS - this.previousTimestampS;
  var predictAngle = angularSpeed * this.predictionTimeS;

  this.deltaQ.setFromAxisAngle(axis, predictAngle);
  this.outQ.copy(this.previousQ);
  this.outQ.multiply(this.deltaQ);

  this.previousQ.copy(currentQ);
  this.previousTimestampS = timestampS;

  return this.outQ;
};


module.exports = PosePredictor;

},{"../math-util":20,"../util":29}],27:[function(_dereq_,module,exports){
function SensorSample(sample, timestampS) {
  this.set(sample, timestampS);
};

SensorSample.prototype.set = function(sample, timestampS) {
  this.sample = sample;
  this.timestampS = timestampS;
};

SensorSample.prototype.copy = function(sensorSample) {
  this.set(sensorSample.sample, sensorSample.timestampS);
};

module.exports = SensorSample;

},{}],28:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

var ROTATE_SPEED = 0.5;
/**
 * Provides a quaternion responsible for pre-panning the scene before further
 * transformations due to device sensors.
 */
function TouchPanner() {
  window.addEventListener('touchstart', this.onTouchStart_.bind(this));
  window.addEventListener('touchmove', this.onTouchMove_.bind(this));
  window.addEventListener('touchend', this.onTouchEnd_.bind(this));

  this.isTouching = false;
  this.rotateStart = new MathUtil.Vector2();
  this.rotateEnd = new MathUtil.Vector2();
  this.rotateDelta = new MathUtil.Vector2();

  this.theta = 0;
  this.orientation = new MathUtil.Quaternion();
}

TouchPanner.prototype.getOrientation = function() {
  this.orientation.setFromEulerXYZ(0, 0, this.theta);
  return this.orientation;
};

TouchPanner.prototype.resetSensor = function() {
  this.theta = 0;
};

TouchPanner.prototype.onTouchStart_ = function(e) {
  // Only respond if there is exactly one touch.
  // Note that the Daydream controller passes in a `touchstart` event with
  // no `touches` property, so we must check for that case too.
  if (!e.touches || e.touches.length != 1) {
    return;
  }
  this.rotateStart.set(e.touches[0].pageX, e.touches[0].pageY);
  this.isTouching = true;
};

TouchPanner.prototype.onTouchMove_ = function(e) {
  if (!this.isTouching) {
    return;
  }
  this.rotateEnd.set(e.touches[0].pageX, e.touches[0].pageY);
  this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
  this.rotateStart.copy(this.rotateEnd);

  // On iOS, direction is inverted.
  if (Util.isIOS()) {
    this.rotateDelta.x *= -1;
  }

  var element = document.body;
  this.theta += 2 * Math.PI * this.rotateDelta.x / element.clientWidth * ROTATE_SPEED;
};

TouchPanner.prototype.onTouchEnd_ = function(e) {
  this.isTouching = false;
};

module.exports = TouchPanner;

},{"./math-util.js":20,"./util.js":29}],29:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = window.Util || {};

Util.MIN_TIMESTEP = 0.001;
Util.MAX_TIMESTEP = 1;

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.clamp = function(value, min, max) {
  return Math.min(Math.max(min, value), max);
};

Util.lerp = function(a, b, t) {
  return a + ((b - a) * t);
};

/**
 * Light polyfill for `Promise.race`. Returns
 * a promise that resolves when the first promise
 * provided resolves.
 *
 * @param {Array<Promise>} promises
 */
Util.race = function(promises) {
  if (Promise.race) {
    return Promise.race(promises);
  }

  return new Promise(function (resolve, reject) {
    for (var i = 0; i < promises.length; i++) {
      promises[i].then(resolve, reject);
    }
  });
};

Util.isIOS = (function() {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.platform);
  return function() {
    return isIOS;
  };
})();

Util.isWebViewAndroid = (function() {
  var isWebViewAndroid = navigator.userAgent.indexOf('Version') !== -1 &&
      navigator.userAgent.indexOf('Android') !== -1 &&
      navigator.userAgent.indexOf('Chrome') !== -1;
  return function() {
    return isWebViewAndroid;
  };
})();

Util.isSafari = (function() {
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return function() {
    return isSafari;
  };
})();

Util.isFirefoxAndroid = (function() {
  var isFirefoxAndroid = navigator.userAgent.indexOf('Firefox') !== -1 &&
      navigator.userAgent.indexOf('Android') !== -1;
  return function() {
    return isFirefoxAndroid;
  };
})();
Util.isAndroid = (function() {
  var isAndroid = navigator.userAgent.indexOf('Android') !== -1; 
  return function() { 
    return isAndroid; 
    }; 
  })();
Util.isR7 = (function() {
  var isR7 = navigator.userAgent.indexOf('R7 Build') !== -1;
  return function() {
    return isR7;
  };
})();

Util.isLandscapeMode = function() {
  var rtn = (window.orientation == 90 || window.orientation == -90);
  return Util.isR7() ? !rtn : rtn;
};

// Helper method to validate the time steps of sensor timestamps.
Util.isTimestampDeltaValid = function(timestampDeltaS) {
  if (isNaN(timestampDeltaS)) {
    return false;
  }
  if (timestampDeltaS <= Util.MIN_TIMESTEP) {
    return false;
  }
  if (timestampDeltaS > Util.MAX_TIMESTEP) {
    return false;
  }
  return true;
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.requestFullscreen = function(element) {
  if (Util.isWebViewAndroid()) {
      return false;
  }
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.exitFullscreen = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.getFullscreenElement = function() {
  return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
};

Util.linkProgram = function(gl, vertexSource, fragmentSource, attribLocationMap) {
  // No error checking for brevity.
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  for (var attribName in attribLocationMap)
    gl.bindAttribLocation(program, attribLocationMap[attribName], attribName);

  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
};

Util.getProgramUniforms = function(gl, program) {
  var uniforms = {};
  var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  var uniformName = '';
  for (var i = 0; i < uniformCount; i++) {
    var uniformInfo = gl.getActiveUniform(program, i);
    uniformName = uniformInfo.name.replace('[0]', '');
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
  }
  return uniforms;
};

Util.orthoMatrix = function (out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right),
      bt = 1 / (bottom - top),
      nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
};

Util.copyArray = function (source, dest) {
  for (var i = 0, n = source.length; i < n; i++) {
    dest[i] = source[i];
  }
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.extend = function(dest, src) {
  for (var key in src) {
    if (src.hasOwnProperty(key)) {
      dest[key] = src[key];
    }
  }

  return dest;
}

Util.safariCssSizeWorkaround = function(canvas) {
  // TODO(smus): Remove this workaround when Safari for iOS is fixed.
  // iOS only workaround (for https://bugs.webkit.org/show_bug.cgi?id=152556).
  //
  // "To the last I grapple with thee;
  //  from hell's heart I stab at thee;
  //  for hate's sake I spit my last breath at thee."
  // -- Moby Dick, by Herman Melville
  if (Util.isIOS()) {
    var width = canvas.style.width;
    var height = canvas.style.height;
    canvas.style.width = (parseInt(width) + 1) + 'px';
    canvas.style.height = (parseInt(height)) + 'px';
    setTimeout(function() {
      canvas.style.width = width;
      canvas.style.height = height;
    }, 100);
  }

  // Debug only.
  window.Util = Util;
  window.canvas = canvas;
};

Util.isDebug = function() {
  return Util.getQueryParameter('debug');
};

Util.getQueryParameter = function(name) {
  var name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.frameDataFromPose = (function() {
  var piOver180 = Math.PI / 180.0;
  var rad45 = Math.PI * 0.25;

  // Borrowed from glMatrix.
  function mat4_perspectiveFromFieldOfView(out, fov, near, far) {
    var upTan = Math.tan(fov ? (fov.upDegrees * piOver180) : rad45),
    downTan = Math.tan(fov ? (fov.downDegrees * piOver180) : rad45),
    leftTan = Math.tan(fov ? (fov.leftDegrees * piOver180) : rad45),
    rightTan = Math.tan(fov ? (fov.rightDegrees * piOver180) : rad45),
    xScale = 2.0 / (leftTan + rightTan),
    yScale = 2.0 / (upTan + downTan);

    out[0] = xScale;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    out[4] = 0.0;
    out[5] = yScale;
    out[6] = 0.0;
    out[7] = 0.0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = ((upTan - downTan) * yScale * 0.5);
    out[10] = far / (near - far);
    out[11] = -1.0;
    out[12] = 0.0;
    out[13] = 0.0;
    out[14] = (far * near) / (near - far);
    out[15] = 0.0;
    return out;
  }

  function mat4_fromRotationTranslation(out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;

    return out;
  };

  function mat4_translate(out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
      a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
      a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

      out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
      out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
      out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
  };

  function mat4_invert(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
      return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
  };

  var defaultOrientation = new Float32Array([0, 0, 0, 1]);
  var defaultPosition = new Float32Array([0, 0, 0]);

  function updateEyeMatrices(projection, view, pose, parameters, vrDisplay) {
    mat4_perspectiveFromFieldOfView(projection, parameters ? parameters.fieldOfView : null, vrDisplay.depthNear, vrDisplay.depthFar);

    var orientation = pose.orientation || defaultOrientation;
    var position = pose.position || defaultPosition;

    mat4_fromRotationTranslation(view, orientation, position);
    if (parameters)
      mat4_translate(view, view, parameters.offset);
    mat4_invert(view, view);
  }

  return function(frameData, pose, vrDisplay) {
    if (!frameData || !pose)
      return false;

    frameData.pose = pose;
    frameData.timestamp = pose.timestamp;

    updateEyeMatrices(
        frameData.leftProjectionMatrix, frameData.leftViewMatrix,
        pose, vrDisplay.getEyeParameters("left"), vrDisplay);
    updateEyeMatrices(
        frameData.rightProjectionMatrix, frameData.rightViewMatrix,
        pose, vrDisplay.getEyeParameters("right"), vrDisplay);

    return true;
  };
})();

Util.isInsideCrossDomainIFrame = function() {
  var isFramed = (window.self !== window.top);
  var refDomain = Util.getDomainFromUrl(document.referrer);
  var thisDomain = Util.getDomainFromUrl(window.location.href);

  return isFramed && (refDomain !== thisDomain);
};

// From http://stackoverflow.com/a/23945027.
Util.getDomainFromUrl = function(url) {
  var domain;
  // Find & remove protocol (http, ftp, etc.) and get domain.
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2];
  }
  else {
    domain = url.split('/')[0];
  }

  //find & remove port number
  domain = domain.split(':')[0];

  return domain;
}

module.exports = Util;

},{}],30:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var DeviceInfo = _dereq_('./device-info.js');
var Util = _dereq_('./util.js');

var DEFAULT_VIEWER = 'CardboardV1';
var VIEWER_KEY = 'WEBVR_CARDBOARD_VIEWER';
var CLASS_NAME = 'webvr-polyfill-viewer-selector';

/**
 * Creates a viewer selector with the options specified. Supports being shown
 * and hidden. Generates events when viewer parameters change. Also supports
 * saving the currently selected index in localStorage.
 */
function ViewerSelector() {
  // Try to load the selected key from local storage.
  try {
    this.selectedKey = localStorage.getItem(VIEWER_KEY);
  } catch (error) {
    console.error('Failed to load viewer profile: %s', error);
  }

  //If none exists, or if localstorage is unavailable, use the default key.
  if (!this.selectedKey) {
    this.selectedKey = DEFAULT_VIEWER;
  }

  this.dialog = this.createDialog_(DeviceInfo.Viewers);
  this.root = null;
  this.onChangeCallbacks_ = [];
}

ViewerSelector.prototype.show = function(root) {
  this.root = root;

  root.appendChild(this.dialog);

  // Ensure the currently selected item is checked.
  var selected = this.dialog.querySelector('#' + this.selectedKey);
  selected.checked = true;

  // Show the UI.
  this.dialog.style.display = 'block';
};

ViewerSelector.prototype.hide = function() {
  if (this.root && this.root.contains(this.dialog)) {
    this.root.removeChild(this.dialog);
  }
  this.dialog.style.display = 'none';
};

ViewerSelector.prototype.getCurrentViewer = function() {
  return DeviceInfo.Viewers[this.selectedKey];
};

ViewerSelector.prototype.getSelectedKey_ = function() {
  var input = this.dialog.querySelector('input[name=field]:checked');
  if (input) {
    return input.id;
  }
  return null;
};

ViewerSelector.prototype.onChange = function(cb) {
  this.onChangeCallbacks_.push(cb);
};

ViewerSelector.prototype.fireOnChange_ = function(viewer) {
  for (var i = 0; i < this.onChangeCallbacks_.length; i++) {
    this.onChangeCallbacks_[i](viewer);
  }
};

ViewerSelector.prototype.onSave_ = function() {
  this.selectedKey = this.getSelectedKey_();
  if (!this.selectedKey || !DeviceInfo.Viewers[this.selectedKey]) {
    console.error('ViewerSelector.onSave_: this should never happen!');
    return;
  }

  this.fireOnChange_(DeviceInfo.Viewers[this.selectedKey]);

  // Attempt to save the viewer profile, but fails in private mode.
  try {
    localStorage.setItem(VIEWER_KEY, this.selectedKey);
  } catch(error) {
    console.error('Failed to save viewer profile: %s', error);
  }
  this.hide();
};

/**
 * Creates the dialog.
 */
ViewerSelector.prototype.createDialog_ = function(options) {
  var container = document.createElement('div');
  container.classList.add(CLASS_NAME);
  container.style.display = 'none';
  // Create an overlay that dims the background, and which goes away when you
  // tap it.
  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.left = 0;
  s.top = 0;
  s.width = '100%';
  s.height = '100%';
  s.background = 'rgba(0, 0, 0, 0.3)';
  overlay.addEventListener('click', this.hide.bind(this));

  var width = 280;
  var dialog = document.createElement('div');
  var s = dialog.style;
  s.boxSizing = 'border-box';
  s.position = 'fixed';
  s.top = '24px';
  s.left = '50%';
  s.marginLeft = (-width/2) + 'px';
  s.width = width + 'px';
  s.padding = '24px';
  s.overflow = 'hidden';
  s.background = '#fafafa';
  s.fontFamily = "'Roboto', sans-serif";
  s.boxShadow = '0px 5px 20px #666';

  dialog.appendChild(this.createH1_('Select your viewer'));
  for (var id in options) {
    dialog.appendChild(this.createChoice_(id, options[id].label));
  }
  dialog.appendChild(this.createButton_('Save', this.onSave_.bind(this)));

  container.appendChild(overlay);
  container.appendChild(dialog);

  return container;
};

ViewerSelector.prototype.createH1_ = function(name) {
  var h1 = document.createElement('h1');
  var s = h1.style;
  s.color = 'black';
  s.fontSize = '20px';
  s.fontWeight = 'bold';
  s.marginTop = 0;
  s.marginBottom = '24px';
  h1.innerHTML = name;
  return h1;
};

ViewerSelector.prototype.createChoice_ = function(id, name) {
  /*
  <div class="choice">
  <input id="v1" type="radio" name="field" value="v1">
  <label for="v1">Cardboard V1</label>
  </div>
  */
  var div = document.createElement('div');
  div.style.marginTop = '8px';
  div.style.color = 'black';

  var input = document.createElement('input');
  input.style.fontSize = '30px';
  input.setAttribute('id', id);
  input.setAttribute('type', 'radio');
  input.setAttribute('value', id);
  input.setAttribute('name', 'field');

  var label = document.createElement('label');
  label.style.marginLeft = '4px';
  label.setAttribute('for', id);
  label.innerHTML = name;

  div.appendChild(input);
  div.appendChild(label);

  return div;
};

ViewerSelector.prototype.createButton_ = function(label, onclick) {
  var button = document.createElement('button');
  button.innerHTML = label;
  var s = button.style;
  s.float = 'right';
  s.textTransform = 'uppercase';
  s.color = '#1094f7';
  s.fontSize = '14px';
  s.letterSpacing = 0;
  s.border = 0;
  s.background = 'none';
  s.marginTop = '16px';

  button.addEventListener('click', onclick);

  return button;
};

module.exports = ViewerSelector;

},{"./device-info.js":14,"./util.js":29}],31:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');

/**
 * Android and iOS compatible wakelock implementation.
 *
 * Refactored thanks to dkovalev@.
 */
function AndroidWakeLock() {
  var video = document.createElement('video');
  video.setAttribute('loop', '');

  function addSourceToVideo(element, type, dataURI) {
    var source = document.createElement('source');
    source.src = dataURI;
    source.type = 'video/' + type;
    element.appendChild(source);
  }

  addSourceToVideo(video,'webm', Util.base64('video/webm', 'GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA='));
  addSourceToVideo(video, 'mp4', Util.base64('video/mp4', 'AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthADAowdbb9/AAAC6W1vb3YAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIVdHJhawAAAFx0a2hkAAAAD3wlsIB8JbCAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAgbWRoZAAAAAB8JbCAfCWwgAAAA+gAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVxtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEcc3RibAAAALhzdHNkAAAAAAAAAAEAAACobXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAIAAgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAFJlc2RzAAAAAANEAAEABDwgEQAAAAADDUAAAAAABS0AAAGwAQAAAbWJEwAAAQAAAAEgAMSNiB9FAEQBFGMAAAGyTGF2YzUyLjg3LjQGAQIAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAEwAAAAEAAAAUc3RjbwAAAAAAAAABAAAALAAAAGB1ZHRhAAAAWG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAAK2lsc3QAAAAjqXRvbwAAABtkYXRhAAAAAQAAAABMYXZmNTIuNzguMw=='));

  this.request = function() {
    if (video.paused) {
      video.play();
    }
  };

  this.release = function() {
    video.pause();
  };
}

function iOSWakeLock() {
  var timer = null;

  this.request = function() {
    if (!timer) {
      timer = setInterval(function() {
        window.location = window.location;
        setTimeout(window.stop, 0);
      }, 30000);
    }
  }

  this.release = function() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}


function getWakeLock() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return iOSWakeLock;
  } else {
    return AndroidWakeLock;
  }
}

module.exports = getWakeLock();
},{"./util.js":29}],32:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var CardboardVRDisplay = _dereq_('./cardboard-vr-display.js');
var MouseKeyboardVRDisplay = _dereq_('./mouse-keyboard-vr-display.js');
// Uncomment to add positional tracking via webcam.
//var WebcamPositionSensorVRDevice = require('./webcam-position-sensor-vr-device.js');
var VRDisplay = _dereq_('./base.js').VRDisplay;
var VRFrameData = _dereq_('./base.js').VRFrameData;
var HMDVRDevice = _dereq_('./base.js').HMDVRDevice;
var PositionSensorVRDevice = _dereq_('./base.js').PositionSensorVRDevice;
var VRDisplayHMDDevice = _dereq_('./display-wrappers.js').VRDisplayHMDDevice;
var VRDisplayPositionSensorDevice = _dereq_('./display-wrappers.js').VRDisplayPositionSensorDevice;
var version = _dereq_('../package.json').version;

function WebVRPolyfill() {
  this.displays = [];
  this.devices = []; // For deprecated objects
  this.devicesPopulated = false;
  this.nativeWebVRAvailable = this.isWebVRAvailable();
  this.nativeLegacyWebVRAvailable = this.isDeprecatedWebVRAvailable();
  this.nativeGetVRDisplaysFunc = this.nativeWebVRAvailable ?
                                 navigator.getVRDisplays :
                                 null;

  if (!this.nativeLegacyWebVRAvailable && !this.nativeWebVRAvailable) {
    this.enablePolyfill();
    if (window.WebVRConfig.ENABLE_DEPRECATED_API) {
      this.enableDeprecatedPolyfill();
    }
  }

  // Put a shim in place to update the API to 1.1 if needed.
  InstallWebVRSpecShim();
}

WebVRPolyfill.prototype.isWebVRAvailable = function() {
  return ('getVRDisplays' in navigator);
};

WebVRPolyfill.prototype.isDeprecatedWebVRAvailable = function() {
  return ('getVRDevices' in navigator) || ('mozGetVRDevices' in navigator);
};

WebVRPolyfill.prototype.connectDisplay = function(vrDisplay) {
  vrDisplay.fireVRDisplayConnect_();
  this.displays.push(vrDisplay);
};

WebVRPolyfill.prototype.populateDevices = function() {
  if (this.devicesPopulated) {
    return;
  }

  // Initialize our virtual VR devices.
  var vrDisplay = null;

  // Add a Cardboard VRDisplay on compatible mobile devices
  if (this.isCardboardCompatible()) {
    vrDisplay = new CardboardVRDisplay();

    this.connectDisplay(vrDisplay);

    // For backwards compatibility
    if (window.WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Add a Mouse and Keyboard driven VRDisplay for desktops/laptops
  if (!this.isMobile() && !window.WebVRConfig.MOUSE_KEYBOARD_CONTROLS_DISABLED) {
    vrDisplay = new MouseKeyboardVRDisplay();
    this.connectDisplay(vrDisplay);

    // For backwards compatibility
    if (window.WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Uncomment to add positional tracking via webcam.
  //if (!this.isMobile() && window.WebVRConfig.ENABLE_DEPRECATED_API) {
  //  positionDevice = new WebcamPositionSensorVRDevice();
  //  this.devices.push(positionDevice);
  //}

  this.devicesPopulated = true;
};

WebVRPolyfill.prototype.enablePolyfill = function() {
  // Provide navigator.getVRDisplays.
  navigator.getVRDisplays = this.getVRDisplays.bind(this);

  // Polyfill native VRDisplay.getFrameData
  if (this.nativeWebVRAvailable && window.VRFrameData) {
    var NativeVRFrameData = window.VRFrameData;
    var nativeFrameData = new window.VRFrameData();
    var nativeGetFrameData = window.VRDisplay.prototype.getFrameData;
    window.VRFrameData = VRFrameData;

    window.VRDisplay.prototype.getFrameData = function(frameData) {
      if (frameData instanceof NativeVRFrameData) {
        nativeGetFrameData.call(this, frameData);
        return;
      }

      /*
      Copy frame data from the native object into the polyfilled object.
      */

      nativeGetFrameData.call(this, nativeFrameData);
      frameData.pose = nativeFrameData.pose;
      Util.copyArray(nativeFrameData.leftProjectionMatrix, frameData.leftProjectionMatrix);
      Util.copyArray(nativeFrameData.rightProjectionMatrix, frameData.rightProjectionMatrix);
      Util.copyArray(nativeFrameData.leftViewMatrix, frameData.leftViewMatrix);
      Util.copyArray(nativeFrameData.rightViewMatrix, frameData.rightViewMatrix);
      //todo: copy
    };
  }

  // Provide the `VRDisplay` object.
  window.VRDisplay = VRDisplay;

  // Provide the `navigator.vrEnabled` property.
  if (navigator && typeof navigator.vrEnabled === 'undefined') {
    var self = this;
    Object.defineProperty(navigator, 'vrEnabled', {
      get: function () {
        return self.isCardboardCompatible() &&
            (self.isFullScreenAvailable() || Util.isIOS());
      }
    });
  }

  if (!('VRFrameData' in window)) {
    // Provide the VRFrameData object.
    window.VRFrameData = VRFrameData;
  }
};

WebVRPolyfill.prototype.enableDeprecatedPolyfill = function() {
  // Provide navigator.getVRDevices.
  navigator.getVRDevices = this.getVRDevices.bind(this);

  // Provide the CardboardHMDVRDevice and PositionSensorVRDevice objects.
  window.HMDVRDevice = HMDVRDevice;
  window.PositionSensorVRDevice = PositionSensorVRDevice;
};

WebVRPolyfill.prototype.getVRDisplays = function() {
  this.populateDevices();
  var polyfillDisplays = this.displays;

  if (!this.nativeWebVRAvailable) {
    return Promise.resolve(polyfillDisplays);
  }

  // Set up a race condition if this browser has a bug where
  // `navigator.getVRDisplays()` never resolves.
  var timeoutId;
  var vrDisplaysNative = this.nativeGetVRDisplaysFunc.call(navigator);
  var timeoutPromise = new Promise(function(resolve) {
    timeoutId = setTimeout(function() {
      console.warn('Native WebVR implementation detected, but `getVRDisplays()` failed to resolve. Falling back to polyfill.');
      resolve([]);
    }, window.WebVRConfig.GET_VR_DISPLAYS_TIMEOUT);
  });

  return Util.race([
    vrDisplaysNative,
    timeoutPromise
  ]).then(function(nativeDisplays) {
    clearTimeout(timeoutId);
    if (window.WebVRConfig.ALWAYS_APPEND_POLYFILL_DISPLAY) {
      return nativeDisplays.concat(polyfillDisplays);
    } else {
      return nativeDisplays.length > 0 ? nativeDisplays : polyfillDisplays;
    }
  });
};

WebVRPolyfill.prototype.getVRDevices = function() {
  console.warn('getVRDevices is deprecated. Please update your code to use getVRDisplays instead.');
  var self = this;
  return new Promise(function(resolve, reject) {
    try {
      if (!self.devicesPopulated) {
        if (self.nativeWebVRAvailable) {
          return navigator.getVRDisplays(function(displays) {
            for (var i = 0; i < displays.length; ++i) {
              self.devices.push(new VRDisplayHMDDevice(displays[i]));
              self.devices.push(new VRDisplayPositionSensorDevice(displays[i]));
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }

        if (self.nativeLegacyWebVRAvailable) {
          return (navigator.getVRDDevices || navigator.mozGetVRDevices)(function(devices) {
            for (var i = 0; i < devices.length; ++i) {
              if (devices[i] instanceof HMDVRDevice) {
                self.devices.push(devices[i]);
              }
              if (devices[i] instanceof PositionSensorVRDevice) {
                self.devices.push(devices[i]);
              }
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }
      }

      self.populateDevices();
      resolve(self.devices);
    } catch (e) {
      reject(e);
    }
  });
};

WebVRPolyfill.prototype.NativeVRFrameData = window.VRFrameData;

/**
 * Determine if a device is mobile.
 */
WebVRPolyfill.prototype.isMobile = function() {
  return /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

WebVRPolyfill.prototype.isCardboardCompatible = function() {
  // For now, support all iOS and Android devices.
  // Also enable the WebVRConfig.FORCE_VR flag for debugging.
  return this.isMobile() || window.WebVRConfig.FORCE_ENABLE_VR;
};

WebVRPolyfill.prototype.isFullScreenAvailable = function() {
  return (document.fullscreenEnabled ||
          document.mozFullScreenEnabled ||
          document.webkitFullscreenEnabled ||
          false);
};

// Installs a shim that updates a WebVR 1.0 spec implementation to WebVR 1.1
function InstallWebVRSpecShim() {
  if ('VRDisplay' in window && !('VRFrameData' in window)) {
    // Provide the VRFrameData object.
    window.VRFrameData = VRFrameData;

    // A lot of Chrome builds don't have depthNear and depthFar, even
    // though they're in the WebVR 1.0 spec. Patch them in if they're not present.
    if(!('depthNear' in window.VRDisplay.prototype)) {
      window.VRDisplay.prototype.depthNear = 0.01;
    }

    if(!('depthFar' in window.VRDisplay.prototype)) {
      window.VRDisplay.prototype.depthFar = 10000.0;
    }

    window.VRDisplay.prototype.getFrameData = function(frameData) {
      return Util.frameDataFromPose(frameData, this.getPose(), this);
    }
  }
};

WebVRPolyfill.InstallWebVRSpecShim = InstallWebVRSpecShim;
WebVRPolyfill.version = version;

module.exports.WebVRPolyfill = WebVRPolyfill;

},{"../package.json":8,"./base.js":9,"./cardboard-vr-display.js":12,"./display-wrappers.js":15,"./mouse-keyboard-vr-display.js":21,"./util.js":29}],33:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var EventEmitter = _dereq_('eventemitter3');
var shaka = _dereq_('shaka-player');

var Types = _dereq_('../video-type');
var Util = _dereq_('../util');

var DEFAULT_BITS_PER_SECOND = 1000000;

/**
 * Supports regular video URLs (eg. mp4), as well as adaptive manifests like
 * DASH (.mpd) and soon HLS (.m3u8).
 *
 * Events:
 *   load(video): When the video is loaded.
 *   error(message): If an error occurs.
 *
 * To play/pause/seek/etc, please use the underlying video element.
 */
function AdaptivePlayer(params) {
  this.video = document.createElement('video');
  // Loop by default.
  if (params.loop === true) {
    this.video.setAttribute('loop', true);
  }

  if (params.volume !== undefined) {
    // XXX: .setAttribute('volume', params.volume) doesn't work for some reason.
    this.video.volume = params.volume;
  }

  // Not muted by default.
  if (params.muted === true) {
    this.video.muted = params.muted;
  }

  // For FF, make sure we enable preload.
  this.video.setAttribute('preload', 'auto');
  // Enable inline video playback in iOS 10+.
  this.video.setAttribute('playsinline', true);
  this.video.setAttribute('crossorigin', 'anonymous');
}
AdaptivePlayer.prototype = new EventEmitter();

AdaptivePlayer.prototype.load = function(url) {
  var self = this;
  // TODO(smus): Investigate whether or not differentiation is best done by
  // mimeType after all. Cursory research suggests that adaptive streaming
  // manifest mime types aren't properly supported.
  //
  // For now, make determination based on extension.
  var extension = Util.getExtension(url);
  switch (extension) {
    case 'm3u8': // HLS
      this.type = Types.HLS;
      if (Util.isSafari()) {
        this.loadVideo_(url).then(function() {
          self.emit('load', self.video, self.type);
        }).catch(this.onError_.bind(this));
      } else {
        self.onError_('HLS is only supported on Safari.');
      }
      break;
    case 'mpd': // MPEG-DASH
      this.type = Types.DASH;
      this.loadShakaVideo_(url).then(function() {
        console.log('The video has now been loaded!');
        self.emit('load', self.video, self.type);
      }).catch(this.onError_.bind(this));
      break;
    default: // A regular video, not an adaptive manifest.
      this.type = Types.VIDEO;
      this.loadVideo_(url).then(function() {
        self.emit('load', self.video, self.type);
      }).catch(this.onError_.bind(this));
      break;
  }
};

AdaptivePlayer.prototype.destroy = function() {
  this.video.pause();
  this.video.src = '';
  this.video = null;
};

/*** PRIVATE API ***/

AdaptivePlayer.prototype.onError_ = function(e) {
  console.error(e);
  this.emit('error', e);
};

AdaptivePlayer.prototype.loadVideo_ = function(url) {
  var self = this, video = self.video;
  return new Promise(function(resolve, reject) {
    video.src = url;
    video.addEventListener('canplaythrough', resolve);
    video.addEventListener('loadedmetadata', function() {
      self.emit('timeupdate', {
        currentTime: video.currentTime,
        duration: video.duration
      });
    });
    video.addEventListener('error', reject);
    video.load();
  });
};

AdaptivePlayer.prototype.initShaka_ = function() {
  this.player = new shaka.Player(this.video);

  this.player.configure({
    abr: { defaultBandwidthEstimate: DEFAULT_BITS_PER_SECOND }
  });

  // Listen for error events.
  this.player.addEventListener('error', this.onError_);
};

AdaptivePlayer.prototype.loadShakaVideo_ = function(url) {
  // Install built-in polyfills to patch browser incompatibilities.
  shaka.polyfill.installAll();

  if (!shaka.Player.isBrowserSupported()) {
    console.error('Shaka is not supported on this browser.');
    return;
  }

  this.initShaka_();
  return this.player.load(url);
};

module.exports = AdaptivePlayer;

},{"../util":45,"../video-type":46,"eventemitter3":3,"shaka-player":5}],34:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Eyes = {
  LEFT: 1,
  RIGHT: 2
};

module.exports = Eyes;

},{}],35:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var EventEmitter = _dereq_('eventemitter3');
var TWEEN = _dereq_('@tweenjs/tween.js');

var Util = _dereq_('../util');

// Constants for the focus/blur animation.
var NORMAL_SCALE = new THREE.Vector3(1, 1, 1);
var FOCUS_SCALE = new THREE.Vector3(1.2, 1.2, 1.2);
var FOCUS_DURATION = 200;

// Constants for the active/inactive animation.
var INACTIVE_COLOR = new THREE.Color(1, 1, 1);
var ACTIVE_COLOR = new THREE.Color(0.8, 0, 0);
var ACTIVE_DURATION = 100;

// Constants for opacity.
var MAX_INNER_OPACITY = 0.8;
var MAX_OUTER_OPACITY = 0.5;
var FADE_START_ANGLE_DEG = 35;
var FADE_END_ANGLE_DEG = 60;
/**
 * Responsible for rectangular hot spots that the user can interact with.
 *
 * Specific duties:
 *   Adding and removing hotspots.
 *   Rendering the hotspots (debug mode only).
 *   Notifying when hotspots are interacted with.
 *
 * Emits the following events:
 *   click (id): a hotspot is clicked.
 *   focus (id): a hotspot is focused.
 *   blur (id): a hotspot is no longer hovered over.
 */
function HotspotRenderer(worldRenderer) {
  this.worldRenderer = worldRenderer;
  this.scene = worldRenderer.scene;

  // Note: this event must be added to document.body and not to window for it to
  // work inside iOS iframes.
  var body = document.body;
  // Bind events for hotspot interaction.
  if (!Util.isMobile()) {
    // Only enable mouse events on desktop.
    body.addEventListener('mousedown', this.onMouseDown_.bind(this), false);
    body.addEventListener('mousemove', this.onMouseMove_.bind(this), false);
    body.addEventListener('mouseup', this.onMouseUp_.bind(this), false);
  }
  body.addEventListener('touchstart', this.onTouchStart_.bind(this), false);
  body.addEventListener('touchend', this.onTouchEnd_.bind(this), false);

  // Add a placeholder for hotspots.
  this.hotspotRoot = new THREE.Object3D();
  // Align the center with the center of the camera too.
  this.hotspotRoot.rotation.y = Math.PI / 2;
  this.scene.add(this.hotspotRoot);

  // All hotspot IDs.
  this.hotspots = {};

  // Currently selected hotspots.
  this.selectedHotspots = {};

  // Hotspots that the last touchstart / mousedown event happened for.
  this.downHotspots = {};

  // For raycasting. Initialize mouse to be off screen initially.
  this.pointer = new THREE.Vector2(1, 1);
  this.raycaster = new THREE.Raycaster();
}
HotspotRenderer.prototype = new EventEmitter();

/**
 * @param pitch {Number} The latitude of center, specified in degrees, between
 * -90 and 90, with 0 at the horizon.
 * @param yaw {Number} The longitude of center, specified in degrees, between
 * -180 and 180, with 0 at the image center.
 * @param radius {Number} The radius of the hotspot, specified in meters.
 * @param distance {Number} The distance of the hotspot from camera, specified
 * in meters.
 * @param hotspotId {String} The ID of the hotspot.
 */
HotspotRenderer.prototype.add = function(pitch, yaw, radius, distance, id) {
  // If a hotspot already exists with this ID, stop.
  if (this.hotspots[id]) {
    // TODO: Proper error reporting.
    console.error('Attempt to add hotspot with existing id %s.', id);
    return;
  }
  var hotspot = this.createHotspot_(radius, distance);
  hotspot.name = id;

  // Position the hotspot based on the pitch and yaw specified.
  var quat = new THREE.Quaternion();
  quat.setFromEuler(new THREE.Euler(THREE.Math.degToRad(pitch), THREE.Math.degToRad(yaw), 0, 'ZYX'));
  hotspot.position.applyQuaternion(quat);
  hotspot.lookAt(new THREE.Vector3());

  this.hotspotRoot.add(hotspot);
  this.hotspots[id] = hotspot;
}

/**
 * Removes a hotspot based on the ID.
 *
 * @param ID {String} Identifier of the hotspot to be removed.
 */
HotspotRenderer.prototype.remove = function(id) {
  // If there's no hotspot with this ID, fail.
  if (!this.hotspots[id]) {
    // TODO: Proper error reporting.
    console.error('Attempt to remove non-existing hotspot with id %s.', id);
    return;
  }
  // Remove the mesh from the scene.
  this.hotspotRoot.remove(this.hotspots[id]);

  // If this hotspot was selected, make sure it gets unselected.
  delete this.selectedHotspots[id];
  delete this.downHotspots[id];
  delete this.hotspots[id];
  this.emit('blur', id);
};

/**
 * Clears all hotspots from the pano. Often called when changing panos.
 */
HotspotRenderer.prototype.clearAll = function() {
  for (var id in this.hotspots) {
    this.remove(id);
  }
};

HotspotRenderer.prototype.getCount = function() {
  var count = 0;
  for (var id in this.hotspots) {
    count += 1;
  }
  return count;
};

HotspotRenderer.prototype.update = function(camera) {
  if (this.worldRenderer.isVRMode()) {
    this.pointer.set(0, 0);
  }
  // Update the picking ray with the camera and mouse position.
  this.raycaster.setFromCamera(this.pointer, camera);

  // Fade hotspots out if they are really far from center to avoid overly
  // distorted visuals.
  this.fadeOffCenterHotspots_(camera);

  var hotspots = this.hotspotRoot.children;

  // Go through all hotspots to see if they are currently selected.
  for (var i = 0; i < hotspots.length; i++) {
    var hotspot = hotspots[i];
    //hotspot.lookAt(camera.position);
    var id = hotspot.name;
    // Check if hotspot is intersected with the picking ray.
    var intersects = this.raycaster.intersectObjects(hotspot.children);
    var isIntersected = (intersects.length > 0);

    // If newly selected, emit a focus event.
    if (isIntersected && !this.selectedHotspots[id]) {
      this.emit('focus', id);
      this.focus_(id);
    }
    // If no longer selected, emit a blur event.
    if (!isIntersected && this.selectedHotspots[id]) {
      this.emit('blur', id);
      this.blur_(id);
    }
    // Update the set of selected hotspots.
    if (isIntersected) {
      this.selectedHotspots[id] = true;
    } else {
      delete this.selectedHotspots[id];
    }
  }
};

/**
 * Toggle whether or not hotspots are visible.
 */
HotspotRenderer.prototype.setVisibility = function(isVisible) {
  this.hotspotRoot.visible = isVisible;
};

HotspotRenderer.prototype.onTouchStart_ = function(e) {
  // In VR mode, don't touch the pointer position.
  if (!this.worldRenderer.isVRMode()) {
    this.updateTouch_(e);
  }

  // Force a camera update to see if any hotspots were selected.
  this.update(this.worldRenderer.camera);

  this.downHotspots = {};
  for (var id in this.selectedHotspots) {
    this.downHotspots[id] = true;
    this.down_(id);
  }
  return false;
};

HotspotRenderer.prototype.onTouchEnd_ = function(e) {
  // If no hotspots are pressed, emit an empty click event.
  if (Util.isEmptyObject(this.downHotspots)) {
    this.emit('click');
    return;
  }

  // Only emit a click if the finger was down on the same hotspot before.
  for (var id in this.downHotspots) {
    this.emit('click', id);
    this.up_(id);
    e.preventDefault();
  }
};

HotspotRenderer.prototype.updateTouch_ = function(e) {
  var size = this.getSize_();
  var touch = e.touches[0];
	this.pointer.x = (touch.clientX / size.width) * 2 - 1;
	this.pointer.y = - (touch.clientY / size.height) * 2 + 1;
};

HotspotRenderer.prototype.onMouseDown_ = function(e) {
  this.updateMouse_(e);

  this.downHotspots = {};
  for (var id in this.selectedHotspots) {
    this.downHotspots[id] = true;
    this.down_(id);
  }
};

HotspotRenderer.prototype.onMouseMove_ = function(e) {
  this.updateMouse_(e);
};

HotspotRenderer.prototype.onMouseUp_ = function(e) {
  this.updateMouse_(e);

  // If no hotspots are pressed, emit an empty click event.
  if (Util.isEmptyObject(this.downHotspots)) {
    this.emit('click');
    return;
  }

  // Only emit a click if the mouse was down on the same hotspot before.
  for (var id in this.selectedHotspots) {
    if (id in this.downHotspots) {
      this.emit('click', id);
      this.up_(id);
    }
  }
};

HotspotRenderer.prototype.updateMouse_ = function(e) {
  var size = this.getSize_();
	this.pointer.x = (e.clientX / size.width) * 2 - 1;
	this.pointer.y = - (e.clientY / size.height) * 2 + 1;
};

HotspotRenderer.prototype.getSize_ = function() {
  var canvas = this.worldRenderer.renderer.domElement;
  return this.worldRenderer.renderer.getSize();
};

HotspotRenderer.prototype.createHotspot_ = function(radius, distance) {
  var innerGeometry = new THREE.CircleGeometry(radius, 32);

  var innerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, side: THREE.DoubleSide, transparent: true,
    opacity: MAX_INNER_OPACITY, depthTest: false
  });

  var inner = new THREE.Mesh(innerGeometry, innerMaterial);
  inner.name = 'inner';

  var outerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, side: THREE.DoubleSide, transparent: true,
    opacity: MAX_OUTER_OPACITY, depthTest: false
  });
  var outerGeometry = new THREE.RingGeometry(radius * 0.85, radius, 32);
  var outer = new THREE.Mesh(outerGeometry, outerMaterial);
  outer.name = 'outer';

  // Position at the extreme end of the sphere.
  var hotspot = new THREE.Object3D();
  hotspot.position.z = -distance;
  hotspot.scale.copy(NORMAL_SCALE);

  hotspot.add(inner);
  hotspot.add(outer);

  return hotspot;
};

/**
 * Large aspect ratios tend to cause visually jarring distortions on the sides.
 * Here we fade hotspots out to avoid them.
 */
HotspotRenderer.prototype.fadeOffCenterHotspots_ = function(camera) {
  var lookAt = new THREE.Vector3(1, 0, 0);
  lookAt.applyQuaternion(camera.quaternion);
  // Take into account the camera parent too.
  lookAt.applyQuaternion(camera.parent.quaternion);

  // Go through each hotspot. Calculate how far off center it is.
  for (var id in this.hotspots) {
    var hotspot = this.hotspots[id];
    var angle = hotspot.position.angleTo(lookAt);
    var angleDeg = THREE.Math.radToDeg(angle);
    var isVisible = angleDeg < 45;
    var opacity;
    if (angleDeg < FADE_START_ANGLE_DEG) {
      opacity = 1;
    } else if (angleDeg > FADE_END_ANGLE_DEG) {
      opacity = 0;
    } else {
      // We are in the case START < angle < END. Linearly interpolate.
      var range = FADE_END_ANGLE_DEG - FADE_START_ANGLE_DEG;
      var value = FADE_END_ANGLE_DEG - angleDeg;
      opacity = value / range;
    }

    // Opacity a function of angle. If angle is large, opacity is zero. At some
    // point, ramp opacity down.
    this.setOpacity_(id, opacity);
  }
};

HotspotRenderer.prototype.focus_ = function(id) {
  var hotspot = this.hotspots[id];

  // Tween scale of hotspot.
  this.tween = new TWEEN.Tween(hotspot.scale).to(FOCUS_SCALE, FOCUS_DURATION)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();
  
  if (this.worldRenderer.isVRMode()) {
    this.timeForHospotClick = setTimeout(function () {
      this.emit('click', id);
    }, 1200 )
  }
};

HotspotRenderer.prototype.blur_ = function(id) {
  var hotspot = this.hotspots[id];

  this.tween = new TWEEN.Tween(hotspot.scale).to(NORMAL_SCALE, FOCUS_DURATION)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start();
  
  if (this.timeForHospotClick) {
    clearTimeout( this.timeForHospotClick );
  }
};

HotspotRenderer.prototype.down_ = function(id) {
  // Become active.
  var hotspot = this.hotspots[id];
  var outer = hotspot.getObjectByName('inner');

  this.tween = new TWEEN.Tween(outer.material.color).to(ACTIVE_COLOR, ACTIVE_DURATION)
      .start();
};

HotspotRenderer.prototype.up_ = function(id) {
  // Become inactive.
  var hotspot = this.hotspots[id];
  var outer = hotspot.getObjectByName('inner');

  this.tween = new TWEEN.Tween(outer.material.color).to(INACTIVE_COLOR, ACTIVE_DURATION)
      .start();
};

HotspotRenderer.prototype.setOpacity_ = function(id, opacity) {
  var hotspot = this.hotspots[id];
  var outer = hotspot.getObjectByName('outer');
  var inner = hotspot.getObjectByName('inner');

  outer.material.opacity = opacity * MAX_OUTER_OPACITY;
  inner.material.opacity = opacity * MAX_INNER_OPACITY;
};

module.exports = HotspotRenderer;

},{"../util":45,"@tweenjs/tween.js":1,"eventemitter3":3}],36:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var EventEmitter = _dereq_('eventemitter3');
var Message = _dereq_('../message');
var Util = _dereq_('../util');


/**
 * Sits in an embedded iframe, receiving messages from a containing
 * iFrame. This facilitates an API which provides the following features:
 *
 *    Playing and pausing content.
 *    Adding hotspots.
 *    Sending messages back to the containing iframe when hotspot is clicked
 *    Sending analytics events to containing iframe.
 *
 * Note: this script used to also respond to synthetic devicemotion events, but
 * no longer does so. This is because as of iOS 9.2, Safari disallows listening
 * for devicemotion events within cross-device iframes. To work around this, the
 * webvr-polyfill responds to the postMessage event containing devicemotion
 * information (sent by the iframe-message-sender in the VR View API).
 */
function IFrameMessageReceiver() {
  window.addEventListener('message', this.onMessage_.bind(this), false);
}
IFrameMessageReceiver.prototype = new EventEmitter();

IFrameMessageReceiver.prototype.onMessage_ = function(event) {
  if (Util.isDebug()) {
    console.log('onMessage_', event);
  }

  var message = event.data;
  var type = message.type.toLowerCase();
  var data = message.data;

  switch (type) {
    case Message.SET_CONTENT:
    case Message.SET_VOLUME:
    case Message.MUTED:
    case Message.ADD_HOTSPOT:
    case Message.PLAY:
    case Message.PAUSE:
    case Message.SET_CURRENT_TIME:
    case Message.GET_POSITION:
    case Message.SET_FULLSCREEN:
      this.emit(type, data);
      break;
    default:
      if (Util.isDebug()) {
        console.warn('Got unknown message of type %s from %s', message.type, message.origin);
      }
  }
};

module.exports = IFrameMessageReceiver;

},{"../message":44,"../util":45,"eventemitter3":3}],37:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Shows a 2D loading indicator while various pieces of EmbedVR load.
 */
function LoadingIndicator() {
  this.el = this.build_();
  document.body.appendChild(this.el);
  this.show();
}

LoadingIndicator.prototype.build_ = function() {
  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.top = 0;
  s.left = 0;
  s.width = '100%';
  s.height = '100%';
  s.background = '#eee';
  var img = document.createElement('img');
  img.src = 'images/loading.gif';
  var s = img.style;
  s.position = 'absolute';
  s.top = '50%';
  s.left = '50%';
  s.transform = 'translate(-50%, -50%)';

  overlay.appendChild(img);
  return overlay;
};

LoadingIndicator.prototype.hide = function() {
  this.el.style.display = 'none';
};

LoadingIndicator.prototype.show = function() {
  this.el.style.display = 'block';
};

module.exports = LoadingIndicator;

},{}],38:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Initialize the loading indicator as quickly as possible to give the user
// immediate feedback.
var LoadingIndicator = _dereq_('./loading-indicator');
var loadIndicator = new LoadingIndicator();

var ES6Promise = _dereq_('es6-promise');
// Polyfill ES6 promises for IE.
ES6Promise.polyfill();

var IFrameMessageReceiver = _dereq_('./iframe-message-receiver');
var Message = _dereq_('../message');
var SceneInfo = _dereq_('./scene-info');
var Stats = _dereq_('../../node_modules/stats-js/build/stats.min');
var Util = _dereq_('../util');
var WebVRPolyfill = _dereq_('webvr-polyfill');
var WorldRenderer = _dereq_('./world-renderer');

var receiver = new IFrameMessageReceiver();
receiver.on(Message.PLAY, onPlayRequest);
receiver.on(Message.PAUSE, onPauseRequest);
receiver.on(Message.ADD_HOTSPOT, onAddHotspot);
receiver.on(Message.SET_CONTENT, onSetContent);
receiver.on(Message.SET_VOLUME, onSetVolume);
receiver.on(Message.MUTED, onMuted);
receiver.on(Message.SET_CURRENT_TIME, onUpdateCurrentTime);
receiver.on(Message.GET_POSITION, onGetPosition);
receiver.on(Message.SET_FULLSCREEN, onSetFullscreen);

window.addEventListener('load', onLoad);

var stats = new Stats();
var scene = SceneInfo.loadFromGetParams();

var worldRenderer = new WorldRenderer(scene);
worldRenderer.on('error', onRenderError);
worldRenderer.on('load', onRenderLoad);
worldRenderer.on('modechange', onModeChange);
worldRenderer.on('ended', onEnded);
worldRenderer.on('play', onPlay);
worldRenderer.hotspotRenderer.on('click', onHotspotClick);

window.worldRenderer = worldRenderer;

var isReadySent = false;
var volume = 0;

function onLoad() {
  if (!Util.isWebGLEnabled()) {
    showError('WebGL not supported.');
    return;
  }

  // Load the scene.
  worldRenderer.setScene(scene);

  if (scene.isDebug) {
    // Show stats.
    showStats();
  }

  if (scene.isYawOnly) {
    WebVRConfig = window.WebVRConfig || {};
    WebVRConfig.YAW_ONLY = true;
  }

  requestAnimationFrame(loop);
}


function onVideoTap() {
  worldRenderer.videoProxy.play();
  hidePlayButton();

  // Prevent multiple play() calls on the video element.
  document.body.removeEventListener('touchend', onVideoTap);
}

function onRenderLoad(event) {
  if (event.videoElement) {

    var scene = SceneInfo.loadFromGetParams();

    // On mobile, tell the user they need to tap to start. Otherwise, autoplay.
    if (Util.isMobile()) {
      // Tell user to tap to start.
      showPlayButton();
      document.body.addEventListener('touchend', onVideoTap);
    } else {
      event.videoElement.play();
    }

    // Attach to pause and play events, to notify the API.
    event.videoElement.addEventListener('pause', onPause);
    event.videoElement.addEventListener('play', onPlay);
    event.videoElement.addEventListener('timeupdate', onGetCurrentTime);
    event.videoElement.addEventListener('ended', onEnded);
  }
  // Hide loading indicator.
  loadIndicator.hide();

  // Autopan only on desktop, for photos only, and only if autopan is enabled.
  if (!Util.isMobile() && !worldRenderer.sceneInfo.video && !worldRenderer.sceneInfo.isAutopanOff) {
    worldRenderer.autopan();
  }

  // Notify the API that we are ready, but only do this once.
  if (!isReadySent) {
    if (event.videoElement) {
      Util.sendParentMessage({
        type: 'ready',
        data: {
          duration: event.videoElement.duration
        }
      });
    } else {
      Util.sendParentMessage({
        type: 'ready'
      });
    }

    isReadySent = true;
  }
}

function onPlayRequest() {
  if (!worldRenderer.videoProxy) {
    onApiError('Attempt to pause, but no video found.');
    return;
  }
  worldRenderer.videoProxy.play();
}

function onPauseRequest() {
  if (!worldRenderer.videoProxy) {
    onApiError('Attempt to pause, but no video found.');
    return;
  }
  worldRenderer.videoProxy.pause();
}

function onAddHotspot(e) {
  if (Util.isDebug()) {
    console.log('onAddHotspot', e);
  }
  // TODO: Implement some validation?

  var pitch = parseFloat(e.pitch);
  var yaw = parseFloat(e.yaw);
  var radius = parseFloat(e.radius);
  var distance = parseFloat(e.distance);
  var id = e.id;
  worldRenderer.hotspotRenderer.add(pitch, yaw, radius, distance, id);
}

function onSetContent(e) {
  if (Util.isDebug()) {
    console.log('onSetContent', e);
  }
  // Remove all of the hotspots.
  worldRenderer.hotspotRenderer.clearAll();
  // Fade to black.
  worldRenderer.sphereRenderer.setOpacity(0, 500).then(function() {
    // Then load the new scene.
    var scene = SceneInfo.loadFromAPIParams(e.contentInfo);
    worldRenderer.destroy();

    // Update the URL to reflect the new scene. This is important particularily
    // on iOS where we use a fake fullscreen mode.
    var url = scene.getCurrentUrl();
    //console.log('Updating url to be %s', url);
    window.history.pushState(null, 'VR View', url);

    // And set the new scene.
    return worldRenderer.setScene(scene);
  }).then(function() {
    // Then fade the scene back in.
    worldRenderer.sphereRenderer.setOpacity(1, 500);
  });
}

function onSetVolume(e) {
  // Only work for video. If there's no video, send back an error.
  if (!worldRenderer.videoProxy) {
    onApiError('Attempt to set volume, but no video found.');
    return;
  }

  worldRenderer.videoProxy.setVolume(e.volumeLevel);
  volume = e.volumeLevel;
  Util.sendParentMessage({
    type: 'volumechange',
    data: e.volumeLevel
  });
}

function onMuted(e) {
  // Only work for video. If there's no video, send back an error.
  if (!worldRenderer.videoProxy) {
    onApiError('Attempt to mute, but no video found.');
    return;
  }

  worldRenderer.videoProxy.mute(e.muteState);

  Util.sendParentMessage({
    type: 'muted',
    data: e.muteState
  });
}

function onUpdateCurrentTime(time) {
  if (!worldRenderer.videoProxy) {
    onApiError('Attempt to pause, but no video found.');
    return;
  }

  worldRenderer.videoProxy.setCurrentTime(time);
  onGetCurrentTime();
}

function onGetCurrentTime() {
  var time = worldRenderer.videoProxy.getCurrentTime();
  Util.sendParentMessage({
    type: 'timeupdate',
    data: time
  });
}

function onSetFullscreen() {
  if (!worldRenderer.videoProxy) {
    onApiError('Attempt to set fullscreen, but no video found.');
    return;
  }
  worldRenderer.manager.onFSClick_();
}

function onApiError(message) {
  console.error(message);
  Util.sendParentMessage({
    type: 'error',
    data: {message: message}
  });
}

function onModeChange(mode) {
  Util.sendParentMessage({
    type: 'modechange',
    data: {mode: mode}
  });
}

function onHotspotClick(id) {
  Util.sendParentMessage({
    type: 'click',
    data: {id: id}
  });
}

function onPlay() {
  Util.sendParentMessage({
    type: 'paused',
    data: false
  });
}

function onPause() {
  Util.sendParentMessage({
    type: 'paused',
    data: true
  });
}

function onEnded() {
    Util.sendParentMessage({
      type: 'ended',
      data: true
    });
}

function onSceneError(message) {
  showError('Loader: ' + message);
}

function onRenderError(message) {
  showError('Render: ' + message);
}

function showError(message) {
  // Hide loading indicator.
  loadIndicator.hide();

  // Sanitize `message` as it could contain user supplied
  // values. Re-add the space character as to not modify the
  // error messages used throughout the codebase.
  message = encodeURI(message).replace(/%20/g, ' ');

  var error = document.querySelector('#error');
  error.classList.add('visible');
  error.querySelector('.message').innerHTML = message;

  error.querySelector('.title').innerHTML = 'Error';
}

function hideError() {
  var error = document.querySelector('#error');
  error.classList.remove('visible');
}

function showPlayButton() {
  var playButton = document.querySelector('#play-overlay');
  playButton.classList.add('visible');
}

function hidePlayButton() {
  var playButton = document.querySelector('#play-overlay');
  playButton.classList.remove('visible');
}

function showStats() {
  stats.setMode(0); // 0: fps, 1: ms

  // Align bottom-left.
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.bottom = '0px';
  document.body.appendChild(stats.domElement);
}

function loop(time) {
  // Use the VRDisplay RAF if it is present.
  if (worldRenderer.vrDisplay) {
    worldRenderer.vrDisplay.requestAnimationFrame(loop);
  } else {
    requestAnimationFrame(loop);
  }

  stats.begin();
  // Update the video if needed.
  if (worldRenderer.videoProxy) {
    worldRenderer.videoProxy.update(time);
  }
  worldRenderer.render(time);
  worldRenderer.submitFrame();
  stats.end();
}
function onGetPosition() {
    Util.sendParentMessage({
        type: 'getposition',
        data: {
            Yaw: worldRenderer.camera.rotation.y * 180 / Math.PI,
            Pitch: worldRenderer.camera.rotation.x * 180 / Math.PI
        }
    });
}

},{"../../node_modules/stats-js/build/stats.min":6,"../message":44,"../util":45,"./iframe-message-receiver":36,"./loading-indicator":37,"./scene-info":40,"./world-renderer":43,"es6-promise":2,"webvr-polyfill":22}],39:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function ReticleRenderer(camera) {
  this.camera = camera;

  this.reticle = this.createReticle_();
  // In front of the hotspot itself, which is at r=0.99.
  this.reticle.position.z = -0.97;
  camera.add(this.reticle);

  this.setVisibility(false);
}

ReticleRenderer.prototype.setVisibility = function(isVisible) {
  // TODO: Tween the transition.
  this.reticle.visible = isVisible;
};

ReticleRenderer.prototype.createReticle_ = function() {
  // Make a torus.
  var geometry = new THREE.TorusGeometry(0.02, 0.005, 10, 20);
  var material = new THREE.MeshBasicMaterial({color: 0x000000});
  var torus = new THREE.Mesh(geometry, material);

  return torus;
};

module.exports = ReticleRenderer;

},{}],40:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('../util');

var CAMEL_TO_UNDERSCORE = {
  video: 'video',
  image: 'image',
  preview: 'preview',
  loop: 'loop',
  volume: 'volume',
  muted: 'muted',
  isStereo: 'is_stereo',
  defaultYaw: 'default_yaw',
  isYawOnly: 'is_yaw_only',
  isDebug: 'is_debug',
  isVROff: 'is_vr_off',
  isAutopanOff: 'is_autopan_off',
  hideFullscreenButton: 'hide_fullscreen_button'
};

/**
 * Contains all information about a given scene.
 */
function SceneInfo(opt_params) {
  var params = opt_params || {};
  params.player = {
    loop: opt_params.loop,
    volume: opt_params.volume,
    muted: opt_params.muted
  };

  this.image = params.image !== undefined ? encodeURI(params.image) : undefined;
  this.preview = params.preview !== undefined ? encodeURI(params.preview) : undefined;
  this.video = params.video !== undefined ? encodeURI(params.video) : undefined;
  this.defaultYaw = THREE.Math.degToRad(params.defaultYaw || 0);

  this.isStereo = Util.parseBoolean(params.isStereo);
  this.isYawOnly = Util.parseBoolean(params.isYawOnly);
  this.isDebug = Util.parseBoolean(params.isDebug);
  this.isVROff = Util.parseBoolean(params.isVROff);
  this.isAutopanOff = Util.parseBoolean(params.isAutopanOff);
  this.loop = Util.parseBoolean(params.player.loop);
  this.volume = parseFloat(
      params.player.volume ? params.player.volume : '1');
  this.muted = Util.parseBoolean(params.player.muted);
  this.hideFullscreenButton = Util.parseBoolean(params.hideFullscreenButton);
}

SceneInfo.loadFromGetParams = function() {
  var params = {};
  for (var camelCase in CAMEL_TO_UNDERSCORE) {
    var underscore = CAMEL_TO_UNDERSCORE[camelCase];
    params[camelCase] = Util.getQueryParameter(underscore)
                        || ((window.WebVRConfig && window.WebVRConfig.PLAYER) ? window.WebVRConfig.PLAYER[underscore] : "");
  }
  var scene = new SceneInfo(params);
  if (!scene.isValid()) {
    console.warn('Invalid scene: %s', scene.errorMessage);
  }
  return scene;
};

SceneInfo.loadFromAPIParams = function(underscoreParams) {
  var params = {};
  for (var camelCase in CAMEL_TO_UNDERSCORE) {
    var underscore = CAMEL_TO_UNDERSCORE[camelCase];
    if (underscoreParams[underscore]) {
      params[camelCase] = underscoreParams[underscore];
    }
  }
  var scene = new SceneInfo(params);
  if (!scene.isValid()) {
    console.warn('Invalid scene: %s', scene.errorMessage);
  }
  return scene;
};

SceneInfo.prototype.isValid = function() {
  // Either it's an image or a video.
  if (!this.image && !this.video) {
    this.errorMessage = 'Either image or video URL must be specified.';
    return false;
  }
  if (this.image && !this.isValidImage_(this.image)) {
    this.errorMessage = 'Invalid image URL: ' + this.image;
    return false;
  }
  this.errorMessage = null;
  return true;
};

/**
 * Generates a URL to reflect this scene.
 */
SceneInfo.prototype.getCurrentUrl = function() {
  var url = location.protocol + '//' + location.host + location.pathname + '?';
  for (var camelCase in CAMEL_TO_UNDERSCORE) {
    var underscore = CAMEL_TO_UNDERSCORE[camelCase];
    var value = this[camelCase];
    if (value !== undefined) {
      url += underscore + '=' + value + '&';
    }
  }
  // Chop off the trailing ampersand.
  return url.substring(0, url.length - 1);
};

SceneInfo.prototype.isValidImage_ = function(imageUrl) {
  return true;
};

module.exports = SceneInfo;

},{"../util":45}],41:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Eyes = _dereq_('./eyes');
var TWEEN = _dereq_('@tweenjs/tween.js');
var Util = _dereq_('../util');
var VideoType = _dereq_('../video-type');

function SphereRenderer(scene) {
  this.scene = scene;

  // Create a transparent mask.
  this.createOpacityMask_();
}

/**
 * Sets the photosphere based on the image in the source. Supports stereo and
 * mono photospheres.
 *
 * @return {Promise}
 */
SphereRenderer.prototype.setPhotosphere = function(src, opt_params) {
  return new Promise(function(resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;

    var params = opt_params || {};

    this.isStereo = !!params.isStereo;
    this.src = src;

    // Load texture.
    var loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(src, this.onTextureLoaded_.bind(this), undefined,
                this.onTextureError_.bind(this));
  }.bind(this));
};

/**
 * @return {Promise} Yeah.
 */
SphereRenderer.prototype.set360Video = function (videoElement, videoType, opt_params) {
  return new Promise(function(resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;

    var params = opt_params || {};

    this.isStereo = !!params.isStereo;

    // Load the video texture.
    var videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.generateMipmaps = false;

    if (Util.isSafari() && videoType === VideoType.HLS) {
      // fix black screen issue on safari
      videoTexture.format = THREE.RGBAFormat;
      videoTexture.flipY = false;
    } else {
      videoTexture.format = THREE.RGBFormat;
    }

    videoTexture.needsUpdate = true;

    this.onTextureLoaded_(videoTexture);
  }.bind(this));
};

/**
 * Set the opacity of the panorama.
 *
 * @param {Number} opacity How opaque we want the panorama to be. 0 means black,
 * 1 means full color.
 * @param {Number} duration Number of milliseconds the transition should take.
 *
 * @return {Promise} When the opacity change is complete.
 */
SphereRenderer.prototype.setOpacity = function(opacity, duration) {
  var scene = this.scene;
  // If we want the opacity
  var overlayOpacity = 1 - opacity;
  return new Promise(function(resolve, reject) {
    var mask = scene.getObjectByName('opacityMask');
    var tween = new TWEEN.Tween({opacity: mask.material.opacity})
        .to({opacity: overlayOpacity}, duration)
        .easing(TWEEN.Easing.Quadratic.InOut);
    tween.onUpdate(function(e) {
      mask.material.opacity = this.opacity;
    });
    tween.onComplete(resolve).start();
  });
};

SphereRenderer.prototype.onTextureLoaded_ = function(texture) {
  var sphereLeft;
  var sphereRight;
  if (this.isStereo) {
    sphereLeft = this.createPhotosphere_(texture, {offsetY: 0.5, scaleY: 0.5});
    sphereRight = this.createPhotosphere_(texture, {offsetY: 0, scaleY: 0.5});
  } else {
    sphereLeft = this.createPhotosphere_(texture);
    sphereRight = this.createPhotosphere_(texture);
  }

  // Display in left and right eye respectively.
  sphereLeft.layers.set(Eyes.LEFT);
  sphereLeft.eye = Eyes.LEFT;
  sphereLeft.name = 'eyeLeft';
  sphereRight.layers.set(Eyes.RIGHT);
  sphereRight.eye = Eyes.RIGHT;
  sphereRight.name = 'eyeRight';


    this.scene.getObjectByName('photo').children = [sphereLeft, sphereRight];

  this.resolve();
};

SphereRenderer.prototype.onTextureError_ = function(error) {
  this.reject('Unable to load texture from "' + this.src + '"');
};


SphereRenderer.prototype.createPhotosphere_ = function(texture, opt_params) {
  var p = opt_params || {};
  p.scaleX = p.scaleX || 1;
  p.scaleY = p.scaleY || 1;
  p.offsetX = p.offsetX || 0;
  p.offsetY = p.offsetY || 0;
  p.phiStart = p.phiStart || 0;
  p.phiLength = p.phiLength || Math.PI * 2;
  p.thetaStart = p.thetaStart || 0;
  p.thetaLength = p.thetaLength || Math.PI;

  var geometry = new THREE.SphereGeometry(1, 48, 48,
      p.phiStart, p.phiLength, p.thetaStart, p.thetaLength);
  geometry.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
  var uvs = geometry.faceVertexUvs[0];
  for (var i = 0; i < uvs.length; i ++) {
    for (var j = 0; j < 3; j ++) {
      uvs[i][j].x *= p.scaleX;
      uvs[i][j].x += p.offsetX;
      uvs[i][j].y *= p.scaleY;
      uvs[i][j].y += p.offsetY;
    }
  }

  var material;
  if (texture.format === THREE.RGBAFormat && texture.flipY === false) {
    material = new THREE.ShaderMaterial({
      uniforms: {
        texture: { value: texture }
      },
      vertexShader: [
        "varying vec2 vUV;",
        "void main() {",
        "	vUV = vec2( uv.x, 1.0 - uv.y );",
        "	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D texture;",
        "varying vec2 vUV;",
        "void main() {",
        " gl_FragColor = texture2D( texture, vUV  )" + (Util.isIOS() ? ".bgra" : "") + ";",
        "}"
      ].join("\n")
    });
  } else {
    material = new THREE.MeshBasicMaterial({ map: texture });
  }
  var out = new THREE.Mesh(geometry, material);
  //out.visible = false;
  out.renderOrder = -1;
  return out;
};

SphereRenderer.prototype.createOpacityMask_ = function() {
  var geometry = new THREE.SphereGeometry(0.49, 48, 48);
  var material = new THREE.MeshBasicMaterial({
    color: 0x000000, side: THREE.DoubleSide, opacity: 0, transparent: true});
  var opacityMask = new THREE.Mesh(geometry, material);
  opacityMask.name = 'opacityMask';
  opacityMask.renderOrder = 1;

  this.scene.add(opacityMask);
  return opacityMask;
};

module.exports = SphereRenderer;

},{"../util":45,"../video-type":46,"./eyes":34,"@tweenjs/tween.js":1}],42:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('../util');

/**
 * A proxy class for working around the fact that as soon as a video is play()ed
 * on iOS, Safari auto-fullscreens the video.
 *
 * TODO(smus): The entire raison d'etre for this class is to work around this
 * issue. Once Safari implements some way to suppress this fullscreen player, we
 * can remove this code.
 */
function VideoProxy(videoElement) {
  this.videoElement = videoElement;
  // True if we're currently manually advancing the playhead (only on iOS).
  this.isFakePlayback = false;

  // When the video started playing.
  this.startTime = null;
}

VideoProxy.prototype.play = function() {
  if (Util.isIOS9OrLess()) {
    this.startTime = performance.now();
    this.isFakePlayback = true;

    // Make an audio element to playback just the audio part.
    this.audioElement = new Audio();
    this.audioElement.src = this.videoElement.src;
    this.audioElement.play();
  } else {
    this.videoElement.play().then(function(e) {
      console.log('Playing video.', e);
    });
  }
};

VideoProxy.prototype.pause = function() {
  if (Util.isIOS9OrLess() && this.isFakePlayback) {
    this.isFakePlayback = true;

    this.audioElement.pause();
  } else {
    this.videoElement.pause();
  }
};

VideoProxy.prototype.setVolume = function(volumeLevel) {
  if (this.videoElement) {
    // On iOS 10, the VideoElement.volume property is read-only. So we special
    // case muting and unmuting.
    if (Util.isIOS()) {
      this.videoElement.muted = (volumeLevel === 0);
    } else {
      this.videoElement.volume = volumeLevel;
    }
  }
  if (this.audioElement) {
    this.audioElement.volume = volumeLevel;
  }
};

/**
 * Set the attribute mute of the elements according with the muteState param.
 *
 * @param bool muteState
 */
VideoProxy.prototype.mute = function(muteState) {
  if (this.videoElement) {
    this.videoElement.muted = muteState;
  }
  if (this.audioElement) {
    this.audioElement.muted = muteState;
  }
};

VideoProxy.prototype.getCurrentTime = function() {
  return Util.isIOS9OrLess() ? this.audioElement.currentTime : this.videoElement.currentTime;
};

/**
 *
 * @param {Object} time
 */
VideoProxy.prototype.setCurrentTime = function(time) {
  if (this.videoElement) {
    this.videoElement.currentTime = time.currentTime;
  }
  if (this.audioElement) {
    this.audioElement.currentTime = time.currentTime;
  }
};

/**
 * Called on RAF to progress playback.
 */
VideoProxy.prototype.update = function() {
  // Fakes playback for iOS only.
  if (!this.isFakePlayback) {
    return;
  }
  var duration = this.videoElement.duration;
  var now = performance.now();
  var delta = now - this.startTime;
  var deltaS = delta / 1000;
  this.videoElement.currentTime = deltaS;

  // Loop through the video
  if (deltaS > duration) {
    this.startTime = now;
    this.videoElement.currentTime = 0;
    // Also restart the audio.
    this.audioElement.currentTime = 0;
  }
};

module.exports = VideoProxy;

},{"../util":45}],43:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var AdaptivePlayer = _dereq_('./adaptive-player');
var EventEmitter = _dereq_('eventemitter3');
var Eyes = _dereq_('./eyes');
var HotspotRenderer = _dereq_('./hotspot-renderer');
var ReticleRenderer = _dereq_('./reticle-renderer');
var SphereRenderer = _dereq_('./sphere-renderer');
var TWEEN = _dereq_('@tweenjs/tween.js');
var Util = _dereq_('../util');
var VideoProxy = _dereq_('./video-proxy');
var WebVRManager = _dereq_('webvr-boilerplate');

var AUTOPAN_DURATION = 3000;
var AUTOPAN_ANGLE = 0.4;

/**
 * The main WebGL rendering entry point. Manages the scene, camera, VR-related
 * rendering updates. Interacts with the WebVRManager.
 *
 * Coordinates the other renderers: SphereRenderer, HotspotRenderer,
 * ReticleRenderer.
 *
 * Also manages the AdaptivePlayer and VideoProxy.
 *
 * Emits the following events:
 *   load: when the scene is loaded.
 *   error: if there is an error loading the scene.
 *   modechange(Boolean isVR): if the mode (eg. VR, fullscreen, etc) changes.
 */
function WorldRenderer(params) {
  this.init_(params.hideFullscreenButton);

  this.sphereRenderer = new SphereRenderer(this.scene);
  this.hotspotRenderer = new HotspotRenderer(this);
  this.hotspotRenderer.on('focus', this.onHotspotFocus_.bind(this));
  this.hotspotRenderer.on('blur', this.onHotspotBlur_.bind(this));
  this.reticleRenderer = new ReticleRenderer(this.camera);

  // Get the VR Display as soon as we initialize.
  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      this.vrDisplay = displays[0];
    }
  }.bind(this));

}
WorldRenderer.prototype = new EventEmitter();

WorldRenderer.prototype.render = function(time) {
  this.controls.update();
  TWEEN.update(time);
  this.effect.render(this.scene, this.camera);
  this.hotspotRenderer.update(this.camera);
};

/**
 * @return {Promise} When the scene is fully loaded.
 */
WorldRenderer.prototype.setScene = function(scene) {
  var self = this;
  var promise = new Promise(function(resolve, reject) {
    self.sceneResolve = resolve;
    self.sceneReject = reject;
  });

  if (!scene || !scene.isValid()) {
    this.didLoadFail_(scene.errorMessage);
    return;
  }

  var params = {
    isStereo: scene.isStereo,
    loop: scene.loop,
    volume: scene.volume,
    muted: scene.muted
  };

  this.setDefaultYaw_(scene.defaultYaw || 0);

  // Disable VR mode if explicitly disabled, or if we're loading a video on iOS
  // 9 or earlier.
  if (scene.isVROff || (scene.video && Util.isIOS9OrLess())) {
    this.manager.setVRCompatibleOverride(false);
  }

  // Set various callback overrides in iOS.
  if (Util.isIOS()) {
    this.manager.setFullscreenCallback(function() {
      Util.sendParentMessage({type: 'enter-fullscreen'});
    });
    this.manager.setExitFullscreenCallback(function() {
      Util.sendParentMessage({type: 'exit-fullscreen'});
    });
    this.manager.setVRCallback(function() {
      Util.sendParentMessage({type: 'enter-vr'});
    });
  }

  // If we're dealing with an image, and not a video.
  if (scene.image && !scene.video) {
    if (scene.preview) {
      // First load the preview.
      this.sphereRenderer.setPhotosphere(scene.preview, params).then(function() {
        // As soon as something is loaded, emit the load event to hide the
        // loading progress bar.
        self.didLoad_();
        // Then load the full resolution image.
        self.sphereRenderer.setPhotosphere(scene.image, params);
      }).catch(self.didLoadFail_.bind(self));
    } else {
      // No preview -- go straight to rendering the full image.
      this.sphereRenderer.setPhotosphere(scene.image, params).then(function() {
        self.didLoad_();
      }).catch(self.didLoadFail_.bind(self));
    }
  } else if (scene.video) {
    if (Util.isIE11()) {
      // On IE 11, if an 'image' param is provided, load it instead of showing
      // an error.
      //
      // TODO(smus): Once video textures are supported, remove this fallback.
      if (scene.image) {
        this.sphereRenderer.setPhotosphere(scene.image, params).then(function() {
          self.didLoad_();
        }).catch(self.didLoadFail_.bind(self));
      } else {
        this.didLoadFail_('Video is not supported on IE11.');
      }
    } else {
      this.player = new AdaptivePlayer(params);
      this.player.on('load', function(videoElement, videoType) {
        self.sphereRenderer.set360Video(videoElement, videoType, params).then(function() {
          self.didLoad_({videoElement: videoElement});
        }).catch(self.didLoadFail_.bind(self));
      });
      this.player.on('error', function(error) {
        self.didLoadFail_('Video load error: ' + error);
      });
      this.player.load(scene.video);

      this.videoProxy = new VideoProxy(this.player.video);
    }
  }

  this.sceneInfo = scene;
  if (Util.isDebug()) {
    console.log('Loaded scene', scene);
  }

  return promise;
};

WorldRenderer.prototype.isVRMode = function() {
  return !!this.vrDisplay && this.vrDisplay.isPresenting;
};

WorldRenderer.prototype.submitFrame = function() {
  if (this.isVRMode()) {
    this.vrDisplay.submitFrame();
  }
};

WorldRenderer.prototype.disposeEye_ = function(eye) {
  if (eye) {
    if (eye.material.map) {
      eye.material.map.dispose();
    }
    eye.material.dispose();
    eye.geometry.dispose();
  }
};

WorldRenderer.prototype.dispose = function() {
  var eyeLeft = this.scene.getObjectByName('eyeLeft');
  this.disposeEye_(eyeLeft);
  var eyeRight = this.scene.getObjectByName('eyeRight');
  this.disposeEye_(eyeRight);
};

WorldRenderer.prototype.destroy = function() {
  if (this.player) {
    this.player.removeAllListeners();
    this.player.destroy();
    this.player = null;
  }
  var photo = this.scene.getObjectByName('photo');
  var eyeLeft = this.scene.getObjectByName('eyeLeft');
  var eyeRight = this.scene.getObjectByName('eyeRight');

  if (eyeLeft) {
    this.disposeEye_(eyeLeft);
    photo.remove(eyeLeft);
    this.scene.remove(eyeLeft);
  }

  if (eyeRight) {
    this.disposeEye_(eyeRight);
    photo.remove(eyeRight);
    this.scene.remove(eyeRight);
  }
};

WorldRenderer.prototype.didLoad_ = function(opt_event) {
  var event = opt_event || {};
  this.emit('load', event);
  if (this.sceneResolve) {
    this.sceneResolve();
  }
};

WorldRenderer.prototype.didLoadFail_ = function(message) {
  this.emit('error', message);
  if (this.sceneReject) {
    this.sceneReject(message);
  }
};

/**
 * Sets the default yaw.
 * @param {Number} angleRad The yaw in radians.
 */
WorldRenderer.prototype.setDefaultYaw_ = function(angleRad) {
  // Rotate the camera parent to take into account the scene's rotation.
  // By default, it should be at the center of the image.
  var display = this.controls.getVRDisplay();
  // For desktop, we subtract the current display Y axis
  var theta = display.theta_ || 0;
  // For devices with orientation we make the current view center
  if (display.poseSensor_) {
    display.poseSensor_.resetPose();
  }
  this.camera.parent.rotation.y = (Math.PI / 2.0) + angleRad - theta;
};

/**
 * Do the initial camera tween to rotate the camera, giving an indication that
 * there is live content there (on desktop only).
 */
WorldRenderer.prototype.autopan = function(duration) {
  var targetY = this.camera.parent.rotation.y - AUTOPAN_ANGLE;
  var tween = new TWEEN.Tween(this.camera.parent.rotation)
      .to({y: targetY}, AUTOPAN_DURATION)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
};

WorldRenderer.prototype.init_ = function(hideFullscreenButton) {
  var container = document.querySelector('body');
  var aspect = window.innerWidth / window.innerHeight;
  var camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
  camera.layers.enable(1);

  var cameraDummy = new THREE.Object3D();
  cameraDummy.add(camera);

  // Antialiasing disabled to improve performance.
  var renderer = new THREE.WebGLRenderer({antialias: false});
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  container.appendChild(renderer.domElement);

  var controls = new THREE.VRControls(camera);
  var effect = new THREE.VREffect(renderer);

  // Disable eye separation.
  effect.scale = 0;
  effect.setSize(window.innerWidth, window.innerHeight);

  // Present submission of frames automatically. This is done manually in
  // submitFrame().
  effect.autoSubmitFrame = false;

  this.camera = camera;
  this.renderer = renderer;
  this.effect = effect;
  this.controls = controls;
  this.manager = new WebVRManager(renderer, effect, {predistorted: false, hideButton: hideFullscreenButton});

  this.scene = this.createScene_();
  this.scene.add(this.camera.parent);


  // Watch the resize event.
  window.addEventListener('resize', this.onResize_.bind(this));

  // Prevent context menu.
  window.addEventListener('contextmenu', this.onContextMenu_.bind(this));

  window.addEventListener('vrdisplaypresentchange',
                          this.onVRDisplayPresentChange_.bind(this));
};

WorldRenderer.prototype.onResize_ = function() {
  this.effect.setSize(window.innerWidth, window.innerHeight);
  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();
};

WorldRenderer.prototype.onVRDisplayPresentChange_ = function(e) {
  if (Util.isDebug()) {
    console.log('onVRDisplayPresentChange_');
  }
  var isVR = this.isVRMode();

  // If the mode changed to VR and there is at least one hotspot, show reticle.
  var isReticleVisible = isVR && this.hotspotRenderer.getCount() > 0;
  this.reticleRenderer.setVisibility(isReticleVisible);

  // Resize the renderer for good measure.
  this.onResize_();

  // Analytics.
  if (window.analytics) {
    analytics.logModeChanged(isVR);
  }

  // When exiting VR mode from iOS, make sure we emit back an exit-fullscreen event.
  if (!isVR && Util.isIOS()) {
    Util.sendParentMessage({type: 'exit-fullscreen'});
  }

  // Emit a mode change event back to any listeners.
  this.emit('modechange', isVR);
};

WorldRenderer.prototype.createScene_ = function(opt_params) {
  var scene = new THREE.Scene();

  // Add a group for the photosphere.
  var photoGroup = new THREE.Object3D();
  photoGroup.name = 'photo';
  scene.add(photoGroup);

  return scene;
};

WorldRenderer.prototype.onHotspotFocus_ = function(id) {
  // Set the default cursor to be a pointer.
  this.setCursor_('pointer');
};

WorldRenderer.prototype.onHotspotBlur_ = function(id) {
  // Reset the default cursor to be the default one.
  this.setCursor_('');
};

WorldRenderer.prototype.setCursor_ = function(cursor) {
  this.renderer.domElement.style.cursor = cursor;
};

WorldRenderer.prototype.onContextMenu_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

module.exports = WorldRenderer;

},{"../util":45,"./adaptive-player":33,"./eyes":34,"./hotspot-renderer":35,"./reticle-renderer":39,"./sphere-renderer":41,"./video-proxy":42,"@tweenjs/tween.js":1,"eventemitter3":3,"webvr-boilerplate":7}],44:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Messages from the API to the embed.
 */
var Message = {
  PLAY: 'play',
  PAUSE: 'pause',
  TIMEUPDATE: 'timeupdate',
  ADD_HOTSPOT: 'addhotspot',
  SET_CONTENT: 'setimage',
  SET_VOLUME: 'setvolume',
  MUTED: 'muted',
  SET_CURRENT_TIME: 'setcurrenttime',
  DEVICE_MOTION: 'devicemotion',
  GET_POSITION: 'getposition',
  SET_FULLSCREEN: 'setfullscreen',
};

module.exports = Message;

},{}],45:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = window.Util || {};

Util.isDataURI = function(src) {
  return src && src.indexOf('data:') == 0;
};

Util.generateUUID = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.isIOS = function() {
  return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
};

Util.isSafari = function() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

Util.cloneObject = function(obj) {
  var out = {};
  for (key in obj) {
    out[key] = obj[key];
  }
  return out;
};

Util.hashCode = function(s) {
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
};

Util.loadTrackSrc = function(context, src, callback, opt_progressCallback) {
  var request = new XMLHttpRequest();
  request.open('GET', src, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously.
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      callback(buffer);
    }, function(e) {
      console.error(e);
    });
  };
  if (opt_progressCallback) {
    request.onprogress = function(e) {
      var percent = e.loaded / e.total;
      opt_progressCallback(percent);
    };
  }
  request.send();
};

Util.isPow2 = function(n) {
  return (n & (n - 1)) == 0;
};

Util.capitalize = function(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

Util.isIFrame = function() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// From http://goo.gl/4WX3tg
Util.getQueryParameter = function(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};


// From http://stackoverflow.com/questions/11871077/proper-way-to-detect-webgl-support.
Util.isWebGLEnabled = function() {
  var canvas = document.createElement('canvas');
  try { gl = canvas.getContext("webgl"); }
  catch (x) { gl = null; }

  if (gl == null) {
    try { gl = canvas.getContext("experimental-webgl"); experimental = true; }
    catch (x) { gl = null; }
  }
  return !!gl;
};

Util.clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

// From http://stackoverflow.com/questions/10140604/fastest-hypotenuse-in-javascript
Util.hypot = Math.hypot || function(x, y) {
  return Math.sqrt(x*x + y*y);
};

// From http://stackoverflow.com/a/17447718/693934
Util.isIE11 = function() {
  return navigator.userAgent.match(/Trident/);
};

Util.getRectCenter = function(rect) {
  return new THREE.Vector2(rect.x + rect.width/2, rect.y + rect.height/2);
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.isIOS9OrLess = function() {
  if (!Util.isIOS()) {
    return false;
  }
  var re = /(iPhone|iPad|iPod) OS ([\d_]+)/;
  var iOSVersion = navigator.userAgent.match(re);
  if (!iOSVersion) {
    return false;
  }
  // Get the last group.
  var versionString = iOSVersion[iOSVersion.length - 1];
  var majorVersion = parseFloat(versionString);
  return majorVersion <= 9;
};

Util.getExtension = function(url) {
  return url.split('.').pop().split('?')[0];
};

Util.createGetParams = function(params) {
  var out = '?';
  for (var k in params) {
    var paramString = k + '=' + params[k] + '&';
    out += paramString;
  }
  // Remove the trailing ampersand.
  out.substring(0, params.length - 2);
  return out;
};

Util.sendParentMessage = function(message) {
  if (window.parent) {
    parent.postMessage(message, '*');
  }
};

Util.parseBoolean = function(value) {
  if (value == 'false' || value == 0) {
    return false;
  } else if (value == 'true' || value == 1) {
    return true;
  } else {
    return !!value;
  }
};

/**
 * @param base {String} An absolute directory root.
 * @param relative {String} A relative path.
 *
 * @returns {String} An absolute path corresponding to the rootPath.
 *
 * From http://stackoverflow.com/a/14780463/693934.
 */
Util.relativeToAbsolutePath = function(base, relative) {
  var stack = base.split('/');
  var parts = relative.split('/');
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] == '.') {
      continue;
    }
    if (parts[i] == '..') {
      stack.pop();
    } else {
      stack.push(parts[i]);
    }
  }
  return stack.join('/');
};

/**
 * @return {Boolean} True iff the specified path is an absolute path.
 */
Util.isPathAbsolute = function(path) {
  return ! /^(?:\/|[a-z]+:\/\/)/.test(path);
}

Util.isEmptyObject = function(obj) {
  return Object.getOwnPropertyNames(obj).length == 0;
};

Util.isDebug = function() {
  return Util.parseBoolean(Util.getQueryParameter('debug'));
};

Util.getCurrentScript = function() {
  // Note: in IE11, document.currentScript doesn't work, so we fall back to this
  // hack, taken from https://goo.gl/TpExuH.
  if (!document.currentScript) {
    console.warn('This browser does not support document.currentScript. Trying fallback.');
  }
  return document.currentScript || document.scripts[document.scripts.length - 1];
}


module.exports = Util;

},{}],46:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Video Types
 */
var VideoTypes = {
  HLS: 1,
  DASH: 2,
  VIDEO: 3
};

module.exports = VideoTypes;
},{}]},{},[38]);
