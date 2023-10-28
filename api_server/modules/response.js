const _ = require('lodash');

function Response({
    meta,
    data,
}) {
    let _meta = !_.isEmpty(meta) ? meta : null;
    let _data = !_.isEmpty(data) ? data : null;

    this.setMeta = (_m) => {
        _meta = _m;
    };

    this.getMeta = () => _meta;

    this.setData = (_d) => {
        _data = _d;
    };

    this.getData = () => _data;

    this.getResponse = () => ({
        meta: _meta,
        data: _data,
    });
}

module.exports = Response;
