/**
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
			for(var i in list) {
				var rs = handler.call(list[i], i);
				if(rs) {
					break;
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

	/**
	 * 将一个脚本元素添加DOM结构中
	 */
	var appendToDom = function(element) {
			var container = document.getElementsByTagName('head');
			container = container ? container[0] : document.body;
			//将script添加到页面
			container.appendChild(element);
		};

	/**
	 * 处理事件监听器
	 */
	var handleEventListener = function(element, name, handler) {
			element.addEventListener = element.addEventListener ||
			function(name, fn, useCapture) {
				if(element.attachEvent) element.attachEvent("on" + name, handler);
			};
			element.removeEventListener = element.removeEventListener ||
			function(name, fn, useCapture) {
				if(element.detachEvent) element.detachEvent("on" + name, handler);
			};
			return element;
		};

	/**
	 * 绑定load事件
	 */
	var bindLoadEvent = function(element, handler) {
			handleEventListener(element);
			var loadEventName = element.attachEvent ? "readystatechange" : "load";
			element.addEventListener(loadEventName, handler);
		};

	/**
	 * 加载缓存
	 */
	var moduleCache = {};

	/**
	 * 加载回调链
	 */
	var loadCallbacks = {};

	/**
	 * 加载一个文件
	 */
	var loadOne = function(uri, callback) {
			//如果缓存中存在，直接回调;
			if(moduleCache[uri] != null && callback) {
				callback(moduleCache[uri]);
				return;
			}
			//如果缓存中不存在，并且回调链也已创建，则压入当前callback
			if(loadCallbacks[uri] != null) {
				loadCallbacks[uri].push(callback);
				return;
			};
			//如果缓存中不存在，并且回调链为NULL，则创建回调链，并压入当前callback
			loadCallbacks[uri] = [];
			loadCallbacks[uri].push(callback);
			//
			var element = uri.indexOf('.css') > 0 ? createStyle(uri) : createScript(uri);
			bindLoadEvent(element, function() {
				var moduleContext = new ModuleContext(uri);
				var exports = null;
				if(currentModuleFunction) {
					exports = currentModuleFunction(moduleContext.require, moduleContext.exports, moduleContext);
					exports = exports || moduleContext.exports;
					currentModuleFunction = null;
				}
				moduleCache[uri] = exports;
				//
				each(loadCallbacks[uri], function() {
					this(moduleCache[uri]);
				});
				loadCallbacks[uri] = null;
			});
			appendToDom(element);
		};

	/**
	 * 加载一组文件
	 */
	owner.load = function(uriList, callback) {
		var uriCount = 0;
		each(uriList, function() {
			loadOne(this, function() {
				uriCount += 1;
				if(uriCount >= uriList.length) {
					if(callback) {
						var moduleExports = getModuleExportsFromCache(uriList);
						callback.apply(null, moduleExports);
					}
				}
			});
		});
	};

	var getModuleExportsFromCache = function(uriList) {
			var moduleExports = [];
			each(uriList, function() {
				moduleExports.push(moduleCache[this]);
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
			if(uri.indexOf('http://') == 0 || uri.indexOf('https://') == 0 || uri.indexOf('/') == 0) {
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
			var uri = this.uri = uri || '/';
			this.resovleUri = function(_uri) {
				return resovleUri(_uri, uri);
			};
			this.require = function(deps, callback) {
				owner.load(depsToUriList(deps, uri), callback);
			};
			this.exports = {};
		};

	/**
	 * 当前加载完成的模块实现函数
	 */
	var currentModuleFunction = null;

	/**
	 * 定义一个模块
	 */
	owner.define = function(moduleFunction) {
		currentModuleFunction = moduleFunction;
	};

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