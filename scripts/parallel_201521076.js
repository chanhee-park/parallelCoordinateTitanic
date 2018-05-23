const root = d3.select('#renderer');

let g = root.append('g')
    .attr("transform", "translate(" + 100 + "," + 50 + ")");

let range = {};
let axies = {};

let line = d3.line()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    })
    .curve(d3.curveLinear);

let Axis = function (min, max, index, axisCount, keyName) {
    const diff = max - min;
    const x = WINDOW_WIDTH / (axisCount - 1) * index;

    this.getCoord = function (val) {
        return {
            x: x,
            y: (val - min) / diff * WINDOW_HEIGHT
        }
    };

    this.render = function () {
        g.append('line').attrs({
            x1: x,
            y1: 0,
            x2: x,
            y2: WINDOW_HEIGHT,
            stroke: '#333',
            'stroke-weight': '3px'
        });

        // 변수명 출력
        g.append('text').attrs({
            dx: WINDOW_WIDTH / (axisCount - 1) * index,
            dy: WINDOW_HEIGHT + 20,
            'text-anchor': 'middle'
        }).text(function () {
            return keyName;
        });
    };

    this.makeFilterEventArea = function () {
        // filter event area
        let axisEventBackground = g.append('rect').attrs({
            x: x - AXIS_EVENT_DETECTING_SIZE / 2,
            y: 0,
            width: AXIS_EVENT_DETECTING_SIZE,
            height: WINDOW_HEIGHT,
            fill: AXIS_EVENT_AREA_COLOR,
            opacity: 0.5
        });

        let createPosY = 0;
        let filterInfo = {};
        let tempRect;
        axisEventBackground.call(d3.drag()
            .on('start', function () {
                createPosY = d3.event.y;
                filterInfo = {
                    startX: 0,
                    startY: 0,
                    height: 0,
                    key: keyName
                };
                filterInfo.startY = d3.event.y;

                tempRect = g.append('rect').attrs({
                    x: x - AXIS_EVENT_DETECTING_SIZE / 2,
                    y: d3.eventY,
                    width: AXIS_EVENT_DETECTING_SIZE,
                    height: 0,
                    fill: FILTER_COLOR,
                    opacity: 0.6,
                    'class': 'temp_filter_rect'
                });
            })
            .on('drag', function () {
                // 위쪽으로 드래그
                if (d3.event.y - createPosY <= 0) {
                    filterInfo.startY = d3.event.y;
                    filterInfo.height = createPosY - d3.event.y;
                    // 축 보다 위까지 드래그하는 경우
                    if (d3.event.y < -AXIS_EVENT_DETECTING_SIZE) {
                        filterInfo.startY = -AXIS_EVENT_DETECTING_SIZE;
                        filterInfo.height = createPosY;
                    }
                } else { // 아래로 드래그
                    filterInfo.height = d3.event.y - createPosY;
                    // 축 보다 아래까지 드래그하는 경우
                    if (d3.event.y > WINDOW_HEIGHT) {
                        filterInfo.height = WINDOW_HEIGHT - createPosY;
                    }
                }
                tempRect.attrs({
                    y: filterInfo.startY,
                    height: filterInfo.height
                });
            })
            .on('end', function () {
                if (filterInfo.height > 5) {
                    filterInfo.startX = x;
                    let newFilter = new Filter(filterInfo);
                    filters[filterInfo.key].push(newFilter);
                    filterOutAll();
                }
                d3.selectAll('.temp_filter_rect').remove();
            }));
    };

    return this;
};

let Node = function (data, selected) {
    let color = data['Survived'] === 1 ? ALIVE_NODE_COLOR : DEAD_NODE_COLOR;
    color = selected ? color : UNSELECTED_NODE_COLOR;

    let coords = _.chain(data).map(function (v, k) {
        return axies[k].getCoord(v);
    }).value();

    this.render = function () {
        g.append('path').attrs({
            'class': 'node',
            d: line(coords),
            stroke: color,
            "stroke-opacity": 20 / allData.length,
            "stroke-width": 1,
            fill: 'none'
        });
    };

    return this;
};

let AmountRect = function (key, val, rectX, min, max, nodes) {
    const rectY = ((val - min) / (max - min)) * WINDOW_HEIGHT;
    const numOfNodes = nodes.length;
    const numOfSurvived = extract(nodes, 'Survived', 1).length;

    this.render = function () {
        // number of alive
        g.append('rect').attrs({
            x: rectX + AXIS_EVENT_DETECTING_SIZE / 2,
            y: rectY,
            width: numOfSurvived * amountRectRatio,
            height: AMOUNT_RECT_HEIGHT,
            fill: ALIVE_NODE_COLOR,
            opacity: 0.7
        });
        // number of dead
        g.append('rect').attrs({
            x: rectX + AXIS_EVENT_DETECTING_SIZE / 2 + (numOfSurvived * amountRectRatio),
            y: rectY,
            width: (numOfNodes - numOfSurvived) * amountRectRatio,
            height: AMOUNT_RECT_HEIGHT,
            fill: DEAD_NODE_COLOR,
            opacity: 0.7
        });
    };
};

let allData;
let keys;
let amountRectRatio;

// 이벤트 적용 속도가 느려서 상위 100개 열만 저장한 데이터셋을 불러왔습니다.
d3.csv('./titanic100.csv', function (data) {
    allData = data;
    keys = Object.keys(data[0]);
    amountRectRatio = (WINDOW_WIDTH / keys.length) / (allData.length);

    // factor 형 변수 Sex, Embarked 처리 및 수치형 변수가 스트링으로 저장되어 있는 경우 처리
    _.forEach(data, function (d) {
        _.forEach(keys, function (key) {
            if (key === 'Sex') {
                d[key] = VARIABLE_SEX[d[key]];
            } else if (key === 'Embarked') {
                d[key] = VARIABLE_EMBARKED[d[key]];
            }
            d[key] = parseFloat(d[key]);
        });
    });

    // 변수별 min, max 값 구하기
    _.forEach(keys, function (key, i) {
        let r = {
            max: _.maxBy(data, function (d) {
                return d[key];
            })[key],
            min: _.minBy(data, function (d) {
                return d[key];
            })[key]
        };
        range[key] = r;
        axies[key] = new Axis(r.min, r.max, i, keys.length, key);
    });

    // 축 그리기
    _.forEach(axies, function (axis) {
        axis.render();
    });

    // 필터 영역 생성하기
    _.forEach(axies, function (axis) {
        axis.makeFilterEventArea();
    });

    // 필터 초기화하기
    _.forEach(keys, function (key) {
        filters[key] = [];
    });

    // 노드 생성
    let nodes = _.map(data, function (d) {
        return new Node(d, true);
    });

    // 노드 그리기
    _.forEach(nodes, function (node) {
        node.render();
    });

    // 축을 지나는 선의 갯수를 확인하는 막대 그래프 그리기
    _.forEach(keys, function (key, i) {
        let rectX = WINDOW_WIDTH / (keys.length - 1) * i;
        let variance = range[key].max - range[key].min;
        let iter = WINDOW_HEIGHT / AMOUNT_RECT_HEIGHT;

        for (let j = 0; j < iter; j++) {
            let rectStartY = range[key].min + variance * j / iter;
            let rectEndY = range[key].min + variance * (j + 1) / iter;

            let extracted = extractWithRange(data, key, rectStartY, rectEndY);
            if (j === iter - 1) extracted = extractWithRange(data, key, rectStartY, rectEndY + 1);

            new AmountRect(key, rectStartY, rectX, range[key].min, range[key].max, extracted).render();

            // 격자 표시
            g.append('text')
                .text(_.ceil(rectStartY, 2))
                .attrs({
                    x: rectX - AXIS_EVENT_DETECTING_SIZE / 2,
                    y: WINDOW_HEIGHT * j / iter,
                    'text-anchor': 'end',
                    'alignment-baseline': 'middle'
                });
            g.append('line').attrs({
                x1: rectX - AXIS_EVENT_DETECTING_SIZE / 3,
                y1: WINDOW_HEIGHT * j / iter,
                x2: rectX + AXIS_EVENT_DETECTING_SIZE / 3,
                y2: WINDOW_HEIGHT * j / iter,
                stroke: '#333',
                'stroke-weight': '1px'
            });
            if (j === iter - 1) {
                g.append('text')
                    .text(_.ceil(range[key].max, 2))
                    .attrs({
                        x: rectX - AXIS_EVENT_DETECTING_SIZE / 2,
                        y: WINDOW_HEIGHT * (j + 1) / iter,
                        'text-anchor': 'end',
                        'alignment-baseline': 'middle'
                    });
                g.append('line').attrs({
                    x1: rectX - AXIS_EVENT_DETECTING_SIZE / 3,
                    y1: WINDOW_HEIGHT * (j + 1) / iter,
                    x2: rectX + AXIS_EVENT_DETECTING_SIZE / 3,
                    y2: WINDOW_HEIGHT * (j + 1) / iter,
                    stroke: '#333',
                    'stroke-weight': '1px'
                });
            }
        }
    });
});

function filterOutAll() {
    d3.selectAll('.node').remove();

    let selectedData = allData;
    let unselectedData;

    let selectedDataTemp = [];
    let selectedDataTempChange = false;

    _.forEach(keys, function (key) {
        selectedDataTemp = [];
        selectedDataTempChange = false;
        _.forEach(filters[key], function (filter) {
            selectedDataTemp = _.unionWith(
                selectedDataTemp, filter.filterOut(allData), _.isEqual);
            selectedDataTempChange = true;
        });
        if (selectedDataTempChange) selectedData = _.intersectionWith(selectedData, selectedDataTemp, _.isEqual);
    });

    unselectedData = _.differenceWith(allData, selectedData, _.isEqual);

    _.map(selectedData, function (d) {
        return new Node(d, true).render();
    });
    _.map(unselectedData, function (d) {
        return new Node(d, false).render();
    });
}
