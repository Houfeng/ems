/**
 *
 * emsjs v1.2.2
 * 作者：侯锋
 * 邮箱：admin@xhou.net
 * 网站：http://houfeng.net , http://houfeng.net/ems
 *
 * emsjs 是一个符合 AMD 规范的浏览器端 JavaScript 模块加载器，兼容所有主流浏览器。
 *
 **/
(function(owner) {

    /*****************************  工具函数开始  *****************************/
    /**
     * 检查是否为null或undefined
     */
    function isNull(obj) {
        return (obj === null) || (typeof obj === 'undefined');
    }

    /**
     * 检查是否是数组
     */
    function isArray(obj) {
        return (obj instanceof Array) || (obj && obj.length && obj[0]);
    }

    /**
     * 遍历数组或对象，return === continue , return object === break
     */
    function each(list, handler) {
        if (!list || !handler) return;
        if (isArray(list)) {
            var listLength = list.length;
            for (var i = 0; i < listLength; i++) {
                if (isNull(list[i])) continue;
                var rs1 = handler.call(list[i], i, list[i]);
                if (!isNull(rs1)) return rs1;
            }
        } else {
            for (var key in list) {
                if (isNull(list[key])) continue;
                var rs2 = handler.call(list[key], key, list[key]);
                if (!isNull(rs2)) return rs2;
            }
        }
    }

    /**
     * 从字符串开头匹配
     */
    function startWith(str1, str2) {
        return str1 && str2 && str1.indexOf(str2) === 0;
    }

    /**
     * 是否包含
     */
    function contains(str1, str2) {
        return str1 && str2 && str1.indexOf(str2) > -1;
    }

    /**
     * 替换所有
     **/
    function replaceAll(str, str1, str2) {
        if (isNull(str)) return str;
        return str.replace(new RegExp(str1, 'g'), str2);
    }

    /**
     * 异步方法
     */
    function async(fn) {
        setTimeout(fn, 0);
    }

    /**
     * 字符串转为字符串数组
     */
    function stringToStringArray(str) {
        if (isNull(str)) return [];
        if ((typeof str) == 'string') {
            str = [str];
        }
        return str;
    }

    /**
     * 清除注释
     */
    function removeComments(code) {
        return code.replace(/(?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$)/g, '\n')
            .replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '\n');
    }

    /**
     * 匹配代码内部的类CommonJs的依赖方式
     */
    function matchRequire(src) {
        src = src.replace(/\/\*[\w\W]*?\*\//gm, ';').replace(/^\/\/.*/gi, ';');
        src = removeComments(src);
        var foundArray = [];
        var regx = /require\s*\(\s*[\"|\'](.+?)[\"|\']\s*\)\s*[;|,|\n|\}|\{|\[|\]|\.|\)|\(|\||\&|\+|\-|\*|\/|\<|\>|\=|\?|\:|\%|\$|\_|\!|\"|\'|\~|\^]/gm;
        var match = null;
        while (match = regx.exec(src)) {
            if (match && match[1] && !contains(match[1], '"') && !contains(match[1], "'")) {
                foundArray.push(match[1]);
            }
        }
        return foundArray;
    }

    owner.match = matchRequire;

    /*****************************  DOM 函数开始  *****************************/

    /**
     * 创建一个脚本元素
     */
    function createScript(uri) {
        var scriptElement = document.createElement('script');
        scriptElement.src = uri;
        scriptElement.async = true;
        scriptElement.defer = true;
        scriptElement.type = "text/javascript";
        return scriptElement;
    }

    /**
     * 创建一个外联样式元素
     */
    function createStyle(uri) {
        var styleElement = document.createElement('link');
        styleElement.href = uri;
        styleElement.type = "text/css";
        styleElement.rel = "stylesheet";
        return styleElement;
    }

    /**
     * 取所有脚本元素
     */
    function getScriptElements() {
        return document.getElementsByTagName('script');
    }

    /**
     * 获取启始模块或文件
     */
    function getMainFile() {
        var scripts = getScriptElements();
        return each(scripts, function() {
            return this.getAttribute('data-main');
        });
    }

    /**
     * 取正在执行的脚本
     */
    function getInteractiveScript() {
        var scripts = getScriptElements();
        return each(scripts, function() {
            if (this.readyState === 'interactive') {
                return this;
            }
        });
    }

    /**
     * 元素容器
     */
    var elementContainer = null;

    /**
     * 将一个脚本元素添加DOM结构中，脚本容器的获取规则依据优先级是 head > body > parent
     */
    function appendToDom(element) {
        if (!elementContainer) {
            elementContainer = document.getElementsByTagName('head');
            elementContainer = elementContainer && elementContainer[0] ? elementContainer[0] : document.body;
            elementContainer = elementContainer || elementContainer.parent;
        }
        elementContainer.appendChild(element);
    }

    /**
     * 处理事件监听器
     */
    function bindEvent(element, name, handler) {
        if (element.addEventListener) {
            element.addEventListener(name, handler);
        } else if (element.attachEvent) {
            element.attachEvent("on" + name, handler);
        }
    }

    /**
     * 绑定load事件
     */
    function bindLoadEvent(element, handler) {
        if (!element || !handler) return;
        //早期的Safari不支持link的load事件，则直接回调handler
        if ((typeof HTMLLinkElement !== 'undefined') && (element instanceof HTMLLinkElement)) {
            handler.apply(element, [{}]); //参数为{},是为了让加载css时返回一个“空对象”
            return;
        }
        var loadEventName = element.attachEvent ? "readystatechange" : "load";
        bindEvent(element, loadEventName, function() {
            var readyState = element.readyState || "loaded";
            if (readyState == "loaded" || readyState == "interactive" || readyState == "complete") {
                handler.apply(element, arguments || []);
            }
        });
    }

    /*****************************  公共配置开始  *****************************/

    /**
     * 超时最大时间（毫稍）
     **/
    var maxLoadTime = owner.maxLoadTime = 15000;

    /**
     * 选项配置
     */
    var options = owner.options = {};

    /**
     * 默认扩展名
     **/
    var extension = owner.extension = ".js";

    /**
     * 别名列表
     */
    var alias = owner.alias = {};

    /**
     * 包列表
     * @type {Object}
     */
    var packages = owner.packages = {};

    /**
     * 模块列表
     **/
    var modules = owner.modules = {
        "require": {
            id: "require",
            loading: true,
            saved: true,
            loaded: true,
            executed: true,
            exports: {}
        },
        "exports": {
            id: "exports",
            loading: true,
            saved: true,
            loaded: true,
            executed: true,
            exports: {}
        },
        "module": {
            id: "module",
            loading: true,
            saved: true,
            loaded: true,
            executed: true,
            exports: {}
        }
    };

    /**
     * 配置
     */
    owner.config = function(_options) {
        if (_options === null) return options;
        _options = _options || {};
        _options.alias = _options.alias || _options.paths || {};
        each(_options.alias, function(name, value) { //防止覆盖已添加的别名
            alias[name] = value;
        });
        _options.packages = _options.packages || [];
        each(_options.packages, function(name, value) { //防止覆盖已添加的包
            value.name = value.name || name;
            packages[value.name] = value;
        });
        extension = extension || _options.extension;
        options = _options;
    };

    /*****************************  路径函数开始  *****************************/

    /**
     * 检查是不是系统模块
     */
    function isSystemModule(uri) {
        return (uri == 'require' || uri == 'exports' || uri == 'module');
    }

    /**
     * 是否开头匹配一种URI协议
     */
    function startWithUriProtocol(uri) {
        if (startWith(uri, 'http://') || startWith(uri, 'https://') || startWith(uri, 'file://')) {
            return true;
        } else {
            var regx1 = /^\S+?:\//ig;
            var regx2 = /^\S+?:\\/ig;
            return regx1.test(uri) || regx2.test(uri);
        }
    }

    /**
     * 是否开头匹配根路径
     */
    function startWithPathRoot(uri) {
        return startWith(uri, '/') || startWith(uri, '\\');
    }

    /**
     * 转换路径为绝对路径
     */
    function _resovleUri(uri, baseUri) {
        if (isNull(uri) || isNull(baseUri) || startWithUriProtocol(uri) || startWithPathRoot(uri) || isSystemModule(uri)) {
            return uri;
        }
        //替换Window下的的路径分隔符
        uri = replaceAll(uri, '\\\\', '/');
        baseUri = replaceAll(baseUri, '\\\\', '/');
        //
        baseUri = baseUri.split('?')[0].split('#')[0];
        var baseDir = baseUri.substring(0, baseUri.lastIndexOf('/'));
        var uriParts = uri.split('#')[0].split('/');
        var uriHash = uri.split('#')[1];
        var newUriParts = baseDir.length > 0 ? baseDir.split('/') : [];
        each(uriParts, function(i, part) {
            if (part == '..') {
                newUriParts.pop();
            } else if (part == '.') {
                //No Handle
            } else {
                newUriParts.push(part);
            }
        });
        return newUriParts.join('/') + (uriHash ? '#' + uriHash : '');
    }

    /**
     * 转换路径为绝对路径，此方将处理插件，内部调用 _resovleUri
     **/
    function resovleUri(_uri, baseUri, notHandleExt) {
        if (isNull(_uri) || isNull(baseUri)) return _uri;
        var uriParts = _uri.split('!'); //处理带插件URI
        var rs = [];
        each(uriParts, function(i, part) {
            var uri = alias[part] || part;
            uri = handlePackages(uri);
            uri = _resovleUri(uri, baseUri);
            if (!notHandleExt) uri = handleExtension(uri);
            rs.push(uri);
        });
        return rs.join('!');
    }

    /**
     * 处理默认扩展名
     */
    function handleExtension(uri) {
        if (isSystemModule(uri)) return uri;
        var fileName = uri.substring(uri.lastIndexOf('/') + 1, uri.length);
        if (!isNull(uri) && !isNull(fileName) && uri !== "" && !contains(uri, '?') && !contains(uri, '#') && fileName !== "" && !contains(fileName, '.')) {
            uri += (extension || ".js");
        }
        return uri;
    }

    /**
     * 处理包
     */
    function handlePackages(uri) {
        var index = uri.indexOf('/');
        if (index < 0) index = uri.length;
        var part1 = uri.substr(0, index);
        var part2 = uri.substr(index + 1, uri.length);
        each(packages, function(name, pack) {
            if (part1 == pack.name) {
                part1 = pack.location || part1;
                part2 = part2 || pack.main || '';
                if (part1[part1.length - 1] == '/') {
                    part1 = part1.substring(0, part1.lastIndexOf('/'));
                }
                if (part2[0] == '/') {
                    part2 = part2.substring(1, part2.length);
                }
                uri = part1 + '/' + part2;
            }
        });
        return uri;
    }

    /**
     * 转换一组依赖为绝对路径
     */
    function depsToUriList(deps, baseUri) {
        baseUri = baseUri || location.href;
        deps = stringToStringArray(deps);
        var absUriList = [];
        each(deps, function(i, dep) {
            var uri = resovleUri(dep, baseUri);
            absUriList.push(uri);
        });
        return absUriList;
    }

    /*****************************  模块函数开始  *****************************/

    /**
     * 将加载上下文信息应用到 module 上
     **/
    function applyLoadContextToModule(module, context) {
        module.deps = context.deps;
        module.factory = context.factory;
        module.factoryDeps = context.factoryDeps; //类似CommonJS的依赖表
        context = null; //清除 context
        return module;
    }

    /**
     * 保存模块
     */
    function saveModule(uri, context) {
        var module = modules[uri];
        if (!module) return;
        applyLoadContextToModule(module, context);
        module.saved = true;
        //处理模块静态依赖开始
        module.load(module.deps, function() {
            module.imports = arguments || []; //将作为 define 的参数
            async(function() {
                //处理类CommonJS方式的依赖开始
                module.load(module.factoryDeps, function() {
                    async(function() {
                        //生成模块的待执行函数
                        module.execute = function() {
                            if (module.executed || isNull(module.factory)) {
                                return module.exports;
                            }
                            //处理传递给 factory 的参数
                            var srcImports = module.imports;
                            var dstImports = [];
                            for (var i = 0; i < srcImports.length; i++) {
                                if (srcImports[i].id == 'require') {
                                    dstImports.push(module.require);
                                } else if (srcImports[i].id == 'exports') {
                                    dstImports.push(module.exports);
                                } else if (srcImports[i].id == 'module') {
                                    dstImports.push(module);
                                } else {
                                    srcImports[i].execute();
                                    dstImports.push(srcImports[i].exports);
                                }
                            }
                            dstImports.push(module.require);
                            dstImports.push(module.exports);
                            dstImports.push(module);
                            module.imports = dstImports;
                            //
                            var returnObject = module.factory.apply(module, module.imports);
                            module.exports = returnObject || module.exports;
                            module.executed = true;
                            return module.exports;
                        };
                        //处理回调列表
                        each(module.loadCallbacks, function(i, callback) {
                            callback(module);
                        });
                        //检查并出发加载完成事件
                        if (owner.onLoad) owner.onLoad(module);
                        //标记录加载完成
                        module.loaded = true;
                        module.loadCallbacks = null;
                        //清楚超时检查定时器
                        if (module.timer) {
                            clearTimeout(module.timer);
                        }
                    });
                }); //处理类CommonJS方式的依赖结束，CommonJS 将延迟执行（在 x=require(...) 时执行）
            });
        }); //处理模块静态依赖结束
    }

    /**
     * 加载一个文件
     */
    function _loadOne(uri, callback, baseUri) {
        //如果加载一个新模块，则创建模块上下文对象
        modules[uri] = modules[uri] || new Module(uri);
        var module = modules[uri];
        //如果加载完成就直接回调;
        if (module && module.saved && callback) {
            callback(module);
            return module;
        }
        //如果缓存中不存在，并且回调链也已创建，则压入当前callback,然后返回，等待回调
        if (module && !isNull(module.loadCallbacks)) {
            module.loadCallbacks.push(callback);
            return;
        }
        //如果缓存中不存在，并且回调链为NULL，则创建回调链，并压入当前callback
        module.loadCallbacks = [];
        module.loadCallbacks.push(callback);
        //创建无素
        module.element = contains(uri, '.css') ? createStyle(uri) : createScript(uri);
        //绑定load事件,模块下载完成，执行完成define，会立即触发load
        bindLoadEvent(module.element, function() {
            if (!module.loaded && !module.saved) {
                var context = loadContextQueque.shift() || {};
                saveModule(uri, context);
            }
        });
        //创建超时计时器
        module.timer = setTimeout(function() {
            throw "加载 " + uri + " 超时,可能存在 '无法处理的循环依赖、脚本错误、其它未知问题'";
        }, maxLoadTime);
        //
        module.loading = true;
        //添加到 DOM 中
        appendToDom(module.element);
    }

    /**
     * 加载一个模块，会检测是否使用了插件，内部调用 _loadOne
     **/
    function loadOne(uri, callback, baseUri) {
        if (!contains(uri, '!')) {
            return _loadOne(uri, callback, baseUri);
        } else {
            //带插件的URL
            var splitIndex = uri.lastIndexOf('!');
            var pluginUri = uri.substring(0, splitIndex);
            var moduleUri = uri.substring(splitIndex + 1);
            //检查是否已加载
            var module = modules[moduleUri];
            if (module && module.loaded) {
                if (callback) callback(module);
                return module;
            }
            //处理使用插件的引用
            return loadOne(pluginUri, function(pluginModule) {
                if (pluginModule && pluginModule.saved && !pluginModule.executed && pluginModule.execute) {
                    pluginModule.execute();
                }
                var plugin = pluginModule.exports;
                if (!plugin || !plugin.load) {
                    throw "插件 '" + pluginUri + "' 存在错误."
                };
                var onLoad = function(_exports) {
                    var module = modules[moduleUri] = {
                        exports: _exports,
                        executed: true,
                        loaded: true,
                        loading: true,
                        saved: true
                    };
                    if (callback) callback(module);
                };
                onLoad.fromText = onLoad;
                onLoad.error = onLoad;
                /**
                 * 调用插件方法。
                 * load: function (name, parentRequire, onload, config)
                 * 因为 moduleUri 是已转换过的 这里 parentRequire 暂先传递 pluginModule.require
                 */
                var parentModule = modules[baseUri] || pluginModule || owner;
                plugin.load(moduleUri, parentModule.require, onLoad, owner.config());
            });
        }
    }

    /**
     * 加载一组文件
     */
    owner.load = function(deps, callback, baseUri) {
        var uriList = depsToUriList(deps, baseUri);
        var moduleList = [];
        var uriCount = 0;
        if (uriList && uriList.length > 0) {
            each(uriList, function(i, uri) {
                loadOne(uri, function() {
                    uriCount += 1;
                    if (uriCount < uriList.length) return;
                    moduleList = getModulesFromCache(uriList) || moduleList;
                    if (callback) callback.apply(moduleList, moduleList);
                }, baseUri);
            });
        } else {
            if (callback) callback.apply(moduleList, moduleList);
        }
        return moduleList;
    };

    /**
     * 卸载一组文件
     */
    owner.unload = function(deps, baseUri) {
        var uriList = depsToUriList(deps, baseUri);
        each(uriList, function(i, uri) {
            var module = modules[uri];
            if (module) {
                module.element.parentNode.removeChild(module.element);
                module.element = null;
                module = null;
            }
        });
    };

    /**
     * 将一组 module 转换为一组 exports
     **/
    function moduleListToExportList(moduleList) {
        var exportsList = [];
        each(moduleList, function(i, module) {
            if (module && module.saved && !module.executed && module.execute) {
                module.execute();
            }
            exportsList.push(module.exports);
        });
        return exportsList;
    };

    /**
     * 全局 Require
     */
    owner.require = function(deps, callback, baseUri) {
        var moduleList = owner.load(deps, function() {
            var moduleList = arguments;
            var exportsList = moduleListToExportList(moduleList);
            if (callback) callback.apply(exportsList, exportsList);
        }, baseUri);
        var exportsList = moduleListToExportList(moduleList);
        return exportsList && exportsList.length == 1 ? exportsList[0] : exportsList;
    };

    /**
     * 从缓存中取得模块
     */
    function getModulesFromCache(uriList) {
        var foundModules = [];
        each(uriList, function(i, uri) {
            //如果 URL 中包括插件信息，则提取出不包括插件的 “模块” URI
            var moduleUri = uri.split('!')[1] || uri || '';
            var module = modules[moduleUri]
            if (module) {
                foundModules.push(module);
            }
        });
        return foundModules;
    }

    /**
     * 模块对象
     */
    function Module(uri) {
        var self = this;
        var moduleUri = self.uri = self.id = uri || '/';
        self.resovleUri = function(_uri, baseUri, doNotHandleExt) {
            return resovleUri(_uri, baseUri || moduleUri, doNotHandleExt);
        };
        self.load = function(deps, callback) {
            return owner.load(deps, callback, uri); //如果提前预加载则能取到返回值
        };
        self.unload = function(deps) {
            return owner.unload(deps, uri);
        };
        self.require = function(deps, callback) {
            return owner.require(deps, callback, uri); //如果提前预加载则能取到返回值
        };
        self.require.toUrl = self.require.resovleUri = function(_uri, baseUri, doNotHandleExt) {
            return self.resovleUri(_uri, baseUri, doNotHandleExt);
        };
        self.require.defined = function(_uri) {
            return modules[_uri].loaded;
        };
        self.require.specified = function(_uri) {
            return modules[_uri].loaded || !isNull(modules[_uri].loadCallbacks);
        };
        this.exports = {};
        this.factory = null;
        this.deps = null;
        this.factoryDeps = null;
        this.loading = false;
        this.loaded = false;
        this.executed = false;
        this.saved = false;
    }

    /**
     * 当前加载的上下文对象栈；
     */
    var loadContextQueque = [];

    /**
     * 创建加载上下文件信息对象
     */
    function createLoadContext(id, deps, factory) {
        var loadContext = null;
        if (deps && factory) { //define(a,b,c);
            loadContext = {
                "id": id,
                "deps": deps,
                "factory": factory
            };
        } else if (id && deps) { //define(a,b)
            loadContext = {
                "deps": id,
                "factory": deps
            };
        } else if (id && factory) { //define(a,null,b)
            loadContext = {
                "deps": deps,
                "factory": factory
            };
        } else if (id) { // define(a)
            loadContext = {
                "factory": id
            };
        }
        return loadContext;
    }

    /**
     * 定义一个模块
     * ems符合EMD规范(不对持moduleId), define还保留moduleId参数是为了兼容AMD规范模块，但在EMD中id将被忽略；
     */
    owner.define = function(id, deps, factory) {
        var context = createLoadContext(id, deps, factory);
        if (context) {
            //如果模块是一个JSON对象
            if (typeof context.factory != 'function') {
                var jsonObject = context.factory;
                context.factory = function() {
                    return jsonObject;
                };
            }
            //处理模块代码中的类CommonJS的依赖方式
            var code = context.factory.toString();
            var factoryDeps = matchRequire(code);
            if (factoryDeps && factoryDeps.length > 0) {
                context.factoryDeps = factoryDeps;
            }
            //如在此时能取到模块URL则保存模块，否则，将模块描述压入队列在script的load中处理
            var iScript = getInteractiveScript();
            if (iScript) {
                var uri = iScript.getAttribute('src');
                saveModule(uri, context);
            } else {
                loadContextQueque.push(context);
            }
        }
    };

    /**
     * 处理路径
     **/
    owner.resovleUri = function(uri, baseUri) {
        return resovleUri(uri, baseUri || location.href);
    };

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
    if (!isNull(mainFile) && mainFile !== '') {
        owner.require(mainFile);
    }

    /**
     * 标识define为amd或emd的实现
     */
    owner.define.amd = owner.define.emd = owner.define.eamd = {};

})(this.ems = {});
//