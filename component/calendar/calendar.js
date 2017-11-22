/**
 * 月视图视图日历
 */
/* global epctrl,moment */

epctrl.Calendar = function (cfg) {
    epctrl.Calendar.superclass.constructor.apply(this, arguments);

    // 添加控件的css和js资源 如果是在父类的基础上新增css资源 则使用以下两个方法
    // this.addCss();
    // this.addJs();
    // 如果要给当前控件新的css、js资源，则通过this.setjs()和this.setCss()进行配置，参数为一个字符串或数组。
    this.setCss('calendar/calendar.css');

    // 当前无moment时 自动引入moment
    if (!window.moment || typeof window.moment != 'function') {
        this.setJs('../lib/moment.min.js');
    }

    // 加入传递的配置
    this.cfg = cfg || {};
};

epctrl.extend('Calendar', 'Control', {
    // 控件类型 必须指定，值即为控件的名称
    type: 'Calendar',
    // 选中日期的样式类名
    selectedCls: 'ep-calendar-selected',

    _defaultCfg: {
        // 不指定时 占满指定元素的宽高度
        width: '',
        height: '',

        // 初始化渲染的年月 格式如：'2017-9'
        date: '',
        // 是否显示日历外边框
        showBorder: true,

        // 设置的选中日期不在当前视图中时，是否自动重绘
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
    },

    // 初始化必要结构
    _initContainer: function () {
        this.$container.empty();

        // 整个日历
        var el = document.createElement('div');
        el.className = 'ep-calendar';

        this.cfg.width && (el.style.width = this.cfg.width);
        this.cfg.height && (el.style.height = this.cfg.height);

        if (!this.showBorder) {
            el.style.border = 'none';
        }

        this.el = el;

        // 头部
        var header = document.createElement('div');
        header.className = 'ep-calendar-header';
        header.innerHTML = '<div class="ep-calendar-header-left"></div><div class="ep-calendar-header-center"><span class="ep-calendar-header-btn ep-calendar-btn-prev"></span><span class="ep-calendar-title"></span><span class="ep-calendar-header-btn ep-calendar-btn-next"></span></div><div class="ep-calendar-header-right"></div>';

        this.cfg.headerHeight && (header.style.height = this.cfg.headerHeight);

        this._header = header;
        this._headerLeft = header.firstChild;
        this._headerRight = header.lastChild;
        // this._headerCenter = jQuery('.ep-weekcalendar-header-center', header)[0];
        this._headerCenter = this._headerLeft.nextSibling;
        // this._prevBtn = jQuery('.ep-weekcalendar-header-btn-prev', this._headerCenter)[0];
        this._prevBtn = this._headerCenter.firstChild;
        this._titleEl = this._prevBtn.nextSibling;

        this._nextBtn = this._headerCenter.lastChild;
        this.el.appendChild(header);

        // 主体
        var body = document.createElement('table'),
            thead = document.createElement('thead'),
            tbody = document.createElement('tbody'),
            tr = document.createElement('tr');

        body.className = 'ep-calendar-body';
        tr.className = 'ep-calendar-daysheader';
        tbody.className = 'ep-calendar-days';

        thead.appendChild(tr);
        body.appendChild(thead);
        body.appendChild(tbody);

        // innerHTML IE8下无法操作
        // body.innerHTML = '<thead><tr class="ep-calendar-daysheader"></tr></thead><tbody class="ep-calendar-days"></tbody>';

        // this._daysHeader = jQuery('.ep-calendar-daysheader', body)[0];
        // this._daysBody = jQuery('.ep-calendar-days', body)[0];

        this._daysHeader = tr;
        this._daysBody = tbody;

        this.el.appendChild(body);
        this._body = body;

        // 底部
        var footer = document.createElement('div');
        footer.className = 'ep-calendar-footer';

        this.cfg.footerHeight && (header.style.height = this.cfg.footerHeight);

        this.el.appendChild(footer);
        this._footer = footer;

        // 年月选择弹出面板
        var menu = document.createElement('div');
        menu.className = 'ep-calendar-menu';

        this.cfg.menuHeigt && (menu.style.height = this.cfg.menuHeigt);
        this.cfg.menuWidth && (menu.style.menuWidth = this.cfg.menuWidth);
        this.menu = menu;
        this.el.appendChild(menu);

        this.container.appendChild(this.el);

        this._calcAndSetHeight();
    },
    // 计算并设置日历主体部分高度
    _calcAndSetHeight: function () {
        var head_h = jQuery(this._header).outerHeight(),
            footer_h = jQuery(this._footer).outerHeight(),
            body_h = jQuery(this.el).height() - head_h - footer_h;

        this._body.style.height = body_h + 'px';
    },

    _weekHeaderDays: {
        Sun: ['日', '一', '二', '三', '四', '五', '六'],
        Sun_full: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        Sun_en: ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'],
        Sun_en_full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thurday', 'Friday', 'Saturday '],

        Mon: ['一', '二', '三', '四', '五', '六', '日'],
        Mon_full: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        Mon_en: ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'],
        Mon_en_full: ['Monday', 'Tuesday', 'Wednesday', 'Thurday', 'Friday', 'Saturday', 'Sunday']
    },

    // 渲染头部的星期
    _renderWeek: function () {
        var weekDays = this.dayStartFromSunday ? this._weekHeaderDays.Sun : this._weekHeaderDays.Mon;

        for (var i = 0; i < 7; ++i) {

            var cell = document.createElement('th'),
                cellInner = document.createElement('div'),
                text = document.createElement('span'),
                isoWeekday = this.dayStartFromSunday ? (i === 0 ? 7 : i) : i + 1;

            cell.className = 'ep-calendar-day';
            cellInner.className = 'ep-calendar-day-inner';
            // iso星期 周一至周日为1-7
            cell.setAttribute('data-isoweekday', isoWeekday);
            cellInner.appendChild(text);
            cell.appendChild(cellInner);

            // 单元格渲染事件 还未插入页面
            var renderEv = this.fire('cellRender', {
                // isoweekday 周一至周日为1-7
                isoWeekday: isoWeekday,
                // 星期th的class
                dayCls: 'ep-calendar-day-text',
                // 星期的内容
                dayText: weekDays[i],
                // 日历dom
                el: this.el,
                // 当前单元格dom
                tdEl: cell,
                // 额外注入的html
                extraHtml: '',
                // 是否表格头 即是否为头部星期几
                isHeader: true
            });

            // 对修改的处理
            text.className = renderEv.dayCls;
            text.innerText = renderEv.dayText;

            // 添加新增内容
            if (renderEv.extraHtml) {
                jQuery(renderEv.extraHtml).appendTo(cellInner);
            }

            this._daysHeader.appendChild(cell);

            // 单元格渲染事件
            this.fire('afterCellRender', {
                isoWeekday: isoWeekday,
                dayCls: text.className,
                dayText: text.innerText,
                el: this.el,
                isHeader: true,
                extraHtml: renderEv.extraHtml,
                tdEl: cell
            });
        }
    },

    _renderTitle: function () {
        this._titleEl.innerHTML = moment(this.currMonth, 'YYYY-MM').format('YYYY年MM月');
        this.fire('titleRender', {
            titleEl: this._titleEl,
            currMonth: this.currMonth
        });
    },

    // 清空已渲染的日历
    _clearDays: function () {
        var trs = this._daysBody.childNodes;

        for (var i = trs.length; i > 0; --i) {
            this._daysBody.removeChild(trs[i - 1]);
        }
    },
    // 每天的渲染
    _renderDay: function (date, currTr) {
        var td = document.createElement('td'),
            tdInner = document.createElement('div'),
            text = document.createElement('span'),
            day = date.isoWeekday(),
            // 返回的月份是0-11
            month = date.month() + 1;

        tdInner.appendChild(text);
        td.appendChild(tdInner);

        td.className = 'ep-calendar-date';
        tdInner.className = 'ep-calendar-date-inner';
        // 完整日期
        td.setAttribute('data-date', date.format('YYYY-MM-DD'));
        // 对应的iso星期
        td.setAttribute('data-isoweekday', day);
        // text.className = 'ep-calendar-date-text';
        // text.innerText = date.date();

        // 周末标记text.className
        if (day === 6 || day === 7) {
            td.className += ' ep-calenday-weekend';
        }
        // 非本月标记
        // substr 在ie8下有问题
        // if (month != parseInt(this.currMonth.substr(-2))) {
        if (month != parseInt(this.currMonth.substr(5), 10)) {
            td.className += ' ep-calendar-othermonth';
        }
        // 今天标记
        if (this.today == date.format('YYYY-MM-DD')) {
            td.className += ' ep-calendar-today';
        }

        // 每天渲染时发生 还未插入页面
        var renderEvent = this.fire('cellRender', {
            // 当天的完整日期
            date: date.format('YYYY-MM-DD'),
            // 当天的iso星期
            isoWeekday: day,
            // 日历dom
            el: this.el,
            // 当前单元格
            tdEl: td,
            // 日期文本
            dateText: date.date(),
            // 日期class
            dateCls: 'ep-calendar-date-text',
            // 需要注入的额外的html
            extraHtml: '',

            isHeader: false
        });

        // 处理对dayText内容和样式的更改
        text.innerText = renderEvent.dateText;
        text.className = renderEvent.dateCls;

        // 添加新增内容
        if (renderEvent.extraHtml) {
            jQuery(renderEvent.extraHtml).appendTo(tdInner);
        }

        currTr.appendChild(renderEvent.tdEl);

        // 每天渲染后发生 插入到页面
        this.fire('afterCellRender', {
            date: date.format('YYYY-MM-DD'),
            isoWeekday: day,
            el: this.el,
            tdEl: td,
            dateText: text.innerText,
            dateCls: text.className,
            extraHtml: renderEvent.extraHtml,
            isHeader: false
        });
    },

    // 日历可变部分的渲染
    _render: function () {
        this._initStartEnd();

        var weeks = 6,
            days = 7,
            curDate = this.startDateOfMonth.clone(),
            tr;

        var dtd = jQuery.Deferred(),
            start = this.startDateOfMonth.format('YYYY-MM-DD'),
            end = this.endDateOfMonth.format('YYYY-MM-DD');

        // 日期渲染前触发渲染前事件
        // 如果需要动态获取数据则将获取数据的ajax加入到事件对象的ajax属性中
        var ev = this.fire('beforeDateRender', {
            momth: this.currMonth,
            startDate: start,
            endDate: end,
            ajax: null
        });

        // 没有用户加入的ajax 则直接模拟一个成功的ajax
        if (!ev.ajax) {
            ev.ajax = dtd.promise();
            dtd.resolve();
        }

        var me = this;

        ev.ajax.then(function () {
            // 拿到数据后再清空 并开始新的渲染
            this._clearDays();
            this._renderTitle();

            for (var i = 0; i < weeks; ++i) {
                tr = document.createElement('tr');
                tr.className = 'ep-calendar-week';
                me._daysBody.appendChild(tr);

                for (var j = 0; j < days; ++j) {
                    // 渲染一天 并递增
                    me._renderDay(curDate, tr);
                    curDate.add(1, 'day');
                }
            }

            // 全部日期渲染完成
            me.fire('afterDateRender', {
                momth: me.currMonth,
                startDate: start,
                endDate: end,
                ajax: ev.ajax
            });
        });
    },

    render: function (ym) {
        // 如果指定了渲染月份 进行处理
        if (ym) {
            var date = moment(ym, 'YYYY-MM');
            if (date.isValid()) {
                this.currMonth = date.format('YYYY-MM');
            } else {
                this.throwError(ym + '指定的日期不正确！');
            }
        }

        // 未初始化时先初始化不变的结构
        if (!this._isInit) {
            this._initContainer();
            this._renderWeek();
            this._isInit = true;
        }

        this._render();

    },

    // 强制重新渲染
    reRedner: function () {
        if (!this._isInit) {
            this.throwError('日历还未渲染过，无需重新渲染！');
        }

        this._initContainer();
        this._renderWeek();
        this.render();
    },

    // 初始化当前月份的开始日期和结束日期
    _initStartEnd: function () {
        // 当月1号
        var currMonth = moment(this.currMonth, 'YYYY-MM'),
            // 当月1号是周几 the ISO day of the week with 1 being Monday and 7 being Sunday.
            firstDay_weekday = currMonth.isoWeekday(),
            startDateOfMonth,
            endDateOfMonth;
        if (!this.dayStartFromSunday) {
            // 开始为周一 则向前减少周几的天数-1即为 开始的日期
            startDateOfMonth = currMonth.subtract(firstDay_weekday - 1, 'day');
        } else {
            // 开始为周日 则直接向前周几的天数即可
            startDateOfMonth = currMonth.subtract(firstDay_weekday, 'day');
        }

        endDateOfMonth = startDateOfMonth.clone().add(41, 'day');

        this.startDateOfMonth = startDateOfMonth;
        this.endDateOfMonth = endDateOfMonth;
    },

    // 设置月份
    setMonth: function (ym) {
        var date = moment(ym, 'YYYY-MM');

        if (date.isValid()) {
            var oldMonth = this.currMonth,
                aimMonth = date.format('YYYY-MM');

            // 月份变动前
            this.fire('beforeMonthChange', {
                el: this.el,
                oldMonth: oldMonth,
                newMonth: aimMonth
            });

            this.currMonth = aimMonth;
            this.render();

            // 月份变动后
            this.fire('afterMonthChange', {
                el: this.el,
                oldMonth: oldMonth,
                newMonth: aimMonth
            });

        } else {
            throw new Error(ym + '是一个不合法的日期');
        }
    },
    getMonth: function () {
        return this.currMonth;
    },
    // 上一月
    prevMonth: function () {
        var prevDate = moment(this.currMonth, 'YYYY-MM').subtract(1, 'M');
        this.setMonth(prevDate);
    },
    // 下一月
    nextMonth: function () {
        var nextDate = moment(this.currMonth, 'YYYY-MM').add(1, 'M');
        this.setMonth(nextDate);
    },

    // 设置选中的日期
    setSelected: function (ymd) {
        // 是否只输入了一个仅包含日的日期，此时将仅在当前月中查找
        var isCurrMonthDate = /^\d{1,2}$/.test(ymd),
            // 所有日期
            $days = jQuery(this._daysBody).find('.ep-calendar-date'),
            // 目标日期
            $day,
            date;

        if (isCurrMonthDate) {
            date = moment(this.currMonth + '-' + ymd, 'YYYY-MM-DD');

            if (!date.isValid()) {
                this.throwError('日期不合法');
            }

            // $day = $days.filter('[data-date="' + date.format('YYYY-MM-DD') + '"]');
            $day = this._getTd(date, $days);

            if ($day.length) {
                $days.removeClass(this.selectedCls);
                $day.addClass(this.selectedCls);
            } else {
                this.throwError('当前月中没有' + ymd + '这一天！');
            }

            return;
        }

        // 否则则应该是一个完整的日期
        date = moment(ymd, 'YYYY-MM-DD');

        if (date.isValid()) {

            // $day = $days.filter('[data-date="' + dateStr + '"]');
            $day = this._getTd(date, $days);

            if ($day.length) {
                // 有则直接显示
                $days.removeClass(this.selectedCls);
                $day.addClass(this.selectedCls);
            } else if (this.autoReRender) {
                // 不在 但是支持自动重绘 则渲染并设置
                this.render(date.format('YYYY-MM'));
                this.setSelected(ymd);
            } else {
                // 日期不存在 且 不自动重绘时 抛出错误
                this.throwError('指定日期不在当前视图，且未开启自动切换，无法设置！');
            }

        } else {
            this.throwError(ymd + ',此日期不合法！');
        }
    },
    getSelected: function () {
        var selectedTd = jQuery('.' + this.selectedCls, this._daysBody)[0];

        return selectedTd ? moment(selectedTd.getAttribute('data-date'), 'YYYY-MM-DD').format('YYYY-MM-DD') : '';
    },
    // 获取当前视图中的开始日期和结束日期
    getStartEnd: function () {
        return {
            start: this.startDateOfMonth.format('YYYY-MM-DD'),
            end: this.endDateOfMonth.format('YYYY-MM-DD')
        };
    },
    // 根据日期获取td
    _getTd: function (date, $days) {

        $days = $days || jQuery(this._daysBody).find('.ep-calendar-date');

        return $days.filter('[data-date="' + date.format('YYYY-MM-DD') + '"]');
    },

    getELByDate: function (md) {

        var date;

        if (/^\d{1,2}$/.test(md)) {
            // 只提供一个日期 不包含月份，则在当前月中查找
            date = moment(this.currMonth + '-' + md, 'YYYY-MM-DD');
        } else if (/^\d{1,2}-\d{1,2}$/.test(md)) {
            // 月-日 的形式
            date = moment((new Date()).getFullYear() + '-' + md, 'YYYY-MM-DD');
        } else {
            // 否则直接认为是一个 完整日期
            date = moment(md, 'YYYY-MM-DD');
        }

        // if (!date.isValid()) {
        //     this.throwError(md + ',此日期不合法！');
        // }

        var $days = this._getTd(date);

        return $days.length ? $days[0] : null;

    },

    // 回到今天的视图
    goToday: function () {
        this.today = moment().format('YYYY-MM-DD');
        return this.setMonth(this.today);
    },

    // 回到初始化的视图
    reset: function () {
        return this.setMonth(this.cfg.date || new Date());
    },

    // 初始化事件
    _initEvent: function () {
        var my = this;
        jQuery(this.el)
            // 日期单元格
            .on('click', '.ep-calendar-date', function (e) {
                var date = this.getAttribute('data-date'),
                    ev = my.fire('dayClick', {
                        ev: e,
                        date: date,
                        day: this.getAttribute('data-isoweekday'),
                        el: my.el,
                        tdEl: this
                    });

                // 如果修改事件对象的cancel为true后 则不进行后续的选中操作
                if (!ev.cancel) {
                    my.setSelected(date);
                }

            })
            // 头部星期
            .on('click', '.ep-calendar-day', function (e) {
                my.fire('dayHeaderClick', {
                    ev: e,
                    day: this.getAttribute('data-isoweekday'),
                    el: my.el,
                    tdEl: this
                });
            })
            // 上一月
            .on('click', '.ep-calendar-btn-prev', function (e) {
                var ev = my.fire('prevBtnClick', {
                    ev: e,
                    currMonth: my.currMonth,
                    el: my.el
                });

                if (!ev.cancel) {
                    my.prevMonth();
                }
            })
            // 下一月
            .on('click', '.ep-calendar-btn-next', function (e) {
                var ev = my.fire('nextBtnClick', {
                    ev: e,
                    currMonth: my.currMonth,
                    el: my.el
                });

                if (!ev.cancel) {
                    my.nextMonth();
                }
            })
            // title 点击
            .on('click', '.ep-calendar-title', function (e) {
                // 已经显示则隐藏
                if (/ show/.test(my.menu.className)) {
                    my.hideMenu();
                    return;
                }

                var ev = my.fire('beforeTitleClick', {
                    ev: e,
                    currMonth: my.currMonth,
                    el: my.el
                });

                if (!ev.cancel) {
                    // showMonth 格式为"2017-10" 不指定时 选择面板渲染出当前年月 如果有指定 则渲染出的面板显示到能显示指定的年月
                    my._onMenuShow(ev.showMonth);
                }
            })
            // 年份、月份选择
            .on('click', '.ep-calendar-menu-month,.ep-calendar-menu-year', function () {

                jQuery(this).addClass('selected')
                    .siblings('.selected').removeClass('selected');
            })
            // 确认
            .on('click', '.ep-calendar-okbtn', function () {
                var year = jQuery(my.menu_year).find('.ep-calendar-menu-year.selected').data('year'),
                    month = jQuery(my.menu_month).find('.ep-calendar-menu-month.selected').data('month');

                if (!year || !month) {
                    my.hideMenu();
                    return;
                }

                my.setMonth(year + '-' + month);
                my.hideMenu();
            })
            // 取消
            .on('click', '.ep-calendar-cancelbtn', function () {
                my.hideMenu();
            })
            // 年份选择翻页
            .on('click', '.ep-calendar-next-year,.ep-calendar-prev-year', function () {
                var $this = jQuery(this),
                    firstYear = parseInt(my.menu_year.firstChild.getAttribute('data-year'), 10),
                    aimStartYear;

                if ($this.hasClass('ep-calendar-prev-year')) {
                    aimStartYear = firstYear - 10;
                } else if ($this.hasClass('ep-calendar-next-year')) {
                    aimStartYear = firstYear + 10;
                }

                my._renderYear(aimStartYear);
            });
        // 空白处点击收起年月选择
        jQuery(document.body).on('click', function (e) {
            var $target = jQuery(e.target);

            if (!$target.closest('.ep-calendar-menu').length && !$target.closest('.ep-calendar-title').length) {
                my.hideMenu();
            }
        });
    },
    hideMenu: function () {
        this.menu.className = this.menu.className.replace(' show', '');
    },

    showMenu: function (ym) {
        this._onMenuShow(ym);
    },

    // 年月面板显示时
    _onMenuShow: function (ym) {
        ym = ym || this.currMonth;

        this.menu.className += ' show';

        var temp = ym.split('-'),
            y = parseInt(temp[0], 10),
            m = parseInt(temp[1], 10);

        if (!this.menuIsInit) {
            this._initMenu(y, m);
            this.menuIsInit = true;
        } else {
            // 重新渲染年份 并重置月份的正确选中状态
            this._renderYear(y);
            jQuery(this.menu_month).find('[data-month="' + m + '"]').addClass('selected')
                .siblings().removeClass('selected');
        }
    },
    // 初始化年月选择
    _initMenu: function (y, m) {
        var month = document.createElement('div'),
            year = document.createElement('div'),
            yearInner = document.createElement('div'),
            footer = document.createElement('div'),
            okBtn = document.createElement('span'),
            cancelBtn = document.createElement('span'),
            prevYear = document.createElement('span'),
            nextYear = document.createElement('span');

        month.className = 'ep-calendar-menu-months';
        year.className = 'ep-calendar-menu-years';
        yearInner.className = 'ep-calendar-menu-years-inner';
        footer.className = 'ep-calendar-menu-footer';
        okBtn.className = 'ep-calendar-okbtn';
        okBtn.innerText = '确定';
        cancelBtn.innerText = '取消';
        cancelBtn.className = 'ep-calendar-cancelbtn';
        prevYear.className = 'ep-calendar-prev-year';
        nextYear.className = 'ep-calendar-next-year';

        footer.appendChild(okBtn);
        footer.appendChild(cancelBtn);
        year.appendChild(yearInner);
        year.appendChild(prevYear);
        year.appendChild(nextYear);

        this.menu_month = month;
        this.menu_year = yearInner;

        this.menu.appendChild(month);
        this.menu.appendChild(year);
        this.menu.appendChild(footer);

        this._renderMonth(m);
        this._renderYear(y, y);
    },

    // 渲染月份选择
    _renderMonth: function (currMonth) {

        var i = 1,
            months = this.menu_month,
            month = document.createElement('span'),
            node;

        month.className = 'ep-calendar-menu-month';

        while (i < 13) {
            node = month.cloneNode(true);
            if (i == currMonth) {
                node.className += ' selected';
            }
            node.innerText = i + '月';
            node.setAttribute('data-month', i);

            months.appendChild(node);
            ++i;
        }

    },

    // 渲染年份选择
    _renderYear: function (start, curr) {
        curr = curr || parseInt(this.currMonth.split('-')[0], 10);
        var i = 0,
            years = this.menu_year,
            year = document.createElement('span'),
            thisYear,
            node;
        years.innerHTML = '';

        year.className += 'ep-calendar-menu-year';

        while (i < 10) {
            node = year.cloneNode();
            thisYear = start + i;

            if (thisYear === curr) {
                node.className += ' selected';
            }
            node.innerText = thisYear;
            node.setAttribute('data-year', thisYear);
            years.appendChild(node);

            ++i;
        }
    },

    // 初始化必要的配置
    initCfg: function () {
        // 将一些常用配置读出
        if (!this.cfg || !this.cfg.el) {
            throw new Error('必须指定日历渲染的html元素');
        }

        // 合并默认配置
        this.cfg = jQuery.extend({}, this._defaultCfg, this.cfg);

        // 日历渲染容器
        this.$container = jQuery(this.cfg.el);
        this.container = this.$container[0];

        // 当前显示的月份 优先取当前的指定的日期，没有则取今天

        this.currMonth = this.cfg.date ? moment(this.cfg.date, 'YYYY-MM').format('YYYY-MM') : moment().format('YYYY-MM');


        // 今天
        this.today = moment().format('YYYY-MM-DD');

        // 星期从周日开始？
        this.dayStartFromSunday = this.cfg.dayStartFromSunday;

        // 设置的选中日期不在当前视图中时，是否自动重绘
        this.autoReRender = this.cfg.autoReRender;

        // 是否显示日历外边框
        this.showBorder = this.cfg.showBorder;
    },

    // 此方法在js等资源加载完成后自动调用
    create: function () {

        // 触发创建前事件
        this.fire('beforeCreate');

        this.initCfg();
        this.render();

        this._initEvent();

        this.fire('afterCreate');
    }
});
