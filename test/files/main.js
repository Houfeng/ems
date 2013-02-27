module("EMS(IMP)");

test("系统对象", function() {
	notEqual(ems, null, '全局ems对象');
	notEqual(ems.define, null, 'ems.define对象');
	notEqual(define.amd, null, 'define.amd对象');
	notEqual(define, null, '全局define对象');
});

define(['a', 'b.js', 'require', 'exports', 'module'], function(a, b, require, exports, module) {

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

	});

	test(name + '导入样式表', function() {
		stop();
		require('a.css', function(c) {
			var styles = document.body.currentStyle || document.body.ownerDocument.defaultView.getComputedStyle(document.body, null);
			//alert(styles.backgroundColor);
			ok(styles.backgroundColor == '#fefefe' || styles.backgroundColor == '#FEFEFE' || styles.backgroundColor == 'rgb(254, 254, 254)', "导入a.css");
			start();
		});
	});

	test(name + "动态依赖", function() {
		stop();
		require('c.js', function(c) {
			ok(c && c.name == 'c', name + '导入' + c.name);
			start();
		});
	});

	test(name + "引入jquery", function() {
		stop();
		define.amd.jQuery = true;
		require('jQuery.js', function(jq) {
			ok(jq && jq('body').length > 0, name + '导入jquery');
			start();
		});
	});

	test(name + "引入远程模块", function() {
		stop();
		define.emd.jtp = true;
		require('https://raw.github.com/Houfeng/jtp/master/src/jtp.min.js', function(jtp) {
			ok(jtp && jtp.parse, name + '导入https://raw.github.com/Houfeng/jtp/master/src/jtp.min.js');
			start();
		});
	});

});

//end