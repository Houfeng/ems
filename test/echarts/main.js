ems.config({
    packages: [{ //配置echarts包
        name: 'echarts',
        location: ems.resovleUri('./lib/echarts/'),
        main: 'echarts'
    }, { //配置echarts的依赖zrender包
        name: 'zrender',
        location: ems.resovleUri('./lib/zrender/'),
        main: 'zrender'
    }]
});
define(function(require, exports, module) {
    var ec = require("echarts");
    require("echarts/chart/pie");

    alert(ec);

    var chart = ec.init(document.getElementById("holder"));
    var option = {
        title: {
            text: '某站点用户访问来源',
            subtext: '纯属虚构',
            x: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        legend: {
            orient: 'vertical',
            x: 'left',
            data: ['直接访问', '邮件营销', '联盟广告', '视频广告', '搜索引擎']
        },
        toolbox: {
            show: true,
            feature: {
                mark: {
                    show: true
                },
                dataView: {
                    show: true,
                    readOnly: false
                },
                restore: {
                    show: true
                },
                saveAsImage: {
                    show: true
                }
            }
        },
        calculable: true,
        series: [{
            name: '访问来源',
            type: 'pie',
            radius: '55%',
            center: ['50%', '60%'],
            data: [{
                value: 335,
                name: '直接访问'
            }, {
                value: 310,
                name: '邮件营销'
            }, {
                value: 234,
                name: '联盟广告'
            }, {
                value: 135,
                name: '视频广告'
            }, {
                value: 1548,
                name: '搜索引擎'
            }]
        }]
    };
    chart.setOption(option);

});