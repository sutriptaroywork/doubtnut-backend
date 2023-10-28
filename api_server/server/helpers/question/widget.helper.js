const _ = require('lodash');
const Data = require('../../../data/data');

function TextWidgetData() {
    this.type = 'text_widget';
    this.data = {};
}

function TextWidgetDataBuilder() {
    this.widgetData = new TextWidgetData();

    this.setType = (type) => {
        this.widgetData.data.type = type;
        return this;
    };

    this.setBackgroundColor = (color) => {
        this.widgetData.data.background_color = color;
        return this;
    };

    this.setText = (text) => {
        this.widgetData.data.title = text;
        return this;
    };

    this.setHtmlText = (html) => {
        this.widgetData.data.html_title = html;
        return this;
    };

    this.setTextColor = (color) => {
        this.widgetData.data.text_color = color;
        return this;
    };

    this.setTextSize = (size) => {
        this.widgetData.data.text_size = size;
        return this;
    };

    this.setBoldText = () => {
        this.widgetData.data.isBold = true;
        return this;
    };

    this.setStrokeColor = (color) => {
        this.widgetData.data.stroke_color = color;
        return this;
    };

    this.setStrokeWidth = (width) => {
        this.widgetData.data.stroke_width = width;
        return this;
    };

    this.setAlignment = (alignmentPosition) => {
        this.widgetData.data.alignment = alignmentPosition;
        return this;
    };

    this.setCornerRadius = (radiusInFloat) => {
        this.widgetData.data.corner_radius = radiusInFloat;
        return this;
    };

    this.setPadding = ({
        start, end, top, bottom,
    }) => {
        this.widgetData.data.layout_padding = {
            padding_start: start,
            padding_end: end,
            padding_top: top,
            padding_bottom: bottom,
        };
        return this;
    };

    this.setMargin = ({
        start, end, top, bottom, left, right,
    }) => {
        this.widgetData.data.layout_margin = {
            left,
            right,
            bottom,
        };
        return this;
    };

    this.build = () => this.widgetData;
}

function HandwrittenTextWidget(versionCode) {
    this.version_code = versionCode;
    this.bg_color = '#D6D6D6';
    this.text_color = '#0000D1';
    this.text_size = 10;
    this.text = 'Handwritten question is asked, if text is not correct edit it';
    this.alignment = 'center';
    this.padding = {
        start: 10,
        end: 10,
        top: 10,
        bottom: 10,
    };
    this.margin = {
        left: 10,
        right: 10,
        bottom: 10,
    };
    this.corner_radius = 12;

    this.getData = () => {
        if (this.version_code >= Data.mp_keys_changes_min_version_code) {
            const data = new TextWidgetDataBuilder()
                .setBackgroundColor(this.bg_color)
                .setText(this.text)
                .setTextSize(this.text_size)
                .setTextColor(this.text_color)
                .setBoldText()
                .setPadding({
                    ...this.padding,
                })
                .setCornerRadius(this.corner_radius)
                .setMargin({
                    ...this.margin,
                })
                .setAlignment(this.alignment)
                .setType('tooltip')
                .build();
            return data;
        }
        return null;
    };
}

function NonPcmbTextWidget(versionCode) {
    this.version_code = versionCode;
    this.bg_color = '#D6D6D6';
    this.text_color = '#0000D1';
    this.text_size = 10;
    this.alignment = 'center';
    this.text = 'Scroll and Check all the solutions carefully';
    this.padding = {
        start: 10,
        end: 10,
        top: 10,
        bottom: 10,
    };
    this.corner_radius = 12;

    this.getData = () => {
        if (this.version_code >= Data.mp_keys_changes_min_version_code) {
            const data = new TextWidgetDataBuilder()
                .setBackgroundColor(this.bg_color)
                .setText(this.text)
                .setTextSize(this.text_size)
                .setTextColor(this.text_color)
                .setBoldText()
                .setPadding({
                    ...this.padding,
                })
                .setAlignment(this.alignment)
                .setCornerRadius(this.corner_radius)
                .setType('tooltip')
                .build();
            return data;
        }
        return null;
    };
}

function LoadMoreSolutionsTextWidget(versionCode) {
    this.version_code = versionCode;
    this.bg_color = '#DA5D3B';
    this.text_color = '#FFFFFF';
    this.text_size = 15;
    this.text = 'See More Solutions &#9660';
    this.corner_radius = 15;

    this.getData = () => {
        if (this.version_code >= Data.mp_keys_changes_min_version_code) {
            const data = new TextWidgetDataBuilder()
                .setBackgroundColor(this.bg_color)
                .setTextColor(this.text_color)
                .setHtmlText(this.text)
                .setAlignment('center')
                .setTextSize(this.text_size)
                .setStrokeColor('#20000000')
                .setStrokeWidth(1)
                .setPadding({
                    start: 5,
                    end: 5,
                    top: 10,
                    bottom: 10,
                })
                .setCornerRadius(this.corner_radius)
                .setType('load_more_solution')
                .build();
            return data;
        }
        if (this.version_code > 100000) {
            return null;
        }
    };
}

function PoorMatchesQualityWidget(versionCode) {
    this.version_code = versionCode;
    this.bg_color = '#EEEAEA';
    this.text_color = '#2E1CFF';
    this.text_size = 12;
    this.text = 'Scroll and Check all the solutions carefully';
    this.corner_radius = 10;

    this.getData = () => {
        if (this.version_code >= Data.mp_keys_changes_min_version_code) {
            const data = new TextWidgetDataBuilder()
                .setBackgroundColor(this.bg_color)
                .setTextColor(this.text_color)
                .setHtmlText(this.text)
                .setAlignment('center')
                .setTextSize(this.text_size)
                .setBoldText()
                .setStrokeColor('#20000000')
                .setStrokeWidth(1)
                .setPadding({
                    start: 0,
                    end: 0,
                    top: 10,
                    bottom: 10,
                })
                .setType('tooltip')
                .setCornerRadius(this.corner_radius)
                .build();
            return data;
        }
        if (this.version_code > 100000) {
            return null;
        }
    };
}

function TextWidgetFactory(versionCode) {
    this.version_code = versionCode;
    this.data = {};
    this.create = (type) => {
        switch (type) {
            case 'handwritten':
                return new HandwrittenTextWidget(this.version_code);
            case 'non_pcmb':
                return new NonPcmbTextWidget(this.version_code);
            case 'load_more_solutions':
                return new LoadMoreSolutionsTextWidget(this.version_code);
            case 'poor_solutions':
                return new PoorMatchesQualityWidget(this.version_code);
            default:
                break;
        }
    };
}

function WidgetFactory(versionCode) {
    this.version_code = versionCode;
    this.widget = {
        _index: '',
        _type: '',
        _id: '1',
        _score: 0,
        _source: {},
        resource_type: 'widget',
    };
    this.create = (type, subtype) => {
        try {
            switch (type) {
                case 'text': {
                    const textWidgetFactory = new TextWidgetFactory(this.version_code);
                    const widgetDataBySubType = textWidgetFactory.create(subtype).getData();
                    if (_.isNull(widgetDataBySubType)) {
                        throw new Error('data is null for widget type');
                    }
                    return {
                        ...this.widget,
                        widget_data: {
                            layout_config: {
                                margin_left: 5,
                                margin_right: 5,
                                margin_bottom: 6,
                                margin_top: 6,
                            },
                            ...widgetDataBySubType,
                        },
                    };
                }
                default:
                    throw new Error('invalid type in Widget Factory');
            }
        } catch (e) {
            console.log(e);
            return null;
        }
    };
}

module.exports = {
    WidgetFactory,
};
