/**
 *
 * EMS(IMP) v0.9.2
 * Easy Module System: 简洁、易用的模块系统
 * 作者：侯锋
 * 邮箱：admin@xhou.net
 * 网站：http://houfeng.net , http://houfeng.net/ems
 *
 * ems 全称为 "Easy Module System" 他还有一个别名叫: "imp";
 * ems 作为 "EMD" 的实现标准范本; 完全符合 "EMD规范";
 *
 **/
(function (owner) {

    /**
     * 检查是否为null或undefined
     */
    function isNull(obj) {
        return (obj === null) || (typeof obj === 'undefined');
    };

    /**
     * 检查是否是数组
     */
    function isArray(obj) {
        return (obj instanceof Array) || (obj && obj.length && obj[0]);
    };

    /**
     * 遍历数组或对象，return === continue , return object === break
     */
    function each(list, handler) {
        if (!list || !handler) return;
        if (isArray(list)) {
            var listLength = list.length;
            for (var i = 0; i < listLength; i++) {
                if (isNull(list[i])) continue;
                var rs = handler.call(list[i], i, list[i]);
                if (!isNull(rs)) return rs;
            }
        } else {
            for (var key in list) {
                if (isNull(list[key])) continue;
                var rs = handler.call(list[key], key, list[key]);
                if (!isNull(rs)) return rs;
            }
        }
    };

    /**
     * 从字符串开头匹配
     */
    function startWith(str1, str2) {
        return str1 && str2 && str1.indexOf(str2) == 0;
    };

    /**
     * 是否包含
     */
    function contains(str1, str2) {
        return str1 && str2 && str1.indexOf(str2) > -1;
    };

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
    };

    /**
     * 创建一个外联样式元素
     */
    function createStyle(uri) {
        var styleElement = document.createElement('link');
        styleElement.href = uri;
        styleElement.type = "text/css";
        styleElement.rel = "stylesheet";
        return styleElement;
    };

    /**
     * 取所有脚本元素
     */
    function getScriptElements() {
        return document.getElementsByTagName('script');
    };

    /**
     * 获取启始模块或文件
     */
    function getMainFile() {
        var scripts = getScriptElements();
        return each(scripts, function () {
            return this.getAttribute('data-main');
        });
    };

    /**
     * 取正在执行的脚本
     */
    function getInteractiveScript() {
        var scripts = getScriptElements();
        return each(scripts, function () {
            if (this.readyState === 'interactive') {
                return this;
            }
        });
    };

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
        //将script添加到页面
        elementContainer.appendChild(element);
    };

    /**
     * 处理事件监听器
     */
    function bindEvent(element, name, handler) {
        if (element.addEventListener) {
            element.addEventListener(name, handler);
        } else if (element.attachEvent) {
            element.attachEvent("on" + name, handler);
        }
    };

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
        bindEvent(element, loadEventName, function () {
            var readyState = element.readyState || "loaded";
            if (readyState == "loaded" || readyState == "interactive" || readyState == "complete") {
                handler.apply(element, arguments || []);
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

    /**
     * 保存模块
     */
    function saveModule(uri, currently) {
        if (!moduleTable[uri]) return;
        moduleTable[uri].loading = true;
        moduleTable[uri].deps = currently.moduleDeps;
        moduleTable[uri].declare = currently.moduleDeclare;
        moduleTable[uri].declareDeps = currently.declareDeps; //类似CommonJS的依赖表
        //清空currently
        currently = null;
        //处理模块静态依赖开始
        moduleTable[uri].require(moduleTable[uri].deps, function () {
            var imports = arguments;
            setTimeout(function () {
                //处理类CommonJS方式的依赖开始
                moduleTable[uri].require(moduleTable[uri].declareDeps, function () {
                    setTimeout(function () {
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
                        each(moduleTable[uri].loadCallbacks, function () {
                            this(moduleTable[uri].exports);
                        });
                        if (owner.onLoad) owner.onLoad(moduleTable[uri]);
                        //
                        moduleTable[uri].loaded = true;
                        moduleTable[uri].loadCallbacks = null;
                    }, 0);
                }); //处理类CommonJS方式的依赖结束
            }, 0);
        }); //处理模块静态依赖结束
    };

    /**
     * 加载一个文件
     */
    function loadOne(uri, callback) {
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
        moduleTable[uri].element = contains(uri, '.css') ? createStyle(uri) : createScript(uri);
        //绑定load事件,模块下载完成，执行完成define，会立即触发load
        bindLoadEvent(moduleTable[uri].element, function () {
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
    owner.load = function (deps, callback, baseUri) {
        var uriList = depsToUriList(deps, baseUri);
        var exportsList = [];
        var uriCount = 0;
        if (uriList && uriList.length > 0) {
            each(uriList, function (i, uri) {
                loadOne(uri, function () {
                    uriCount += 1;
                    if (uriCount < uriList.length) return;
                    exportsList = getModuleExportsFromCache(uriList) || exportsList;
                    if (callback) callback.apply(exportsList, exportsList);
                });
            });
        } else {
            if (callback) callback.apply(exportsList, exportsList);
        }
        return exportsList && exportsList.length == 1 ? exportsList[0] : exportsList;
    };

    /**
     * 卸载一组文件
     */
    owner.unload = function (deps, baseUri) {
        var uriList = depsToUriList(deps, baseUri);
        each(uriList, function (i, uri) {
            if (moduleTable[uri]) {
                moduleTable[uri].element.parentNode.removeChild(moduleTable[uri].element);
                moduleTable[uri].exports = null;
                moduleTable[uri].loading = null;
                moduleTable[uri].deps = null;
                moduleTable[uri].declare = null;
                moduleTable[uri].declareDeps = null;
                moduleTable[uri].element = null;
                moduleTable[uri] = null;
            }
        });
    };

    /**
     * 从缓存中取得模块
     */
    function getModuleExportsFromCache(uriList) {
        var moduleExports = [];
        each(uriList, function (i, uri) {
            if (moduleTable[uri]) {
                moduleExports.push(moduleTable[uri].exports);
            }
        });
        return moduleExports;
    };

    /**
     * 检查是不是系统模块
     */
    function isSystemModule(uri) {
        return (uri == 'require' || uri == 'exports' || uri == 'module');
    };

    /**
     * 是否开头匹配一种URI协议
     */
    function startWithUriProtocol(uri) {
        if (startWith(uri, 'http://') || startWith(uri, 'https://') || startWith(uri, 'file://')) {
            return true;
        } else {
            var regx = /^\S+?:\/\//ig;
            return regx.test(uri);
        }
    };

    /**
     * 是否开头匹配根路径
     */
    function startWithPathRoot(uri) {
        return startWith(uri, '/') || startWith(uri, '\\');
    };

    /**
     * 转换路径为绝对路径
     */
    function resovleUri(uri, baseUri) {
        if (!uri || !baseUri || startWithUriProtocol(uri) || startWithPathRoot(uri) || isSystemModule(uri)) {
            return uri;
        }
        baseUri = baseUri.split('?')[0].split('#')[0];
        var baseDir = baseUri.substring(0, baseUri.lastIndexOf('/'));
        var uriParts = uri.split('#')[0].split('/');
        var uriHash = uri.split('#')[1];
        var newUriParts = baseDir.length > 0 ? baseDir.split('/') : [];
        each(uriParts, function (i, part) {
            if (part == '..') {
                newUriParts.pop();
            } else if (part == '.') { //No Handle
            } else {
                newUriParts.push(part);
            }
        });
        return newUriParts.join('/') + (uriHash ? '#' + uriHash : '');
    };

    /**
     * 处理默认扩展名
     */
    function handleExtension(uri) {
        if (isSystemModule(uri)) return uri;
        var fileName = uri.substring(uri.lastIndexOf('/'), uri.length);
        if (!contains(fileName, '?') && !contains(fileName, '#') && !contains(fileName, '.')) {
            uri += (extension || ".js");
        }
        return uri;
    };

    /**
     * 处理包
     */
    function handlePackages(uri) {
        var index = uri.indexOf('/');
        if (index < 0) index = uri.length;
        var part1 = uri.substr(0, index);
        var part2 = uri.substr(index + 1, uri.length);
        each(packageTable, function (name, pack) {
            if (part1 == pack.name) {
                part1 = pack.location || part1;
                part2 = part2 || pack.main || '';
                uri = part1 + '/' + part2;
            }
        });
        return uri;
    };

    /**
     * 字符串转为字符串数组
     */
    function stringToStringArray(str) {
        if (str == null) return [];
        if ((typeof str) == 'string') {
            str = [str];
        }
        return str;
    };

    /**
     * 转换一组依赖为绝对路径
     */
    function depsToUriList(deps, baseUri) {
        baseUri = baseUri || location.href;
        deps = stringToStringArray(deps);
        var absUriList = [];
        each(deps, function (i, dep) {
            var uri = aliasTable[dep] || dep;
            uri = handlePackages(uri);
            uri = handleExtension(uri);
            uri = resovleUri(uri, baseUri);
            absUriList.push(uri);
        });
        return absUriList;
    };

    /**
     * 模块上下文件对象
     */
    function ModuleContext(uri) {
        var moduleUri = this.uri = this.id = uri || '/';
        this.resovleUri = function (_uri, baseUri) {
            return resovleUri(_uri, baseUri || moduleUri);
        };
        this.require = function (deps, callback) {
            return owner.load(deps, callback, uri); //如果提前预加载则能取到返回值
        };
        this.unrequire = function (deps) {
            return owner.unload(deps, uri);
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
    function createCurrently(_moduleId, _moduleDeps, _moduleDeclare) {
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
    function matchRequire(src) {
        var rs = [];
        var regx = /require\s*\(\s*[\"|\'](.+?)[\"|\']\s*\)\s*[;|,|\n|\}|\{|\[|\]|\.]/gm;
        var mh = null;
        while (mh = regx.exec(src)) {
            if (mh && mh[1] && !contains(mh[1], '"') && !contains(mh[1], "'")) {
                rs.push(mh[1]);
            }
        }
        return rs;
    };

    /**
     * 定义一个模块
     * ems符合EMD规范(不对持moduleId), define还保留moduleId参数是为了兼容AMD规范模块，但在EMD中id将被忽略；
     */
    owner.define = function (_moduleId, _moduleDeps, _moduleDeclare) {
        var currently = createCurrently(_moduleId, _moduleDeps, _moduleDeclare);
        if (currently) {
            //如果模块是一个JSON对象
            if (typeof currently.moduleDeclare != 'function') {
                var obj = currently.moduleDeclare;
                currently.moduleDeclare = function () {
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
    owner.config = function (option) {
        option = option || {};
        option.alias = option.alias || option.paths || {};
        each(option.alias, function (name, value) {//防止覆盖已添加的别名
            aliasTable[name] = value;
        });
        option.packages = option.packages || [];
        each(option.packages, function (name, value) {//防止覆盖已添加的包
            value.name = value.name || name;
            packageTable[value.name] = value;
        });
        extension = extension || option.extension;
    };

    /**
     * 别名列表
     */
    var aliasTable = {};
    var extension = ".js";
    /**
     * 包列表
     * @type {Object}
     */
    var packageTable = {};

    owner.resovleUri = function (uri,baseUri) {
        return resovleUri(uri, baseUri||location.href);
    };

    owner.alias = aliasTable;
    owner.packages = packageTable;
    owner.modules = moduleTable;

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
})(this.ems = this.imp = {});
//