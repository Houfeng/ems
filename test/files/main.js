module("EMS(IMP)");

test("系统对象创建", function() {
	notEqual(ems, null, '创建全局ems对象');
	notEqual(ems.define, null, '创建ems.define对象');
	notEqual(define.amd, null, '创建define.amd对象');
	notEqual(define, null, '创建全局define对象');
});

define(['a.js', 'b.js', 'require', 'exports', 'module'], function(a, b, require, exports, module) {

	var name = "main";

	test('模块' + name, function() {
		ok(true, '进入' + name + '模块声明函数');
	});

	test(name + "静态依赖", function() {
		ok(a && a.name == 'a', name + '导入' + a.name);
		a.say(' form ' + name);
		ok(b && b.name == 'b', name + '导入' + b.name);
		b.say(' form ' + name);
	});

	test(name + "系统依赖", function() {
		notEqual(require, null, 'require就续');
		notEqual(exports, null, 'exports就续');
		notEqual(module, null, 'module就续');
		ok(true, "模块" + name + "的uri: " + module.uri);
		ok(true, "模块" + name + "的id: " + module.id);
		ok(true, "URI: '../none.js' 转换结果为: " + module.resovleUri('../none.js'));
	});

	test(name + "动态依赖", function() {
		stop();
		require('c.js', function(c) {
			ok(c && c.name == 'c', name + '导入' + c.name);
			start();
		});
	});

});