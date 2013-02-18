define(['a.js', 'b.js', 'c.js', 'require'], function(a, b, c, require, exports, module) {

	ems.config({
		alias: {
			jquery: 'hdasfdaf'
		}
	});

	alert(c.name);
	a.say('main');
	b.say('main');

});