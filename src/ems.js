/**
 * EMS(IMP) v0.2.2
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
 * 规范定义:
 * define([deps...<require>,<exports>,<module>]function(... <require>,<exports>,<module>){
 *
 * 	    //动态导入依赖 (AMD)
 * 		require([deps...],function(...){
 *
 * 		});
 *
 * 		//标准导出 (AMD)
 * 		return {
 * 			say:function(){}
 * 		};
 *
 *      //类CommonJS导入 (CommonJS)
 *      var a=require('a');
 *
 *      //类CommonJS导出 (CommonJS)
 *      exports.say=function(){};
 * });
 *
 *
 * ******************************************************
 *
 */

this.ems = this.imp = {};

(function(owner) {

	/**
	 * 遍历数组或对象
	 */
	var each = function(list, handler) {
			if(!list || !handler) {
				return;
			}
			if((list instanceof Array) || (list.length && list[0])) {
				var listLength = list.length;
				for(var i = 0; i < listLength; i++) {
					if(list[i]) {
						var rs = handler.call(list[i], i);
						if(rs) break;
					}
				}
			} else {
				for(var i in list) {
					if(list[i]) {
						var rs = handler.call(list[i], i);
						if(rs) break;
					}
				}
			}
		};

	/**
	 * 创建一个脚本元素
	 */
	var createScript = function(uri) {
			var scriptElement = document.createElement('script');
			scriptElement.src = uri;
			scriptElement.async = true;
			scriptElement.defer = true;
			scriptElement.type = "text/javascript";
			return scriptElement;
		};

	/**
	 * 创建一个外联样式元素
	 */
	var createStyle = function(uri) {
			var styleElement = document.createElement('link');
			styleElement.href = uri;
			styleElement.type = "text/css";
			styleElement.rel = "stylesheet";
			return styleElement;
		};

	var elementContainer = null;
	/**
	 * 将一个脚本元素添加DOM结构中
	 */
	var appendToDom = function(element) {
			if(!elementContainer) {
				elementContainer = document.getElementsByTagName('head');
				elementContainer = elementContainer ? elementContainer[0] : document.body;
			}
			//将script添加到页面
			elementContainer.appendChild(element);
		};

	/**
	 * 处理事件监听器
	 */
	var bindEvent = function(element, name, handler) {
			if(element.addEventListener) {
				element.addEventListener(name, handler);
			} else if(element.attachEvent) {
				element.attachEvent("on" + name, handler);
			}
		};

	/**
	 * 绑定load事件
	 */
	var bindLoadEvent = function(element, handler) {
			if(!element || !handler) return;
			var loadEventName = element.attachEvent ? "readystatechange" : "load";
			bindEvent(element, loadEventName, function() {
				var readyState = element.readyState || "loaded";
				if(readyState == "loaded" || readyState == "interactive" || readyState == "complete") {
					handler.apply(element, arguments);
				}
			});
		};

	/**
	 * 加载缓存
	 */
	var moduleTable = {
		'require': {
			loaded: true,
			exports: 'require'
		},
		'exports': {
			loaded: true,
			exports: 'exports'
		},
		'moeule': {
			loaded: true,
			exports: 'moeule'
		}
	};
	owner.moduleTable = moduleTable;
	/**
	 * 加载一个文件
	 */
	var loadOne = function(uri, callback) {
			if(moduleTable[uri] == null) {
				moduleTable[uri] = new ModuleContext(uri);
			}
			//如果缓存中存在，直接回调;
			if(moduleTable[uri].loaded && callback) {
				callback(moduleTable[uri].exports);
				return moduleTable[uri].exports;
			}
			//如果缓存中不存在，并且回调链也已创建，则压入当前callback,然后返回，等待回调
			if(moduleTable[uri].loadCallbacks != null) {
				moduleTable[uri].loadCallbacks.push(callback);
				return;
			};
			//如果缓存中不存在，并且回调链为NULL，则创建回调链，并压入当前callback
			moduleTable[uri].loadCallbacks = [];
			moduleTable[uri].loadCallbacks.push(callback);
			//创建无素
			moduleTable[uri].element = uri.indexOf('.css') > 0 ? createStyle(uri) : createScript(uri);
			//绑定load事件,模块下载完成，执行完成define，会立即触发load
			bindLoadEvent(moduleTable[uri].element, function() {
				var currently = currentlyQueque.shift() || {};
				moduleTable[uri].deps = currently.moduleDeps;
				moduleTable[uri].declare = currently.moduleDeclare;
				//清空currently
				currently = null;
				//处理模块静态依赖
				moduleTable[uri].require(moduleTable[uri].deps, function() {
					if(moduleTable[uri].declare) {
						var args = [];
						for(var i = 0; i < arguments.length; i++) {
							if(arguments[i] == 'require') arguments[i] = moduleTable[uri].require
							if(arguments[i] == 'exports') arguments[i] = moduleTable[uri].exports
							if(arguments[i] == 'module') arguments[i] = moduleTable[uri].module
							args.push(arguments[i]);
						}
						var retExports = moduleTable[uri].declare.apply(moduleTable[uri], args);
						moduleTable[uri].exports = retExports || moduleTable[uri].exports;
					}
					//
					each(moduleTable[uri].loadCallbacks, function() {
						this(moduleTable[uri].exports);
					});
					moduleTable[uri].loaded = true;
					moduleTable[uri].loadCallbacks = null;

				});

			});
			//
			appendToDom(moduleTable[uri].element);
		};

	/**
	 * 加载一组文件
	 */
	owner.load = function(uriList, callback) {
		var exportsList = window || {};
		var uriCount = 0;
		if(uriList && uriList.length > 0) {
			each(uriList, function() {
				loadOne(this, function() {
					uriCount += 1;
					if(uriCount >= uriList.length) {
						if(callback) {
							exportsList = getModuleExportsFromCache(uriList);
							callback.apply(exportsList, exportsList);
						}
					}
				});
			});
		} else {
			callback.apply(exportsList, exportsList);
		}
		return exportsList;
	};

	/**
	 * 从缓存中取得模块
	 */
	var getModuleExportsFromCache = function(uriList) {
			var moduleExports = [];
			each(uriList, function() {
				if(moduleTable[this]) {
					moduleExports.push(moduleTable[this].exports);
				}
			});
			return moduleExports;
		};

	/**
	 * 配置
	 */
	owner.config = function(option) {
		option = option || {};
		option.alias = option.alias || {};
		each(option.alias, function(name) {
			aliasTable[name] = this;
		});
	};

	var aliasTable = {};

	/**
	 * 转换路径为绝对路径
	 */
	var resovleUri = function(uri, baseUri) {
			if(uri.indexOf('http://') == 0 || uri.indexOf('https://') == 0 || uri.indexOf('/') == 0 || uri == 'require' || uri == 'exports' || uri == 'module') {
				return uri;
			}
			//
			var uriParts = uri.split('/');
			var newUriParts = baseUri.substring(0, baseUri.lastIndexOf('/')).split('/');
			each(uriParts, function() {
				if(this == '..') {
					newUriParts.pop();
				} else if(this == '.') {
					//No Handle
				} else {
					newUriParts.push(this);
				}
			});
			return newUriParts.join('/');
		};

	/**
	 * 转换一组依赖为绝对路径
	 */
	var depsToUriList = function(deps, baseUri) {
			if((typeof deps) == 'string') {
				deps = [deps];
			}
			var absUriList = [];
			each(deps, function() {
				var uri = aliasTable[this] || this;
				absUriList.push(resovleUri(uri, baseUri));
			});
			return absUriList;
		};

	/**
	 * 模块上下文件对象
	 */
	var ModuleContext = function(uri) {
			var uri = this.uri = this.id = uri || '/';
			this.resovleUri = function(_uri) {
				return resovleUri(_uri, uri);
			};
			this.require = function(deps, callback) {
				var uriList = depsToUriList(deps, uri);
				var exports = owner.load(uriList, callback); //如果提前预加载则能取到返回值
				return exports && exports.length == 1 ? exports[0] : exports;
			};
			this.exports = {};
			//
			this.declare = null;
			this.deps = null;
			this.loaded = false;
		};

	/**
	 * 当前加载完成的模块的“依赖表”及“声明”栈；
	 */
	var currentlyQueque = [];

	/**
	 * 定义一个模块
	 */
	owner.define = function(_moduleDeps, _moduleDeclare) {
		if(_moduleDeps && _moduleDeclare && (typeof _moduleDeclare == 'function')) {
			currentlyQueque.push({
				moduleDeps: _moduleDeps,
				moduleDeclare: _moduleDeclare
			});
		} else if(_moduleDeps && !_moduleDeclare && (typeof _moduleDeps == 'function')) {
			currentlyQueque.push({
				moduleDeclare: _moduleDeps
			});
		} else if(_moduleDeps && !_moduleDeclare && (typeof _moduleDeps != 'function')) {
			currentlyQueque.push({
				moduleDeclare: function() {
					return _moduleDeps;
				}
			});
		}
	};

	/**
	 * 标识define为amd或emd的实现
	 */
	owner.define.amd = owner.define.emd = owner.define.eamd = {};

	/**
	 * 获取启始模块或文件
	 */
	var getMainFile = function() {
			var scripts = document.getElementsByTagName('script');
			var mainFile = '';
			each(scripts, function() {
				var dataMain = this.getAttribute('data-main');
				if(dataMain) {
					mainFile = dataMain;
					return true;
				}
			});
			return mainFile;
		};

	/**
	 * 如果在浏览器环境
	 */
	if(window) {
		window.define = owner.define;
	}

	/**
	 * 加载启始模块或文件
	 */
	owner.load([getMainFile()]);

})(this.ems);