const _ = require('lodash');

function MatchSolutionTypeElasticDataStrategy() {
    this.getType = (obj) => {
        if (obj._source.is_answered === 0 && obj._source.is_text_answered === 1) return 'text';
        return 'video';
    };
}

function MatchSolutionTypeResourceTypeStrategy() {
    this.getType = (obj) => obj.resource_type;
}

function MatchSolutionTypeStrategyManager(strategy) {
    if (strategy === 'resource_type') {
        return new MatchSolutionTypeResourceTypeStrategy();
    } if (strategy === 'elastic_source') {
        return new MatchSolutionTypeElasticDataStrategy();
    }
}

function MatchItemDisplayDataLayoutManager(obj) {
    this.obj = obj;
    this.displayPropertyNameMapping = {
        text: 'text',
        textColor: 'text_color',
        textSize: 'text_size',
        backgroundColor: 'background_color',
        image: 'icon_link',
        widthSpreadPercentage: 'width_percentage',
        cornerRadius: 'corner_radius',
    };

    this.default_corner_radius = 12;
    this.textSolutionInfoBackgroundColor = '#F4A18B';
    this.audioIcon = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1AE8032B-509A-5B1E-F2C1-3C1266CA2D98.webp';
    this.audioIconTransparent = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/73F3D583-544A-B42C-CE91-EF524237699C.webp';
    this.paddingSetterByElement = {
        canvas: this.setDisplayCanvas,
    };
    this.textSolutionBookIcon = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/E2951EB1-DA68-AD9A-A52E-1E9044A9F8A4.webp';
    this.setPosition = (position) => {
        this.position = position;
    };

    this.BottomLeftStylingStrategyV1 = () => ({
        style: () => {
            this.setPrimaryStyleProperties('text', '_source.ref');
            this.setPrimaryStyleProperties('textColor', '_source.ref_color');
            this.setPrimaryStyleProperties('image', null, this.audioIconTransparent);
            this.setPrimaryStyleProperties('widthSpreadPercentage', null, 0.5);
        },
    });

    this.BottomRightStylingStrategyV1 = () => ({
        style: () => {
            this.setPrimaryStyleProperties('text', '_source.rating');
            this.setPrimaryStyleProperties('textColor', '_source.rating_color');
            // this.setPrimaryStyleProperties('textColor', null, '#FFFFFF');
            this.setPrimaryStyleProperties('backgroundColor', '_source.rating_background_color');
            this.setPrimaryStyleProperties('widthSpreadPercentage', null, 0.25);
            this.setCornerRadiusProperty({
                topLeft: this.default_corner_radius,
                topRight: this.default_corner_radius,
                bottomLeft: this.default_corner_radius,
                bottomRight: this.default_corner_radius,
            });
        },
    });

    this.BottomCenterStylingStrategyV1 = () => ({
        style: () => {
            this.setPrimaryStyleProperties('text', '_source.subject_title');
            this.setPrimaryStyleProperties('textColor', '_source.subject_title_color');
            this.setPrimaryStyleProperties('widthSpreadPercentage', null, 0.25);
        },
    });

    this.TopLeftStylingVideoSolutionStrategyV1 = () => ({
        style: () => {},
    });

    this.TopLeftStylingExactVideoSolutionStrategyV1 = () => ({
        style: () => {
            this.setPrimaryStyleProperties('text', null, '100% correct');
            this.setPrimaryStyleProperties('textColor', null, 'white');
            this.setPrimaryStyleProperties('backgroundColor', null, '#79C26A');
            this.setCornerRadiusProperty({
                topLeft: this.default_corner_radius,
                topRight: this.default_corner_radius,
                bottomLeft: this.default_corner_radius,
                bottomRight: this.default_corner_radius,
            });
            this.setMargin('item', {
                top: 10,
                left: 20,
            });
            this.setPadding('item', {
                top: 4,
                right: 4,
                bottom: 4,
                left: 4,
            });
        },
    });

    this.TopLeftStylingTextSolutionStrategyV1 = () => ({
        style: () => {
            this.setPrimaryStyleProperties('text', null, 'Text Solution');
            this.setPrimaryStyleProperties('textColor', null, 'white');
            this.setPrimaryStyleProperties('backgroundColor', null, this.textSolutionInfoBackgroundColor);
            this.setPrimaryStyleProperties('image', null, this.textSolutionBookIcon);
            this.setCornerRadiusProperty({
                topLeft: this.default_corner_radius,
                topRight: this.default_corner_radius,
                bottomLeft: this.default_corner_radius,
                bottomRight: this.default_corner_radius,
            });
            this.setMargin('item', {
                top: 10,
                left: 20,
            });
            this.setPadding('item', {
                top: 4,
                right: 4,
                bottom: 4,
                left: 4,
            });
        },
    });

    this.TopRightStylingStrategyV1 = () => ({
        style: () => {
            this.setPrimaryStyleProperties('text', 'string_diff_text');
            // TODO
            // this.setPrimaryStyleProperties('textSize', null, 1);
            this.setPrimaryStyleProperties('backgroundColor', 'string_diff_text_bg_color');
            this.setPrimaryStyleProperties('textColor', null, '#FFFFFF');
            this.setPadding('item', {
                top: 4,
                right: 4,
                bottom: 4,
                left: 4,
            });
            this.setCornerRadiusProperty({
                topLeft: this.default_corner_radius,
                topRight: this.default_corner_radius,
                bottomLeft: this.default_corner_radius,
                bottomRight: this.default_corner_radius,
            });
            this.setMargin('item', {
                top: 10,
                right: 10,
            });
        },
    });

    this.TopLeftNoStylingStrategyV1 = () => ({
        style: () => this,
    });

    this.getStylingStrategy = ({
        position,
        attachment: {},
    }) => {
        if (position === 'bottom_left') {
            return this.BottomLeftStylingStrategyV1();
        }
        if (position === 'bottom_right') {
            return this.BottomRightStylingStrategyV1();
        }
        if (position === 'bottom_center') {
            return this.BottomCenterStylingStrategyV1();
        }
        if (position === 'top_left') {
            if (MatchSolutionTypeStrategyManager('resource_type').getType(obj) === 'text') {
                return this.TopLeftStylingTextSolutionStrategyV1();
            } if (MatchSolutionTypeStrategyManager('resource_type').getType(obj) === 'video' && obj._source.is_exact_match) {
                return this.TopLeftStylingExactVideoSolutionStrategyV1();
            }
            return this.TopLeftStylingVideoSolutionStrategyV1();
        }
        if (position === 'top_right') {
            if (MatchSolutionTypeStrategyManager('resource_type').getType(obj) === 'video' && obj._source.is_exact_match) {
                return this.TopLeftNoStylingStrategyV1();
            }
            return this.TopRightStylingStrategyV1();
        }
        throw new Error('not a valid position to style');
    };

    this.setDisplayByPosition = (position) => {
        this.setPosition(position);
        this.getStylingStrategy({
            position: this.position,
            attachment: {},
        }).style.call(this);
        return this;
    };

    this.setDisplayCanvas = (propertyName, val) => {
        _.set(this.obj, `canvas.${this.displayPropertyNameMapping[propertyName]}`, val);
        return this;
    };

    this.setCornerRadiusProperty = ({
        topLeft, topRight, bottomLeft, bottomRight,
    }) => {
        if (typeof topLeft !== 'undefined') {
            _.set(this.obj, `_source.${this.position}.corner_radius.top_left`, topLeft);
        }

        if (typeof topRight !== 'undefined') {
            _.set(this.obj, `_source.${this.position}.corner_radius.top_right`, topRight);
        }

        if (typeof bottomLeft !== 'undefined') {
            _.set(this.obj, `_source.${this.position}.corner_radius.bottom_left`, bottomLeft);
        }

        if (typeof bottomRight !== 'undefined') {
            _.set(this.obj, `_source.${this.position}.corner_radius.bottom_right`, bottomRight);
        }
        return this;
    };

    this.resetCornerRadiusProperty = () => {
        delete this.obj._source[this.position].corner_radius;
    };

    this.setPadding = (element, {
        top, right, bottom, left,
    }) => {
        if (typeof top !== 'undefined') {
            this.setPaddingProperty(element, 'top', top);
        }

        if (typeof right !== 'undefined') {
            this.setPaddingProperty(element, 'right', right);
        }

        if (typeof bottom !== 'undefined') {
            this.setPaddingProperty(element, 'bottom', bottom);
        }

        if (typeof left !== 'undefined') {
            this.setPaddingProperty(element, 'left', left);
        }
        return this;
    };

    this.resetMargin = (element) => {
        switch (element) {
            case 'canvas':
                delete this.obj.canvas.margin;
                break;
            case 'item':
                delete this.obj._source[this.position].margin;
                break;
            default:
                break;
        }
    };

    this.setMargin = (element, {
        top,
        right,
        bottom,
        left,
    }) => {
        if (typeof top !== 'undefined') {
            this.setMarginProperty(element, 'top', top);
        }

        if (typeof right !== 'undefined') {
            this.setMarginProperty(element, 'right', right);
        }

        if (typeof bottom !== 'undefined') {
            this.setMarginProperty(element, 'bottom', bottom);
        }

        if (typeof left !== 'undefined') {
            this.setMarginProperty(element, 'left', left);
        }
        return this;
    };

    this.setPaddingProperty = (element, paddingPosition, val) => {
        try {
            switch (element) {
                case 'canvas':
                    _.set(this.obj, `canvas.padding.${paddingPosition}`, val);
                    break;
                case 'item':
                    _.set(this.obj, `_source.${this.position}.padding.${paddingPosition}`, val);
                    break;
                default:
                    throw new Error('no such element');
            }
        } catch (e) {
            console.log(e);
        }
    };

    this.setMarginProperty = (element, marginPosition, val) => {
        switch (element) {
            case 'canvas':
                _.set(this.obj, `canvas.margin.${marginPosition}`, val);
                break;
            case 'item':
                _.set(this.obj, `_source.${this.position}.margin.${marginPosition}`, val);
                break;
            default:
                throw new Error('no such element');
        }
    };

    this.setPrimaryStyleProperties = (propertyName, refrence, val) => {
        if (typeof this.displayPropertyNameMapping[propertyName] === 'undefined') {
            throw new Error('Invalid Display Property Name');
        }
        if (this.position) {
            if (refrence == null) {
                _.set(this.obj, `_source.${this.position}.${this.displayPropertyNameMapping[propertyName]}`, val);
            } else {
                _.set(this.obj, `_source.${this.position}.${this.displayPropertyNameMapping[propertyName]}`, _.get(this.obj, refrence));
            }
        } else if (refrence == null) {
            _.set(this.obj, `_source.${this.displayPropertyNameMapping[propertyName]}`, val);
        } else {
            _.set(this.obj, `_source.${this.displayPropertyNameMapping[propertyName]}`, _.get(this.obj, refrence));
        }
    };

    this.unsetAllLayoutProperties = () => {
        delete obj._source.top_left;
        delete obj._source.top_right;
        delete obj._source.bottom_left;
        delete obj._source.bottom_center;
        delete obj._source.bottom_right;
        return this;
    };
}

module.exports = {
    MatchItemDisplayDataLayoutManager,
};
