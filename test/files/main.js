define(['a.js', 'b.js','require'], function(a, b, require, exports, module) {
	alert(require);
	a.say('main');
	b.say('main');
});