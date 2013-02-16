define(function (require,exports,module) {
	imp.config({
		alias:{
			'a':'a.js'
		}
	});
	require(['a'],function (a) {
		a.say();
	});
});