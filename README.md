# component-frame

一套组件机制，支持自动加载依赖资源、事件、继承、重写等

目前已经在里面新增了两个日历组件：

- 一个月视图日历，支持在日历中插入任意内容。 [在线演示](https://cdswyda.github.io/component-frame/component/calendar/demo/calendar.html)  [说明文档](https://github.com/cdswyda/component-frame/tree/master/component/calendar)
- 二维周视图日历。 [在线演示](https://cdswyda.github.io/component-frame/component/weekcalendar/demo/week.html) [说明文档](https://github.com/cdswyda/component-frame/tree/master/component/weekcalendar)

## 基本功能

- 提供了一套完整的事件机制
- 提供控件的继承方法、重写方法
- 自动加载控件依赖资源
- 在资源加载完成后自动调用控件的初始化方法

## 基本使用

1. 引入控件机制的js文件
1. 引入实际要使用控件的js文件
1. 调用统一的初始化方法 `epctrl.init(name/* 控件名称 */, cfg /* 控件初始化配置*/)` 即可

## 控件机制api

### 继承方法

```js
/**
 * 继承方法
 *
 * @param {String} subName  新Class的名称
 * @param {String} spName  父类的名称
 * @param {Object} overrides 要新增或重写到原型上的属性和方法集合
 * @returns 继承后的Class
 */
epctrl.extend(subName, spName, overrides);
```

继承控件时，如果指定的的父类控件还未加载，会自动加载父类资源。

### 重写方法

```js
/**
 * 重写方法
 *
 * @param {String} destName 要重写的控件的名称
 * @param {Object} proto 要重写的属性、方法集合
 * @returns 重写后的控件
 */
epctrl.overwrite(destName, proto);
```

重写控件时，如果指定的的父类控件还未加载，会自动加载父类资源。

### 初始化方法

基于此机制的控件，统一使用此方法进行初始化。

```js
/**
 * 初始化方法
 * @param {String} name 控件名称
 * @param {Object} cfg 控件需要的配置
 * @returns 实例控件
 */
epctrl.init(name, cfg);
```

此方法中会自动实例化出一个指定的控件，并在此控件依赖资源加载完成后自动调用创建方法，返回实例控件。

### 控件基类

`epctrl.Control` 为控件机制中所有控件的基类，其中提供了事件机制，以及自动引入相关资源，并在所有依赖资源加载完成后，自动调用控件的初始化方法。

基类构造函数在执行时将读取配置中的events属性，如果存在，则自动将指定的响应事件绑定到实例对象上。同时，如果此控件需要皮肤，则会自动绑定一个仅指向一次的加载皮肤事件，以便在加载资源时自动引入皮肤资源。

**方法**

方法名称 | 参数 | 说明
-- | -- | --
`on(type, fn, scope)` |  `type` ：字符串类型，表示事件名称 <br> `fn` ：事件处理函数 <br> `scope` : 额外指定的事件处理函数执行时的上下文，不指定时为控件实例对象 | 绑定一个事件
`off(type, fn)` | `type` ：字符串类型，表示事件名称 <br> `fn` ：事件处理函数 | 取消绑定一个事件，第二个参数可省略，省略时取消绑定当前类型下的所有处理事件
`fire(type, data)` | `type` ：字符串类型，表示事件名称 <br> `data` 一个对象，触发此事件时的数据 | 触发一个事件，返回事件对象 <br>事件处理函数的实参中除了fire时传递的data中的所有属性之外，还包括以下通用属性：<br> `type` : 事件类型 <br> `origin` : 事件所在实例对象，是指为当前控件的实例对象 <br> `scope` : 用户指定的事件处理函数的执行上下文，未指定时为undefined。<br> `cancel` ： 是否取消，用于一些情况下取消事件的后续操作。
`one(type, fn, scope)` |  和 `on` 方法相同 | 绑定一个仅执行一次的事件
`addCss(url)` |  `url` ：字符串类型，表示css资源路径 | 为此控件添加一个css资源
`addJs(url)` |  `url` ：字符串类型，表示js资源路径 | 为此控件添加一个js资源
`setCss(url)` |  `url` ：字符串类型或数组类型，表示css资源路径，数组表示有多个资源按顺序加载 | 为此控件设置css资源 <br> 有相应的get方法，将set换为get即可，表示获取。
`setJs(url)` |  `url` ：字符串类型或数组类型，表示js资源路径，数组表示有多个资源按顺序加载 | 为此控件设置js资源 <br> 有相应的get方法，将set换为get即可，表示获取。
`setHtml(url)` |  `url` ：字符串类型，表示html资源路径 | 为此控件设置html资源 <br> 有相应的get方法，将set换为get即可，表示获取。
`setHtmlContainer(selector)` |  `selector` ：字符串类型，一个jQuery选择器，表示html要插入的容器 | 为此控件设置html资源插入的容器 <br> 有相应的get方法，将set换为get即可，表示获取。
`throwError(msg)` |  `msg` 一个字符串，表示错误信息 | 抛出一个错误
`print(msg, type)` | `msg` 一个字符串，表示要在控制台输出的信息 <br> `type` 可选值为 `"info"` 、 `"warn"` 、 `"error"` 之一，表示输出信息类型 | 在控制台输出信息
`loadSource()` | | 自动加载控件资源，此方法中将读取控件所依赖的css、html和js资源，并在html和js资源加载完成后自动调用控件的 `create` 方法。 <br> **此方法无需手动调用**，会自动在 `epctrl.init` 方法中调用。
`create()` | | 控件所依赖资源加载完成后的真实创建方法。<br> **控件应该实现此方法** <br> 不同控件应该有不同的初始化方法，不应该直接调用到此基类的创建方法，此方法被调用时将抛出一个错误。
`_cacheFn(fn [,fnArgs])` | fn 一个函数为迟延执行的方法 <br> 其他后续参数将被传递给指定的fn |缓冲一个方法，直到控件初始化完成后再真实调用。 |

> 以上方法中，最终用户会使用的仅为 `on`、`one` 方法，其余均是提供给开发者在新控件中使用的。

**提供属性**

属性名称 | 说明
-- | --
`type` | 类型为一个字符串 ，值和控件的构造函数名相同，不区分大小写，用于标识此控件的类型。<br> 每个控件在继承时必须重写此属性。
`useSkin` | 值为一个布尔值，表示此控件是否需要皮肤，默认在基类上提供，值为false，如果某控件需要换肤，需要设置为true，并提供相应的皮肤资源。
`cssUrl` | 值为一个数组，表示此控件需要加载的所有的css资源路径
`jsUrl` | 值为一个数组，表示此控件需要加载的所有的js资源路径
`htmlUrl` | 值为一个字符串，表示此控件需要加载的html资源路径
`htmlContainer` | 控件html资源加载成功后要插入的容器，值为一个jq选择器或jq对象或HTMLElement

> 控件基类提供的以上属性中，均为控件开发者使用的，最终用户无需关注。

**事件**

触发事件时，除了触发时传递的其他属性之外，固定有以下属性：

```js
{
    type: String,   // 事件类型
    origin: Object, // 事件绑定到的对象，即当前控件
    cancel: Boolean, // 是否取消
    scope: Object // 事件处理函数执行的上下文对象，绑定事件时未指定则同origin
}
```

此外控件基类中自动处理流程中会按顺序触发以下事件：

事件名称 | 额外参数 | 说明
-- | -- | --
`beforeSourceLoad` | `cssUrl` ： 将要加载的css资源 <br> `jsUrl` ：将要加载的js资源 | 控件开始加载所需要的资源之前触发。
`beforeHTMLLoad` | `htmlUrl` ： 将要加载的HTML资源 | 控件HTML资源加载前触发
`beforeHtmlInsert` | `htmlUrl` ： 将要加载的HTML资源 <br> `content` ：获取到的HTML内容 <br> `htmlContainer` : HTML将要插入的容器 | 控件HTML资源加载成功，插入页面前触发。
`afterHTMLLoad` | 同 beforeHtmlInsert | 控件HTML资源加载成功，并插入页面后触发。
`beforeJsload` | `jsUrl` ：将要加载的js资源 | js资源开始加载前触发。
`afterJsLoad` | `jsUrl` ：加载的js资源 | js资源加载完成后触发。
`afterSourceLoad` | `cssUrl` ： 加载的css资源 <br> `jsUrl` ：加载的js资源 | 控件加载资源完成后触发。

## 控件机制约定和规范

### 命名约定

- 控件的构造函数名称遵循帕斯卡命名规范
- 控件继承时，必须为此控件指定 `type` 属性，类型为字符，值和构造函数名称相同
- 控件存放的js、css文件名称和控件的构造函数名称一致
- 控件存放的js、css文件名称全部小写

### 控件资源组织

一个控件形成一个文件夹，以自己的控件名称（即控件的构造函数名称）命名，全部小写，放在控件基类文件（`base.js`）所在的目录下。

控件的资源目录组织结构应如下所示：

```
component
|-  controlname
    |-  controlname.js              // 控件js
    |-  controlname.css             // 控件css
    |-  readme                      // 关于此控件的说明
    |-  images                      // 控件需要的图片资源
        |- 图片资源1
        |- 图片资源2
        |- ...
        |- 图片资源n
    |-  themes                      // 皮肤资源 如果控件需要换肤则必须提供
        |-  grace                   // 主题名称 如dream、classic、imac等
            |-  skins
                |-  default         // 皮肤的名称
                    |- skin.css     // 此皮肤的css文件
                |-  chinared
                    |- skin.css
        |-  dream
            |- ..
        |-  classic
            |- ..

```

以下为一个控件的结构示例

```
component
|-  calendar
    |-  calendar.js                 // 控件js
    |-  calendar.css                // 控件css
    |-  readme.md                   // 关于此控件的说明
    |-  images                      // 控件需要的图片资源
        |- btn-prev.png
        |- btn-next.png
    |-  themes                      // 皮肤资源 如果控件需要换肤则必须提供
        |-  grace                   // 主题名称 如dream、classic、imac等
            |-  skins
                |-  default         // 皮肤的名称
                    |- skin.css     // 此皮肤的css文件
                |-  chinared
                    |- skin.css
```

### 配置

**开发时的约定**

除以上命名和资源组织之外，控件开发时还需要注意：

- 每个控件需要实现自己的 `create` 方法，并在控件真实创建完成后触发 `afterCreate` 事件。
- `useSkin` 属性：表示此控件是否需要切换皮肤
  - 通常一种控件是否需要换肤在开发时就可以确定，因此开发者应该在开发时为此控件指定好此属性，需要皮肤的情况下，在资源加载前，会自动获取当前皮肤并加载。
  - 如果需要切换皮肤，必须提供相应的皮肤资源，皮肤资源组织结构参考上面的控件资源组织结构。
- 关于 `setCss()`、`setJs` 方法 和 `addCss()` 、 `addJs()` 方法的作用和区别。
  -  都是为控件指定需要的css和js资源。
  -  直接使用 `this.setCss()` 和 `this.setCss()` 时，参数为一个字符串或数组，值为资源路径，表示直接为此控件指定所需要的css和js资源。
  -  使用 `this.addCss()` 和 `this.addJs()` 方法，传递一个资源的路径时，此时是在父类css或js资源的基础上新加入指定的css或js文件。

**关于用户使用时配置的约定**

- 配置 `cfg` 必须为一个对象。
- 配置对象中的 `events` 属性为一个对象，键名为事件名称，值为处理函数。用于绑定控件在初始化过程中就需要的事件。没有则无需指定。

## 继承基类创建一个新的控件

继承固定格式如下：

```js
// 新控件的构造函数
epctrl.Calendar = function (cfg) {
    epctrl.Calendar.superclass.constructor.apply(this, arguments);

    // TODO 控件上的其他操作
};
// 继承关系
epctrl.extend('Calendar', 'Control', {
    // 此控件类型
    type:"Calendar",
    // 创建方法，在资源加载完成后自动调用
    create: function () {
        // TODO 此控件的创建方法
    }
});
```

以上展示了继承基类创建一个控件名称为 **Calendar** 的新控件的固定写法和必要部分。

可分为两个部分：构造函数和继承关系

**构造函数**

1. 首先在控件机制的命名空间下新增一个名为 `Calendar` 的构造函数，参数为此控件的配置。

2. 在构造函数内部首先调用此控件的 `superclass.constructor` 方法，作用为先执行一遍父类的构造函数，固定写法为:  `epctrl.新增的控件.superclass.constructor.apply(this, arguments)` ， 此处的Calendar控件，即：`epctrl.Calendar.superclass.constructor.apply(this, arguments);`

**继承关系**

1. 直接调用 `epctrl.extend`  方法，第一个参数为当前控件的名称，第二个参数为父类控件的名称，第三个参数为要新增或覆盖的属性、方法集合。
2. 在第三个参数中，必须有 `type` 属性和 `create()` 方法，`type` 属性用于唯一标识当前控件的名称，值为一个字符串，约定值和当前控件构造函数名称相同；`create()` 方法为此控件的真实创建方法。

## 继承已有控件创建一个新的控件

使用和基于基类创建控件类似，首先也是创建自己的构造函数，并在构造函数内首先调用父类的构造函数，之后指定此控件的继承关系和需要新增或重写的方法即可。

例如继承上面创建的 `Calendar` 控件，来创建一个新的 `ExtraCalendar` :

```js
// 新控件构造函数
epctrl.ExtraCalendar = function (cfg) {
    epctrl.ExtraCalendar.superclass.constructor.apply(this, arguments);

    // 到此 所有在Calendar构造函数中处理的内容已经执行，之后在加入或修改即可。
    // TODO
};

// 继承关系
epctrl.extend('ExtraCalendar', 'Calendar', {
    // 此控件类型 必须重写
    type:"ExtraCalendar",
    // 创建方法，在资源加载完成后自动调用
    // 如果此控件的创建方法可以复用Calendar中的，则可以不用重写
    create: function () {
        // TODO 此控件的创建方法
    }
});
```

## 重写一个已有控件

如果已有控件的某些方法不符合目前的需求，则可以重写这个已有控件的部分属性和方法。

使用 `epctrl.overwrite(destName, proto)` 方法即可。

如重写之前创建的 `ExtraCalendar` 控件：

```js
// 重写控件
epctrl.overwrite('ExtraCalendar', {
    // 需要新增或者重写的属性方法
    // ...
});
```
