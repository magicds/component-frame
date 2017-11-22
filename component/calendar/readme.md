# 日历控件

此日历控件是基于框架组件机制，自行实现的一个月视图日历，主要功能在于支持日历中每天的单元格中插入任意内容，支持异步获取内容。

- [在线演示](https://cdswyda.github.io/component-frame/component/calendar/demo/calendar.html)
- [说明文档](https://github.com/cdswyda/component-frame/tree/master/component/calendar)

## 使用说明

**资源引入**

- 引入框架控件机制的基类js文件。

- 引入此日历控件的js文件。

**初始化**

使用框架控件机制的统一初始化方法 `epctrl.init(controlName, cfg)` 即可，第一个参数为控件名称，此处即 `Calendar`，第二个参数为控件的配置。

使用如下所示：

```js
var calendar = epctrl.init('Calendar', {
    el: '#calendar',
    date: '2017-09'
});
```

详细配置如下：

```js
{
    // 不指定时 占满指定元素的宽高度
    width: '',
    height: '',

    // 初始化渲染的年月 格式如：'2017-9'
    date: '',
    // 是否显示日历外边框
    showBorder: true,

    // 设置的选中日期不在当前视图中时，是否自动重绘为可展示目标日期的月份
    autoReRender: true,
    // 星期从周日开始？
    dayStartFromSunday: false,
    // 头部高度 不指定以css样式为准 如果指定了 也需要自行修改css 否则可能不协调
    headerHeight: '',
    // 日历底部高度，用不到可以不用管
    footerHeight: '',
    // 日历年月选择弹窗的宽高
    menuHeigt: 240,
    menuWidth: 220
}
```

## 方法说明

方法名| 作用 | 参数 | 返回 | 说明
-- | -- | -- | -- | --
`setMonth(ym)` | 设置日历显示的月份 | 要显示的年月，值为一个字符串，格式 `YYYY-MM` | 设置日历中显示的月份，此过程中触发 `beforeMonthChange` 和 `beforeMonthChange` 事件。<br>输入一个不合法的日期将抛出错误。
`getMonth()` | 获取当前显示的月份 |  | 当前正在显示的月份，格式 `YYYY-MM` |
`prevMonth()` | 上一月 | | |
`nextMonth()` | 下一月 | | |
`setSelected(ymd)` | 设置选中的日期 | 参数ymd为一个字符串，表示完整的日期，格式 `YYYY-MM-DD` <br> 或直接指定当月日期（如当前视图为2017-10，设置选中1号，可直接传入1即可），则直接在当月日期中选择。 | | 传入日期不合法时将抛出错误。指定日期在当前显示的视图中不存在，且 `autoReRender` 为false，会抛出错误，无法选中。
`getSelected` | 获取当前选中的日期 | | 当前选中的日期，格式 `YYYY-MM` <br> 无选中日期时，返回 `""` |
`getStartEnd` | 返回当前视图中的开始日期和结束日期 | | `{start: '2017-09-25', end: '2017-11-5'}` |
`getELByDate(md)` | 根据日期获取对应的dom元素 | 日期字符串，格式 `[[YYYY-]MM-]DD` | `HTMLElement` or `null` | 参数可以直接指定当月日期，格式 `DD`。或 `MM-DD` 和 `YYYY-MM-DD` 的形式
`goToday()` | 回到能显示今天的视图 | | |
`reset()` | 回到初始化时的视图 | | |

## 事件说明

### beforeCreate

日历控件开始创建前触发

### afterCreate

日历控件创建完成后触发

### beforeDateRender

日历中可变部分（即日期部分）渲染前触发

事件参数的基本属性见控件机制中的描述，此事件参数为：

```js
{
    // 要渲染的月份
    momth: String,
    // 此月渲染时的开始日期，格式YYYY-MM-DD
    startDate: String,
    // 此月份日期渲染的结束日期
    endDate: String,
    // ajax对象
    ajax: null
}
```

如渲染2017-11月份的日期，则 `month` 为 `'2017-11'`, `startDate` : `'2017-10-30'` , `endDate` : `'2017-12-10'` 。 其中开始日期和结束日期是和日历的周一开始和周日开始有关的，上述为周一开始。

如果需要动态获取数据，以便在日期渲染时使用，可将获取数据的ajax对象加到事件参数的ajax属性上。如果用户加入了ajax，则之后的日期渲染会等待此ajax请求完成后才会触发。

如：

```js
// 日期部分渲染前
testCalendar.on('beforeDateRender', function (e) {
    var startDate = e.startDate,
        endDate = e.endDate;
    // 如果需要动态获取数据
    // 则将获取数据的ajax加到事件对象的ajax属性上即可
    // 日期渲染的cellRender事件将在ajax成功获取数据后执行
    e.ajax = $.ajax({
        url: 'getDateInfo.xxx',
        data: {
            start: startDate,
            end: endDate
        }
    });
});
```

### afterDateRender

日历中可变部分（即日期部分）渲染前触发

事件参数同 `beforeDateRender`。

如果用户指定了获取数据的ajax，则时间参数中的ajax即用获取数据的ajax，否则ajax属性会替换成一个jQuery中Deferred对象模拟的Promise。

### cellRender

日历中星期头和日期单元格渲染时触发，基本结构已经生成，还未插入页面。

事件参数的基本属性见控件机制中的描述，此事件参数为：

```js
{
    // isoweekday 周一至周日为1-7
    isoWeekday: Number,
    // 星期th的class 日期渲染时时无此属性
    dayCls: String,
    // 日期td 的class 星期渲染时无此属性
    dateCls: String,
    // 星期的内容 日期渲染时时无此属性
    dayText: String,
    // 当天的完整日期，YYYY-MM-DD  星期渲染时无此属性
    date: String,
    // 日期文本 星期渲染时无此属性
    dateText: String,
    // 日历dom
    el: HTMLElement,
    // 当前单元格dom
    tdEl: HTMLElement,
    // 额外注入的html 此部分html将会被自动插入到内容中
    extraHtml: String,
    // 是否表格头 即是否为头部星期几
    isHeader: Boolean
}
```

### afterCellRender

一个单元格渲染完成后触发。基本结构以及cellRender中自定义的内容已经插入页面。

参数同cellRender。

### titleRender

日历头部的“YYYY年MM月”改变时触发，还未插入页面

```js
{
    // title dom对象
    titleEl: HTMLElement,
    // 当前月份 格式 YYYY-MM
    currMonth: String,
    // 实际显示的内容，支持HTML片段，修改此值即可自定义title
    titleContent: String
}
```

### afterTitleRender

日历头部的“YYYY年MM月”改变完成时触发，已经修改到页面。

### beforeMonthChange

日历显示月份变化前触发

```js
{
    // 日历dom
    el: HTMLElement,
    // 之前的月份 YYYY-MM
    oldMonth: String,
    // 新的月份
    newMonth: String
}
```

### afterMonthChange

日历显示月份变化后触发,参数同 `beforeMonthChange`。

### dayClick

日期单元格点击时触发

```js
{
    // jq封装的事件参数
    ev: Object,
    // 当前日期
    date: String,
    // iso星期
    day: String,
    // 日历dom
    el: HTMLElement,
    // 当前单元格dom
    tdEl: HTMLElement
}
```

一个日期的点击，默认导致此日期选中。在事件中设置事件参数的 `cancel` 属性为 `true` 可以阻止此操作。

### dayHeaderClick

日历中头部星期单元格点击时触发

```js
{
    // jq封装的事件参数
    ev: Object,
    // 此星期的iso星期 1-7 为周一至周日
    day: String,
    // 日历dom
    el: HTMLElement,
    // 当前单元格dom
    tdEl: HTMLElement
}
```

### prevBtnClick 和 nextBtnClick

前一月和后一月点击事件

```js
{
    // jq封装的事件参数
    ev: Object,
    // 当前显示的月份
    currMonth: String,
    // 日历dom
    el: HTMLElement
}
```

默认操作为视图重新渲染为前一月或后一月，设置事件参数的 `cancel` 属性为 `true` 可以阻止此操作。

### titleClick

日历title(YYYY年MM月)点击时触发

```js
{
    // jq封装的事件参数
    ev: Object,
    // 当前显示的月份
    currMonth: String,
    // 日历dom
    el: HTMLElement,
    // 年月选择面板中展示出的年月 YYYY-MM
    // 默认为空，展示后显示出当前年月
    showMonth: String
}
```

此事件后续默认操作为展示年月选择面板，设置事件参数的 `cancel` 属性为 `true` 可以阻止此操作。
