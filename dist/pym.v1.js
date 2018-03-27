/*! pym.js - v1.3.3 - 2018-03-27 */
/*
* Pym.js is library that resizes an iframe based on the width of the parent and the resulting height of the child.
* Check out the docs at http://blog.apps.npr.org/pym.js/ or the readme at README.md for usage.
*/

/** @module pym */
(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory();
	} else {
		window.pym = factory.call(this);
	}
})(function() {
	var MESSAGE_DELIMITER = 'xPYMx';

	var lib = {};

	/**
	 * Create and dispatch a custom pym event
	 *
	 * @method _raiseCustomEvent
	 * @inner
	 *
	 * @param {String} eventName
	 */
	var _raiseCustomEvent = function(eventName) {
		console.log('pym:_raiseCustomEvent:args', { eventName: eventName });

		var event = document.createEvent('Event');
		event.initEvent('pym:' + eventName, true, true);
		console.log('pym:_raiseCustomEvent:event', event);
		document.dispatchEvent(event);
	};

	/**
	 * Generic function for parsing URL params.
	 * Via http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	 *
	 * @method _getParameterByName
	 * @inner
	 *
	 * @param {String} name The name of the paramter to get from the URL.
	 */
	var _getParameterByName = function(name) {
		console.log('pym:_getParameterByName:args', { name: name });

		var regex = new RegExp(
			'[\\?&]' +
				name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]') +
				'=([^&#]*)'
		);
		console.log('pym:_getParameterByName:regex', regex);

		var results = regex.exec(location.search);
		console.log('pym:_getParameterByName:location_search', location.search);

		console.log('pym:_getParameterByName:results', results);

		if (results === null) {
			return '';
		}

		console.log(
			'pym:_getParameterByName:decodeURIComponent',
			decodeURIComponent(results[1].replace(/\+/g, ' '))
		);

		return decodeURIComponent(results[1].replace(/\+/g, ' '));
	};

	/**
	 * Check the message to make sure it comes from an acceptable xdomain.
	 * Defaults to '*' but can be overriden in config.
	 *
	 * @method _isSafeMessage
	 * @inner
	 *
	 * @param {Event} e The message event.
	 * @param {Object} settings Configuration.
	 */
	var _isSafeMessage = function(e, settings) {
		console.log('pym:_isSafeMessage:args', {
			e: e,
			settings: settings
		});

		if (settings.xdomain !== '*') {
			// If origin doesn't match our xdomain, return.
			if (!e.origin.match(new RegExp(settings.xdomain + '$'))) {
				console.log(
					'_isSafeMessage:origin_doesnt_match',
					!e.origin.match(new RegExp(settings.xdomain + '$'))
				);
				return;
			}
		}

		console.log('pym:_isSafeMessage:type_of_data_before_if', typeof e.data);
		// Ignore events that do not carry string data #151
		if (typeof e.data !== 'string') {
			console.log('pym:_isSafeMessage:type_of_data_after_if', typeof e.data);
			return;
		}

		return true;
	};

	var _isSafeUrl = function(url) {
		console.log('pym:_isSafeUrl:args', { url: url });
		// Adapted from angular 2 url sanitizer
		var SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp):|[^&:/?#]*(?:[/?#]|$))/gi;
		if (!url.match(SAFE_URL_PATTERN)) {
			console.log('pym:_isSafeUrl:not_safe_url', !url.match(SAFE_URL_PATTERN));

			return;
		}
		console.log('pym:_isSafeUrl:safe_url', url);

		return true;
	};

	/**
	 * Construct a message to send between frames.
	 *
	 * NB: We use string-building here because JSON message passing is
	 * not supported in all browsers.
	 *
	 * @method _makeMessage
	 * @inner
	 *
	 * @param {String} id The unique id of the message recipient.
	 * @param {String} messageType The type of message to send.
	 * @param {String} message The message to send.
	 */
	var _makeMessage = function(id, messageType, message) {
		console.log('pym:_makeMessage:args', {
			id: id,
			messageType: messageType,
			message: message
		});

		var bits = ['pym', id, messageType, message];

		console.log('pym:_makeMessage:bits', bits);
		console.log('pym:_makeMessage:joined_bits', bits.join(MESSAGE_DELIMITER));
		return bits.join(MESSAGE_DELIMITER);
	};

	/**
	 * Construct a regex to validate and parse messages.
	 *
	 * @method _makeMessageRegex
	 * @inner
	 *
	 * @param {String} id The unique id of the message recipient.
	 */
	var _makeMessageRegex = function(id) {
		console.log('pym:_makeMessageRegex:args', { id: id });

		var bits = ['pym', id, '(\\S+)', '(.*)'];
		console.log('pym:_makeMessageRegex:bits', bits);
		console.log(
			'pym:_makeMessageRegex:regex',
			new RegExp('^' + bits.join(MESSAGE_DELIMITER) + '$')
		);

		return new RegExp('^' + bits.join(MESSAGE_DELIMITER) + '$');
	};

	/**
	 * Underscore implementation of getNow
	 *
	 * @method _getNow
	 * @inner
	 *
	 */
	var _getNow =
		Date.now ||
		function() {
			return new Date().getTime();
		};

	/**
	 * Underscore implementation of throttle
	 *
	 * @method _throttle
	 * @inner
	 *
	 * @param {function} func Throttled function
	 * @param {number} wait Throttle wait time
	 * @param {object} options Throttle settings
	 */

	var _throttle = function(func, wait, options) {
		var context, args, result;
		var timeout = null;
		var previous = 0;
		if (!options) {
			options = {};
		}
		var later = function() {
			previous = options.leading === false ? 0 : _getNow();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) {
				context = args = null;
			}
		};
		return function() {
			var now = _getNow();
			if (!previous && options.leading === false) {
				previous = now;
			}
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0 || remaining > wait) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
				previous = now;
				result = func.apply(context, args);
				if (!timeout) {
					context = args = null;
				}
			} else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	};

	/**
	 * Clean autoInit Instances: those that point to contentless iframes
	 * @method _cleanAutoInitInstances
	 * @inner
	 */
	var _cleanAutoInitInstances = function() {
		var length = lib.autoInitInstances.length;
		console.log(
			'pym:_cleanAutiInitInstances:length',
			lib.autoInitInstances.length
		);

		// Loop backwards to avoid index issues
		for (var idx = length - 1; idx >= 0; idx--) {
			var instance = lib.autoInitInstances[idx];
			console.log('pym:_cleanAutoInitInstances:instance_' + idx, instance);

			// If instance has been removed or is contentless then remove it
			if (
				instance.el.getElementsByTagName('iframe').length &&
				instance.el.getElementsByTagName('iframe')[0].contentWindow
			) {
				console.log('pym:_cleanAutoInitInstances:is_contentless // true');
				continue;
			} else {
				console.log(
					'_cleanAutoInitInstances:is_contentless // false removing instance',
					lib.autoInitInstances.splice(idx, 1)
				);
				// Remove the reference to the removed or orphan instance
				lib.autoInitInstances.splice(idx, 1);
			}
		}
	};

	/**
	 * Store auto initialized Pym instances for further reference
	 * @name module:pym#autoInitInstances
	 * @type Array
	 * @default []
	 */
	lib.autoInitInstances = [];

	/**
	 * Initialize Pym for elements on page that have data-pym attributes.
	 * Expose autoinit in case we need to call it from the outside
	 * @instance
	 * @method autoInit
	 * @param {Boolean} doNotRaiseEvents flag to avoid sending custom events
	 */
	lib.autoInit = function(doNotRaiseEvents) {
		console.log('pym:lib.autoInit:args', {
			doNotRaiseEvents: doNotRaiseEvents
		});

		var elements = document.querySelectorAll(
			'[data-pym-src]:not([data-pym-auto-initialized])'
		);
		console.log(
			'pym:lib.autoInit:elements[data-pym-src]:not([data-pym-auto-initialized]',
			elements
		);

		var length = elements.length;

		// Clean stored instances in case needed
		_cleanAutoInitInstances();
		for (var idx = 0; idx < length; ++idx) {
			var element = elements[idx];
			console.log('pym:lib.autoInit:element_' + idx, element);
			/*
            * Mark automatically-initialized elements so they are not
            * re-initialized if the user includes pym.js more than once in the
            * same document.
            */
			element.setAttribute('data-pym-auto-initialized', '');

			// Ensure elements have an id
			if (element.id === '') {
				element.id =
					'pym-' +
					idx +
					'-' +
					Math.random()
						.toString(36)
						.substr(2, 5);
			}

			var src = element.getAttribute('data-pym-src');

			console.log('pym:lib.autoInit:src', src);

			// List of data attributes to configure the component
			// structure: {'attribute name': 'type'}
			var settings = {
				xdomain: 'string',
				title: 'string',
				name: 'string',
				id: 'string',
				sandbox: 'string',
				allowfullscreen: 'boolean',
				parenturlparam: 'string',
				parenturlvalue: 'string',
				optionalparams: 'boolean',
				trackscroll: 'boolean',
				scrollwait: 'number'
			};

			var config = {};

			for (var attribute in settings) {
				// via https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute#Notes
				if (element.getAttribute('data-pym-' + attribute) !== null) {
					switch (settings[attribute]) {
						case 'boolean':
							config[attribute] = !(element.getAttribute('data-pym-' + attribute) === 'false'); // jshint ignore:line
							console.log(
								'lib.autoInit: boolean config[' + attribute + ']',
								config[attribute]
							);

							break;
						case 'string':
							config[attribute] = element.getAttribute('data-pym-' + attribute);
							console.log(
								'lib.autoInit: string config[' + attribute + ']',
								config[attribute]
							);
							break;
						case 'number':
							var n = Number(element.getAttribute('data-pym-' + attribute));
							console.log('pym:lib.autoInit:n', n);
							if (!isNaN(n)) {
								config[attribute] = n;
							}
							break;
						default:
							console.err('unrecognized attribute type');
					}
				}
			}

			console.log('pym:lib.autoInit:references', {
				id: element.id,
				src: src,
				config: config
			});

			// Store references to autoinitialized pym instances
			var parent = new lib.Parent(element.id, src, config);

			console.log('pym:lib.autoInit:parent', parent);

			lib.autoInitInstances.push(parent);
		}

		// Fire customEvent
		if (!doNotRaiseEvents) {
			_raiseCustomEvent('pym-initialized');
		}
		// Return stored autoinitalized pym instances
		return lib.autoInitInstances;
	};

	/**
	 * The Parent half of a response iframe.
	 *
	 * @memberof module:pym
	 * @class Parent
	 * @param {String} id The id of the div into which the iframe will be rendered. sets {@link module:pym.Parent~id}
	 * @param {String} url The url of the iframe source. sets {@link module:pym.Parent~url}
	 * @param {Object} [config] Configuration for the parent instance. sets {@link module:pym.Parent~settings}
	 * @param {string} [config.xdomain='*'] - xdomain to validate messages received
	 * @param {string} [config.title] - if passed it will be assigned to the iframe title attribute
	 * @param {string} [config.name] - if passed it will be assigned to the iframe name attribute
	 * @param {string} [config.id] - if passed it will be assigned to the iframe id attribute
	 * @param {boolean} [config.allowfullscreen] - if passed and different than false it will be assigned to the iframe allowfullscreen attribute
	 * @param {string} [config.sandbox] - if passed it will be assigned to the iframe sandbox attribute (we do not validate the syntax so be careful!!)
	 * @param {string} [config.parenturlparam] - if passed it will be override the default parentUrl query string parameter name passed to the iframe src
	 * @param {string} [config.parenturlvalue] - if passed it will be override the default parentUrl query string parameter value passed to the iframe src
	 * @param {string} [config.optionalparams] - if passed and different than false it will strip the querystring params parentUrl and parentTitle passed to the iframe src
	 * @param {boolean} [config.trackscroll] - if passed it will activate scroll tracking on the parent
	 * @param {number} [config.scrollwait] - if passed it will set the throttle wait in order to fire scroll messaging. Defaults to 100 ms.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe iFrame}
	 */
	lib.Parent = function(id, url, config) {
		console.log('pym:lib.Parent:args', {
			id: id,
			url: url,
			config: config
		});

		/**
		 * The id of the container element
		 *
		 * @memberof module:pym.Parent
		 * @member {string} id
		 * @inner
		 */
		this.id = id;
		console.log('pym:lib.Parent:id', this.id);
		/**
		 * The url that will be set as the iframe's src
		 *
		 * @memberof module:pym.Parent
		 * @member {String} url
		 * @inner
		 */
		this.url = url;
		console.log('pym:lib.Parent:url', this.url);

		/**
		 * The container DOM object
		 *
		 * @memberof module:pym.Parent
		 * @member {HTMLElement} el
		 * @inner
		 */
		this.el = document.getElementById(id);
		console.log('pym:lib.Parent:el', this.el);
		/**
		 * The contained child iframe
		 *
		 * @memberof module:pym.Parent
		 * @member {HTMLElement} iframe
		 * @inner
		 * @default null
		 */
		this.iframe = null;
		console.log('pym:lib.Parent:iframe', this.iframe);
		/**
		 * The parent instance settings, updated by the values passed in the config object
		 *
		 * @memberof module:pym.Parent
		 * @member {Object} settings
		 * @inner
		 */
		this.settings = {
			xdomain: '*',
			optionalparams: true,
			parenturlparam: 'parentUrl',
			parenturlvalue: window.location.href,
			trackscroll: false,
			scrollwait: 100
		};
		console.log('pym:lib.Parent:settings', this.settings);
		/**
		 * RegularExpression to validate the received messages
		 *
		 * @memberof module:pym.Parent
		 * @member {String} messageRegex
		 * @inner
		 */
		this.messageRegex = _makeMessageRegex(this.id);
		console.log('pym:lib.Parent:messageRegex', this.messageRegex);
		/**
		 * Stores the registered messageHandlers for each messageType
		 *
		 * @memberof module:pym.Parent
		 * @member {Object} messageHandlers
		 * @inner
		 */
		this.messageHandlers = {};
		console.log('pym:lib.Parent:messageHandlers', this.messageHandlers);

		// ensure a config object
		config = config || {};
		console.log('pym:lib.Parent:ensured_config', this.config);

		/**
		 * Construct the iframe.
		 *
		 * @memberof module:pym.Parent
		 * @method _constructIframe
		 * @inner
		 */
		this._constructIframe = function() {
			// Calculate the width of this element.
			var width = this.el.offsetWidth.toString();
			console.log('pym:lib.Parent:_constructIframe:width', width);

			// Create an iframe element attached to the document.
			this.iframe = document.createElement('iframe');
			console.log('pym:lib.Parent:_constructIframe:iframe', this.iframe);

			// Save fragment id
			var hash = '';
			var hashIndex = this.url.indexOf('#');

			if (hashIndex > -1) {
				hash = this.url.substring(hashIndex, this.url.length);
				this.url = this.url.substring(0, hashIndex);
			}

			// If the URL contains querystring bits, use them.
			// Otherwise, just create a set of valid params.
			if (this.url.indexOf('?') < 0) {
				this.url += '?';
			} else {
				this.url += '&';
			}

			console.log('pym:lib.Parent:_constructIframe:hashes_and_url', {
				hash: hash,
				hashIndex: hashIndex,
				url: this.url
			});

			// Append the initial width as a querystring parameter
			// and optional params if configured to do so
			this.iframe.src =
				this.url + 'initialWidth=' + width + '&childId=' + this.id;

			console.log(
				'pym:lib.Parent:_constructIframe:src_generation_pre_optional_params',
				this.iframe.src
			);

			if (this.settings.optionalparams) {
				this.iframe.src += '&parentTitle=' + encodeURIComponent(document.title);
				this.iframe.src +=
					'&' +
					this.settings.parenturlparam +
					'=' +
					encodeURIComponent(this.settings.parenturlvalue);
			}
			this.iframe.src += hash;

			console.log(
				'pym:lib.Parent:_constructIframe:src_generation_after_optional_params',
				this.iframe.src
			);

			// Set some attributes to this proto-iframe.
			this.iframe.setAttribute('width', '100%');
			this.iframe.setAttribute('scrolling', 'no');
			this.iframe.setAttribute('marginheight', '0');
			this.iframe.setAttribute('frameborder', '0');

			if (this.settings.title) {
				this.iframe.setAttribute('title', this.settings.title);
			}

			if (
				this.settings.allowfullscreen !== undefined &&
				this.settings.allowfullscreen !== false
			) {
				this.iframe.setAttribute('allowfullscreen', '');
			}

			if (
				this.settings.sandbox !== undefined &&
				typeof this.settings.sandbox === 'string'
			) {
				this.iframe.setAttribute('sandbox', this.settings.sandbox);
			}

			if (this.settings.id) {
				if (!document.getElementById(this.settings.id)) {
					this.iframe.setAttribute('id', this.settings.id);
				}
			}

			if (this.settings.name) {
				this.iframe.setAttribute('name', this.settings.name);
			}

			console.log(
				'pym:lib.Parent:_constructIframe:updated_settings',
				this.iframe.attributes
			);

			// Replace the child content if needed
			// (some CMSs might strip out empty elements)
			while (this.el.firstChild) {
				this.el.removeChild(this.el.firstChild);
			}
			// Append the iframe to our element.
			this.el.appendChild(this.iframe);

			// Add an event listener that will handle redrawing the child on resize.
			window.addEventListener('resize', this._onResize);

			// Add an event listener that will send the child the viewport.
			if (this.settings.trackscroll) {
				window.addEventListener('scroll', this._throttleOnScroll);
			}
		};

		/**
		 * Send width on resize.
		 *
		 * @memberof module:pym.Parent
		 * @method _onResize
		 * @inner
		 */
		this._onResize = function() {
			this.sendWidth();
			if (this.settings.trackscroll) {
				this.sendViewportAndIFramePosition();
			}
		}.bind(this);

		/**
		 * Send viewport and iframe info on scroll.
		 *
		 * @memberof module:pym.Parent
		 * @method _onScroll
		 * @inner
		 */
		this._onScroll = function() {
			this.sendViewportAndIFramePosition();
		}.bind(this);

		/**
		 * Fire all event handlers for a given message type.
		 *
		 * @memberof module:pym.Parent
		 * @method _fire
		 * @inner
		 *
		 * @param {String} messageType The type of message.
		 * @param {String} message The message data.
		 */
		this._fire = function(messageType, message) {
			console.log('pym:lib.Parent:_fire:args', {
				messageType: messageType,
				message: message,
				messageHandlers: this.messageHandlers
			});

			if (messageType in this.messageHandlers) {
				for (var i = 0; i < this.messageHandlers[messageType].length; i++) {
					this.messageHandlers[messageType][i].call(this, message);
				}
			}
		};

		/**
		 * Remove this parent from the page and unbind it's event handlers.
		 *
		 * @memberof module:pym.Parent
		 * @method remove
		 * @instance
		 */
		this.remove = function() {
			window.removeEventListener('message', this._processMessage);
			console.log('pym:lib.Parent:remove:eventListener:message removed!');

			window.removeEventListener('resize', this._onResize);
			console.log('pym:lib.Parent:remove:eventListener:resize removed!');

			this.el.removeChild(this.iframe);
			console.log('pym:lib.Parent:remove:child', this.iframe);
			// _cleanAutoInitInstances in case this parent was autoInitialized
			console.log('pym:lib.Parent:cleaningAutoInitInstances start');
			_cleanAutoInitInstances();
			console.log('pym:lib.Parent:cleaningAutoInitInstances finish');
		};

		/**
		 * Process a new message from the child.
		 *
		 * @memberof module:pym.Parent
		 * @method _processMessage
		 * @inner
		 *
		 * @param {Event} e A message event.
		 */
		this._processMessage = function(e) {
			console.log('pym:lib.Parent:_processMessage:args', { e: e });

			// First, punt if this isn't from an acceptable xdomain.
			if (!_isSafeMessage(e, this.settings)) {
				console.log(
					'pym:lib.Parent:_processMessage:_isSafeMessage:false:args',
					{
						e: e,
						settings: this.settings
					}
				);

				return;
			}

			// Discard object messages, we only care about strings
			if (typeof e.data !== 'string') {
				console.log(
					'pym:lib.Parent:_processMessage:discard_object_messages',
					e.data
				);

				return;
			}

			// Grab the message from the child and parse it.
			var match = e.data.match(this.messageRegex);
			console.log('pym:lib.Parent:_processMessage:match', match);

			// If there's no match or too many matches in the message, punt.
			if (!match || match.length !== 3) {
				console.log('pym:lib.Parent:match_or_too_many_matches', match);

				return false;
			}

			var messageType = match[1];
			var message = match[2];

			console.log('pym:lib.Parent:process_message_fire:data', {
				messageType: messageType,
				message: message
			});

			this._fire(messageType, message);
		}.bind(this);

		/**
		 * Resize iframe in response to new height message from child.
		 *
		 * @memberof module:pym.Parent
		 * @method _onHeightMessage
		 * @inner
		 *
		 * @param {String} message The new height.
		 */
		this._onHeightMessage = function(message) {
			console.log('pym:lib.Parent:_onHeightMessage:args', { message: message });

			/*
             * Handle parent height message from child.
             */
			var height = parseInt(message);

			console.log('pym:lib.Parent:_onHeightMessage:new_height', height);

			this.iframe.setAttribute('height', height + 'px');
		};

		/**
		 * Navigate parent to a new url.
		 *
		 * @memberof module:pym.Parent
		 * @method _onNavigateToMessage
		 * @inner
		 *
		 * @param {String} message The url to navigate to.
		 */
		this._onNavigateToMessage = function(message) {
			console.log('pym:lib.Parent:_onNavigateToMessage:args', {
				message: message
			});

			/*
             * Handle parent scroll message from child.
             */
			if (!_isSafeUrl(message)) {
				console.log(
					'pym:lib.Parent:_onNavigateToMessage:not_safe_url',
					message
				);

				return;
			}
			console.log(
				'pym:lib.Parent:_onNavigateToMessage:document_location_href',
				message
			);
			document.location.href = message;
		};

		/**
		 * Scroll parent to a given child position.
		 *
		 * @memberof module:pym.Parent
		 * @method _onScrollToChildPosMessage
		 * @inner
		 *
		 * @param {String} message The offset inside the child page.
		 */
		this._onScrollToChildPosMessage = function(message) {
			// Get the child container position using getBoundingClientRect + pageYOffset
			// via https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
			var iframePos =
				document.getElementById(this.id).getBoundingClientRect().top +
				window.pageYOffset;

			var totalOffset = iframePos + parseInt(message);
			window.scrollTo(0, totalOffset);
		};

		/**
		 * Bind a callback to a given messageType from the child.
		 *
		 * Reserved message names are: "height", "scrollTo" and "navigateTo".
		 *
		 * @memberof module:pym.Parent
		 * @method onMessage
		 * @instance
		 *
		 * @param {String} messageType The type of message being listened for.
		 * @param {module:pym.Parent~onMessageCallback} callback The callback to invoke when a message of the given type is received.
		 */
		this.onMessage = function(messageType, callback) {
			console.log('pym:lib.Parent:onMessage:args', {
				messageType: messageType,
				callback: callback.toString()
			});

			if (!(messageType in this.messageHandlers)) {
				this.messageHandlers[messageType] = [];
			}

			this.messageHandlers[messageType].push(callback);
		};

		/**
		 * @callback module:pym.Parent~onMessageCallback
		 * @param {String} message The message data.
		 */

		/**
		 * Send a message to the the child.
		 *
		 * @memberof module:pym.Parent
		 * @method sendMessage
		 * @instance
		 *
		 * @param {String} messageType The type of message to send.
		 * @param {String} message The message data to send.
		 */
		this.sendMessage = function(messageType, message) {
			console.log('pym:lib.Parent:sendMessage:args', {
				messageType: messageType,
				message: message
			});

			// When used alongside with pjax some references are lost
			if (this.el.getElementsByTagName('iframe').length) {
				if (this.el.getElementsByTagName('iframe')[0].contentWindow) {
					console.log('pym:lib.Parent:sendMessage:postMessage', {
						id: this.id,
						messageType: messageType,
						message: message
					});

					this.el
						.getElementsByTagName('iframe')[0]
						.contentWindow.postMessage(
							_makeMessage(this.id, messageType, message),
							'*'
						);
				} else {
					console.log(
						'pym:lib.Parent:sendMessage:removeChild removing contentless child'
					);

					// Contentless child detected remove listeners and iframe
					this.remove();
				}
			}
		};

		/**
		 * Transmit the current iframe width to the child.
		 *
		 * You shouldn't need to call this directly.
		 *
		 * @memberof module:pym.Parent
		 * @method sendWidth
		 * @instance
		 */
		this.sendWidth = function() {
			var width = this.el.offsetWidth.toString();
			console.log('pym:lib.Parent:sendWidth:message_width', width);

			this.sendMessage('width', width);
		};

		/**
		 * Transmit the current viewport and iframe position to the child.
		 * Sends viewport width, viewport height
		 * and iframe bounding rect top-left-bottom-right
		 * all separated by spaces
		 *
		 * You shouldn't need to call this directly.
		 *
		 * @memberof module:pym.Parent
		 * @method sendViewportAndIFramePosition
		 * @instance
		 */
		this.sendViewportAndIFramePosition = function() {
			var iframeRect = this.iframe.getBoundingClientRect();
			var vWidth = window.innerWidth || document.documentElement.clientWidth;
			var vHeight = window.innerHeight || document.documentElement.clientHeight;
			var payload = vWidth + ' ' + vHeight;
			payload += ' ' + iframeRect.top + ' ' + iframeRect.left;
			payload += ' ' + iframeRect.bottom + ' ' + iframeRect.right;
			console.log(
				'pym:lib.Parent:sendViewportAndIFramePosition:payload',
				payload
			);

			this.sendMessage('viewport-iframe-position', payload);
		};

		// Add any overrides to settings coming from config.
		for (var key in config) {
			this.settings[key] = config[key];
			console.log('pym:lib.Parent:overrides:settings', this.settings);
		}

		/**
		 * Throttled scroll function.
		 *
		 * @memberof module:pym.Parent
		 * @method _throttleOnScroll
		 * @inner
		 */
		this._throttleOnScroll = _throttle(
			this._onScroll.bind(this),
			this.settings.scrollwait
		);

		// Bind required message handlers
		this.onMessage('height', this._onHeightMessage);
		this.onMessage('navigateTo', this._onNavigateToMessage);
		this.onMessage('scrollToChildPos', this._onScrollToChildPosMessage);
		this.onMessage('parentPositionInfo', this.sendViewportAndIFramePosition);

		// Add a listener for processing messages from the child.
		window.addEventListener('message', this._processMessage, false);

		// Construct the iframe in the container element.
		this._constructIframe();

		return this;
	};

	/**
	 * The Child half of a responsive iframe.
	 *
	 * @memberof module:pym
	 * @class Child
	 * @param {Object} [config] Configuration for the child instance. sets {@link module:pym.Child~settings}
	 * @param {function} [config.renderCallback=null] Callback invoked after receiving a resize event from the parent, sets {@link module:pym.Child#settings.renderCallback}
	 * @param {string} [config.xdomain='*'] - xdomain to validate messages received
	 * @param {number} [config.polling=0] - polling frequency in milliseconds to send height to parent
	 * @param {number} [config.id] - parent container id used when navigating the child iframe to a new page but we want to keep it responsive.
	 * @param {string} [config.parenturlparam] - if passed it will be override the default parentUrl query string parameter name expected on the iframe src
	 */
	lib.Child = function(config) {
		console.log('pym:lib.Child:args', { config: config });

		/**
		 * The initial width of the parent page
		 *
		 * @memberof module:pym.Child
		 * @member {string} parentWidth
		 * @inner
		 */
		this.parentWidth = null;
		console.log('pym:lib.Child:parentWidth', this.parentWidth);
		/**
		 * The id of the parent container
		 *
		 * @memberof module:pym.Child
		 * @member {String} id
		 * @inner
		 */
		this.id = null;
		console.log('pym:lib.Child:id', this.id);
		/**
		 * The title of the parent page from document.title.
		 *
		 * @memberof module:pym.Child
		 * @member {String} parentTitle
		 * @inner
		 */
		this.parentTitle = null;
		console.log('pym:lib.Child:parentTitle', this.parentTitle);
		/**
		 * The URL of the parent page from window.location.href.
		 *
		 * @memberof module:pym.Child
		 * @member {String} parentUrl
		 * @inner
		 */
		this.parentUrl = null;
		console.log('pym:lib.Child:parentUrl', this.parentUrl);
		/**
		 * The settings for the child instance. Can be overriden by passing a config object to the child constructor
		 * i.e.: var pymChild = new pym.Child({renderCallback: render, xdomain: "\\*\.npr\.org"})
		 *
		 * @memberof module:pym.Child.settings
		 * @member {Object} settings - default settings for the child instance
		 * @inner
		 */
		this.settings = {
			renderCallback: null,
			xdomain: '*',
			polling: 0,
			parenturlparam: 'parentUrl'
		};

		console.log('pym:lib.Child:settings', this.settings);

		/**
		 * The timerId in order to be able to stop when polling is enabled
		 *
		 * @memberof module:pym.Child
		 * @member {String} timerId
		 * @inner
		 */
		this.timerId = null;
		console.log('pym:lib.Child:timerId', this.timerId);
		/**
		 * RegularExpression to validate the received messages
		 *
		 * @memberof module:pym.Child
		 * @member {String} messageRegex
		 * @inner
		 */
		this.messageRegex = null;
		console.log('pym:lib.Child:messageRegex', this.messageRegex);
		/**
		 * Stores the registered messageHandlers for each messageType
		 *
		 * @memberof module:pym.Child
		 * @member {Object} messageHandlers
		 * @inner
		 */
		this.messageHandlers = {};

		console.log('pym:lib.Child:messageHandlers', this.messageHandlers);

		// Ensure a config object
		config = config || {};

		console.log('pym:lib.Child:ensure_config', config);

		/**
		 * Bind a callback to a given messageType from the child.
		 *
		 * Reserved message names are: "width".
		 *
		 * @memberof module:pym.Child
		 * @method onMessage
		 * @instance
		 *
		 * @param {String} messageType The type of message being listened for.
		 * @param {module:pym.Child~onMessageCallback} callback The callback to invoke when a message of the given type is received.
		 */
		this.onMessage = function(messageType, callback) {
			console.log('pym:lib.Child:onMessage:args', {
				messageType: messageType,
				callback: callback.toString()
			});
			if (!(messageType in this.messageHandlers)) {
				this.messageHandlers[messageType] = [];
			}

			this.messageHandlers[messageType].push(callback);
		};

		/**
		 * @callback module:pym.Child~onMessageCallback
		 * @param {String} message The message data.
		 */

		/**
		 * Fire all event handlers for a given message type.
		 *
		 * @memberof module:pym.Child
		 * @method _fire
		 * @inner
		 *
		 * @param {String} messageType The type of message.
		 * @param {String} message The message data.
		 */
		this._fire = function(messageType, message) {
			console.log('pym:lib.Child:_fire:args', {
				messageType: messageType,
				message: message
			});

			/*
             * Fire all event handlers for a given message type.
             */
			if (messageType in this.messageHandlers) {
				for (var i = 0; i < this.messageHandlers[messageType].length; i++) {
					console.log(
						'pym:lib.Child:_fire:this.messageHandlers[' +
							messageType +
							'][' +
							i +
							']',
						{
							itself: this,
							message: message
						}
					);
					this.messageHandlers[messageType][i].call(this, message);
				}
			}
		};

		/**
		 * Process a new message from the parent.
		 *
		 * @memberof module:pym.Child
		 * @method _processMessage
		 * @inner
		 *
		 * @param {Event} e A message event.
		 */
		this._processMessage = function(e) {
			console.log('pym:lib.Child:_processMessage:args', {
				e: e
			});

			/*
            * Process a new message from parent frame.
            */
			// First, punt if this isn't from an acceptable xdomain.
			if (!_isSafeMessage(e, this.settings)) {
				console.log('pym:lib.Child:_processMessage:_isSafeMessage:false:args', {
					e: e,
					settings: this.settings
				});

				return;
			}

			// Discard object messages, we only care about strings
			if (typeof e.data !== 'string') {
				console.log(
					'pym:lib.Child:_processMessage:discard_object_messages',
					e.data
				);
				return;
			}

			// Get the message from the parent.
			var match = e.data.match(this.messageRegex);

			console.log('pym:lib.Parent:_processMessage:match', match);

			// If there's no match or it's a bad format, punt.
			if (!match || match.length !== 3) {
				console.log('pym:lib.Child:match_or_too_many_matches', match);
				return;
			}

			var messageType = match[1];
			var message = match[2];

			console.log('pym:lib.Child:process_message_fire:data', {
				messageType: messageType,
				message: message
			});

			this._fire(messageType, message);
		}.bind(this);

		/**
		 * Resize iframe in response to new width message from parent.
		 *
		 * @memberof module:pym.Child
		 * @method _onWidthMessage
		 * @inner
		 *
		 * @param {String} message The new width.
		 */
		this._onWidthMessage = function(message) {
			console.log('pym:lib.Child:_onWidthMessage:args', {
				message: message
			});

			/*
             * Handle width message from the child.
             */
			var width = parseInt(message);

			// Change the width if it's different.
			if (width !== this.parentWidth) {
				this.parentWidth = width;

				// Call the callback function if it exists.
				if (this.settings.renderCallback) {
					this.settings.renderCallback(width);
				}

				// Send the height back to the parent.
				this.sendHeight();
			}
		};

		/**
		 * Send a message to the the Parent.
		 *
		 * @memberof module:pym.Child
		 * @method sendMessage
		 * @instance
		 *
		 * @param {String} messageType The type of message to send.
		 * @param {String} message The message data to send.
		 */
		this.sendMessage = function(messageType, message) {
			console.log('pym:lib.Child:sendMessage:args', {
				messageType: messageType,
				message: message
			});

			console.log('pym:lib.Child:sendMessage:window_parent', window.parent);

			console.log('pym:lib.Child:sendMessage:message_to_send', {
				id: this.id,
				messageType: messageType,
				message: message
			});

			/*
             * Send a message to the parent.
             */
			window.parent.postMessage(
				_makeMessage(this.id, messageType, message),
				'*'
			);
		};

		/**
		 * Transmit the current iframe height to the parent.
		 *
		 * Call this directly in cases where you manually alter the height of the iframe contents.
		 *
		 * @memberof module:pym.Child
		 * @method sendHeight
		 * @instance
		 */
		this.sendHeight = function() {
			// Get the child's height.
			var height = document
				.getElementsByTagName('body')[0]
				.offsetHeight.toString();

			console.log('pym:lib.Child:sendHeight:height', height);

			// Send the height to the parent.
			this.sendMessage('height', height);

			return height;
		}.bind(this);

		/**
		 * Ask parent to send the current viewport and iframe position information
		 *
		 * @memberof module:pym.Child
		 * @method sendHeight
		 * @instance
		 */
		this.getParentPositionInfo = function() {
			console.log('pym:lib.Child:getParentPositionInfo message sent');

			// Send the height to the parent.
			this.sendMessage('parentPositionInfo');
		};

		/**
		 * Scroll parent to a given element id.
		 *
		 * @memberof module:pym.Child
		 * @method scrollParentTo
		 * @instance
		 *
		 * @param {String} hash The id of the element to scroll to.
		 */
		this.scrollParentTo = function(hash) {
			console.log('pym:lib.Child:scrollParentTo message sent', '#' + hash);
			this.sendMessage('navigateTo', '#' + hash);
		};

		/**
		 * Navigate parent to a given url.
		 *
		 * @memberof module:pym.Child
		 * @method navigateParentTo
		 * @instance
		 *
		 * @param {String} url The url to navigate to.
		 */
		this.navigateParentTo = function(url) {
			console.log('pym:lib.Child:navigateParentTo message sent', url);
			this.sendMessage('navigateTo', url);
		};

		/**
		 * Scroll parent to a given child element id.
		 *
		 * @memberof module:pym.Child
		 * @method scrollParentToChildEl
		 * @instance
		 *
		 * @param {String} id The id of the child element to scroll to.
		 */
		this.scrollParentToChildEl = function(id) {
			// Get the child element position using getBoundingClientRect + pageYOffset
			// via https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
			var topPos =
				document.getElementById(id).getBoundingClientRect().top +
				window.pageYOffset;
			console.log('pym:lib.Child:scrollParentToChildEl message sent', topPos);
			this.scrollParentToChildPos(topPos);
		};

		/**
		 * Scroll parent to a particular child offset.
		 *
		 * @memberof module:pym.Child
		 * @method scrollParentToChildPos
		 * @instance
		 *
		 * @param {Number} pos The offset of the child element to scroll to.
		 */
		this.scrollParentToChildPos = function(pos) {
			console.log('pym:lib.Child:scrollParentToChildPos message sent', pos);
			this.sendMessage('scrollToChildPos', pos.toString());
		};

		/**
		 * Mark Whether the child is embedded or not
		 * executes a callback in case it was passed to the config
		 *
		 * @memberof module:pym.Child
		 * @method _markWhetherEmbedded
		 * @inner
		 *
		 * @param {module:pym.Child~onMarkedEmbeddedStatus} The callback to execute after determining whether embedded or not.
		 */
		var _markWhetherEmbedded = function(onMarkedEmbeddedStatus) {
			console.log('pym:lib.Child:_markWhetherEmbedded', {
				onMarkedEmbeddedStatus: onMarkedEmbeddedStatus
			});
			var htmlElement = document.getElementsByTagName('html')[0],
				newClassForHtml,
				originalHtmlClasses = htmlElement.className;
			console.log('pym:lib.Child:_markWhetherEmbedded:info', {
				htmlElement: htmlElement,
				newClassForHtml: newClassForHtml,
				originalHtmlClasses: originalHtmlClasses
			});

			try {
				if (window.self !== window.top) {
					newClassForHtml = 'embedded';
				} else {
					newClassForHtml = 'not-embedded';
				}
			} catch (e) {
				newClassForHtml = 'embedded';
			}

			console.log(
				'pym:lib.Child:_markWhetherEmbedded:info_after_window_check',
				{
					htmlElement: htmlElement,
					newClassForHtml: newClassForHtml,
					originalHtmlClasses: originalHtmlClasses
				}
			);

			if (originalHtmlClasses.indexOf(newClassForHtml) < 0) {
				htmlElement.className = originalHtmlClasses ? originalHtmlClasses + ' ' + newClassForHtml : newClassForHtml;
				if (onMarkedEmbeddedStatus) {
					onMarkedEmbeddedStatus(newClassForHtml);
				}
				_raiseCustomEvent('marked-embedded');
			}

			console.log(
				'pym:lib.Child:_markWhetherEmbedded:after_does_newClass_exist_in_original_check',
				{
					htmlElement: htmlElement,
					newClassForHtml: newClassForHtml,
					originalHtmlClasses: originalHtmlClasses
				}
			);
		};

		/**
		 * @callback module:pym.Child~onMarkedEmbeddedStatus
		 * @param {String} classname "embedded" or "not-embedded".
		 */

		/**
		 * Unbind child event handlers and timers.
		 *
		 * @memberof module:pym.Child
		 * @method remove
		 * @instance
		 */
		this.remove = function() {
			window.removeEventListener('message', this._processMessage);
			console.log(
				'pym:lib.Child:removeEventListener:message',
				this._processMessage
			);
			if (this.timerId) {
				clearInterval(this.timerId);
			}
		};

		// Initialize settings with overrides.
		for (var key in config) {
			this.settings[key] = config[key];
			console.log('pym:lib.Child:overrides:settings', this.settings);
		}

		// Identify what ID the parent knows this child as.
    this.id = _getParameterByName('childId') || config.id;
    console.log('pym:lib.Child:know_child_as_what_id', this.id);
    
    this.messageRegex = new RegExp(
			'^pym' +
				MESSAGE_DELIMITER +
				this.id +
				MESSAGE_DELIMITER +
				'(\\S+)' +
				MESSAGE_DELIMITER +
				'(.*)$'
    );
    
    console.log('pym:lib.Child:messageRegex', this.messageRegex);
    

		// Get the initial width from a URL parameter.
    var width = parseInt(_getParameterByName('initialWidth'));
    
    console.log('pym:lib.Child:initialWidthFromUrlParam', width);

		// Get the url of the parent frame
    this.parentUrl = _getParameterByName(this.settings.parenturlparam);
    
    console.log('pym:lib.Child:getUrlOfParentFrame', this.parentUrl);

		// Get the title of the parent frame
    this.parentTitle = _getParameterByName('parentTitle');
    console.log('pym:lib.Child:getTitleOfParentFrame', this.parentTitle);

		// Bind the required message handlers
		this.onMessage('width', this._onWidthMessage);

		// Set up a listener to handle any incoming messages.
		window.addEventListener('message', this._processMessage, false);

		// If there's a callback function, call it.
		if (this.settings.renderCallback) {
      console.log('pym:lib.Child:ifRenderCallback_use_width', width);
			this.settings.renderCallback(width);
		}

		// Send the initial height to the parent.
		this.sendHeight();

		// If we're configured to poll, create a setInterval to handle that.
		if (this.settings.polling) {
      console.log('pym:lib.Child:ifPolling POLL!');
			this.timerId = window.setInterval(this.sendHeight, this.settings.polling);
		}

		_markWhetherEmbedded(config.onMarkedEmbeddedStatus);

		return this;
	};

	// Initialize elements with pym data attributes
	// if we are not in server configuration
	if (typeof document !== 'undefined') {
    console.log('pym:initializedViaDataAttributes');
    
		lib.autoInit(true);
	}

	return lib;
});
