 * EMS(IMP) v0.1
 * Easy Module System: 简洁、易用的模块系统
 * 作者：侯锋
 * 邮箱：admin@xhou.net
 * 网站：http://houfeng.net , http://houfeng.net/ems
 *
 *
 * ***********************< EMS >************************
 *
 * ems 全称为 "Easy Module System" 他还有一个别名叫: "imp";
 * ems 作为 "EMD" 的实现标准范本; 完全符合 "EMD规范";
 *
 *
 * *********************< EMD 规范 >**********************
 *
 * EMD 全称为 "Easy Module Definition"
 *
 * 定义一个模块
 * define(function(require,exports,module){
 * 		require([module...],function(){
 *
 * 		});
 *
 * 		exports= {
 * 			say:function(){}
 * 		};
 * });