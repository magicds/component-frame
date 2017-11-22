/**
 * 二维周视图日历
 * author: chends
 */
/* global epctrl,moment*/

epctrl.WeekCalendar = function (cfg) {
    epctrl.WeekCalendar.superclass.constructor.apply(this, arguments);

    // 添加控件的css和js资源 如果是在父类的基础上新增css资源 则使用以下两个方法
    // this.addCss();
    // this.addJs();
    // 如果要给当前控件新的css、js资源，则通过this.setjs()和this.setCss()进行配置，参数为一个字符串或数组。
    this.setCss('weekcalendar/weekcalendar.css');

    // 当前无moment时 自动引入moment
    if (!window.moment || typeof window.moment != 'function') {
        this.setJs('../lib/moment.min.js');
    }

    // 加入传递的配置
    this.cfg = cfg || {};
};

epctrl.extend('WeekCalendar', 'Control', {
    // 控件类型 必须指定，值即为控件的名称
    type: 'WeekCalendar',

    // 选中的单元格的class
    _selectedCls: 'selected',

    // 一周分钟数
    _WEEKMINUTES: 7 * 24 * 60,
    // 一周秒数
    _WEEKSECONDS: 7 * 24 * 3600,
    // 一天的分钟数秒数
    _DAYMINUTES: 24 * 60,
    _DAYSCONDS: 24 * 3600,

    // 计算位置的精度 取值second 或 minute
    posUnit: 'second',

    // 日期和时间之前的分隔符
    _dateTimeSplit: ' ',

    _defaultCfg: {
        // 不指定时 占满指定元素的宽高度
        width: '',
        height: '',

        // 初始化渲染的日期 格式如：'2017-11-10'
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
        category: []
    },

    // 初始化配置
    _initCfg: function () {
        this.cfg = jQuery.extend({}, this._defaultCfg, this.cfg);

        if (!this.cfg.el) {
            this.throwError('必须指定日历渲染容器');
        }

        // 日历渲染容器
        this.$container = jQuery(this.cfg.el);
        this.container = this.$container[0];

        // 星期从周日开始？
        this.dayStartFromSunday = this.cfg.dayStartFromSunday;

        // 是否显示边框
        this.showBorder = this.cfg.showBorder;

        // 今天
        this.today = moment().format('YYYY-MM-DD');

        // 需要展示的日期
        this.date = this.cfg.date || this.today;

        // 分类标题
        this._categoryTitle = this.cfg.categoryTitle;

        // 分类数据
        this._categoryData = this.cfg.category;

        // 日期时间分隔符
        this._dateTimeSplit = this.cfg.dateTimeSplit || this._dateTimeSplit;
        // 位置精度
        this.posUnit = this.cfg.posUnit || this.posUnit;
    },

    // 渲染
    render: function () {

        this._initContainer();

        this._renderCatagories();

        this._renderChanged();
        // this._renderWeeks();
        // this._renderGrid();
        // this._rednerContent();

    },

    // 初始化结构
    _initContainer: function () {
        this.$container.empty();

        var el = document.createElement('div');
        el.className = 'ep-weekcalendar' + (this.showBorder ? ' border' : '');

        this.cfg.width && (el.style.width = this.cfg.width);
        this.cfg.height && (el.style.height = this.cfg.height);

        this.el = el;

        // header
        var header = document.createElement('div');
        header.className = 'ep-weekcalendar-header';
        header.innerHTML = '<div class="ep-weekcalendar-header-left"></div><div class="ep-weekcalendar-header-center"><span class="ep-weekcalendar-header-btn ep-weekcalendar-header-btn-prev"></span><span class="ep-weekcalendar-title"></span><span class="ep-weekcalendar-header-btn ep-weekcalendar-header-btn-next"></span></div><div class="ep-weekcalendar-header-right"></div>';

        this.cfg.headerHeight && (header.style.height = this.cfg.headerHeight);

        this._headerEl = header;

        this._headerLeft = header.firstChild;
        this._headerRight = header.lastChild;
        // this._headerCenter = jQuery('.ep-weekcalendar-header-center', header)[0];
        this._headerCenter = this._headerLeft.nextSibling;
        // this._prevBtn = jQuery('.ep-weekcalendar-header-btn-prev', this._headerCenter)[0];
        this._prevBtn = this._headerCenter.firstChild;
        this._titleEl = this._prevBtn.nextSibling;

        this._nextBtn = this._headerCenter.lastChild;
        this.el.appendChild(header);

        // 主体部分 左侧分类 右侧日历
        var body = document.createElement('div');
        body.className = 'ep-weekcalendar-body';

        // 左侧分类
        var categoryArea = document.createElement('div'),
            cateHeader = document.createElement('div'),
            cateTitle = document.createElement('span'),
            cateList = document.createElement('ul');

        categoryArea.className = 'ep-weekcalendar-category-area';
        cateHeader.className = 'ep-weekcalendar-category-header';
        cateTitle.className = 'ep-weekcalendar-category-title';
        cateList.className = 'ep-weekcalendar-category-list';
        cateHeader.appendChild(cateTitle);
        categoryArea.appendChild(cateHeader);
        categoryArea.appendChild(cateList);

        // 右侧区域
        var timeArea = document.createElement('div');
        timeArea.className = 'ep-weekcalendar-time-area';

        // 头部星期
        var weeks = document.createElement('div');
        weeks.className = 'ep-weekcalendar-weeks';

        // 时间部分中分两块 一个画日历作为背景 一个用于显示内容
        var main = document.createElement('div'),
            grid = document.createElement('div'),
            content = document.createElement('div');
        main.className = 'ep-weekcalendar-main';
        grid.className = 'ep-weekcalendar-grid';
        content.className = 'ep-weekcalendar-content';

        timeArea.appendChild(weeks);
        main.appendChild(grid);
        main.appendChild(content);
        timeArea.appendChild(main);
        body.appendChild(categoryArea);
        body.appendChild(timeArea);

        el.appendChild(body);

        this._categoryTitleEl = cateTitle;
        this._categoryListEl = cateList;
        this._weeksEl = weeks;
        this._gridEl = grid;
        this._contentEl = content;
        this.container.appendChild(this.el);
    },

    // 左侧分类渲染
    _renderCatagories: function () {
        this.setCategoryTitle();

        this._categoryListEl.innerHTML = '';

        var i = 0,
            data = this._categoryData,
            node = document.createElement('li'),
            cataEl;
        node.className = 'ep-weekcalendar-category';

        // 用行作为下标记录当前分类id集合
        this._categoryIndexs = [];
        // id为键记录索引
        this._categoryReocrds = {};

        while (i < data.length) {
            this._categoryIndexs.push(data[i].id);
            this._categoryReocrds[data[i].id] = i;
            cataEl = node.cloneNode(true);
            this._rendercategory(data[i], cataEl);
            i++;
        }

        // 分类重绘必定重绘网格和内容
        this._renderGrid();
        this._rednerContent();

    },

    _rendercategory: function (cate, cateEl) {
        cateEl.setAttribute('data-cateid', cate.id);

        var titleEl = document.createElement('span'),
            contentEl = document.createElement('span');
        titleEl.className = 'title';
        contentEl.className = 'content';

        titleEl.innerHTML = cate.name;
        contentEl.innerHTML = cate.content;
        cateEl.appendChild(titleEl);
        cateEl.appendChild(contentEl);

        this.fire('categoryRender', {
            categoryEl: cateEl,
            titleEl: titleEl,
            contentEl: contentEl
        });

        this._categoryListEl.appendChild(cateEl);

        this.fire('agterCategoryRender', {
            categoryEl: cateEl,
            titleEl: titleEl,
            contentEl: contentEl
        });
    },

    // 右侧网格
    _renderGrid: function () {
        this._gridEl.innerHTML = '';

        var rowNode = document.createElement('div'),
            itemNode = document.createElement('span'),
            rowsNum = this._categoryData.length,
            i = 0,
            j = 0,
            row, item;

        rowNode.className = 'ep-weekcalendar-grid-row';
        itemNode.className = 'ep-weekcalendar-grid-item';

        while (i < rowsNum) {
            row = rowNode.cloneNode();
            row.setAttribute('data-i', i);
            j = 0;

            while (j < 7) {
                item = itemNode.cloneNode();
                // 周末标识
                if (this.dayStartFromSunday) {
                    if (j === 0 || j === 6) {
                        item.className += ' weekend';
                    }
                } else {
                    if (j > 4) {
                        item.className += ' weekend';
                    }
                }

                item.setAttribute('data-i', i);
                item.setAttribute('data-j', j);
                row.appendChild(item);

                j++;
            }

            this._gridEl.appendChild(row);

            i++;
        }

        rowNode = itemNode = row = item = null;
    },

    // 右侧内容
    _rednerContent: function () {
        this._contentEl.innerHTML = '';

        var i = 0,
            node = document.createElement('div'),
            row;

        node.className = 'ep-weekcalendar-content-row';

        while (i < this._categoryData.length) {
            row = node.cloneNode();
            row.setAttribute('data-i', i);

            this._contentEl.appendChild(row);
            ++i;
        }

        row = node = null;

    },

    // 日期切换时清空内容
    _clearContent: function () {
        var rows = this._contentEl.childNodes,
            i = 0;

        while (i < rows.length) {
            rows[i].innerHTML && (rows[i].innerHTML = '');
            ++i;
        }

        // 部件数据清空
        this._widgetData = {};
    },

    // 渲染日历星期头部
    _renderWeeks: function () {
        this._weeksEl.innerHTML = '';
        var i = 0,
            currDate = this._startDate.clone(),
            node = document.createElement('div'),
            week;
        node.className = 'ep-weekcalendar-week';

        // 单元格列作为下标记录日期
        this._dateRecords = [];

        while (i++ < 7) {
            // 更新记录日期
            this._dateRecords.push(currDate.clone());

            week = node.cloneNode(true);
            this._renderWeek(currDate, week);
            currDate.add(1, 'day');
        }

        // 切换日期 需要重绘内容区域
        this._rednerContent();
    },

    _renderWeek: function (date, node) {
        var dateText = date.format('YYYY-MM-DD'),
            day = date.isoWeekday();
        // dateText = '周' + this._WEEKSNAME[date.isoWeekday() - 1] + ' ' + date.format('MM-DD');
        // node.innerText = '周' + this._WEEKSNAME[day-1] + ' ' + date.format('MM-DD');

        if (day > 5) {
            node.className += ' weekend';
        }
        if (date.isSame(this.today, 'day')) {
            node.className += ' today';
        }

        node.setAttribute('data-date', dateText);
        node.setAttribute('date-isoweekday', day);

        var ev = this.fire('dateRender', {
            // 当前完整日期
            date: dateText,
            // iso星期
            isoWeekday: day,
            // 显示的文本
            dateText: '周' + this._WEEKSNAME[day - 1] + ' ' + date.format('MM-DD'),
            // classname
            dateCls: node.className,
            // 日历el
            el: this.el,
            // 当前el
            dateEl: node
        });

        // 处理事件的修改
        node.innerHTML = ev.dateText;
        node.className = ev.dateCls;

        this._weeksEl.appendChild(node);

        this.fire('afterDateRender', {
            // 当前完整日期
            date: dateText,
            // iso星期
            isoWeekday: day,
            // 显示的文本
            dateText: node.innerHTML,
            // classname
            dateCls: node.className,
            // 日历el
            el: this.el,
            // 当前el
            dateEl: node
        });
    },

    // 绘制可变部分
    _renderChanged: function () {
        // 清空内容
        this._clearContent();
        // 初始日期范围
        // 渲染标题和日期
        this._initStartEnd();

        var start = this._startDate.format('YYYY-MM-DD'),
            end = this._endDate.format('YYYY-MM-DD');

        this._renderCalendarTitle();
        this._renderWeeks();

        // 渲染完成
        this.fire('dateChanged', {
            startDate: start,
            endDate: end,
            categorys: this._categoryIndexs
        });

    },

    // 绘制头部标题
    _renderCalendarTitle: function () {
        var start_text = this._startDate.format('YYYY年MM月DD日'),
            end_text =
            this._endDate.format(this._startDate.isSame(this._endDate, 'month') ? 'DD日' : 'MM月-DD日');

        // 触发标题改变事件
        var ev = this.fire('titleChanged', {
            startDate: this._startDate.format('YYYY-MM-DD'),
            endDate: this._endDate.format('YYYY-MM-DD'),
            title: start_text + ' - ' + end_text,
            titleEl: this._titleEl
        });

        this._titleEl.innerHTML = ev.title;
    },

    // 星期文本
    _WEEKSNAME: ['一', '二', '三', '四', '五', '六', '日'],

    // 初始一周的开始和结束
    _initStartEnd: function () {
        var startEnd = this._getStartEnd();

        this._startDate = startEnd.start;
        this._endDate = startEnd.end;
    },

    _getStartEnd: function (date) {
        date = moment(date || this.date, 'YYYY-MM-DD');

        var isoWeekday = date.isoWeekday(),
            start, end;

        if (this.dayStartFromSunday) {
            start = date.clone().subtract(isoWeekday === 7 ? 0 :
                isoWeekday, 'day');
        } else {
            start = date.clone().subtract(isoWeekday - 1, 'day');
        }
        end = start.clone().add(6, 'day');
        return {
            start: start,
            end: end
        };
    },

    // 根据指定日期获取周视图周中的开始和结束日期
    getStartEnd: function (date) {
        var o = this._getStartEnd(date);
        return {
            start: o.start.format('YYYY-MM-DD'),
            end: o.end.format('YYYY-MM-DD')
        };
    },

    // 初始化事件
    _initEvent: function () {
        var me = this;

        // 点击的行索引
        var row,
            // 开始列索引
            columnStart,
            // 结束列索引
            columnEnd,
            // 是否在按下、移动、松开的click中
            isDurringClick = false,
            // 是否移动过 用于处理按下没有移动直接松开的过程
            isMoveing = false,
            $columns,
            // 网格左侧宽度
            gridLeft,
            // 每列的宽度
            columnWidth;
        jQuery(this.el)
            // 按下鼠标 记录分类和开始列
            .on('mousedown.weekcalendar', '.ep-weekcalendar-content-row', function (e) {
                isDurringClick = true;
                gridLeft = jQuery(me._gridEl).offset().left;
                columnWidth = jQuery(me._gridEl).width() / 7;
                jQuery(me._gridEl).find('.ep-weekcalendar-grid-item').removeClass(me._selectedCls);

                row = this.getAttribute('data-i');
                $columns = jQuery(me._gridEl).find('.ep-weekcalendar-grid-row').eq(row).children();

                columnStart = (e.pageX - gridLeft) / columnWidth >> 0;

            })
            // 前后一周
            .on('click.weekcalendar', '.ep-weekcalendar-header-btn', function (e) {
                var $this = jQuery(this),
                    isPrev = $this.hasClass('ep-weekcalendar-header-btn-prev'),
                    isNext = $this.hasClass('ep-weekcalendar-header-btn-next'),
                    ev,
                    start = me._startDate.format('YYYY-MM-DD'),
                    end = me._endDate.format('YYYY-MM-DD');

                if (isPrev) {
                    ev = me.fire('prevWeekClick', {
                        ev: e,
                        start: start,
                        end: end
                    });
                } else if (isNext) {
                    ev = me.fire('nextWeekClick', {
                        ev: e,
                        start: start,
                        end: end
                    });
                }

                if (ev && !ev.cancel) {
                    me[(isPrev ? 'prev' : 'next') + 'Week']();
                }

            })
            // 小部件点击 由于之前的点击用了down move up来做 这里不能直接使用click 因为click触发太晚
            .on('mousedown.weekcalendar', '.ep-weekcalendar-content-widget', function (e) {
                e.stopPropagation();
            })
            .on('mouseup.weekcalendar', '.ep-weekcalendar-content-widget', function (e) {
                e.stopPropagation();

                me.fire('widgetClick', {
                    ev: e,
                    categoryId: me._categoryIndexs[this.parentNode.getAttribute('data-i')],
                    widgetId: this.getAttribute('data-id'),
                    start: this.getAttribute('data-start'),
                    end: this.getAttribute('data-end'),
                    title: this.title
                });
            })
            // 头部日期点击
            .on('click.weekcalendar', '.ep-weekcalendar-week', function (e) {
                me.fire('dateClick', {
                    ev: e,
                    date: this.getAttribute('data-date'),
                    isoWeekday: this.getAttribute('data-isoweekday'),
                    dateEl: this
                });
            })
            // 分类点击
            .on('click.weekcalendar', '.ep-weekcalendar-category', function (e) {
                var id = this.getAttribute('data-cateid');
                me.fire('categoryClick', {
                    ev: e,
                    categoryId: id,
                    title: this.firstChild.innerHTML,
                    categoryIndex: me._categoryReocrds[id]
                });
            });

        // 移动和松开 松开鼠标 记录结束列 触发点击事件
        // 必须绑定在body上 否则直接移除后 不能正确结束move事件
        jQuery('body')
            // 点击移动过程中 实时响应选中状态
            .on('mousemove.weekcalendar', function (e) {
                if (!isDurringClick) {
                    return;
                }
                isMoveing = true;

                // 当前列索引
                var currColumn;

                currColumn = (e.pageX - gridLeft) / columnWidth >> 0;

                // 修正溢出
                currColumn = currColumn > 6 ? 6 : currColumn;
                currColumn = currColumn < 0 ? 0 : currColumn;

                $columns.removeClass(me._selectedCls);

                // 起止依次选中
                var start = Math.min(columnStart, currColumn),
                    end = Math.max(columnStart, currColumn);

                do {
                    $columns.eq(start).addClass(me._selectedCls);
                } while (++start <= end);

            })
            // 鼠标松开
            .on('mouseup.weekcalendar', function (e) {
                if (!isDurringClick) {
                    return;
                }

                var startIndex = -1,
                    endIndex = -1;

                columnEnd = (e.pageX - gridLeft) / columnWidth >> 0;

                columnEnd = columnEnd > 6 ? 6 : columnEnd;

                // 没有移动过时
                if (!isMoveing) {
                    startIndex = endIndex = columnEnd;
                    // 直接down up 没有move的过程则只会有一个选中的，直接以结束的作为处理即可
                    $columns.eq(columnEnd).addClass(me._selectedCls)
                        .siblings().removeClass(me._selectedCls);
                } else {
                    startIndex = Math.min(columnStart, columnEnd);
                    endIndex = Math.max(columnStart, columnEnd);
                }

                // 触发点击事件
                me.fire('cellClick', {
                    // 分类id
                    categoryId: me._categoryIndexs[row],
                    // 时间1
                    startDate: me._dateRecords[startIndex].format('YYYY-MM-DD'),
                    // 日期2
                    endDate: me._dateRecords[endIndex].format('YYYY-MM-DD'),
                    // 行索引
                    rowIndex: row,
                    // 列范围
                    columnIndexs: (function (i, j) {
                        var arr = [];
                        while (i <= j) {
                            arr.push(i++);
                        }
                        return arr;
                    }(startIndex, endIndex))
                });

                row = columnStart = columnEnd = isMoveing = isDurringClick = false;
            });
    },

    // 左侧分类标题
    setCategoryTitle: function (title) {
        title && (this._categoryTitle = title);
        this._categoryTitleEl.innerHTML = this._categoryTitle;
    },
    getCategoryTitle: function () {
        return this._categoryTitle;
    },

    // 左侧分类数据
    setCategory: function (data) {
        if (!(data instanceof Array)) {
            this.throwError('分类数据必须是一个数组');
            return;
        }
        this._categoryData = data;

        this._renderCatagories();

        this._renderChanged();
    },
    getCategory: function () {
        return this._categoryData;
    },

    // 根据行列获取日历网格
    getGridElByPos: function (i, j) {
        var $row = jQuery('.ep-weekcalendar-grid-row[data-i="' + i + '"]', this._gridEl);

        return $row.length ? $row.find('[data-j="' + j + '"]')[0] : null;
    },

    // 指定一个日期，渲染到能能显示当前日期的视图
    setDate: function (dateText) {
        if (/^\d{1,2}-\d{1,2}$/.test(dateText)) {
            dateText = (new Date()).getFullYear() + '-' + dateText;
        }
        var date = moment(dateText, 'YYYY-MM-DD');

        if (!date.isValid()) {
            this.throwError('指定日期不合法');
            return false;
        }

        var sn = this._getStartEnd(date);

        if (sn.start.isSame(this._startDate, 'day')) {
            // 就是当前视图
            return false;
        }

        this._setDate(date);
    },

    _setDate: function (date) {
        this.date = date.format('YYYY-MM-DD');

        // 调整日期和标题
        this._renderChanged();
    },

    // 上一周
    prevWeek: function () {
        this._setDate(this._startDate.clone().subtract(1, 'day'));
    },

    // 下一周
    nextWeek: function () {
        this._setDate(this._endDate.clone().add(1, 'day'));
    },

    // 回今天视图
    goToday: function () {
        var today = moment();
        if (today.isBetween(this._startDate, this._endDate)) {
            // 今天在 当前视图中 则不用处理
            return false;
        }

        this.today = today.format('YYYY-MM-DD');
        this._setDate(today);
    },

    // 计算指定日期的分钟或秒数
    _getNumByUnits: function (dateStr) {
        var temp = dateStr.split(this._dateTimeSplit),
            date = temp[0];

        // 处理左侧溢出
        if (this._startDate.isAfter(date, 'day')) {
            // 指定日期在开始日期之前
            return 0;
        }
        // 右侧溢出直接算作7天即可

        var times = (temp[1] || '').split(':'),
            days = (function (startDate) {
                var currDate = startDate.clone(),
                    i = 0,
                    d = moment(date, 'YYYY-MM-DD');
                while (i < 7) {
                    if (currDate.isSame(d, 'day')) {
                        return i;
                    } else {
                        currDate.add(1, 'day');
                        ++i;
                    }
                }

                console && console.error && console.error('计算天数时出错！');
                return i;
            }(this._startDate)),
            hours = parseInt(times[0], 10) || 0,
            minutes = parseInt(times[1], 10) || 0,
            seconds = parseInt(times[2], 10) || 0,
            // 对应分钟数
            result = days * this._DAYMINUTES + hours * 60 + minutes;

        return this.posUnit == 'minute' ? result : (result * 60 + seconds);
    },

    // 计算日期时间的百分比位置
    _getPos: function (dateStr) {
        var p = this._getNumByUnits(dateStr) / (this.posUnit == 'minute' ? this._WEEKMINUTES : this._WEEKSECONDS);

        return p > 1 ? 1 : p;
    },
    /**
     * 检查是否发生重叠
     *
     * @param {Object} data 当前要加入的数据
     * @returns false 或 和当前部件重叠的元素数组
     */
    _checkOccupied: function (data) {

        if (!this._widgetData[data.categoryId]) {
            return false;
        }

        var i = 0,
            cate = this._widgetData[data.categoryId],
            len = cate.length,
            result = false,
            occupied = [];

        for (; i < len; ++i) {
            if (data.start < cate[i].end && data.end > cate[i].start) {
                occupied.push(cate[i]);

                result = true;
            }
        }

        return result ? occupied : false;
    },
    // 缓存widget数据
    _cacheWidgetData: function (data) {
        if (!this._widgetData[data.categoryId]) {
            this._widgetData[data.categoryId] = [];
        }
        // 记录当前的
        this._widgetData[data.categoryId].push(data);
    },
    // 新增一个小部件
    addWidget: function (data) {
        var row = this._contentEl.childNodes[this._categoryReocrds[data.categoryId]];

        if (!row) {
            this.throwError('对应分类不存在，添加失败');
            return false;
        }

        // 先查找是否含有
        var $aim = jQuery('.ep-weekcalendar-content-widget[data-id="' + data.id + '"]', row);

        if ($aim.length) {
            // 已经存在则不添加
            return $aim[0];
        }

        // 创建部件
        var widget = document.createElement('div'),
            title = document.createElement('span'),
            content = document.createElement('p'),
            startPos = this._getPos(data.start),
            endPos = this._getPos(data.end),
            _data = {
                categoryId: data.categoryId,
                id: data.id,
                start: startPos,
                end: endPos,
                el: widget,
                data: data
            };

        widget.className = 'ep-weekcalendar-content-widget';
        title.className = 'ep-weekcalendar-content-widget-title';
        content.className = 'ep-weekcalendar-content-widget-content';

        widget.appendChild(title);
        widget.appendChild(content);

        widget.style.left = startPos * 100 + '%';
        widget.style.right = (1 - endPos) * 100 + '%';
        data.bgColor && (widget.style.backgroundColor = data.bgColor);

        data.id && widget.setAttribute('data-id', data.id);
        widget.setAttribute('data-start', data.start);
        widget.setAttribute('data-end', data.end);

        title.innerHTML = data.title;
        data.content && (content.innerHTML = data.content);
        widget.title = data.title + ' 从' + moment(data.start, 'YYYY-MM-DD' + this._dateTimeSplit + 'HH:mm:ss').format('M月D日 HH:mm') + ' 到 ' + moment(data.end, 'YYYY-MM-DD' + this._dateTimeSplit + 'HH:mm:ss').format('M月D日 HH:mm');

        // 检查是否发生重叠
        var isoccupied = this._checkOccupied(_data);

        if (isoccupied) {
            // 触发重叠事件
            var occupiedEv = this.fire('widgetoccupied', {
                occupiedWidgets: (function () {
                    var arr = [];
                    for (var i = 0, l = isoccupied.length; i < l; ++i) {
                        arr.push(isoccupied[i].el);
                    }
                    return arr;
                })(),
                currWidget: widget,
                widgetData: data
            });

            // 取消后续执行
            if (occupiedEv.cancel) {
                return false;
            }
        }

        // 缓存数据
        this._cacheWidgetData(_data);

        var addEv = this.fire('widgetAdd', {
            widgetId: data.id,
            categoryId: data.categoryId,
            start: data.start,
            end: data.end,
            startPos: startPos,
            endPos: endPos,
            widgetEl: widget
        });

        if (addEv.cancel) {
            return false;
        }

        row.appendChild(widget);

        this.fire('afterWidgetAdd', {
            widgetId: data.id,
            categoryId: data.categoryId,
            start: data.start,
            end: data.end,
            startPos: startPos,
            endPos: endPos,
            widgetEl: widget
        });

        return widget;
    },

    // 移除一个小部件
    removeWidget: function (id) {
        var $widget = jQuery('.ep-weekcalendar-content-widget[data-id="' + id + '"]', this._contentEl);

        if (!$widget.length) {
            return false;
        }

        var categoryId = this._categoryIndexs[$widget.parent().data('i')],
            widgetData = this._widgetData[categoryId];

        // 移除widget数据
        jQuery.each(widgetData, function (i, item) {
            if (item.id == id) {
                widgetData.splice(i, 1);
                return false;
            }
        });

        return $widget.remove();
    },

    // 此方法在js等资源加载完成后自动调用
    create: function () {

        // 触发创建前事件
        this.fire('beforeCreate');

        this._initCfg();
        this.render();

        this._initEvent();

        this.fire('afterCreate');
    }
});
