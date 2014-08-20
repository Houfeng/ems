###emsjs
```
+ emsjs 是一个符合 AMD 规范的浏览器端 JavaScript 模块加载器，兼容所有主流浏览器;
```

###最新版本 
```
+  v1.2.9
```

### 许可协议
>[请您遵守LGPL协议，（点击可查看LGPL协议）](http://www.gnu.org/licenses/lgpl.html)

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
+ 邮件组：emsjs@googlegroups.com
```

#####规范定义
```javascript
define([id],[deps...<require>,<exports>,<module>],
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

###快速指南

```html
<!--方式一-->
<script type="text/javascript" src='scripts/ems.js' data-main='scripts/module/main'></script>

<!--方式二-->
<script type="text/javascript" src='scripts/ems.js'></script>
<script type="text/javascript">
    ems.load('scripts/module/main');
</script>

<!--作为脚本加载器使用-->
<script type="text/javascript" src='scripts/ems.js'></script>
<script type="text/javascript">
    ems.load('scripts/script1.js',function(){
        //callback可以省略，也可以在callback处理脚本加载完成后才能执行的操作
    });
    ems.load(['scripts/script1.js','scripts/script2.js'],function(){
        //callback可以省略，也可以在callback处理脚本加载完成后才能执行的操作
    });
</script>

````