(function() {

var swf;

/**
 * The DGE.Audio object manages audio in your game OMGZ!
 * @param {Object} conf The configuration settings for this new Audio object.
 * @namespace DGE
 * @class Audio
 * @constructor
 * @extends DGE.Object
 */
DGE.Audio = DGE.Object.make(function(conf) {

	if (conf === undefined) return;

	this.init(conf);

}, {
	volume : 100
}, {
	'change:file' : function(file) {

		if (DGE.platform.name == DGE.platform.TITANIUM) {
			this.node = Titanium.Media.createSound(file);
		} else {
			if (DGE.Audio.enabled) swf.load(this.id, file);
		}

	},
	'change:mute' : function(muted) {

		if (DGE.platform.name == DGE.platform.TITANIUM) {
			if (muted === false) {
				this.node.setVolume(this.get('volume'));
			} else {
				this.node.setVolume(0);
			}
		} else {
			this.node.muted = muted;
		}

	},
	'change:volume' : function(volume) {

		// This line is necessary because of the crappy way Titanium implements sound objects.
		// The node might not exist yet because you must create it with a file defined,
		// and the file might not have been set yet.
		if (!this.node) return;

		if (DGE.platform.name == DGE.platform.TITANIUM) {
			this.node.setVolume(volume / 100);
		} else {
			this.node.volume = (volume / 100);
		}

	}
});

/**
 * Mutes the audio.
 * @param {Boolean} mute true to mute the audio, false to disable mute.
 * @return {Object} this (for chaining).
 * @method mute
 */
DGE.Audio.prototype.mute = function(mute) {
	return this.set('mute', (mute !== false));
};

/**
 * Pauses the audio.
 * @return {Object} this (for chaining).
 * @method pause
 */
DGE.Audio.prototype.pause = function() {
	this.node.pause();
	return this.fire('pause');
};

/**
 * Plays the audio file.
 * @return {Object} this (for chaining).
 * @method play
 */
DGE.Audio.prototype.play = function() {
	try {
		if (DGE.Audio.enabled) swf.play(this.id);
	} catch(e) {};

	return this.fire('play');
};

/**
 * Stops audio playback (resets seeker to beginning).
 * @return {Object} this (for chaining).
 * @method stop
 */
DGE.Audio.prototype.stop = function() {

	if (DGE.platform.name == DGE.platform.BROWSER) {
		if (DGE.Audio.enabled) swf.stop(this.id);
		// The try/catch is here because this error gets thrown in Gecko and Webkit:
		// An attempt was made to use an object that is not, or is no longer, usable" code: "11"
		/*
		try {
			this.node.pause();
			this.node.currentTime = 0;
		} catch(e) {}
		*/
	} else {
		this.node.stop();
	}

	return this.fire('stop');

};

/**
 * Represents the availability of audio in the current platform.
 * @property available
 * @final
 * @static
 * @type Boolean
 */
DGE.Audio.available = (function() {

	if (DGE.platform.name == DGE.platform.TITANIUM) {
		return true;
	} else {
		return !!swf;
	}

})();

/**
 * Whether the audio is enabled or not.
 * Note: audio can be available (supported by the platform)
 * but disabled (meaning this flag is set to false).
 * @property enabled
 * @default false
 * @type Boolean
 */
DGE.Audio.enabled = false;

/**
 * The location of Diggy's .swf file for audio.
 * Set to use flash instead of the audio tag.
 * @property swfSrc
 * @default swf/external_interface.swf
 * @static
 * @type String
 */
DGE.Audio.swfSrc = 'swf/external_interface.swf';

/**
 * Initializes audio.
 * @param {Object} callbacks (optional) The callbacks to fire (complete, error).
 * @param {Number} timeoutDelay (optional) The number of milliseconds to wait before timing out (default: 3000).
 * @method init
 * @static
 */
DGE.Audio.init = function(callbacks, timeoutDelay) {

	callbacks = (callbacks || {});
	timeoutDelay = (timeoutDelay || 3000);

	if (DGE.platform.name == DGE.platform.TITANIUM) {
		DGE.Audio.enabled = true;
		if (callbacks.complete) callbacks.complete();
		return;
	}

	var container = document.createElement('div');
	var html = [];
	var timeout = setTimeout(function() {
		interval.stop();
		if (callbacks.error) callbacks.error();
	}, timeoutDelay);
	var interval = new DGE.Interval({
		delay : 100,
		interval : function() {
			if (swf && (typeof(swf.load) == 'function')) {
				clearTimeout(timeout);
				interval.stop();
				DGE.Audio.enabled = true;
				if (callbacks.complete) callbacks.complete();
			}
		}
	});

	// Note: using user agent is bad practice. I am lazy.
	if (navigator.userAgent.match(/MSIE/i)) {
		html.push('<object data="{swf}" id="dge_audio" type="application/x-shockwave-flash" width="0" height="0">');
		html.push(' <param name="movie" value="{swf}">');
		html.push(' <param name="allowFullScreen" value="false">');
		html.push(' <param name="allowScriptAccess" value="always">');
		html.push(' <param name="quality" value="high">');
		html.push('</object>');
	} else {
		html.push('<embed');
		html.push('	id="dge_audio"');
		html.push('	name="dge_audio"');
		html.push('	src="{swf}"');
		html.push('	allowFullScreen="false"');
		html.push('	allowScriptAccess="always"');
		html.push('	type="application/x-shockwave-flash"');
		html.push('	width="0"');
		html.push('	height="0"');
		html.push('></embed>');
	}

	container.innerHTML = html.join('').replace(/{swf}/g, DGE.Audio.swfSrc);
	//DGE.setCSS(container, 'display', 'none');
	DGE.stage.node.appendChild(container);

	swf = DGE.getNode('dge_audio');

	interval.start();

};

})();
