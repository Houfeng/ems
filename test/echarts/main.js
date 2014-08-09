ems.config({
    packages: [
        {//配置echarts包
            name: 'echarts',
            location: ems.resovleUri('./lib/echarts/'),
            main: 'echarts'
        },
        {//配置echarts的依赖zrender包
            name: 'zrender',
            location: ems.resovleUri('./lib/zrender/'),
            main: 'zrender'
        }
    ]
});
define(function(require, exports, module) {
    var ec = require("echarts");
    alert(JSON.stringify(ec));
});