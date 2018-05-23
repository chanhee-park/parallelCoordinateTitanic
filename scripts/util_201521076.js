function extract(objs, key, value) {
    let conditional = [];
    objs.map(function (obj) {
        if (obj.hasOwnProperty(key) && obj[key] === value) {
            conditional.push(obj);
        }
    });
    return conditional;
}

function extractWithRange(objs, key, min, max) {
    let conditional = [];
    objs.map(function (obj) {
        if (obj.hasOwnProperty(key) && obj[key] >= min && obj[key] < max) {
            conditional.push(obj);
        }
    });
    return conditional;
}

Array.prototype.remove = function () {
    let what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

