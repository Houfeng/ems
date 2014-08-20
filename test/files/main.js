module('EMS ');

test('系统对象', function() {
    notEqual(ems, null, '全局ems对象');
    notEqual(ems.define, null, 'ems.define对象');
    notEqual(define.amd, null, 'define.amd对象');
    notEqual(define, null, '全局define对象');
});

ems.config({
    maxLoadTime: 3000,
    disabledCircularDependency: false,
    settings: {
        test: 'test'
    },
    packages: [{
        name: "m",
        location: ems.resovleUri("./files/"),
        main: ''
    }],
    paths: {
        shimTest: ems.resovleUri('./files/shim.js'),
        jq1: {
            name: 'jq',
            uri: ems.resovleUri('./files/jQuery.js')
        }
    },
    shim: {
        shimTest: {
            //uri:ems.resovleUri('./files/shim.js'),
            deps: ['jq'],
            exports: function($) {
                return window['shimTest'];
            }
        }
    }
});

define(['a', 'd.js', 'require', 'exports', 'module'], function(a, d, require, exports, module) {

    console.log("开始执行测试模块");

    var name = 'main';

    var b = require('b');

    test('模块' + name, function() {
        ok(true, '进入' + name + '模块声明函数');
    });

    test(name + "系统依赖", function() {
        notEqual(require, null, 'require就绪');
        notEqual(exports, null, 'exports就绪');
        notEqual(module, null, 'module就绪');
        ok(true, '模块' + name + "的uri: " + module.uri);
        ok(true, '模块' + name + "的id: " + module.id);
    });

    test('包配置' + name, function() {
        stop();
        var a = require("m/a");
        ok(a && a.name == 'a', '导入m包默认模块a');
        var b = require("m/b");
        ok(b && b.name == 'b', '导入m包模块b');
        var e = require("m/e");
        ok(e && e.name == 'e', '导入m包模块e');
        start();
    });

    test(name + '静态依赖', function() {
        ok(a && a.name == 'a', name + '导入' + a.name);
        a.say(' form ' + name);
        ok(b && b.name == 'b', name + '导入' + b.name);
        b.say(' form ' + name);
        ok(d && d.name == 'd', name + '导入' + d.name);
    });

    test(name + '类似CommonJS依赖', function() {
        var e = require('e.js');
        var f1 = require('f.js');
        var f2 = require("f.js");
        ok(e && e.name == 'e', name + '类似CommonJS方式导入' + e.name);
        ok(f1 && f1.name == 'f', name + '类似CommonJS方式第一次导入' + f1.name);
        ok(f2 && f2.name == 'f', name + '类似CommonJS方式第二次导入' + f2.name);
    });

    test(name + '导入样式表', function() {
        stop();
        require('a.css', function(c) {
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

    test("a、b循环依赖", function() {
        stop();
        a.bSay("my name is a");
        b.aSay("my name is b");
        ok(true, '循环依赖调用完成');
        start();
    });

    test("远程模块", function() {
        stop();
        var jq = require('http://libs.baidu.com/jquery/1.9.0/jquery.js');
        ok(jq && jq('html')[0], '来自百度 CDN');
        start();
    });

});

//end