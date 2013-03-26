/**
 * EMS(IMP) v0.3.5
 * Easy Module System: 简洁、易用的模块系统
 * 作者：侯锋
 * 邮箱：admin@xhou.net
 * 网站：http://houfeng.net , http://houfeng.net/ems
 *
 * ***********************< EMS >************************
 *
 * ems 全称为 "Easy Module System" 他还有一个别名叫: "imp";
 * ems 作为 "EMD" 的实现标准范本; 完全符合 "EMD规范";
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
 * ******************************************************
 */

this.ems = this.imp = {};

(function(owner) {

	/**
	 * 遍历数组或对象，return === continue , return object === break
	 */
	var each = function(list, handler) {
		if (!list || !handler) {
			return;
		}
		if ((list instanceof Array) || (list.length && list[0])) {
			var listLength = list.length;
			for (var i = 0; i < listLength; i++) {
				if (list[i]) {
					var rs = handler.call(list[i], i);
					if (rs) break;
				}
			}
		} else {
			for (var i in list) {
				if (list[i]) {
					var rs = handler.call(list[i], i);
					if (rs) break;
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

	/**
	 * 取所有脚本元素
	 */
	var getScriptElements = function() {
		return document.getElementsByTagName('script');
	};

	/**
	 * 获取启始模块或文件
	 */
	var getMainFile = function() {
		var scripts = getScriptElements();
		var mainFile = '';
		each(scripts, function() {
			var dataMain = this.getAttribute('data-main');
			if (dataMain) {
				mainFile = dataMain;
				return true;
			}
		});
		return mainFile;
	};

	/**
	 * 取正在执行的脚本
	 */
	var getInteractiveScript = function() {
		var scripts = getScriptElements();
		var interactiveScript = null;
		each(scripts, function() {
			if (this.readyState === 'interactive') {
				interactiveScript = this;
				return interactiveScript;
			}
		});
		return interactiveScript;
	};

	/**
	 * 元素容器
	 */
	var elementContainer = null;
	/**
	 * 将一个脚本元素添加DOM结构中，脚本容器的获取规则依据优先级是 head > body > parent
	 */
	var appendToDom = function(element) {
		if (!elementContainer) {
			elementContainer = document.getElementsByTagName('head');
			elementContainer = elementContainer && elementContainer[0] ? elementContainer[0] : document.body;
			elementContainer = elementContainer || elementContainer.parent;
		}
		//将script添加到页面
		elementContainer.appendChild(element);
	};

	/**
	 * 处理事件监听器
	 */
	var bindEvent = function(element, name, handler) {
		if (element.addEventListener) {
			element.addEventListener(name, handler);
		} else if (element.attachEvent) {
			element.attachEvent("on" + name, handler);
		}
	};

	/**
	 * 绑定load事件
	 */
	var bindLoadEvent = function(element, handler) {
		if (!element || !handler) return;
		//早期的Safari不支持link的load事件，则直接回调handler
		if ((typeof HTMLLinkElement != 'undefined') && (element instanceof HTMLLinkElement)) {
			handler.apply(element, [{}]);
			return;
		}
		var loadEventName = element.attachEvent ? "readystatechange" : "load";
		bindEvent(element, loadEventName, function() {
			var readyState = element.readyState || "loaded";
			if (readyState == "loaded" || readyState == "interactive" || readyState == "complete") {
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
		'module': {
			loaded: true,
			exports: 'module'
		}
	};
	owner.moduleTable = moduleTable;

	/**
	 * 保存模块
	 */
	var saveModule = function(uri, currently) {
		if (!moduleTable[uri]) return;
		moduleTable[uri].loading = true;
		moduleTable[uri].deps = currently.moduleDeps;
		moduleTable[uri].declare = currently.moduleDeclare;
		moduleTable[uri].declareDeps = currently.declareDeps; //类似CommonJS的依赖表
		//清空currently
		currently = null;
		//处理模块静态依赖开始
		moduleTable[uri].require(moduleTable[uri].deps, function() {
			var imports = arguments;
			//处理类CommonJS方式的依赖开始
			moduleTable[uri].require(moduleTable[uri].declareDeps, function() {
				setTimeout(function() {
					if (moduleTable[uri].declare) {
						var args = [];
						for (var i = 0; i < imports.length; i++) {
							if (imports[i] == 'require') imports[i] = moduleTable[uri].require;
							if (imports[i] == 'exports') imports[i] = moduleTable[uri].exports;
							if (imports[i] == 'module') imports[i] = moduleTable[uri];
							args.push(imports[i]);
						}
						args.push(moduleTable[uri].require);
						args.push(moduleTable[uri].exports);
						args.push(moduleTable[uri]);
						var retExports = moduleTable[uri].declare.apply(moduleTable[uri], args);
						moduleTable[uri].exports = retExports || moduleTable[uri].exports;
					}
					//
					each(moduleTable[uri].loadCallbacks, function() {
						this(moduleTable[uri].exports);
					});
					moduleTable[uri].loaded = true;
					moduleTable[uri].loadCallbacks = null;
				}, 0);
			}); //处理类CommonJS方式的依赖结束
		}); //处理模块静态依赖结束
	};

	/**
	 * 加载一个文件
	 */
	var loadOne = function(uri, callback) {
		if (moduleTable[uri] == null) {
			moduleTable[uri] = new ModuleContext(uri);
		}
		//如果缓存中存在，直接回调;
		if (moduleTable[uri].loaded && callback) {
			callback(moduleTable[uri].exports);
			return moduleTable[uri].exports;
		}
		//如果缓存中不存在，并且回调链也已创建，则压入当前callback,然后返回，等待回调
		if (moduleTable[uri].loadCallbacks != null) {
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
			if (!moduleTable[uri].loaded && !moduleTable[uri].loading) {
				var currently = currentlyQueque.shift() || {};
				saveModule(uri, currently);
			}
		});
		//
		appendToDom(moduleTable[uri].element);
	};

	/**
	 * 加载一组文件
	 */
	owner.load = function(deps, callback, baseUri) {
		var uriList = depsToUriList(deps, baseUri);
		var exportsList = null;
		var uriCount = 0;
		if (uriList && uriList.length > 0) {
			each(uriList, function() {
				loadOne(this, function() {
					uriCount += 1;
					if (uriCount < uriList.length) return;
					exportsList = getModuleExportsFromCache(uriList);
					if (callback) callback.apply(exportsList || {}, exportsList);
				});
			});
		} else {
			if (callback) callback.apply(exportsList || {}, exportsList);
		}
		return exportsList && exportsList.length == 1 ? exportsList[0] : exportsList;
	};

	/**
	 * 从缓存中取得模块
	 */
	var getModuleExportsFromCache = function(uriList) {
		var moduleExports = [];
		each(uriList, function() {
			if (moduleTable[this]) {
				moduleExports.push(moduleTable[this].exports);
			}
		});
		return moduleExports;
	};

	/**
	 * 检查是不是系统模块
	 */
	var isSystemModule = function(uri) {
		return (uri == 'require' || uri == 'exports' || uri == 'module');
	};

	/**
	 * 转换路径为绝对路径
	 */
	var resovleUri = function(uri, baseUri) {
		if (uri.indexOf('http://') == 0 || uri.indexOf('https://') == 0 || uri.indexOf('/') == 0 || isSystemModule(uri)) {
			return uri;
		}
		//
		var uriParts = uri.split('/');
		var baseDir = baseUri.substring(0, baseUri.lastIndexOf('/'));
		var newUriParts = baseDir.length > 0 ? baseDir.split('/') : [];
		each(uriParts, function() {
			if (this == '..') {
				newUriParts.pop();
			} else if (this == '.') {
				//No Handle
			} else {
				newUriParts.push(this);
			}
		});
		return newUriParts.join('/');
	};

	/**
	 * 处理默认扩展名
	 */
	var handleExtension = function(uri) {
		if (isSystemModule(uri)) return uri;
		var fileName = uri.substring(uri.lastIndexOf('/'), uri.length);
		if (fileName.indexOf('?') < 0 && fileName.indexOf('#') < 0 && fileName.indexOf('.') < 0) {
			uri += (extension || ".js");
		}
		return uri;
	};

	/**
	 * 字符串转为字符串数组
	 */
	var stringToStringArray = function(str) {
		if (str == null) return [];
		if ((typeof str) == 'string') {
			str = [str];
		}
		return str;
	};

	/**
	 * 转换一组依赖为绝对路径
	 */
	var depsToUriList = function(deps, baseUri) {
		deps = stringToStringArray(deps);
		var absUriList = [];
		each(deps, function() {
			var uri = aliasTable[this] || this;
			uri = handleExtension(uri);
			uri = resovleUri(uri, baseUri || location.href);
			absUriList.push(uri);
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
			return owner.load(deps, callback, uri); //如果提前预加载则能取到返回值
		};
		this.exports = {};
		this.declare = null;
		this.deps = null;
		this.loaded = false;
	};

	/**
	 * 当前加载完成的模块的“依赖表”及“声明”栈；
	 */
	var currentlyQueque = [];

	/**
	 * 创建当前上下文模块信息对象
	 */
	var createCurrently = function(_moduleId, _moduleDeps, _moduleDeclare) {
		var currently = null;
		if (_moduleDeps && _moduleDeclare) { //define(a,b,c);
			currently = {
				moduleDeps: _moduleDeps,
				moduleDeclare: _moduleDeclare
			};
		} else if (_moduleId && _moduleDeps) { //define(a,b)
			currently = {
				moduleDeps: _moduleId,
				moduleDeclare: _moduleDeps
			};
		} else if (_moduleId && _moduleDeclare) { //define(a,null,b)
			currently = {
				moduleDeps: _moduleDeps,
				moduleDeclare: _moduleDeclare
			};
		} else if (_moduleId) { // define(a)
			currently = {
				moduleDeclare: _moduleId
			};
		}
		return currently;
	};

	/**
	 * 匹配代码内部的类CommonJs的依赖方式
	 */
	var matchRequire = function(src) {
		var rs = [];
		var regx = /require\s*\(\s*[\"|\'](.+?)[\"|\']\s*\)\s*[;|,]/gm;
		var mh = null;
		while (mh = regx.exec(src)) {
			if (mh && mh[1] && mh[1].indexOf('"') < 0 && mh[1].indexOf("'") < 0) {
				rs.push(mh[1]);
			}
		}
		return rs;
	};
	//owner.matchRequire = matchRequire;

	/**
	 * 定义一个模块
	 * ems符合EMD规范(不对持moduleId), define还保留moduleId参数是为了兼容AMD规范模块，但在EMD中id将被忽略；
	 */
	owner.define = function(_moduleId, _moduleDeps, _moduleDeclare) {
		var currently = createCurrently(_moduleId, _moduleDeps, _moduleDeclare);
		if (currently) {
			//如果模块是一个JSON对象
			if (typeof currently.moduleDeclare != 'function') {
				var obj = currently.moduleDeclare;
				currently.moduleDeclare = function() {
					return obj;
				};
			}
			//处理模块代码中的类CommonJS的依赖方式
			var declareDeps = matchRequire(currently.moduleDeclare.toString());
			if (declareDeps && declareDeps.length > 0) {
				currently.declareDeps = declareDeps;
			}
			//如在此时能取到模块URL则保存模块，否则，将模块描述压入队列在script的load中处理
			var iScript = getInteractiveScript();
			if (iScript) {
				var uri = iScript.getAttribute('src');
				saveModule(uri, currently);
			} else {
				currentlyQueque.push(currently);
			}
		}
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
		extension = extension || option.extension;
	};

	var aliasTable = {};
	var extension = ".js";

	/**
	 * 标识define为amd或emd的实现
	 */
	owner.define.amd = owner.define.emd = owner.define.eamd = {};

	/**
	 * 如果在浏览器环境
	 */
	if (window) {
		window.define = owner.define;
	}

	/**
	 * 加载启始模块或文件
	 */
	var mainFile = getMainFile();
	if (mainFile && mainFile != '') {
		owner.load(mainFile);
	}

})(this.ems);