(function () {
    Mock.setup({
        timeout: '50-600'
    });

    function getParams(query) {
        var o = {};
        $.each(query.split('&'), function (i, item) {
            var r = item.split('=');

            o[r[0]] = r[1];
        });
        return o;
    }

    var timeRanges = [
        ['07:00', '16:00'],
        ['08:00', '17:00'],
        ['09:00', '18:00'],
        ['10:00', '19:00'],
        ['05:00', '09:00'],
        ['08:00', '24:00'],
        ['08:33', '21:55'],
        ['17:44', '09:44']
    ];

    function random() {
        return (Math.random() * 17 >> 0).toString(16);
    }

    function getColor() {
        return '#' + random() + random() + random()+ random() + random() + random();
    }

    function mockDate(range) {
        var s = range.start,
            e = range.end,
            dateArr = [],
            data = [],
            i = 0,
            temp;

        while (i < 7) {
            temp = moment(s, 'YYYY-MM-DD');
            dateArr.push(temp.add(i, 'day').format('YYYY-MM-DD'));
            i++;
        }

        i = 0;
        while (i < 7) {
            data.push({
                id:i,
                categoryId: 'cate-1',
                title: '用车',
                content: '',
                start: dateArr[i] + ' ' + timeRanges[i][0],
                end: dateArr[i] + ' ' + timeRanges[i][1],
                bgColor: getColor()
            });
            i++;
        }

        data.push({
            id:i++,
            categoryId: 'cate-1',
            title: '车',
            content: '',
            start: dateArr[0] + ' 00:00' ,
            end: dateArr[0] + ' 08:00',
            bgColor: getColor()
        });
        data.push({
            id:i++,
            categoryId: 'cate-1',
            title: '车',
            content: '',
            start: dateArr[0] + ' 14:00' ,
            end: dateArr[0] + ' 20:00',
            bgColor: getColor()
        });

        data.push({
            id:i++,
            categoryId: 'cate-2',
            title: '本周用车',
            content: '',
            start: dateArr[0] + ' ' + timeRanges[7][0],
            end: dateArr[5] + ' ' + timeRanges[7][1],
            bgColor: getColor()
        });

        data.push({
            id:i++,
            categoryId: 'cate-3',
            title: '本周用车2',
            content: '',
            start: dateArr[0] + ' 00:00',
            end: dateArr[6] + ' 24:00',
            bgColor: getColor()
        });

        return data;
    }

    Mock.mock('./test.json', function (opt) {

        return mockDate(getParams(opt.body));

    });


})();