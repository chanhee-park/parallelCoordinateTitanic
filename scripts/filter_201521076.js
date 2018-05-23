let filters = {};
let filterIdx = 0;
let Filter = function (f) {
    const startX = f.startX;
    const key = f.key;
    const id = filterIdx++;

    let startY = f.startY + 1;
    let height = f.height;
    let that = this;

    let filterStart = range[key].min + (range[key].max - range[key].min) * (startY / WINDOW_HEIGHT);
    let filterEnd = range[key].min + (range[key].max - range[key].min) * ((startY + height) / WINDOW_HEIGHT);

    let filterRect = g.append('rect').attrs({
        x: startX - AXIS_EVENT_DETECTING_SIZE / 2,
        y: startY,
        width: AXIS_EVENT_DETECTING_SIZE,
        height: height,
        fill: FILTER_COLOR,
        opacity: 0.6,
        'class': 'filter' + id
    });

    let filterHandlerUp = g.append('rect').attrs({
        x: startX - AXIS_EVENT_DETECTING_SIZE / 2,
        y: startY - 10,
        width: AXIS_EVENT_DETECTING_SIZE,
        height: 10,
        fill: FILTER_COLOR,
        opacity: 1,
        'class': 'filter' + id
    });

    let filterHandlerDown = g.append('rect').attrs({
        x: startX - AXIS_EVENT_DETECTING_SIZE / 2,
        y: startY + height,
        width: AXIS_EVENT_DETECTING_SIZE,
        height: 10,
        fill: FILTER_COLOR,
        opacity: 1,
        'class': 'filter' + id
    });

    let dragStartY = 0;
    filterRect.call(d3.drag()
        .on('start', function () {
            dragStartY = d3.event.y - startY;
        })
        .on('drag', function () {
            if (d3.event.y - dragStartY > -10 && d3.event.y - dragStartY < WINDOW_HEIGHT - height + 10) {
                startY = d3.event.y - dragStartY;
                update();
            }
        }));

    filterRect.on("click", function () {
        removeFilter();
    });

    let preStartY;
    let preHeight;
    filterHandlerUp.call(d3.drag()
        .on('start', function () {
            preStartY = startY;
            preHeight = height;
        })
        .on('drag', function () {
            if (d3.event.y > -10 && d3.event.y < startY + height) {
                startY = d3.event.y;
                height = preHeight - (d3.event.y - preStartY);
                update();
            }
        })
    );

    filterHandlerDown.call(d3.drag()
        .on('start', function () {
            preHeight = height;
        })
        .on('drag', function () {
            if (d3.event.y < WINDOW_HEIGHT + 10 && d3.event.y > startY) {
                height = d3.event.y - startY;
                update();
            }

        })
    );

    let update = function () {
        filterStart = range[key].min + (range[key].max - range[key].min) * (startY / WINDOW_HEIGHT);
        filterEnd = range[key].min + (range[key].max - range[key].min) * ((startY + height) / WINDOW_HEIGHT);

        filterRect.attr('y', startY);
        filterRect.attr('height', height);
        filterHandlerUp.attr('y', startY - 10);
        filterHandlerDown.attr('y', startY + height);

        filterOutAll();
    };

    let removeFilter = function () {
        d3.selectAll('.filter' + id).remove();
        filters[key].remove(that);

        filterOutAll();
    };

    this.filterOut = function (data) {
        return extractWithRange(data, key, filterStart, filterEnd);
    };
};