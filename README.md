###EMS(IMP)
```
+ Easy Module System: 简洁、易用的模块系统; 
+ ems 全称为 "Easy Module System" 他还有一个别名叫: "imp"; 
+ ems 作为 "EMD" 的标准实现范本; 完全符合 "EMD规范"; 
```

###最新版本 
```
+ v0.3.0
```

###支持
```
+ IE
+ Chrome
+ Firefox
+ Safari 
+ Opera
```

###联系
```
+ 作者：侯锋
+ 邮箱：admin@xhou.net
+ 网站：http://houfeng.net , http://houfeng.net/ems
```

###EMD 规范 
```
+ EMD 全称为 "Easy Module Definition"; 
+ EMD 是AMD规范的子集,所以EDM只能写AMD中所谓的“匿名模块”；
+ 符合EMD的模块可以，直接在实现AMD的模块系统中加载使用；
```

#####规范定义
```javascript
define([deps...<require>,<exports>,<module>],
    function(... <require>,<exports>,<module>){

    //动态导入依赖 (AMD)
    require([deps...],function(...){
        // TODO
    });

    //标准导出 (AMD)
    return {
        say:function(){}
    };

    //类CommonJS导入 (CommonJS)
    var a=require('a');

    //类CommonJS导出 (CommonJS)
    exports.say=function(){};

});
```