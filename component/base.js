/**
 * 一套组件机制
 * author: Douglas Chen
 */

/* global epctrl*/

(function (win, $) {

    if (!$ || typeof $ != 'function') {
        throw new Error('epctrl require jQuery');
    }

    var isIE67 = '\v' == 'v',
        isIE8 = !!document.all && document.querySelector && !document.addEventListener;

    var getPathByName = function (name) {
        name = name.toLowerCase();

        var url = epctrl._rootPath + '/' + name + '/' + name + '.js';

        return url;
    };

    var throwError = function (msg) {
        throw new Error(msg);
    };

    /**
     * 同步加载资源，用于继承和重写时自动引入父类的定义
     *
     * @param {String} url 父类名称
     * @returns jQuery.promise
     */
    var loadSupperSync = function (name) {
        return $.ajax({
            url: getPathByName(name),
            type: 'get',
            dataType: 'TEXT',
            async: false
        }).done(function (data) {
            var script = document.createElement('script');
            script.text = data;
            document.getElementsByTagName('head')[0].appendChild(script);
        }).fail(throwError);
    };

    /**
     * 加载父类资源
     *
     * @param {String} supperCls 父类控件名称
     * @returns undefined
     */
    var loadSupperCls = function (supperCls) {
        // 已经存在则不用操作
        if (typeof epctrl[supperCls] == 'function') {
            return;
        }

        // 否则同步加载父类资源
        loadSupperSync(supperCls);
    };

    /**
     * 继承实现
     *
     * @param {Function} newClass 新Class的构造函数
     * @param {Function} sp 父类的构造函数
     * @param {Object} overrides 要新增或重写到原型上的属性和方法集合
     * @returns 继承后的Class
     */
    var extend = function (newClass, sp, overrides) {
        overrides = overrides || {};

        if (typeof sp != 'function') {
            return this;
        }

        // 自动给新控件中加入用于记录资源是否加载的记录对象
        if (!overrides._jsPromise) {
            // js资源的promise
            overrides._jsPromise = {};
        }

        var sb = newClass,
            sbp = sb.prototype,
            spp = sp.prototype;
        if (sb.superclass == spp) {
            return;
        }
        sb.superclass = spp;
        sb.superclass.constructor = sp;

        var p;

        for (p in spp) {
            sbp[p] = spp[p];
        }
        if (overrides) {
            for (p in overrides) {
                sbp[p] = overrides[p];
            }
        }
        return sb;
    };

    /**
     * 重写实现
     *
     * @param {Object} dest 要重写的控件
     * @param {Object} proto 要重写的属性、方法集合
     * @returns 重写后的控件
     */
    var overwrite = function (dest, proto) {
        var d;
        if (typeof dest == 'function') {
            d = dest.prototype;
        } else if (typeof dest == 'object') {
            d = dest;
        } else {
            return this;
        }

        for (var c in proto) {
            d[c] = proto[c];
        }
        return dest;
    };

    var Control = function () {
        // 添加事件存储对象
        this._events = {};
        // 添加css和js资源属性
        this.cssUrl = [];
        this.jsUrl = [];
        // html 加载
        this.htmlUrl = '';
        this.htmlContainer = false;

        // 缓存需要迟延执行的方法
        this._FnQueues = [];

        // 处理初始化的事件绑定
        // 统一约定初始化就需要的事件放在参数的events中，键名为事件名称，值为处理函数
        var cfg = arguments[0],
            events = cfg.events;
        // 加入事件
        if (events) {
            for (var p in events) {
                if (events.hasOwnProperty(p)) {
                    this.on(p, events[p]);
                }
            }
        }

        // 绑定一个创建完成事件，处理迟延执行方法队列
        this.on('afterCreate', this._onCreate);
    };

    Control.prototype = {
        // 控件唯一标识
        type: 'control',
        constructor: Control,
        // js资源的promise 在继承方法中自动重写此属性保证每个控件资源加载独立
        _jsPromise: {},
        // 控件所在路径
        _getControlPath: function () {
            return 'frame/fui/js/widgets/epcontrols/' + this.type.toLowerCase() + '/';
        },
        // 事件实现
        /**
         * 绑定事件
         *
         * @param {String} type 事件类型
         * @param {Function} fn 事件处理函数
         * @param {Object} scope 要为事件处理函数绑定的执行上下文
         * @returns 当前实例对象
         */
        on: function (type, fn, scope) {
            if (typeof type != 'string') {
                // console && console.error && console.error('the first arguments type is requird as string');
                this.print('the first arguments type is requird as string', 'error');
                return this;
            }
            if (typeof fn != 'function') {
                // console && console.error && console.error('the second arguments fn is requird as function');
                this.print('the second arguments fn is requird as function', 'error');
                return this;
            }

            type = type.toLowerCase();

            if (!this._events[type]) {
                this._events[type] = [];
            }

            this._events[type].push(scope ? [fn, scope] : [fn]);

            return this;
        },

        /**
         * 取消绑定一个事件
         *
         * @param {String} type 取消绑定的事件名称
         * @param {Function} fn 要取消绑定的事件处理函数，不指定则移除当前事件类型下的全部处理函数
         * @returns 当前实例对象
         */
        off: function (type, fn) {
            type = type.toLowerCase();

            var eventArr = this._events[type];

            if (!eventArr || !eventArr.length) {
                return this;
            }

            if (!fn) {
                this._events[type] = eventArr = [];
            } else {
                for (var i = 0; i < eventArr.length; ++i) {
                    if (fn === eventArr[i][0]) {
                        eventArr.splice(i, 1);
                        // 1、找到后不能立即 break 肯存在一个事件一个函数绑定多次的情况
                        // 删除后数组改变，下一个仍然需要遍历处理！
                        --i;
                    }
                }
            }
            return this;
        },
        /**
         * 触发事件
         *
         * @param {String} type 触发事件的名称
         * @param {Anything} data 要额外传递的数据,事件处理函数参数如下
         * event = {
                // 事件类型
                type: type,
                // 绑定的源，始终为当前实例对象
                origin: this,
                // 事件处理函数中的执行上下文 为 this 或用户指定的上下文对象
                scope :this/scope
                // 其他数据 为fire时传递的数据
                data: data
            }
         * @returns 事件对象
         */
        fire: function (type, data) {
            type = type.toLowerCase();

            var eventArr = this._events[type];

            var fn,
                // event = {
                //     // 事件类型
                //     type: type,
                //     // 绑定的源
                //     origin: this,
                //     // scope 为 this 或用户指定的上下文，
                //     // 其他数据
                //     data: data,
                //     // 是否取消
                //     cancel: false
                // };
                // 上面对自定义参数的处理不便于使用 将相关属性直接合并到事件参数中
                event = $.extend({
                    // 事件类型
                    type: type,
                    // 绑定的源
                    origin: this,
                    // scope 为 this 或用户指定的上下文，
                    // 其他数据
                    // data: data,
                    // 是否取消
                    cancel: false
                }, data);

            if (!eventArr) {
                return event;
            }

            for (var i = 0, l = eventArr.length; i < l; ++i) {
                fn = eventArr[i][0];
                event.scope = eventArr[i][1] || this;
                fn.call(event.scope, event);
            }
            return event;
        },
        /**
         * 绑定一个只执行一次的事件
         *
         * @param {String} type 事件类型
         * @param {Function} fn 事件处理函数
         * @param {Object} scope 要为事件处理函数绑定的执行上下文
         * @returns 当前实例对象
         */
        one: function (type, fn, scope) {
            var that = this;

            function nfn() {
                // 执行时 先取消绑定
                that.off(type, nfn);
                // 再执行函数
                fn.apply(scope || that, arguments);
            }

            this.on(type, nfn, scope);

            return this;
        },
        // 资源加载实现
        // 动态加载js
        _loadJsPromise: function (url) {

            // 无 url 则直接成功
            if (!url) {
                return $.Deferred().resolve().promise();
            }

            // 已经加载 则返回之前的promise
            if (this._jsPromise[url]) {
                return this._jsPromise[url];
            }

            var that = this,
                dtd = $.Deferred(),
                script = document.createElement('script');

            script.type = 'text/javascript';

            // IE8- IE9+ 已经支持onload等，控制更加精确
            if ((isIE67 || isIE8) && script.readyState) {
                script.onreadystatechange = function () {
                    if (script.readyState == 'loaded' || script.readyState == 'complete') {
                        dtd.resolve();
                        script.onreadystatechange = null;
                    }
                };
            } else {
                script.onload = function () {
                    dtd.resolve();
                    script.onload = null;
                };
                script.onerror = function () {
                    dtd.reject();
                    script.onerror = null;
                    that._jsPromise[url] = null;
                    throwError(url + '：此资源加载失败！');
                };
            }

            this.fire('beforeOneJsload', {
                jsUrl: url
            });

            script.src = epctrl._rootPath + '/' + url;
            // append to head
            document.getElementsByTagName('head')[0].appendChild(script);

            return (this._jsPromise[url] = dtd.promise());
        },
        loadJs: function (urls, callback) {

            var successDtd = $.Deferred();

            if (!urls || !urls.length) {
                // jq 3.0以下版本的此处有问题 此处会立即执行 是一个bug 不能直接使用
                // return $.Deferred().resolve().promise().then(function () {
                //     callback && callback();
                // });

                if ($.fn.jquery >= '3') {
                    return $.Deferred().resolve().promise().then(function () {
                        callback && callback();
                    });
                } else {

                    // 用迟延模拟异步
                    setTimeout(function () {
                        successDtd.resolve();
                    });
                    return successDtd.promise().then(function () {
                        callback && callback();
                    });
                }
            }

            var that = this;
            if (typeof urls == 'string') {
                urls = [urls];
            }

            this.fire('beforeJsload', {
                jsUrl: urls
            });

            var loads = JSON.parse(JSON.stringify(urls));

            function loadNext() {
                // 单个资源加载完成
                that.fire('afterOneJsload', {
                    js: loads[0]
                });

                // 删除第一个元素
                loads.splice(0, 1);

                if (loads.length) {
                    // 还有时继续加载
                    return that._loadJsPromise(loads[0])
                        .done(loadNext)
                        .fail(that.throwError);
                } else {
                    // 待加载的js中没有元素时代表全部资源加载完毕
                    that.fire('afterJsLoad', {
                        jsUrl: urls
                    });
                    // callback && callback();
                    return $.Deferred().resolve().promise().then(function () {
                        callback && callback();
                    });
                }
            }

            return this._loadJsPromise(loads[0])
                .then(loadNext);
        },
        /**
         * 加载css
         *
         * @param {String/Array} urls 要加载的css资源的路径，多个用数组表示。可为根路径写起或相对路径
         * @param {HTMLElement} target 要插入到的目标位置，默认为head元素
         * @param {String} pos 要插入的位置，值为After或Before
         */
        loadCss: function (urls, target, pos) {
            // 外部组件需要引用的css可能有多个
            if (typeof urls == 'string') {
                urls = [urls];
            }

            var link = null,
                head = document.getElementsByTagName('head')[0];
            for (var i = 0, l = urls.length; i < l; ++i) {

                if (document.getElementById('style-' + this.type + (l > 1 ? '-' + i : ''))) {
                    // 当前需要的css已经存在是则跳过加载 避免重复加载
                    continue;
                }

                link = document.createElement('link');
                link.rel = 'stylesheet';
                // 如果仅一个 则id为 style-当前控件类型
                // 多个css时 id 为 style-当前控件类型-i
                link.id = 'style-' + this.type + (l > 1 ? '-' + i : '');

                link.href =epctrl._rootPath + '/' + urls[i];

                if (!target) {
                    head.appendChild(link);
                } else {
                    if (pos == 'Before') {
                        head.insertBefore(link, target);
                    } else {
                        head.appendChild(link);
                    }
                }
            }
        },
        /**
         * 加载一段html
         *
         * @param {String} url 加载地址
         * @returns 当前实例对象
         */
        loadHtml: function (url) {
            // 无url则表示不用加载 直接返回成功的
            if (!url || !this.htmlContainer) {
                return $.Deferred().resolve().promise();
            }

            var ev = this.fire('beforeHTMLLoad', {
                htmlUrl: url
            });

            this.htmlUrl = url = ev.htmlUrl;

            var that = this;

            return $.ajax({
                url:  epctrl._rootPath + '/' + url,
                type: 'GET',
                async: true,
                dataType: 'HTML'
            }).done(function (data) {
                var ev = that.fire('beforeHtmlInsert', {
                    htmlUrl: url,
                    content: data,
                    htmlContainer: that.htmlContainer
                });

                // 处理用户修改
                data = ev.content;
                that.htmlContainer = ev.htmlContainer;

                // 插入到页面
                data && that.htmlContainer && $(data).appendTo(that.htmlContainer);
                that.fire('afterHTMLLoad', {
                    htmlUrl: url,
                    content: data,
                    htmlContainer: that.htmlContainer
                });
            });
        },
        // 用于添加额外的css资源
        // 如控件中只加载了基础的资源，有些插件的某些功能还需要其他额外内容来支持
        // 直接作为统一的加载好久比较浪费了
        // 故提供此方法，用于在控件实例化之前将其加入即可
        addCss: function (cssUrl) {

            if (!cssUrl) {
                return;
            }

            var cssSources = this.cssUrl;

            // 如果是字符串则转化为数组
            if (cssUrl + '' === cssUrl) {
                cssUrl = [cssUrl];
            }

            $.each(cssUrl, function (i, item) {
                cssSources.push(item);
            });
        },
        // 为控件设置css资源
        setCss: function (url) {
            if (url + '' === url) {
                return this.cssUrl.push(url);
            } else {
                return (this.cssUrl = url);
            }
        },
        // 为控件设置js资源
        setJs: function (url) {
            if (url + '' === url) {
                return this.jsUrl.push(url);
            } else {
                return (this.jsUrl = url);
            }
        },
        // 设置控件需要的html资源
        setHtml: function (url) {
            return (this.htmlUrl = url);
        },
        // 设置HTML插入的容器
        setHtmlContainer: function (selector) {
            return (this.htmlContainer = selector);
        },
        getHtmlContainer: function () {
            return this.htmlContainer;
        },
        getHtml: function () {
            return this.htmlUrl;
        },
        getCss: function () {
            return this.cssUrl;
        },
        getJs: function () {
            return this.jsUrl;
        },
        // 用于添加额外的css资源
        addJs: function (jsUrl) {

            if (!jsUrl) {
                return;
            }

            var jsSources = this.jsUrl;

            if (jsUrl + '' === jsUrl) {
                jsUrl = [jsUrl];
            }

            $.each(jsUrl, function (i, item) {
                jsSources.push(item);
            });
        },
        /**
         * 自动加载此控件的所有资源，并在资源加载完成后自动调用控件的create方法
         */
        loadSource: function () {
            var that = this;

            // 触发资源加载前事件
            var sourseEv = this.fire('beforeSourceLoad', {
                cssUrl: this.cssUrl,
                jsUrl: this.jsUrl
            });

            // 同步事件中的修改
            this.cssUrl = sourseEv.cssUrl;
            this.jsUrl = sourseEv.jsUrl;

            // css 资源 异步加载 不影响
            if (this.cssUrl) {
                this.loadCss(this.cssUrl);
            }

            // 加载html和js资源
            this.loadHtml(this.htmlUrl)
                .then(function () {
                    return that.loadJs(that.jsUrl, function () {
                        that.fire('afterSourceLoad', {
                            cssUrl: that.cssUrl,
                            jsUrl: that.jsUrl
                        });
                        // 此处仅能保证css和js加载完毕，不能确定控件是否创建完毕，因为有的控件的初始化和创建仍然是异步的
                        that.create();
                    });
                });
        },

        // 不同控件的初始化方法各不相同，需要每个控件自行实现这个方法，进入此方法时 相关资源已经加载完毕
        create: function () {
            // 触发创建前事件
            // this.fire('beforeCreate');

            this.throwError('控件未提供初始化方法，初始化失败！');

            // 在这里实现控件的创建或初始化机制 完成后触发完成创建的事件
            // this.fire('afterCreate');
        },
        // 在创建完成后检查缓存队列
        _onCreate: function (e) {
            // 真实的触发源
            var origin = e.origin,
                cache = origin._FnQueues,
                item;

            while (cache.length) {
                item = cache.splice(0, 1)[0];

                item[0].apply(origin, item[1]);
            }
        },
        /**
         * 缓存要在创建完成后再执行的方法
         *
         * @param {Function} fn 要迟延执行的方法
         * @param {any} 此方法执行时的其他参数
         * @returns
         */
        _cacheFn: function (fn) {
            if (typeof fn != 'function') {
                this.throwError('The first argument must be a function');
                return;
            }

            var args = Array.prototype.slice.call(arguments, 1);

            this._FnQueues.push([fn, args]);
        },

        // 抛出一个错误，参数为错误文本或错误对象
        throwError: throwError,
        // 控制台打印信息
        print: function (msg, type) {
            // type = type || 'info';
            if (!win.console || !win.console.log) {
                return;
            }

            switch (type) {
                case 'info':
                    console.log(msg);
                    break;
                case 'warn':
                    console.warn(msg);
                    break;
                case 'error':
                    console.error(msg);
                    break;
                default:
                    console.log(msg);
                    break;
            }
        }

    };

    win.epctrl = {
        // 组件存放的目录
        _rootPath:'/component',
        /**
         * 继承实现
         *
         * @param {Function} newClass  新Class的构造函数
         * @param {String} spName  父类的名称
         * @param {Object} overrides 要新增或重写到原型上的属性和方法集合
         * @returns 继承后的Class
         */
        extend: function (sbName, spName, overrides) {
            // 首字符转化为大写
            var name = sbName.substr(0, 1).toUpperCase() + sbName.substr(1),
                newClass = this[name];

            if (typeof newClass != 'function') {
                throw new Error('在epctrl下未找到' + sbName + '的定义，请确认控件名称正确！');
            }

            loadSupperCls(spName);
            return extend(newClass, epctrl[spName], overrides);
        },
        // 重写实现
        overwrite: function (destName, proto) {
            loadSupperCls(destName);
            return overwrite(epctrl[destName], proto);
        },
        // control 基类
        Control: Control,
        // 统一的初始化方法
        init: function (name, cfg) {
            var controlName = name.substr(0, 1).toUpperCase() + name.substr(1);

            if (!this[controlName] || typeof this[controlName] != 'function') {
                throw new Error('指定的控件：' + name + ' 未找到，请确认控件名称正确！');
            }

            var control = new this[controlName](cfg);

            control.loadSource();

            return control;
        }
    };

})(this, jQuery);
