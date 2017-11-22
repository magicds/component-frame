# 周视图二维日历控件

此日历控件是基于框架控件机制，自行实现的一个周视图的二维日历。主要特色在于，由分类和日期形成一个二维视图，可以在二维视图中插入任意小部件（而且自动根据开始结束时间计算好了在视图中占据的位置），用于展示日程、会议室安排、车辆安排等。

- [在线演示](https://cdswyda.github.io/component-frame/component/weekcalendar/demo/week.html)
- [说明文档](https://github.com/cdswyda/component-frame/tree/master/component/weekcalendar)

## 使用说明

**资源引入**

- 引入框架控件机制的基类js文件。

- 引入此日历控件的js文件。

**初始化**

使用框架控件机制的统一初始化方法 epctrl.init(controlName, cfg) 即可，第一个参数为控件名称，此处即 WeekCalendar，第二个参数为控件的配置。

使用如下所示：

```js
var calendar = epctrl.init('WeekCalendar', {
    el: '#calendar',
    date: '2017-11-11'
});
```

相关配置如下：

```js
{
    // 日历渲染的容器 必须指定 值为一个jq选择器
    el: '#calendar',
    // 日历宽高度 不指定时 占满指定元素的宽高度
    width: '',
    height: '',

    // 初始化渲染的日期 格式如：'2017-11-10'
    // 初始化的周视图中必定能够显示此日期，不知道则取当天日期
    date: '',
    // 是否显示边框
    showBorder: true,

    // 星期从周日开始？
    dayStartFromSunday: false,
    // 头部高度 不指定以css样式为准 如果指定了 也需要自行修改css 否则可能不协调
    headerHeight: '',
    // 左侧分类标题
    categoryTitle: '',
    // 左侧分类数据
    // 格式如：
    // [{
    //     id: 'cate-1',
    //     name: '大众',
    //     content: '苏A00000'
    // }, {
    //     id: 'cate-2',
    //     name: '雷诺',
    //     content: '苏A00001'
    // }, {
    //     id: 'cate-3',
    //     name: '红旗',
    //     content: '苏A00003'
    // }]
    category: [],
    // 日期时间分隔符 默认为空 对应格式为 '2017-11-11 20:00'
    // 对于'2017-11-11T20:00' 这样的格式务必指定正确的日期和时间之间的分隔符
    dateTimeSplit: ' ',
    // 计算插入部件位置精度的单位 支持秒和分钟 即 second/minute 默认为 second
    posUnit: 'second'
}
```

## 方法说明

方法名 | 作用 | 参数 | 返回
-- | -- | -- | --
`setCategoryTitle(title)` | 设置分类标题 | `title` 字符串类型，分类名称 | -
`getCategoryTitle()` | 获取分类标题 | | 分类的标题
`setCategory(data)` | 设置左侧分类数据，<br>设置后分类和网格部分将重绘 | `data` 一个数组，表示左侧分类的数据，详细格式见配置信息 |
`getCategory()` | 获取分类数据 | | 分类数据的数组
`getGridElByPos(i,j)` | 根据位置获取日历网格dom元素 | `i` 、 `j` 为一个数字，表示行列索引，从0开始 | 对应的 `HTMLElement` 或 `null`
`setDate(dateText)` | 指定一个日期渲染到能显示此日期的日历视图 | `dateText` 表示日期的字符串，格式为 `'11-11'` 或 `'2017-11-11'` 不指定年份时则取今天所在年份|
`prevWeek()` | 上一周 | |
`nextWeek()` | 下一周 | |
`goToday()` | 回到今天的视图，今天已经在显示则不处理 | | 今天已经在视图中时返回 `false`
`addWidget(data)` | 在日历中新增一个小部件 | `data` 生成小部件的数据对象。<br/>属性如下：<br/>`id`: 部件id<br/>`categoryId`: 分类id<br/>`title`: 部件title<br/>`content`: 部件内容 可选<br/>`start`: 开始时间 日期格式为2017-11-11 时间格式为08:00:00 日期和时间之间的分隔符可通过`dateTimeSplit`自行配置。如："2017-11-11 08:22:23"<br/>`end`: 结束时间<br/>`bgColor`: 部件背景色 可选，有默认背景色 | 分类不存在或者用户取消添加时，返回`false`，否则返回新增部件的 `HTMLElement`
`removeWidget(id)` | 移除一个小部件 | `id` 小部件ID | 部件不存在时，返回 `false` ，否则返回移除后的部件 `HTMLElement`。
`getStartEnd(dateStr)` | 指定一个日期，获取对应的周视图中的开始日期和结束日期 | `dateStr` 日期字符串 格式 "2017-11-11" | 一个对象，start属性为开始日期，end为结束日期

## 事件说明

### beforeCreate

日历控件开始创建前触发

### afterCreate

日历控件创建完成后触发

### categoryRender

分类渲染时触发，结构生成还未插入页面

```js
{
    categoryEl: HTMLElement, // 当前分类的HTML元素
    titleEl: HTMLElement, // 此分类标题的HTML元素
    contentEl: HTMLElement // 此分类内容的HTML元素
}
```

### agterCategoryRender

分类渲染时触发，已经插入页面，参数同上。

### dateRender

日历日期渲染时发生，结构生成还未插入页面。

```js
{
    // 当前完整日期 2017-11-11
    date: String,
    // iso星期 1-7 表示周一至周日
    isoWeekday: Nomber,
    // 显示的文本 默认为 周一 11-13
    dateText: String,
    // 当前日期don元素的className
    dateCls: String,
    // 日历el
    el: HTMLElement,
    // 当前el
    dateEl: HTMLElement
}
```

对 `dateText` 和 `dateCls` 的处理会自动更新到日历控件上。`dateCls`通常可以新增一个类，不能直接覆盖默认的类名。

### afterDateRender

日历日期渲染完成时发生，已经插入页面。参数同上。

### titleChanged

日历title改变时触发。

```js
{
    startDate: String, // 当前视图开始日期 格式 YYYY-MM-DD
    endDate: String, // 结束日期
    // 显示的文本 默认形式为2017年11月13日-19日 或 2017年11月27日-12月3日
    title: String,
    // 日历title的dom元素
    titleEl: HTMLElement
}
```

### dateChanged

日历日期改变后触发

```js
{
    startDate: String, // 开始日期 格式 YYYY-MM-DD
    endDate: String, // 结束日期
    categorys: Array // 分类id集合
}
```

### dateClick

日期点击时触发，仅指显示日期的7天。

```js
{
    ev: Object, // 原始click事件对象
    date: String, // 日期
    isoWeekday: Number, // iso星期
    dateEl: HTMLElement // 此日期的dom元素
}
```

### categoryClick

分类点击时触发

```js
{
    ev: Object, // 原始click事件对象
    categoryId:String, // 此分类的id
    title: String, // 此分类名称
    categoryIndex: Number // 此分类的索引
}
```

### prevBtnClick

上一周点击时触发

```js
{
    ev: Object,    // 原始click事件对象
    start: String, // 当前视图开始日期 格式 YYYY-MM-DD
    end: String    // 结束日期
}
```

设置事件对象的 `cancel` 为 `true` 可取消跳转到上一周

### nextWeekClick

下一周点击时触发，参数同上。

### widgetClick

日历中部件点击时触发

```js
{
    ev: Object, // 原始click事件对象
    categoryId: String, // 所属分类id
    widgetId: String, // 部件id
    start: String, // 此部件开始日期时间
    end: String, // 结束日期时间
    title: String // 部件名称
}
```

### cellClick

日历中分类和日期形成的网格点击时触发，按下鼠标移动再松开，则可以选择一段时间。

```js
{
    // 分类id
    categoryId: String,
    // 开始日期
    startDate: String,
    // 结束日期
    endDate: String,
    // 行索引
    rowIndex: Number,
    // 列索引范围
    columnIndexs: Array
}
```

### widgetOccupied

添加部件和现有部件冲突（重叠）时发生。

```js
{
    occupiedWidgets: Array,  // 和当前添加部件发生冲突的部件的集合，每个成员为部件的 HTMLElement
    currWidget: HTMLElement, // 当前部件的HTMLElement
    widgetData: Object // 此部件数据
}
```

在此事件中可对发生重叠的部件进行处理，或直接设置其 `cancel` 为 `true` 取消当前的添加。

### widgetAdd

部件添加时触发，已经检测过是否重叠，还未插入页面。

```js
{
    widgetId: String, // 部件id
    categoryId: String, // 所属分类id
    start: String, // 开始日期时间
    end: String, // 结束日期时间
    startPos: Number, // 开始时间距离左侧的百分比
    endPos: Number, // 结束时间换算后距离左侧的百分比
    widgetEl: HTMLElement // 部件HTMLElement
}
```

设置其 `cancel` 为 `true` 取消当前的添加。

### afterWidgetAdd

部件添加完成时触发，参数同上。
