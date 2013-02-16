###EMS(IMP)
>最新版本 v0.1
>Easy Module System: 简洁、易用的模块系统
>ems 全称为 "Easy Module System" 他还有一个别名叫: "imp";
>ems 作为 "EMD" 的实现标准范本; 完全符合 "EMD规范";

###联系
>作者：侯锋
>邮箱：admin@xhou.net
>网站：http://houfeng.net , http://houfeng.net/ems

###EMD 规范 
>EMD 全称为 "Easy Module Definition"
>EMD 类似AMD、CMD，但比AMD、CMD更加简洁、易用。

#####规范定义
```javascript
define(function(require,exports,module){
 	require(['module1.js','module2.js'],function(module1,module2){
 		module1.doSomesing();
 		module2.doSomesing();
 	});
	exports.doSomesing=function(){
		//TODO
	};
});
```