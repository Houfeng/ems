define(['b.js', 'exports'], function(b, exports) {

	var name = "a";

	test('模块' + name, function() {
		ok(true, '进入' + name + '模块声名函数');
	});

	test(name + "静态依赖", function() {
		ok(b && b.name == 'b', name + ' 导入 ' + b.name);
		b.say(' form ' + name);
	});
	exports.name = name;
	exports.say = function(x) {
		ok(true, '模块' + name + ',say:' + x);
	};

});