/**
 * emsjs v1.3.2
 * 作者：侯锋
 * 邮箱：admin@xhou.net
 * 网站：http://houfeng.net , http://houfeng.net/ems
 *
 * emsjs 是一个符合 AMD 规范的浏览器端 JavaScript 模块加载器，兼容主流浏览器。
 **/

(function(env) {

    /**
     * ems 全局对象本身是一个 function ，内部调用自身的方法 (ems.require);
     */
    var owner = (env.ems = function(deps, callback, baseUri) {
        return owner.require(deps, callback, baseUri);
    });

    /**
     * 版本信息
     */
    owner.version = "v1.3.2";

    /**
     * 作者信息
     */
    owner.author = "Houfeng";

    /*****************************  工具函数开始  *****************************/

    /**
     * 某此公开的工具函数会挂载到这个对象上，一般用于开发或调式
     */
    owner.tool = {};

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
        if (isNull(obj)) return false;
        var v1 = Object.prototype.toString.call(obj) === '[object Array]';
        var v2 = obj instanceof Array;
        var v3 = !isString(obj) && isNumber(obj.length) && isFunction(obj.splice);
        var v4 = !isString(obj) && isNumber(obj.length) && obj[0];
        return v1 || v2 || v3 || v4;
    }

    /**
     * 检查是否是数字
     */
    function isNumber(obj) {
        if (isNull(obj)) return false;
        return typeof obj === 'number' || obj instanceof Number;
    }

    /**
     * 检查是否是函数
     */
    function isFunction(obj) {
        return !isNull(obj) && typeof(obj) === 'function';
    }

    /**
     * 检查是否是字符串
     */
    function isString(obj) {
        return !isNull(obj) && typeof(obj) === 'string';
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
        return !isNull(str1) && !isNull(str2) && str1.indexOf(str2) === 0;
    }

    /**
     * 是否包含
     */
    function contains(str1, str2) {
        return !isNull(str1) && !isNull(str2) && str1.indexOf(str2) > -1;
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
        return setTimeout(fn, 0);
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
    owner.tool.matchRequire = matchRequire;

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
        //早期的Safari不支持link的load事件，暂不判断浏览器，粗暴的针对css，直接回调handler
        if ((typeof HTMLLinkElement !== 'undefined') && (element instanceof HTMLLinkElement)) {
            //因为 css 直接执行事件处理函数 handler 加 async 防阻塞
            async(function() {
                handler.apply(element, [{}]); //参数为{},是为了让加载css时返回一个“空对象”
            });
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
     * 选项配置
     */
    var options = owner.options = {};

    /**
     * 默认扩展名
     **/
    options.extension = ".js";

    /**
     * 超时最大时间,0 代表不进行超进检查（单位:毫秒）
     **/
    options.maxLoadTime = 10000;

    /**
     * 是否禁用循环依赖
     **/
    options.disabledCircularDependency = false;

    /**
     * 公共配置节
     **/
    options.settings = {};

    /**
     * 别名列表 (在 owner 上挂载对应属性)
     */
    var alias = owner.alias = owner.paths = options.alias = options.paths = {};

    /**
     * 包列表 (在 owner 上挂载对应属性)
     * @type {Object}
     */
    var packages = owner.packages = options.packages = {};

    /**
     * 垫片列表 (在 owner 上挂载对应属性)
     * @type {Object}
     */
    var shim = owner.shim = options.shim = {};

    var shimTable = {};

    /**
     * 模块列表，默包含系统模块（系模块在执行时会被转换为实际有效的 factory 参数）
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
        //通过从 _options 向 options 拷贝的方式支持 “简单的多处配置”
        //
        //处理别名配置
        _options.alias = _options.alias || _options.paths || {};
        each(_options.alias, function(name, value) { //防止覆盖已添加的别名
            var key = value.name || name;
            alias[key] = value;
        });
        //处理垫片配置
        _options.shim = _options.shim || {};
        each(_options.shim, function(name, value) { //防止覆盖已添加垫片配置
            var key = value.name || name;
            shim[key] = value;
        });
        //处理包配置
        _options.packages = _options.packages || [];
        each(_options.packages, function(name, value) { //防止覆盖已添加的包
            var key = value.name || name;
            packages[value.name] = value;
        });
        //公共配置节
        _options.settings = _options.settings || {};
        each(_options.settings, function(name, value) { //防止覆盖已添加公共配置
            var key = value.name || name;
            options.settings[value.name] = value;
        });
        //处理其它配置
        options.extension = options.extension || _options.extension;
        options.baseUri = options.baseUri || _options.baseUri || _options.baseUrl;
        options.maxLoadTime = options.maxLoadTime || _options.maxLoadTime;
        options.disabledCircularDependency = _options.disabledCircularDependency;
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
        if (isNull(_uri) || isNull(baseUri)) {
            return _uri;
        }
        var uriParts = _uri.split('!'); //处理带插件URI
        var rs = [];
        each(uriParts, function(i, part) {
            var uri = handleAliasAndShim(part); //处理别名及垫片,别名在前，可指向包
            uri = handlePackages(uri); //处理包
            uri = _resovleUri(uri, baseUri); //计算路径
            if (!notHandleExt) {
                uri = handleExtension(uri);
            }
            rs.push(uri);
        });
        return rs.join('!');
    }

    /**
     * 处理别名及垫片,垫片指向的 uri 或同名的 “别名” 必须指向一个文件
     */
    function handleAliasAndShim(uri) {
        if (isNull(uri) || isSystemModule(uri)) {
            return uri;
        }
        //查找别名配置
        var realUri = alias[uri] || uri;
        //如果别名配置的值是一个 ｛name:'',uri:''｝的配置
        realUri = realUri.uri || realUri || uri;
        //查找垫片
        var shimItem = shim[uri];
        if (shimItem != null) {
            //如果垫片配置了指定的Uri
            var realUri = shimItem.uri || realUri;
            shimTable[realUri] = shimItem;
        }
        return realUri;
    }

    /**
     * 处理默认扩展名
     */
    function handleExtension(uri) {
        if (isNull(uri) || isSystemModule(uri)) {
            return uri;
        }
        var fileName = uri.substring(uri.lastIndexOf('/') + 1, uri.length);
        var isPath = isNull(fileName) || fileName === '';
        if (isPath) return uri;
        //
        if (!contains(uri, '?') && !contains(uri, '#') && !contains(fileName, '.')) {
            uri += options.extension;
        }
        return uri;
    }

    /**
     * 处理包
     */
    function handlePackages(uri) {
        if (isSystemModule(uri)) {
            return uri;
        }
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
        baseUri = baseUri || options.baseUri || location.href;
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
        module.id = context.id || module.id;
        module.deps = context.deps || module.deps;
        module.factory = context.factory || module.factory || function() {};
        module.factoryDeps = context.factoryDeps || module.factoryDeps; //类似CommonJS的依赖表
        module.executed = false;
        context = null; //清除 context
        return module;
    }

    /**
     * 保存模块
     */
    function saveModule(uri, context) {
        var module = modules[uri];
        if (isNull(module)) return;
        applyLoadContextToModule(module, context);
        module.saved = true;

        //生成模块的待执行函数
        module.execute = function() {
            //如果存在 factory 
            if (!module.executed && isFunction(module.factory)) {
                /*
                将模块的执行状态设定为 true。
                1）因为 execute 是同步方法，不会出现 executed 已置为 true 
                   但是没执行完时被 require 而出理引用失败。
                2）因为 execute 需要级联执行静态依赖的模块，为支持循环依赖，执行
                   一开始，在级联调用 execute 之前，就需要将 executed 置为 true
                   以避免出现无限循环调用，因为级联调用时，如果出现循环依赖，
                   标准AMD 导入或者在 factory 可直接执行到的 commonjs require，
                   会导入一个空对象（{}）, 而在 exports 的某一个方法中的 require
                   因为 execute 已经完成可以正确拿到依赖的 exports，或者导入一个
                   未执行模块，即时调用 execute , 因为 execute 为同步方法，同样可
                   以正确拿到 exports
                */
                module.executed = true;
                //处理传递给 factory 的参数
                var depModules = module.depModules;
                var depExports = [];
                for (var i = 0; i < depModules.length; i++) {
                    var depModule = depModules[i];
                    if (depModule.id == 'require') {
                        depExports.push(module.require);
                    } else if (depModule.id == 'exports') {
                        depExports.push(module.exports);
                    } else if (depModule.id == 'module') {
                        depExports.push(module);
                    } else {
                        depModule.execute();
                        depExports.push(depModule.exports);
                    }
                }
                depExports.push(module.require);
                depExports.push(module.exports);
                depExports.push(module);
                //执行一个模块时，级联执行依赖的模块
                var returnObject = module.factory.apply(env, depExports);
                module.exports = returnObject || module.exports;
            }
            return module.exports;
        };

        //处理模块静态依赖开始
        module.load(module.deps, function() {
            module.depModules = arguments || []; //将作为 define 的参数
            //async(function() { //async 1 开始
            //处理类CommonJS方式的依赖开始
            module.load(module.factoryDeps, function() {
                module.factoryDepModules = arguments || [];
                //async(function() { //async 2 开始
                //清除超时检查定时器
                if (module.timer) {
                    clearTimeout(module.timer);
                }
                //检查并出发加载完成事件
                if (owner.onLoad && isFunction(owner.onLoad)) {
                    owner.onLoad(module);
                }
                //标记录加载完成
                module.loaded = true;
                //加载完成处理回调列表
                each(module.loadCallbacks, function(i, callback) {
                    if (isFunction(callback)) {
                        callback(module);
                    }
                });
                module.loadCallbacks = null;
                //}); //async 2 结束
            }); //处理类CommonJS方式的依赖结束，CommonJS 将延迟执行（在 x=require(...) 时执行）
            //}); //async 1 开始
        }); //处理模块静态依赖结束
    }

    /**
     * 加载一个文件
     */
    function _loadOne(uri, callback, baseUri) {
        if (isNull(uri)) {
            throw "路径 '" + uri + "' 存在错误.";
        }
        //如果加载一个新模块，则创建模块上下文对象
        modules[uri] = modules[uri] || new Module(uri);
        var module = modules[uri];
        //如果已加载并保存就直接回调;
        if (!isNull(module) && module.loaded && isFunction(callback)) {
            //async(function() {
            callback(module);
            //});
            return;
        }
        /*
        代码能执行到这里，说明是加载的一个没载入的模块，些时需要
        对 module.loaded=false 的模块进行循环依赖检查，如果检查为 true 则直接 callback
        已被载入的循环模块 isCircularDependency 才会返回 true ，未载入的会返回 false
        所以即能确保循环模块会正确载入，并同时不会出理重复载入，或循环级联载入调用
        */
        if (isCircularDependency(uri, baseUri) && isFunction(callback)) {
            //alert('循环依赖');
            //async(function() {
            callback(module);
            //});
            return;
        }
        //如果缓存中不存在，并且回调链也已创建，则压入当前callback,然后返回，等待回调
        if (!isNull(module) && isArray(module.loadCallbacks)) {
            module.loadCallbacks.push(callback);
            return;
        }
        //如果缓存中不存在，并且回调链为NULL，则创建回调链，并压入当前callback
        module.loadCallbacks = [];
        module.loadCallbacks.push(callback);
        //创建元素
        module.element = contains(uri, '.css') ? createStyle(uri) : createScript(uri);
        //创建超时计时器（定时间需要在 bindLoadEvent 方法前，因为对于 css 会直接触发 “load 事件”）
        if (options.maxLoadTime > 0) {
            module.timer = setTimeout(function() {
                throw "加载 " + uri + " 超时,可能原因: \"1.无法处理的循环依赖; 2.资源不存在; 3.脚本错误; 4.其它未知错误;\".";
            }, options.maxLoadTime);
        }
        //绑定load事件,模块下载完成，执行完成define，会立即触发load
        bindLoadEvent(module.element, function() {
            if (!module.loaded && !module.saved) {
                var context = loadContextQueque.shift();
                if (!isNull(context)) {
                    //TODO: 如果某天想支持一个文件多个模块
                    //需要在些将 loadContextQueque 里的所有模块取出来保存
                    saveModule(uri, context);
                } else if (!isNull(shimTable[uri])) {
                    //如果是一个垫片 URI，则生成垫片 Context
                    //垫片代码文件没有 define 只会在些触发 saveModule
                    context = shimTable[uri];
                    if (isFunction(context.exports) || isFunction(context.init)) {
                        var fun = context.init || context.exports || context.factory;
                        context.factory = fun;
                    } else if (isString(context.exports)) {
                        var varName = context.exports;
                        context.factory = function() {
                            return env[varName];
                        };
                    }
                    context.id = uri;
                    //context.exports = {};
                    saveModule(uri, context);
                } else {
                    //其它，如样式、没有配置 shim 的普通脚本
                    saveModule(uri, {});
                }
            }
        });
        //设置加载中状态
        module.loading = true;
        //添加到 DOM 中
        appendToDom(module.element);
        return;
    }

    /**
     * 加载一个模块，会检测是否使用了插件，内部调用 _loadOne
     **/
    function loadOne(uri, callback, baseUri) {
        if (isNull(uri)) {
            throw "路径 '" + uri + "' 存在错误.";
        }
        if (!contains(uri, '!')) {
            return _loadOne(uri, callback, baseUri);
        } else {
            //带插件的URL
            var splitIndex = uri.lastIndexOf('!');
            var pluginUri = uri.substring(0, splitIndex);
            var moduleUri = uri.substring(splitIndex + 1);
            if (pluginUri == '' || moduleUri == '') {
                throw "路径 '" + uri + "' 存在错误.";
            }
            //检查是否已加载
            var module = modules[moduleUri];
            if (!isNull(module) && module.loaded) {
                if (isFunction(callback)) {
                    callback(module);
                }
                return module;
            }
            //处理使用插件的引用
            return loadOne(pluginUri, function(pluginModule) {
                if (isNull(pluginModule)) {
                    throw "插件 '" + pluginUri + "' 存在错误.";
                }
                //使用插件模块时，需要先执行插件模块
                if (isFunction(pluginModule.execute)) {
                    pluginModule.execute();
                }
                var plugin = pluginModule.exports;
                if (isNull(plugin) || !isFunction(plugin.load)) {
                    throw "插件 '" + pluginUri + "' 存在错误.";
                };
                var onLoad = function(_exports) {
                    var module = modules[moduleUri] = {
                        exports: _exports,
                        executed: true,
                        loaded: true,
                        loading: true,
                        saved: true
                    };
                    if (isFunction(callback)) {
                        callback(module);
                    }
                };
                onLoad.fromText = onLoad;
                onLoad.error = onLoad;
                /*
                 调用插件方法。
                 load: function (name, parentRequire, onload, config)
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
        var moduleList = getModulesFromCache(uriList);
        var loadCount = 0;
        if (uriList && uriList.length > 0) {
            each(uriList, function(i, uri) {
                loadOne(uri, function() {
                    loadCount++;
                    if (loadCount < uriList.length) return;
                    moduleList = getModulesFromCache(uriList) || moduleList;
                    if (isFunction(callback)) {
                        callback.apply(env, moduleList);
                    }
                }, baseUri);
            });
        } else {
            if (isFunction(callback)) {
                callback.apply(env, moduleList);
            }
        }
        return moduleList;
    };

    /**
     * 检测是否是循环依赖
     **/
    function isCircularDependency(uri, baseUri) {
        var state = false;
        //
        baseUri = baseUri || options.baseUri || location.href;
        if (isNull(baseUri) || isNull(uri)) state = false;
        if (uri == baseUri) state = true;
        if (!state) {
            var loadModule = modules[uri];
            if (!isNull(loadModule)) {
                //state = loadModule.loaded; //检测时是否受 loaed 的影响
                if (!state && loadModule.deps && loadModule.deps.length > 0) {
                    var deps = depsToUriList(loadModule.deps, loadModule.uri);
                    each(deps, function(i, depUri) {
                        if (depUri == baseUri || isCircularDependency(depUri, baseUri)) {
                            state = true;
                            return;
                        }
                    });
                }
                if (!state && loadModule.factoryDeps && loadModule.factoryDeps.length > 0) {
                    var factoryDeps = depsToUriList(loadModule.factoryDeps, loadModule.uri);
                    each(factoryDeps, function(i, depUri) {
                        if (depUri == baseUri || isCircularDependency(depUri, baseUri)) {
                            state = true;
                            return;
                        }
                    });
                }
            } else {
                state = false;
            }
        }
        if (options.disabledCircularDependency && state) {
            throw '已检测到"' + uri + '"和"' + baseUri + '"或其上层依赖存在循环依赖';
        }
        return state;
    }

    /**
     * 卸载一组文件
     */
    owner.unload = owner.undef = function(deps, baseUri) {
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
            if (isNull(module)) {
                exportsList.push(null);
            } else {
                if (isFunction(module.execute)) {
                    module.execute();
                }
                exportsList.push(module.exports);
            }
        });
        return exportsList;
    };

    /**
     * 全局 require
     */
    owner.require = function(deps, callback, baseUri) {
        var moduleList = owner.load(deps, function() {
            var moduleList = arguments;
            //require 模块时，需要先执行这个模块
            var exportsList = moduleListToExportList(moduleList);
            if (isFunction(callback)) {
                //callback.apply(exportsList, exportsList);
                callback.apply(env, exportsList);
            };
        }, baseUri);
        var exportsList = moduleListToExportList(moduleList);
        return (exportsList && exportsList.length == 1) ? exportsList[0] : exportsList;
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
            foundModules.push(module);
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
        self.unload = self.undef = function(deps) {
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
        self.require.module = self;
        self.exports = {};
        self.factory = null;
        self.deps = null;
        self.factoryDeps = null;
        self.loading = false;
        self.loaded = false;
        self.executed = false;
        self.saved = false;
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
                "id": id,
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
        if (!isNull(context)) {
            //如果模块是一个JSON对象
            if (!isFunction(context.factory)) {
                var jsonObject = context.factory;
                context.factory = function() {
                    return jsonObject;
                };
            }
            //处理模块代码中的类CommonJS的依赖方式
            var code = context.factory.toString();
            var factoryDeps = matchRequire(code);
            if (isArray(factoryDeps) && factoryDeps.length > 0) {
                context.factoryDeps = factoryDeps;
            }
            //如在此时能取到模块URL则保存模块，否则，将模块描述压入队列在script的load中处理
            var iScript = getInteractiveScript();
            if (!isNull(iScript)) {
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
    owner.resovleUri = function(uri, baseUri, doNotHandleExt) {
        return resovleUri(uri, baseUri || options.baseUri || location.href, doNotHandleExt);
    };

    /**
     * 标识define为amd或emd的实现
     */
    owner.define.amd = {};
    owner.define.amd.jQuery = true; //处理早期的 jQuery SB 版本

    /**
     * 加载启始模块或文件
     */
    var mainFile = getMainFile();
    if (!isNull(mainFile) && mainFile !== '') {
        owner.require(mainFile);
    }

    /**
     * 声明全局 define
     */
    env.define = owner.define;

    /**
     * 声明全局 require
     */
    //env.require = owner.require;

})(this);
//