module('EMS ');

test('系统对象', function() {
    notEqual(ems, null, '全局ems对象');
    notEqual(ems.define, null, 'ems.define对象');
    notEqual(define.amd, null, 'define.amd对象');
    notEqual(define, null, '全局define对象');
});

ems.config({
    packages: [{
        name: "abc",
        location: ems.resovleUri("./files/"),
        main: 'a'
    }],
    paths: {
        shimTest: ems.resovleUri('./files/shim.js'),
        jq: ems.resovleUri('./files/jQuery.js')
    },
    shim: {
        shimTest: {
            deps: ['jq'],
            exports: function($){
                return window['shimTest'];
            }
        }
    }
});

define(['a', 'b.js', 'd.js', 'require', 'exports', 'module'], function(a, b, d, require, exports, module) {

    var name = 'main';

    test('模块' + name, function() {
        ok(true, '进入' + name + '模块声明函数');
    });

    test('包' + name, function() {
        require("abc");
        ok(true, '导入abc包默认模块a');
    });

    test('包' + name, function() {
        require("abc/b");
        ok(true, '导入abc包模块b');
    });


    test(name + '静态依赖', function() {
        ok(a && a.name == 'a', name + '导入' + a.name);
        a.say(' form ' + name);
        ok(b && b.name == 'b', name + '导入' + b.name);
        b.say(' form ' + name);
        ok(d && d.name == 'd', name + '导入' + d.name);
    });

    var e = require('e.js');
    var f1 = require('f.js');
    var f2 = require("f.js");
    test(name + '类似CommonJS依赖', function() {
        ok(e && e.name == 'e', name + '类似CommonJS方式导入' + e.name);
        ok(f1 && f1.name == 'f', name + '类似CommonJS方式第一次导入' + f1.name);
        ok(f2 && f2.name == 'f', name + '类似CommonJS方式第二次导入' + f2.name);
    });

    test(name + "系统依赖", function() {
        notEqual(require, null, 'require就续');
        notEqual(exports, null, 'exports就续');
        notEqual(module, null, 'module就续');
        ok(true, '模块' + name + "的uri: " + module.uri);
        ok(true, '模块' + name + "的id: " + module.id);

    });

    test(name + '导入样式表', function() {
        stop();
        require('a.css', function(c) {
            //var styles = document.body.currentStyle || document.body.ownerDocument.defaultView.getComputedStyle(document.body, null);
            //alert(styles.backgroundColor);
            //ok(styles.backgroundColor == '#fefefe' || styles.backgroundColor == '#FEFEFE' || styles.backgroundColor == 'rgb(254, 254, 254)', "导入a.css");
            ok(true, "导入a.css");
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
        require('jQuery.js', function(jq) {
            //alert(typeof(jq));
            ok(jq && jq('body').length > 0, name + '导入jquery');
            start();
        });
    });


    test(name + "通过 shim 引用普通脚本", function() {
        stop();
        require('shimTest', function(rs) {
            ok(rs && rs == 'houfeng', name + '通过 shim 引用普通脚本');
            start();
        });
    });


    /*
	test(name + "引入远程模块", function() {
		stop();
		define.amd.jQuery = true;
		require('http://code.jquery.com/jquery-1.9.1.min.js', function($) {
			ok($ && $.fn, name + '导入http://code.jquery.com/jquery-1.9.1.min.js');
			start();
		});
	});*/

});

//end