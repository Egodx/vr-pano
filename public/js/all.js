var convertedImage, sourceImage;

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';
/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
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
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
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
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

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

},{}],2:[function(require,module,exports){
(function (Buffer){
var jsfx;
(function (jsfx) {
    var Filter = (function () {
        function Filter(vertexSource, fragmentSource) {
            if (vertexSource === void 0) { vertexSource = null; }
            if (fragmentSource === void 0) { fragmentSource = null; }
            this.vertexSource = vertexSource;
            this.fragmentSource = fragmentSource;
            this.properties = {};
        }
        /**
         * Returns all the properties of the shader. Useful for drawWebGl when are are just passing along data
         * to the shader.
         *
         * @returns {{}|*}
         */
        Filter.prototype.getProperties = function () {
            return this.properties;
        };
        /**
         * The javascript implementation of the filter
         *
         * @param imageData
         */
        Filter.prototype.drawCanvas = function (imageData) {
            throw new Error("Must be implemented");
        };
        /**
         * The WebGL implementation of the filter
         *
         * @param renderer
         */
        Filter.prototype.drawWebGL = function (renderer) {
            var shader = renderer.getShader(this);
            var properties = this.getProperties();
            renderer.getTexture().use();
            renderer.getNextTexture().drawTo(function () {
                shader.uniforms(properties).drawRect();
            });
        };
        Filter.prototype.getVertexSource = function () {
            return this.vertexSource;
        };
        Filter.prototype.getFragmentSource = function () {
            return this.fragmentSource;
        };
        Filter.clamp = function (low, value, high) {
            return Math.max(low, Math.min(value, high));
        };
        return Filter;
    })();
    jsfx.Filter = Filter;
})(jsfx || (jsfx = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var jsfx;
(function (jsfx) {
    var IterableFilter = (function (_super) {
        __extends(IterableFilter, _super);
        function IterableFilter() {
            _super.apply(this, arguments);
        }
        IterableFilter.prototype.drawCanvas = function (imageData) {
            return IterableFilter.drawCanvas([this], imageData);
        };
        IterableFilter.prototype.iterateCanvas = function (imageData) {
            throw new Error("Must be implemented");
        };
        IterableFilter.drawCanvas = function (filters, imageData) {
            var helper;
            for (var i = 0; i < imageData.data.length; i += 4) {
                helper = new jsfx.util.ImageDataHelper(imageData, i);
                for (var j = 0; j < filters.length; j++) {
                    filters[j].iterateCanvas(helper);
                }
                helper.save();
            }
            return imageData;
        };
        return IterableFilter;
    })(jsfx.Filter);
    jsfx.IterableFilter = IterableFilter;
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var hasWebGL = (function () {
        try {
            var canvas = document.createElement("canvas");
            return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
        }
        catch (e) {
            return false;
        }
    })();
    function Renderer(type) {
        if (!type) {
            type = hasWebGL ? "webgl" : "canvas";
        }
        if (type === "webgl") {
            return new jsfx.webgl.Renderer();
        }
        return new jsfx.canvas.Renderer();
    }
    jsfx.Renderer = Renderer;
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var Source = (function () {
        function Source(element) {
            this.element = element;
        }
        Object.defineProperty(Source.prototype, "width", {
            get: function () {
                return this.element.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "height", {
            get: function () {
                return this.element.height;
            },
            enumerable: true,
            configurable: true
        });
        return Source;
    })();
    jsfx.Source = Source;
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var canvas;
    (function (canvas) {
        var Renderer = (function () {
            function Renderer() {
                this.canvas = jsfx.canvas.Renderer.createCanvas();
                this.ctx = this.canvas.getContext("2d");
                this.source = null;
                this.imageData = null;
            }
            Renderer.prototype.setSource = function (source) {
                // first, clean up
                if (this.source) {
                    this.cleanUp();
                }
                // re-set data and start rendering
                this.source = source;
                this.canvas.width = source.width;
                this.canvas.height = source.height;
                // draw the image on to a canvas we can manipulate
                this.ctx.drawImage(source.element, 0, 0, source.width, source.height);
                // store the pixels
                this.imageData = this.ctx.getImageData(0, 0, source.width, source.height);
                return this;
            };
            Renderer.prototype.getSource = function () {
                return this.source;
            };
            Renderer.prototype.applyFilter = function (filter) {
                this.imageData = filter.drawCanvas(this.imageData);
                return this;
            };
            Renderer.prototype.applyFilters = function (filters) {
                var stack = [];
                var filter;
                for (var i = 0; i < filters.length; i++) {
                    filter = filters[i];
                    if (filter instanceof jsfx.IterableFilter) {
                        stack.push(filter);
                    }
                    else {
                        // if there if something in the stack, apply that first
                        if (stack.length > 0) {
                            this.applyFilterStack(stack);
                            stack = [];
                        }
                        // apply current filter
                        this.applyFilter(filter);
                    }
                }
                // if there is still a stack left, apply it
                if (stack.length > 0) {
                    this.applyFilterStack(stack);
                }
                return this;
            };
            Renderer.prototype.applyFilterStack = function (stack) {
                this.imageData = jsfx.IterableFilter.drawCanvas(stack, this.imageData);
                return this;
            };
            Renderer.prototype.render = function () {
                this.ctx.putImageData(this.imageData, 0, 0);
            };
            Renderer.prototype.getCanvas = function () {
                return this.canvas;
            };
            Renderer.prototype.cleanUp = function () {
                this.imageData = null;
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            };
            Renderer.createCanvas = function () {
                return typeof Buffer !== "undefined" && typeof window === "undefined" ?
                    // Commented out, since it was causing require failures.
                    // new (require("canvas"))(100, 100) :
                    null :
                    document.createElement("canvas");
            };
            return Renderer;
        })();
        canvas.Renderer = Renderer;
    })(canvas = jsfx.canvas || (jsfx.canvas = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter         Blur
         * @description    This is the TriangleBlur from glfx, but for the canvas implementation, we are cheating by
         *                 using StackBlur. The implementations are obviously very different, but the results are very close.
         * @param radius   The radius of the pyramid convolved with the image.
         */
        var Blur = (function (_super) {
            __extends(Blur, _super);
            function Blur(radius) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform vec2 delta;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = vec4(0.0);\n                float total = 0.0;\n\n                /* randomize the lookup values to hide the fixed number of samples */\n                //float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n\n                vec3 scale = vec3(12.9898, 78.233, 151.7182);\n                float offset = fract(sin(dot(gl_FragCoord.xyz + 0.0, scale)) * 43758.5453 + 0.0);\n\n                for (float t = -30.0; t <= 30.0; t++) {\n                    float percent = (t + offset - 0.5) / 30.0;\n                    float weight = 1.0 - abs(percent);\n                    vec4 sample = texture2D(texture, texCoord + delta * percent);\n\n                    /* switch to pre-multiplied alpha to correctly blur transparent images */\n                    sample.rgb *= sample.a;\n\n                    color += sample * weight;\n                    total += weight;\n                }\n\n                gl_FragColor = color / total;\n\n                /* switch back from pre-multiplied alpha */\n                gl_FragColor.rgb /= gl_FragColor.a + 0.00001;\n            }\n        ");
                // set properties
                this.properties.radius = radius;
            }
            Blur.prototype.drawWebGL = function (renderer) {
                var shader = renderer.getShader(this);
                var firstPass = { delta: [this.properties.radius / renderer.getSource().width, 0] };
                var secondPass = { delta: [0, this.properties.radius / renderer.getSource().height] };
                renderer.getTexture().use();
                renderer.getNextTexture().drawTo(function () {
                    shader.uniforms(firstPass).drawRect();
                });
                renderer.getTexture().use();
                renderer.getNextTexture().drawTo(function () {
                    shader.uniforms(secondPass).drawRect();
                });
            };
            Blur.prototype.drawCanvas = function (imageData) {
                var pixels = imageData.data;
                var radius = this.properties.radius;
                var width = imageData.width;
                var height = imageData.height;
                var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, r_out_sum, g_out_sum, b_out_sum, a_out_sum, r_in_sum, g_in_sum, b_in_sum, a_in_sum, pr, pg, pb, pa, rbs;
                var div = radius + radius + 1;
                var widthMinus1 = width - 1;
                var heightMinus1 = height - 1;
                var radiusPlus1 = radius + 1;
                var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
                var stackStart = new BlurStack();
                var stack = stackStart;
                for (i = 1; i < div; i++) {
                    stack = stack.next = new BlurStack();
                    if (i == radiusPlus1)
                        var stackEnd = stack;
                }
                stack.next = stackStart;
                var stackIn = null;
                var stackOut = null;
                yw = yi = 0;
                var mul_sum = mul_table[radius];
                var shg_sum = shg_table[radius];
                for (y = 0; y < height; y++) {
                    r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;
                    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
                    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
                    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
                    a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
                    r_sum += sumFactor * pr;
                    g_sum += sumFactor * pg;
                    b_sum += sumFactor * pb;
                    a_sum += sumFactor * pa;
                    stack = stackStart;
                    for (i = 0; i < radiusPlus1; i++) {
                        stack.r = pr;
                        stack.g = pg;
                        stack.b = pb;
                        stack.a = pa;
                        stack = stack.next;
                    }
                    for (i = 1; i < radiusPlus1; i++) {
                        p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
                        r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
                        g_sum += (stack.g = (pg = pixels[p + 1])) * rbs;
                        b_sum += (stack.b = (pb = pixels[p + 2])) * rbs;
                        a_sum += (stack.a = (pa = pixels[p + 3])) * rbs;
                        r_in_sum += pr;
                        g_in_sum += pg;
                        b_in_sum += pb;
                        a_in_sum += pa;
                        stack = stack.next;
                    }
                    stackIn = stackStart;
                    stackOut = stackEnd;
                    for (x = 0; x < width; x++) {
                        pixels[yi + 3] = pa = (a_sum * mul_sum) >> shg_sum;
                        if (pa != 0) {
                            pa = 255 / pa;
                            pixels[yi] = ((r_sum * mul_sum) >> shg_sum) * pa;
                            pixels[yi + 1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                            pixels[yi + 2] = ((b_sum * mul_sum) >> shg_sum) * pa;
                        }
                        else {
                            pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
                        }
                        r_sum -= r_out_sum;
                        g_sum -= g_out_sum;
                        b_sum -= b_out_sum;
                        a_sum -= a_out_sum;
                        r_out_sum -= stackIn.r;
                        g_out_sum -= stackIn.g;
                        b_out_sum -= stackIn.b;
                        a_out_sum -= stackIn.a;
                        p = (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;
                        r_in_sum += (stackIn.r = pixels[p]);
                        g_in_sum += (stackIn.g = pixels[p + 1]);
                        b_in_sum += (stackIn.b = pixels[p + 2]);
                        a_in_sum += (stackIn.a = pixels[p + 3]);
                        r_sum += r_in_sum;
                        g_sum += g_in_sum;
                        b_sum += b_in_sum;
                        a_sum += a_in_sum;
                        stackIn = stackIn.next;
                        r_out_sum += (pr = stackOut.r);
                        g_out_sum += (pg = stackOut.g);
                        b_out_sum += (pb = stackOut.b);
                        a_out_sum += (pa = stackOut.a);
                        r_in_sum -= pr;
                        g_in_sum -= pg;
                        b_in_sum -= pb;
                        a_in_sum -= pa;
                        stackOut = stackOut.next;
                        yi += 4;
                    }
                    yw += width;
                }
                for (x = 0; x < width; x++) {
                    g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;
                    yi = x << 2;
                    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
                    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
                    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
                    a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
                    r_sum += sumFactor * pr;
                    g_sum += sumFactor * pg;
                    b_sum += sumFactor * pb;
                    a_sum += sumFactor * pa;
                    stack = stackStart;
                    for (i = 0; i < radiusPlus1; i++) {
                        stack.r = pr;
                        stack.g = pg;
                        stack.b = pb;
                        stack.a = pa;
                        stack = stack.next;
                    }
                    yp = width;
                    for (i = 1; i <= radius; i++) {
                        yi = (yp + x) << 2;
                        r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
                        g_sum += (stack.g = (pg = pixels[yi + 1])) * rbs;
                        b_sum += (stack.b = (pb = pixels[yi + 2])) * rbs;
                        a_sum += (stack.a = (pa = pixels[yi + 3])) * rbs;
                        r_in_sum += pr;
                        g_in_sum += pg;
                        b_in_sum += pb;
                        a_in_sum += pa;
                        stack = stack.next;
                        if (i < heightMinus1) {
                            yp += width;
                        }
                    }
                    yi = x;
                    stackIn = stackStart;
                    stackOut = stackEnd;
                    for (y = 0; y < height; y++) {
                        p = yi << 2;
                        pixels[p + 3] = pa = (a_sum * mul_sum) >> shg_sum;
                        if (pa > 0) {
                            pa = 255 / pa;
                            pixels[p] = ((r_sum * mul_sum) >> shg_sum) * pa;
                            pixels[p + 1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                            pixels[p + 2] = ((b_sum * mul_sum) >> shg_sum) * pa;
                        }
                        else {
                            pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
                        }
                        r_sum -= r_out_sum;
                        g_sum -= g_out_sum;
                        b_sum -= b_out_sum;
                        a_sum -= a_out_sum;
                        r_out_sum -= stackIn.r;
                        g_out_sum -= stackIn.g;
                        b_out_sum -= stackIn.b;
                        a_out_sum -= stackIn.a;
                        p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;
                        r_sum += (r_in_sum += (stackIn.r = pixels[p]));
                        g_sum += (g_in_sum += (stackIn.g = pixels[p + 1]));
                        b_sum += (b_in_sum += (stackIn.b = pixels[p + 2]));
                        a_sum += (a_in_sum += (stackIn.a = pixels[p + 3]));
                        stackIn = stackIn.next;
                        r_out_sum += (pr = stackOut.r);
                        g_out_sum += (pg = stackOut.g);
                        b_out_sum += (pb = stackOut.b);
                        a_out_sum += (pa = stackOut.a);
                        r_in_sum -= pr;
                        g_in_sum -= pg;
                        b_in_sum -= pb;
                        a_in_sum -= pa;
                        stackOut = stackOut.next;
                        yi += width;
                    }
                }
                return imageData;
            };
            return Blur;
        })(jsfx.Filter);
        filter.Blur = Blur;
        var mul_table = [
            512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
            454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512,
            482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456,
            437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512,
            497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328,
            320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456,
            446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335,
            329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512,
            505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
            399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328,
            324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271,
            268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456,
            451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388,
            385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335,
            332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
            289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];
        var shg_table = [
            9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
            17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
            19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
            20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
            21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
            21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
            22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
            22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
            23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
            23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
            23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
            23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
            24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
            24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
            24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
            24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];
        var BlurStack = (function () {
            function BlurStack() {
                this.r = 0;
                this.g = 0;
                this.b = 0;
                this.a = 0;
                this.next = null;
            }
            return BlurStack;
        })();
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter           Brightness
         * @description      Provides additive brightness control.
         * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
         */
        var Brightness = (function (_super) {
            __extends(Brightness, _super);
            function Brightness(brightness) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float brightness;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n                color.rgb += brightness;\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.brightness = jsfx.Filter.clamp(-1, brightness, 1) || 0;
            }
            Brightness.prototype.iterateCanvas = function (helper) {
                var brightness = this.properties.brightness;
                helper.r += brightness;
                helper.g += brightness;
                helper.b += brightness;
            };
            return Brightness;
        })(jsfx.IterableFilter);
        filter.Brightness = Brightness;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter           Contrast
         * @description      Provides multiplicative contrast control.
         * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
         */
        var Contrast = (function (_super) {
            __extends(Contrast, _super);
            function Contrast(contrast) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float contrast;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n\n                if (contrast > 0.0) {\n                    color.rgb = (color.rgb - 0.5) / (1.0 - contrast) + 0.5;\n                } else {\n                    color.rgb = (color.rgb - 0.5) * (1.0 + contrast) + 0.5;\n                }\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.contrast = jsfx.Filter.clamp(-1, contrast, 1) || 0;
            }
            Contrast.prototype.iterateCanvas = function (helper) {
                var contrast = this.properties.contrast;
                if (contrast > 0) {
                    helper.r = (helper.r - 0.5) / (1 - contrast) + 0.5;
                    helper.g = (helper.g - 0.5) / (1 - contrast) + 0.5;
                    helper.b = (helper.b - 0.5) / (1 - contrast) + 0.5;
                }
                else {
                    helper.r = (helper.r - 0.5) * (1 + contrast) + 0.5;
                    helper.g = (helper.g - 0.5) * (1 + contrast) + 0.5;
                    helper.b = (helper.b - 0.5) * (1 + contrast) + 0.5;
                }
            };
            return Contrast;
        })(jsfx.IterableFilter);
        filter.Contrast = Contrast;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter      Curves
         * @description A powerful mapping tool that transforms the colors in the image
         *              by an arbitrary function. The function is interpolated between
         *              a set of 2D points using splines. The curves filter can take
         *              either one or three arguments which will apply the mapping to
         *              either luminance or RGB values, respectively.
         * @param red   A list of points that define the function for the red channel.
         *              Each point is a list of two values: the value before the mapping
         *              and the value after the mapping, both in the range 0 to 1. For
         *              example, [[0,1], [1,0]] would invert the red channel while
         *              [[0,0], [1,1]] would leave the red channel unchanged. If green
         *              and blue are omitted then this argument also applies to the
         *              green and blue channels.
         * @param green (optional) A list of points that define the function for the green
         *              channel (just like for red).
         * @param blue  (optional) A list of points that define the function for the blue
         *              channel (just like for red).
         */
        var Curves = (function (_super) {
            __extends(Curves, _super);
            function Curves(red, green, blue) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform sampler2D map;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n                color.r = texture2D(map, vec2(color.r)).r;\n                color.g = texture2D(map, vec2(color.g)).g;\n                color.b = texture2D(map, vec2(color.b)).b;\n                gl_FragColor = color;\n            }\n        ");
                this.red = red;
                this.green = green;
                this.blue = blue;
                // interpolate
                red = Curves.splineInterpolate(red);
                if (arguments.length == 1) {
                    green = blue = red;
                }
                else {
                    green = Curves.splineInterpolate(green);
                    blue = Curves.splineInterpolate(blue);
                }
                this.red = red;
                this.green = green;
                this.blue = blue;
            }
            Curves.prototype.drawCanvas = function (imageData) {
                var pixels = imageData.data;
                var amount = this.properties.amount;
                var r, g, b;
                for (var i = 0; i < pixels.length; i += 4) {
                    // get color values
                    r = pixels[i] / 255;
                    g = pixels[i + 1] / 255;
                    b = pixels[i + 2] / 255;
                    r = Math.min(1.0, (r * (1 - (0.607 * amount))) + (g * (0.769 * amount)) + (b * (0.189 * amount)));
                    g = Math.min(1.0, (r * 0.349 * amount) + (g * (1 - (0.314 * amount))) + (b * 0.168 * amount));
                    b = Math.min(1.0, (r * 0.272 * amount) + (g * 0.534 * amount) + (b * (1 - (0.869 * amount))));
                    // set values
                    pixels[i] = r * 255;
                    pixels[i + 1] = g * 255;
                    pixels[i + 2] = b * 255;
                }
                return imageData;
            };
            Curves.splineInterpolate = function (points) {
                var interpolator = new jsfx.util.SplineInterpolator(points);
                var array = [];
                for (var i = 0; i < 256; i++) {
                    array.push(jsfx.Filter.clamp(0, Math.floor(interpolator.interpolate(i / 255) * 256), 255));
                }
                return array;
            };
            return Curves;
        })(jsfx.Filter);
        filter.Curves = Curves;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter           Hue / Saturation
         * @description      Provides rotational hue control. RGB color space
         *                   can be imagined as a cube where the axes are the red, green, and blue color
         *                   values. Hue changing works by rotating the color vector around the grayscale
         *                   line, which is the straight line from black (0, 0, 0) to white (1, 1, 1).
         * @param hue        -1 to 1 (-1 is 180 degree rotation in the negative direction, 0 is no change,
         *                   and 1 is 180 degree rotation in the positive direction)
         */
        var Hue = (function (_super) {
            __extends(Hue, _super);
            function Hue(hue) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float hue;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n\n                /* hue adjustment, wolfram alpha: RotationTransform[angle, {1, 1, 1}][{x, y, z}] */\n                float angle = hue * 3.14159265;\n                float s = sin(angle), c = cos(angle);\n                vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;\n                color.rgb = vec3(\n                    dot(color.rgb, weights.xyz),\n                    dot(color.rgb, weights.zxy),\n                    dot(color.rgb, weights.yzx)\n                );\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.hue = jsfx.Filter.clamp(-1, hue, 1) || 0;
                // pre-calculate data for canvas iteration
                var angle = hue * 3.14159265;
                var sin = Math.sin(angle);
                var cos = Math.cos(angle);
                this.weights = new jsfx.util.Vector3(2 * cos, -Math.sqrt(3.0) * sin - cos, Math.sqrt(3.0) * sin - cos)
                    .addScalar(1.0)
                    .divideScalar(3.0);
            }
            Hue.prototype.iterateCanvas = function (helper) {
                var rgb = helper.toVector3();
                helper.r = rgb.dot(this.weights);
                helper.g = rgb.dotScalars(this.weights.z, this.weights.x, this.weights.y);
                helper.b = rgb.dotScalars(this.weights.y, this.weights.z, this.weights.x);
            };
            return Hue;
        })(jsfx.IterableFilter);
        filter.Hue = Hue;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter           Hue / Saturation
         * @description      Provides multiplicative saturation control. RGB color space
         *                   can be imagined as a cube where the axes are the red, green, and blue color
         *                   values.
         *                   Saturation is implemented by scaling all color channel values either toward
         *                   or away from the average color channel value.
         * @param saturation -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
         */
        var Saturation = (function (_super) {
            __extends(Saturation, _super);
            function Saturation(saturation) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float saturation;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n\n                float average = (color.r + color.g + color.b) / 3.0;\n                if (saturation > 0.0) {\n                    color.rgb += (average - color.rgb) * (1.0 - 1.0 / (1.001 - saturation));\n                } else {\n                    color.rgb += (average - color.rgb) * (-saturation);\n                }\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.saturation = jsfx.Filter.clamp(-1, saturation, 1) || 0;
            }
            Saturation.prototype.iterateCanvas = function (helper) {
                var saturation = this.properties.saturation;
                var average = (helper.r + helper.g + helper.b) / 3;
                if (saturation > 0) {
                    helper.r += (average - helper.r) * (1 - 1 / (1.001 - saturation));
                    helper.g += (average - helper.g) * (1 - 1 / (1.001 - saturation));
                    helper.b += (average - helper.b) * (1 - 1 / (1.001 - saturation));
                }
                else {
                    helper.r += (average - helper.r) * (-saturation);
                    helper.g += (average - helper.g) * (-saturation);
                    helper.b += (average - helper.b) * (-saturation);
                }
            };
            return Saturation;
        })(jsfx.IterableFilter);
        filter.Saturation = Saturation;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter         Sepia
         * @description    Gives the image a reddish-brown monochrome tint that imitates an old photograph.
         * @param amount   0 to 1 (0 for no effect, 1 for full sepia coloring)
         */
        var Sepia = (function (_super) {
            __extends(Sepia, _super);
            function Sepia(amount) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float amount;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n                float r = color.r;\n                float g = color.g;\n                float b = color.b;\n\n                color.r = min(1.0, (r * (1.0 - (0.607 * amount))) + (g * (0.769 * amount)) + (b * (0.189 * amount)));\n                color.g = min(1.0, (r * 0.349 * amount) + (g * (1.0 - (0.314 * amount))) + (b * 0.168 * amount));\n                color.b = min(1.0, (r * 0.272 * amount) + (g * 0.534 * amount) + (b * (1.0 - (0.869 * amount))));\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.amount = jsfx.Filter.clamp(-1, amount, 1) || 0;
            }
            Sepia.prototype.iterateCanvas = function (helper) {
                var r = helper.r;
                var g = helper.g;
                var b = helper.b;
                var amount = this.properties.amount;
                helper.r = Math.min(1.0, (r * (1.0 - (0.607 * amount))) + (g * (0.769 * amount)) + (b * (0.189 * amount)));
                helper.g = Math.min(1.0, (r * 0.349 * amount) + (g * (1.0 - (0.314 * amount))) + (b * 0.168 * amount));
                helper.b = Math.min(1.0, (r * 0.272 * amount) + (g * 0.534 * amount) + (b * (1.0 - (0.869 * amount))));
            };
            return Sepia;
        })(jsfx.IterableFilter);
        filter.Sepia = Sepia;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter         Unsharp Mask
         * @description    A form of image sharpening that amplifies high-frequencies in the image. It
         *                 is implemented by scaling pixels away from the average of their neighbors.
         * @param radius   0 to 180 - The blur radius that calculates the average of the neighboring pixels.
         * @param strength A scale factor where 0 is no effect and higher values cause a stronger effect.
         * @note           Could potentially be converted to an IterableFilter, but we somehow need the original ImageData
         */
        var UnsharpMask = (function (_super) {
            __extends(UnsharpMask, _super);
            function UnsharpMask(radius, strength) {
                _super.call(this, null, "\n            uniform sampler2D blurredTexture;\n            uniform sampler2D originalTexture;\n            uniform float strength;\n            uniform float threshold;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 blurred = texture2D(blurredTexture, texCoord);\n                vec4 original = texture2D(originalTexture, texCoord);\n                gl_FragColor = mix(blurred, original, 1.0 + strength);\n            }\n        ");
                // set properties
                this.properties.radius = radius;
                this.properties.strength = strength;
            }
            UnsharpMask.prototype.drawWebGL = function (renderer) {
                var shader = renderer.getShader(this);
                var radius = this.properties.radius;
                var strength = this.properties.strength;
                // create a new texture
                var extraTexture = renderer.createTexture();
                // use a texture and draw to it
                renderer.getTexture().use();
                extraTexture.drawTo(renderer.getDefaultShader().drawRect.bind(renderer.getDefaultShader()));
                // blur current texture
                extraTexture.use(1);
                // draw the blur
                var blur = new filter.Blur(radius);
                blur.drawWebGL(renderer);
                // use the stored texture to detect edges
                shader.textures({
                    originalTexture: 1
                });
                renderer.getTexture().use();
                renderer.getNextTexture().drawTo(function () {
                    shader.uniforms({ strength: strength }).drawRect();
                });
                extraTexture.unuse(1);
            };
            UnsharpMask.prototype.drawCanvas = function (imageData) {
                var pixels = imageData.data;
                // props
                var radius = this.properties.radius;
                var strength = this.properties.strength + 1;
                // clone of data
                // @todo: declared my own Uint8ClampedArray above since I am having issues with TypeScript.
                // additionally, my previous called imageData.data.set(original) (which I also can't here because of TS mapping)
                var original = new Uint8ClampedArray(imageData.data);
                imageData.data = original;
                // blur image
                var blur = new filter.Blur(radius);
                blur.drawCanvas(imageData);
                // trying to replicate mix() from webgl, which is basically x * (1 -a)
                for (var i = 0; i < pixels.length; i += 4) {
                    pixels[i] = pixels[i] * (1 - strength) + original[i] * strength;
                    pixels[i + 1] = pixels[i + 1] * (1 - strength) + original[i + 1] * strength;
                    pixels[i + 2] = pixels[i + 2] * (1 - strength) + original[i + 2] * strength;
                }
                return imageData;
            };
            return UnsharpMask;
        })(jsfx.Filter);
        filter.UnsharpMask = UnsharpMask;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var util;
    (function (util) {
        var ImageDataHelper = (function () {
            function ImageDataHelper(imageData, index) {
                this.imageData = imageData;
                this.index = index;
                this.r = this.imageData.data[index] / 255;
                this.g = this.imageData.data[index + 1] / 255;
                this.b = this.imageData.data[index + 2] / 255;
                this.a = this.imageData.data[index + 3] / 255;
            }
            ImageDataHelper.prototype.getImageData = function () {
                return this.imageData;
            };
            ImageDataHelper.prototype.save = function () {
                this.imageData.data[this.index] = this.r * 255;
                this.imageData.data[this.index + 1] = this.g * 255;
                this.imageData.data[this.index + 2] = this.b * 255;
                this.imageData.data[this.index + 3] = this.a * 255;
            };
            ImageDataHelper.prototype.toVector3 = function () {
                return new jsfx.util.Vector3(this.r, this.g, this.b);
            };
            ImageDataHelper.prototype.fromVector3 = function (v) {
                this.r = v.x;
                this.g = v.y;
                this.b = v.z;
            };
            return ImageDataHelper;
        })();
        util.ImageDataHelper = ImageDataHelper;
    })(util = jsfx.util || (jsfx.util = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var util;
    (function (util) {
        /**
         * From SplineInterpolator.cs in the Paint.NET source code
         */
        var SplineInterpolator = (function () {
            function SplineInterpolator(points) {
                this.points = points;
                var n = points.length;
                var i;
                this.xa = [];
                this.ya = [];
                this.u = [];
                this.y2 = [];
                points.sort(function (a, b) {
                    return a[0] - b[0];
                });
                for (i = 0; i < n; i++) {
                    this.xa.push(points[i][0]);
                    this.ya.push(points[i][1]);
                }
                this.u[0] = 0;
                this.y2[0] = 0;
                for (i = 1; i < n - 1; ++i) {
                    // This is the decomposition loop of the tri-diagonal algorithm.
                    // y2 and u are used for temporary storage of the decomposed factors.
                    var wx = this.xa[i + 1] - this.xa[i - 1];
                    var sig = (this.xa[i] - this.xa[i - 1]) / wx;
                    var p = sig * this.y2[i - 1] + 2.0;
                    this.y2[i] = (sig - 1.0) / p;
                    var ddydx = (this.ya[i + 1] - this.ya[i]) / (this.xa[i + 1] - this.xa[i]) -
                        (this.ya[i] - this.ya[i - 1]) / (this.xa[i] - this.xa[i - 1]);
                    this.u[i] = (6.0 * ddydx / wx - sig * this.u[i - 1]) / p;
                }
                this.y2[n - 1] = 0;
                // This is the back-substitution loop of the tri-diagonal algorithm
                for (i = n - 2; i >= 0; --i) {
                    this.y2[i] = this.y2[i] * this.y2[i + 1] + this.u[i];
                }
            }
            SplineInterpolator.prototype.interpolate = function (x) {
                var n = this.ya.length;
                var klo = 0;
                var khi = n - 1;
                // We will find the right place in the table by means of
                // bisection. This is optimal if sequential calls to this
                // routine are at random values of x. If sequential calls
                // are in order, and closely spaced, one would do better
                // to store previous values of klo and khi.
                while (khi - klo > 1) {
                    var k = (khi + klo) >> 1;
                    if (this.xa[k] > x) {
                        khi = k;
                    }
                    else {
                        klo = k;
                    }
                }
                var h = this.xa[khi] - this.xa[klo];
                var a = (this.xa[khi] - x) / h;
                var b = (x - this.xa[klo]) / h;
                // Cubic spline polynomial is now evaluated.
                return a * this.ya[klo] + b * this.ya[khi] +
                    ((a * a * a - a) * this.y2[klo] + (b * b * b - b) * this.y2[khi]) * (h * h) / 6.0;
            };
            return SplineInterpolator;
        })();
        util.SplineInterpolator = SplineInterpolator;
    })(util = jsfx.util || (jsfx.util = {}));
})(jsfx || (jsfx = {}));
/**
 * Vector3 Utility Class
 *  -> Taken from https://github.com/mrdoob/three.js/blob/master/src/math/Vector3.js with only the functions we need.
 */
var jsfx;
(function (jsfx) {
    var util;
    (function (util) {
        var Vector3 = (function () {
            function Vector3(x, y, z) {
                this.x = x;
                this.y = y;
                this.z = z;
            }
            Vector3.prototype.addScalar = function (s) {
                this.x += s;
                this.y += s;
                this.z += s;
                return this;
            };
            Vector3.prototype.multiplyScalar = function (s) {
                this.x *= s;
                this.y *= s;
                this.z *= s;
                return this;
            };
            Vector3.prototype.divideScalar = function (s) {
                if (s !== 0) {
                    var invScalar = 1 / s;
                    this.x *= invScalar;
                    this.y *= invScalar;
                    this.z *= invScalar;
                }
                else {
                    this.x = 0;
                    this.y = 0;
                    this.z = 0;
                }
                return this;
            };
            Vector3.prototype.length = function () {
                return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
            };
            Vector3.prototype.dot = function (v) {
                return this.x * v.x + this.y * v.y + this.z * v.z;
            };
            Vector3.prototype.dotScalars = function (x, y, z) {
                return this.x * x + this.y * y + this.z * z;
            };
            return Vector3;
        })();
        util.Vector3 = Vector3;
    })(util = jsfx.util || (jsfx.util = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var webgl;
    (function (webgl) {
        var Renderer = (function () {
            function Renderer() {
                this.canvas = document.createElement("canvas");
                this.gl = this.canvas.getContext("experimental-webgl", { premultipliedAlpha: false });
                this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
                // variables to store the source
                this.source = null;
                this.sourceTexture = null;
                // store the textures and buffers
                this.textures = null;
                this.currentTexture = 0;
                // initialize a shader cache
                this.gl.shaderCache = {};
                this.maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);

            }
            Renderer.prototype.setSource = function (source) {
                // first, clean up
                if (this.source) {
                    this.cleanUp();
                }
                // re-initialize renderer for rendering with new source
                this.source = source;
                this.sourceTexture = jsfx.webgl.Texture.fromElement(this.gl, source.element);
                // initialize the renderer textures
                this.initialize();
                // draw the source texture onto the first texture
                this.sourceTexture.use();
                this.getTexture().drawTo(this.getDefaultShader().drawRect.bind(this.getDefaultShader()));
                return this;
            };
            Renderer.prototype.getSource = function () {
                return this.source;
            };
            Renderer.prototype.applyFilter = function (filter) {
                filter.drawWebGL(this);
                return this;
            };
            Renderer.prototype.applyFilters = function (filters) {
                var _this = this;
                filters.forEach(function (filter) {
                    filter.drawWebGL(_this);
                });
                return this;
            };
            Renderer.prototype.render = function () {
                this.getTexture().use();
                this.getFlippedShader().drawRect();
            };
            Renderer.prototype.getCanvas = function () {
                return this.canvas;
            };
            Renderer.prototype.getTexture = function () {
                return this.textures[this.currentTexture % 2];
            };
            Renderer.prototype.getNextTexture = function () {
                return this.textures[++this.currentTexture % 2];
            };
            Renderer.prototype.createTexture = function () {
                return new jsfx.webgl.Texture(this.gl, this.source.width, this.source.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE);
            };
            Renderer.prototype.getShader = function (filter) {
                var cacheKey = filter.getVertexSource() + filter.getFragmentSource();
                return this.gl.shaderCache.hasOwnProperty(cacheKey) ?
                    this.gl.shaderCache[cacheKey] :
                    new jsfx.webgl.Shader(this.gl, filter.getVertexSource(), filter.getFragmentSource());
            };
            Renderer.prototype.getDefaultShader = function () {
                if (!this.gl.shaderCache.def) {
                    this.gl.shaderCache.def = new jsfx.webgl.Shader(this.gl);
                }
                return this.gl.shaderCache.def;
            };
            Renderer.prototype.getFlippedShader = function () {
                if (!this.gl.shaderCache.flipped) {
                    this.gl.shaderCache.flipped = new jsfx.webgl.Shader(this.gl, null, "\n                uniform sampler2D texture;\n                varying vec2 texCoord;\n\n                void main() {\n                    gl_FragColor = texture2D(texture, vec2(texCoord.x, 1.0 - texCoord.y));\n                }\n            ");
                }
                return this.gl.shaderCache.flipped;
            };
            Renderer.prototype.initialize = function () {
                this.canvas.width = this.source.width;
                this.canvas.height = this.source.height;
                // initialize the textures
                var textures = [];
                for (var i = 0; i < 2; i++) {
                    textures.push(this.createTexture());
                }
                this.textures = textures;
            };
            Renderer.prototype.cleanUp = function () {
                // destroy source texture
                this.sourceTexture.destroy();
                // destroy textures used for filters
                for (var i = 0; i < 2; i++) {
                    this.textures[i].destroy();
                }
                // re-set textures
                this.textures = null;
            };
            Renderer.prototype.getMaxTextureSize = function () {
                return this.maxTextureSize;
            };
            return Renderer;
        })();
        webgl.Renderer = Renderer;
    })(webgl = jsfx.webgl || (jsfx.webgl = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var webgl;
    (function (webgl) {
        var Shader = (function () {
            function Shader(gl, vertexSource, fragmentSource) {
                this.gl = gl;
                // get the shader source
                this.vertexSource = vertexSource || Shader.defaultVertexSource;
                this.fragmentSource = fragmentSource || Shader.defaultFragmentSource;
                // set precision
                this.fragmentSource = "precision highp float;" + this.fragmentSource;
                // init vars
                this.vertexAttribute = null;
                this.texCoordAttribute = null;
                // create the program
                this.program = gl.createProgram();
                // attach the shaders
                gl.attachShader(this.program, compileSource(gl, gl.VERTEX_SHADER, this.vertexSource));
                gl.attachShader(this.program, compileSource(gl, gl.FRAGMENT_SHADER, this.fragmentSource));
                // link the program and ensure it worked
                gl.linkProgram(this.program);
                if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                    throw "link error: " + gl.getProgramInfoLog(this.program);
                }
            }
            /**
             * textures are uniforms too but for some reason can't be specified by this.gl.uniform1f,
             * even though floating point numbers represent the integers 0 through 7 exactly
             *
             * @param textures
             * @returns {Shader}
             */
            Shader.prototype.textures = function (textures) {
                this.gl.useProgram(this.program);
                for (var name in textures) {
                    if (!textures.hasOwnProperty(name)) {
                        continue;
                    }
                    this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), textures[name]);
                }
                return this;
            };
            Shader.prototype.uniforms = function (uniforms) {
                this.gl.useProgram(this.program);
                for (var name in uniforms) {
                    if (!uniforms.hasOwnProperty(name)) {
                        continue;
                    }
                    var location = this.gl.getUniformLocation(this.program, name);
                    if (location === null) {
                        // will be null if the uniform isn't used in the shader
                        continue;
                    }
                    var value = uniforms[name];
                    if (isArray(value)) {
                        switch (value.length) {
                            case 1:
                                this.gl.uniform1fv(location, new Float32Array(value));
                                break;
                            case 2:
                                this.gl.uniform2fv(location, new Float32Array(value));
                                break;
                            case 3:
                                this.gl.uniform3fv(location, new Float32Array(value));
                                break;
                            case 4:
                                this.gl.uniform4fv(location, new Float32Array(value));
                                break;
                            case 9:
                                this.gl.uniformMatrix3fv(location, false, new Float32Array(value));
                                break;
                            case 16:
                                this.gl.uniformMatrix4fv(location, false, new Float32Array(value));
                                break;
                            default:
                                throw "dont't know how to load uniform \"" + name + "\" of length " + value.length;
                        }
                    }
                    else if (isNumber(value)) {
                        this.gl.uniform1f(location, value);
                    }
                    else {
                        throw "attempted to set uniform \"" + name + "\" to invalid value " + (value || "undefined").toString();
                    }
                }
                return this;
            };
            Shader.prototype.drawRect = function (left, top, right, bottom) {
                var undefined;
                var viewport = this.gl.getParameter(this.gl.VIEWPORT);
                top = top !== undefined ? (top - viewport[1]) / viewport[3] : 0;
                left = left !== undefined ? (left - viewport[0]) / viewport[2] : 0;
                right = right !== undefined ? (right - viewport[0]) / viewport[2] : 1;
                bottom = bottom !== undefined ? (bottom - viewport[1]) / viewport[3] : 1;
                if (!this.gl.vertexBuffer) {
                    this.gl.vertexBuffer = this.gl.createBuffer();
                }
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.vertexBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([left, top, left, bottom, right, top, right, bottom]), this.gl.STATIC_DRAW);
                if (!this.gl.texCoordBuffer) {
                    this.gl.texCoordBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.texCoordBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]), this.gl.STATIC_DRAW);
                }
                if (this.vertexAttribute == null) {
                    this.vertexAttribute = this.gl.getAttribLocation(this.program, "vertex");
                    this.gl.enableVertexAttribArray(this.vertexAttribute);
                }
                if (this.texCoordAttribute == null) {
                    this.texCoordAttribute = this.gl.getAttribLocation(this.program, "_texCoord");
                    this.gl.enableVertexAttribArray(this.texCoordAttribute);
                }
                this.gl.useProgram(this.program);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.vertexBuffer);
                this.gl.vertexAttribPointer(this.vertexAttribute, 2, this.gl.FLOAT, false, 0, 0);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.texCoordBuffer);
                this.gl.vertexAttribPointer(this.texCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            };
            Shader.prototype.destroy = function () {
                this.gl.deleteProgram(this.program);
                this.program = null;
            };
            Shader.defaultVertexSource = "\nattribute vec2 vertex;\nattribute vec2 _texCoord;\nvarying vec2 texCoord;\n\nvoid main() {\n    texCoord = _texCoord;\n    gl_Position = vec4(vertex * 2.0 - 1.0, 0.0, 1.0);\n}";
            Shader.defaultFragmentSource = "\nuniform sampler2D texture;\nvarying vec2 texCoord;\n\nvoid main() {\n    gl_FragColor = texture2D(texture, texCoord);\n}";
            return Shader;
        })();
        webgl.Shader = Shader;
        function compileSource(gl, type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw "compile error: " + gl.getShaderInfoLog(shader);
            }
            return shader;
        }
        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }
        function isNumber(obj) {
            return Object.prototype.toString.call(obj) === "[object Number]";
        }
    })(webgl = jsfx.webgl || (jsfx.webgl = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var webgl;
    (function (webgl) {
        var Texture = (function () {
            function Texture(gl, width, height, format, type) {
                if (format === void 0) { format = gl.RGBA; }
                if (type === void 0) { type = gl.UNSIGNED_BYTE; }
                this.gl = gl;
                this.width = width;
                this.height = height;
                this.format = format;
                this.type = type;
                this.id = gl.createTexture();
                this.element = null;
                gl.bindTexture(gl.TEXTURE_2D, this.id);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                if (width && height) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);
                }
            }
            Texture.prototype.loadContentsOf = function (element) {
                this.element = element;
                this.width = element.width;
                this.height = element.height;
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.format, this.format, this.type, element);
            };
            Texture.prototype.initFromBytes = function (width, height, data) {
                this.width = width;
                this.height = height;
                this.format = this.gl.RGBA;
                this.type = this.gl.UNSIGNED_BYTE;
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.type, new Uint8Array(data));
            };
            Texture.prototype.use = function (unit) {
                this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
            };
            Texture.prototype.unuse = function (unit) {
                this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
                this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            };
            Texture.prototype.drawTo = function (callback) {
                // create and bind frame buffer
                this.gl.frameBuffer = this.gl.frameBuffer || this.gl.createFramebuffer();
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gl.frameBuffer);
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.id, 0);
                // ensure there was no error
                if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
                    throw new Error("incomplete framebuffer");
                }
                // set the viewport
                this.gl.viewport(0, 0, this.width, this.height);
                // do the drawing
                callback();
                // stop rendering to this texture
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            };
            Texture.prototype.destroy = function () {
                this.gl.deleteTexture(this.id);
                this.id = null;
            };
            Texture.fromElement = function (gl, element) {
                var texture = new Texture(gl, 0, 0);
                texture.loadContentsOf(element);
                return texture;
            };
            return Texture;
        })();
        webgl.Texture = Texture;
    })(webgl = jsfx.webgl || (jsfx.webgl = {}));
})(jsfx || (jsfx = {}));

module.exports = jsfx;

}).call(this,require("buffer").Buffer)

},{"buffer":8}],3:[function(require,module,exports){
var Emitter = require('./emitter');

function Dropzone(el) {
  var self = this;
  var input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('multiple', true);
  input.style.display = 'none';
  input.addEventListener('change', function(e) {
    self.onFile_(e);
  });
  el.appendChild(input);

  el.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    el.classList.add('dragover');
  });

  el.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('dragover');
  });

  el.addEventListener('drop', function(e) {
    file = self.getFile_(e);
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('dragover');
    if (file) {
      self.onFile_(e);
    }
  });

  el.addEventListener('click', function() {
    // TODO: Figure out about re-enabling click to upload.
    //input.value = null;
    //input.click();
  });
}

Dropzone.prototype = new Emitter();

Dropzone.prototype.getFile_ = function(e) {
  var files;
  if (e.dataTransfer) {
    files = e.dataTransfer.files;
  } else if(e.target) {
    files = e.target.files;
  }

  if (files.length > 1) {
    this.emit('error', 'Multiple files dropped. Please convert one at a time.');
    return null;
  } else {
    // Just take the first file.
    return files[0];
  }
};

Dropzone.prototype.onFile_ = function(e) {
  var file = this.getFile_(e);
  if (!file.name.endsWith('jpg')) {
    this.emit('error', 'Dropped file must have the .jpg extension');
  } else {
    this.emit('file', file);
  }
};

module.exports = Dropzone;

},{"./emitter":4}],4:[function(require,module,exports){
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
  this.initEmitter();
}

Emitter.prototype.initEmitter = function() {
  this.callbacks = {};
};

Emitter.prototype.emit = function(eventName) {
  var callbacks = this.callbacks[eventName];
  if (!callbacks) {
    console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments)
  // Eliminate the first param (the callback).
  args.shift();
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(this, args);
  }
};

Emitter.prototype.on = function(eventName, callback) {
  if (eventName in this.callbacks) {
    var cbs = this.callbacks[eventName]
    if (cbs.indexOf(callback) == -1) {
      cbs.push(callback);
    }
  } else {
    this.callbacks[eventName] = [callback];
  }
};

Emitter.prototype.removeListener = function(eventName, callback) {
  if (!(eventName in this.callbacks)) {
    return;
  }
  var cbs = this.callbacks[eventName];
  var ind = cbs.indexOf(callback);
  if (ind == -1) {
    console.warn('No matching callback found');
    return;
  }
  cbs.splice(ind, 1);
};

module.exports = Emitter;

},{}],5:[function(require,module,exports){
var OdsConverter = require('./ods-converter');
var Dropzone = require('./dropzone');

var TARGET_SIZE = 4096;

var dz = document.querySelector('#dropzone');

var dropzone = new Dropzone(dz);
dropzone.on('file', onFileDropped);
dropzone.on('error', onDropError);

converter = new OdsConverter();
converter.on('convert', onOdsConverted);
converter.on('error', onOdsConversionError);


// Hook up the open file link.
document.querySelector('#openfile').addEventListener('click', onOpenClicked);

var filename;

function onFileDropped(file) {
  // Show a new dialog.
  showDialog('progress');

  console.log('onFileDropped', file.name);
  filename = file.name;

  var reader = new FileReader();

  reader.onload = function(e) {
    var arrayBuffer = reader.result;
    var img = new Image();
    img.onload = function() {
        // Kick off the conversion process.
        if (img.width != img.height) converter.convert(arrayBuffer);
        //if dimensions are equal consider equirectangular stereo panorama. No conversion needed
        else  {
            document.getElementById('send').addEventListener('click',uploadPanorama);
            closeActiveDialog();
        }
        showDropzoneMessage('<img src="'+img.src+'">');

    }
    img.src = URL.createObjectURL(file);

  }
  sourceImage = file;
  reader.readAsArrayBuffer(file);
}



function onOdsConverted(canvas, audio) {
  console.log('onOdsConverted, %s x %s', canvas.width, canvas.height);

  canvas.toBlob(function(blob) {
    convertedImage = blob;
    document.getElementById('send').addEventListener('click',uploadPanorama);

      closeActiveDialog();
  }, 'image/jpeg');

}

function uploadPanorama() {
    var fd = new FormData();

    var isPublic = document.getElementById('public').checked ? 1 : 0;

    if (convertedImage) {
        fd.append('type', 'cardboard');
        fd.append('image', convertedImage);
    }
    else  fd.append('type', 'equirectangular');
    fd.append('title', document.getElementById('panorama-title').value);
    fd.append('_token', document.querySelector('meta[name="csrf-token"]').content);
    fd.append('public', isPublic);
    fd.append('source', sourceImage);

    buttonProgress();

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);
    xhr.setRequestHeader('accept', 'application/json')
    xhr.onload = function() {
        var parsed_response = JSON.parse(this.responseText);

        if (xhr.status >= 400){
            showUploadErrors(parsed_response.errors);
        }
        else if(xhr.status === 200){
            window.location.href = '/edit?key='+parsed_response.manage_key;
        }
    };

    xhr.send(fd);
}

function showUploadErrors(errors) {
    var message ='';
    for (const field in errors)
    {
        for (var i=0;i<errors[field].length;i++) message += '<p>'+errors[field][i]+'</p>';
    }
    buttonReset();
    setErrorMessage(message);
    showDialog('fail');
}
function showDropzoneMessage(message){
    var dropzone = document.getElementById('dropzone');
    dropzone.innerHTML = message;

}
function buttonProgress() {
    var send_button = document.getElementById('send');
    send_button.classList.remove('btn-primary');
    send_button.className += ' btn-warning';
    send_button.setAttribute('disabled','disabled');
    send_button.innerHTML ='<i class="fas fa-fw fa-spinner fa-pulse"></i> Uploading...';
}
function buttonReset() {
    var send_button = document.getElementById('send');
    send_button.classList.remove('btn-warning');
    send_button.removeAttribute('disabled');
    send_button.className += ' btn-primary';
    send_button.innerHTML ='<i class="fas fa-fw fa-upload"></i> Upload';
}
function closeActiveDialog() {
    $('.modal').modal('hide');
}
function createLink(url, filename) {
  var link = document.createElement('a');
  link.download = filename;
  link.href = url;
  return link;
}

function onOdsConversionError(error) {
  console.log('onOdsConversionError', error);
  showDialog('fail')
  setErrorMessage('Conversion error: '+error);
}

function onDropError(error) {
  console.log('onDropError', error);
  showDialog('fail')
  setErrorMessage('Drop error: ' + error);
}

function getConvertedFilename(filename, opt_ext) {
  var extIndex = filename.lastIndexOf('.');
  var basename = filename.substring(0, extIndex);
  var ext = opt_ext || filename.substring(extIndex);
  return basename + '.converted' + ext;
}

function showDialog(id) {
    closeActiveDialog()
    $('#'+id).modal();


}

function setErrorMessage(errorMessage) {
  var error = document.querySelector('#error-message');
  error.innerHTML = errorMessage;
}

function onOpenClicked(e) {
  var input = document.createElement('input');
  input.type = 'file';
  input.click();
  input.addEventListener('change', onFilePicked);
}

function onFilePicked(e) {
  // TODO: Validation.
  var file = e.path[0].files[0];
  onFileDropped(file);
};

},{"./dropzone":3,"./ods-converter":6}],6:[function(require,module,exports){
var EventEmitter3 = require('eventemitter3');
var jsfx = require('jsfx');


var startParsing;

var width = 640;

var M_SOI = 0xd8;
var M_APP1 = 0xe1;
var M_SOS = 0xda;

var XMP_SIGNATURE = 'http://ns.adobe.com/xap/1.0/';
var EXTENSTION_SIGNATURE = 'http://ns.adobe.com/xmp/extension/';
var EXT_PREFIX_LENGTH = 71;


var TARGET_SIZE = 4096;

function OdsConverter() {
  this.lastWidth = null;
}

OdsConverter.prototype = new EventEmitter3();

OdsConverter.prototype.convert = function(arrayBuffer) {
  this.decode_(arrayBuffer);
};

/**
 * Given the last converted Cardboard Camera image, this method returns the
 * best pow-of-two width for the image.
 */
OdsConverter.prototype.getOptimalWidth = function() {
  if (!this.lastWidth) {
    return -1;
  }
  return Math.ceil(Math.log(this.lastWidth)/Math.log(2))
};

OdsConverter.prototype.decode_ = function(arrayBuffer) {
  var scope = this;

  if (!arrayBuffer) {
    return;
  }
  startParsing = Date.now();
  console.log('Started parsing');
  var bytes = new Uint8Array(arrayBuffer);
  var doc = extractXMP(bytes, function(e) {
    scope.emit('error', e);
  });
  if (!doc) {
    // No valid doc, so we quit.
    return;
  }
  var gPano = getObjectMeta(doc, 'GPano');
  var gImage = getObjectMeta(doc, 'GImage');
  var gAudio = getObjectMeta(doc, 'GAudio');
  var image = makeImageFromBinary('image/jpeg', bytes);
  var audio = makeAudio(gAudio.Mime, gAudio.Data);

  image.onload = function () {
    this.setupScene_(gPano, gImage, image, audio);
  }.bind(this);

}

OdsConverter.prototype.setupScene_ = function(gPano, gImage, leftImage, audio) {
  // Ensure the right image is valid.
  if (!gImage.Mime || !gImage.Data) {
    this.emit('error', 'No valid right eye image found in the XMP metadata. This might not be a valid Cardboard Camera image.');
    return;
  }

  var rightImage = makeImage(gImage.Mime, gImage.Data);
  rightImage.onload = function () {
    console.log('Parsing took ' + (Date.now() - startParsing) + ' ms');
    this.buildImage_(leftImage, rightImage, gPano, audio);
  }.bind(this);
}

OdsConverter.prototype.buildImage_ = function(leftImage, rightImage, gPano, audio) {
  var fullWidth = parseInt(gPano['FullPanoWidthPixels']);
  var cropLeft = parseInt(gPano['CroppedAreaLeftPixels']);
  var cropTop = parseInt(gPano['CroppedAreaTopPixels']);
  var cropWidth = parseInt(gPano['CroppedAreaImageWidthPixels']);
  var initialHeadingDeg = parseInt(gPano['InitialViewHeadingDegrees']);

  var ratio = TARGET_SIZE / fullWidth;

  // Handle partial panos.
  var scaleWidth = 1;
  if (cropWidth != fullWidth) {
    scaleWidth = cropWidth / fullWidth;
  }

  // A canvas for the over-under rendering.
  var canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;

  // Scaled dimensions for left and right eye images.
  var imageWidth = TARGET_SIZE * scaleWidth;
  var imageHeight = leftImage.height * ratio;

  // Save the original size of the most recently converted image.
  this.lastWidth = canvas.width;

  // Offsets for where to render each image. For partial panos (ie. imageWidth <
  // TARGET_SIZE), render the image centered.
  var offsetX = (TARGET_SIZE - imageWidth) / 2;
  var x = Math.floor(cropLeft * ratio) + offsetX;
  var y = Math.floor(cropTop * ratio);
  var ctx = canvas.getContext('2d');

  // Clear the canvas.
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the left and right images onto the canvas.
  ctx.drawImage(leftImage, x, y, imageWidth, imageHeight);
  ctx.drawImage(rightImage, x, y + canvas.height/2, imageWidth, imageHeight);

  var halfHeight = Math.floor(canvas.height / 2);
  // Offsets are the offsets for each eye.
  var offsets = [0, halfHeight];

  // Calculate how much to blur the image.
  var blurRadius = imageHeight / 2;

  for (var i = 0; i < offsets.length; i++) {
    var offset = offsets[i];

    // Calculate the dimensions of the actual image.
    var top = offset + y;
    var bottom = offset + y + imageHeight - 1;

    // Repeat the top part.
    repeatImage(canvas, top, offset);

    // Repeat the bottom part.
    repeatImage(canvas, bottom, offset + halfHeight);
  }
  var blurCanvas = blurImage(canvas, blurRadius);

  // Copy the blurred canvas onto the regular one.
  ctx.drawImage(blurCanvas, 0, 0);

  // Re-render the images themselves.
  ctx.drawImage(leftImage, x, y, imageWidth, imageHeight);
  ctx.drawImage(rightImage, x, y + canvas.height/2, imageWidth, imageHeight);

  this.emit('convert', canvas, audio);
}

function repeatImage(canvas, startY, endY) {
  var ctx = canvas.getContext('2d');

  var y = Math.min(startY, endY);
  var height = Math.abs(startY - endY);

  // Repeat the start line through the whole range.
  ctx.drawImage(canvas, 0, startY, canvas.width, 1,
                        0, y, canvas.width, height);

}

function blurImage(canvas, radius) {
  var source = new jsfx.Source(canvas);

  //var blurFilter = new jsfx.filter.Brightness(0.5);
  var blurFilter = new jsfx.filter.Blur(radius);

  var renderer = new jsfx.Renderer();
    console.log(renderer.getMaxTextureSize(),source.width);
  renderer.setSource(source)
      .applyFilters([blurFilter])
      .render();

  return renderer.getCanvas();
}

function makeImage(mime, data) {
  var img = new Image();
  img.src = 'data:' + mime + ';base64,' + data;
  return img;
}

function makeImageFromBinary(mime, bytes) {
  var blob = new Blob([bytes], {type: mime});
  var url = URL.createObjectURL(blob);
  var img = new Image();
  img.src = url;
  return img;
}

function makeAudio(mime, data) {
  return 'data:' + mime + ';base64,' + data;
}

function byteToString(bytes, start, end) {
  var s = '';
  start = start || 0;
  end = end || bytes.length;
  for (var i = start; i < end; i++) {
    if (bytes[i]) {
      var c = String.fromCharCode(bytes[i]);
      s += c;
    }
  }
  return s;
}

function getObjectMeta (doc, tag) {
  var meta = {};
  var descriptions = doc.querySelectorAll('Description');
  for (var i = 0; i < descriptions.length; i++) {
    var node = descriptions[i];
    for (var j in node.attributes) {
      var attr = node.attributes[j];
      if (attr.prefix == tag) {
        meta[attr.localName] = attr.value;
      }
    }
  }
  return meta;
}

function extractXMP(bytes, errorCallback) {
  var sections = parseJpeg(bytes, true);
  if (sections === null) {
    errorCallback('No XMP metadata found in specified image file. This might not be a valid Cardboard Camera image.');
    return;
  }
  var xml = '';
  var visitedExtended = false;
  for (var i = 0; i < sections.length; i++) {
    var isXmp = true;
    var isExt = true;
    var section = sections[i];
    for (var j = 0; j < section.data.length; j++) {
      var a = String.fromCharCode(section.data[j]);
      if (isXmp && a != XMP_SIGNATURE[j]) {
        isXmp = false;
      }
      if (isExt && a != EXTENSTION_SIGNATURE[j]) {
        isExt = false;
      }
      if (!isExt || !isXmp) {
        break;
      }
    }

    if (isXmp) {
      var str = byteToString(section.data);
      var re = new RegExp('<x:xmpmeta([\\s\\S]*)</x:xmpmeta>');
      xml = str.match(re)[0];
    }
    else if (isExt) {
      var len = EXT_PREFIX_LENGTH;
      if (visitedExtended) {
        len +=4;
      }
      visitedExtended = true;
      xml += byteToString(section.data, len);
    }
  }
  var parser = new DOMParser();
  var doc = parser.parseFromString('<xml>' + xml + '</xml>', 'text/xml');
  return doc;
}

function binaryToBase64 (bytes) {
  var b64 = [];
  var pageSize = 100000;
  for (var i = 0; i < bytes.length; i += pageSize) {
    b64.push(btoa(String.fromCharCode.apply(null,
                                            bytes.subarray(i, i + pageSize))));
  }
  return b64.join('');
}

function parseJpeg (bytes, readMetaOnly) {
  var c;
  var i = 0;
  var read = function() {
    return i < bytes.length ? bytes[i++] : -1;
  };

  if (read() != 0xff || read() != M_SOI) {
    return null;
  }
  var sections = [];
  while((c = read()) != -1) {
    if (c != 0xff) {
      return null;
    }
    while((c = read()) == 0xff) {
    }

    if (c == -1) {
      return null
    }
    var marker = c;
    if (marker == M_SOS) {
      // M_SOS indicates that image data will follow and no metadata after
      // that so read all data at one time.
      if (!readMetaOnly) {
        var section = {
          marker: marker,
          length: -1,
          data: bytes.subarray(i)
        };
        sections.push(section);
      }
      return sections;
    }
    var lh = read();
    var ll = read();
    if (lh == -1 || ll == -1) {
      return null;
    }
    var length = lh << 8 | ll;
    if (!readMetaOnly || c == M_APP1) {
      var section = {
        marker: marker,
        length: length,
        data: bytes.subarray(i, i + length - 2)
      };
      sections.push(section);
    }
    // Move i to end of section.
    i += length - 2;
  }
  return sections;
}

module.exports = OdsConverter;

},{"eventemitter3":1,"jsfx":2}],7:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],8:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":7,"ieee754":9,"isarray":10}],9:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],10:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}]},{},[5])
