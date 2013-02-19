define(function(require, exports, module) {
	var name = 'b';
	test('模块' + name, function() {
		ok(true, '进入' + name + '模块声名函数');
	});

	return {
		name: name,
		say: function(x) {
			ok(true, '模块' + name + ',say:' + x);
		}
	};
});