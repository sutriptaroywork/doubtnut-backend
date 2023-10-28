const _ = require('lodash');

const { MatchItemDisplayDataLayoutManager } = require('./layout.helper');
const { WidgetFactory } = require('./widget.helper');

// function D0ExperimentStrategyV1() {
//     this.state = {};
//     this.doAction = () => {
//         console.log('doing action V1');
//     };

//     this.updateState = (property, value) => {
//         this.state[property] = value;
//     };
// }

function unsetAllPropertiesByPosition(matchObj, position) {
    try {
        delete matchObj._source[position];
    } catch (e) {
        console.log(e);
    }
}

function defaultMatchPageCardLayoutSetter(matchObj) {
    const layoutManager = new MatchItemDisplayDataLayoutManager(matchObj);
    layoutManager
        .setMargin('canvas', {
            top: 2,
            bottom: 2,
        })
        .setPadding('canvas', {
            top: 5,
            right: 3,
        })
        .setDisplayByPosition('top_left')
        .setDisplayByPosition('top_right')
        .setDisplayByPosition('bottom_left')
        .setDisplayByPosition('bottom_center')
        .setDisplayByPosition('bottom_right');
}

function SimilarQuestionsLayoutStrategyV1() {
    const wigetFactory = new WidgetFactory(1021);
    this.backgroundColor = '#E6FEF1';
    this.matchScoreBackgroundColor = '#51876D';
    this.textColor = 'white';
    this.primaryDisplayMatchesLimit = 3;

    this.doAction = (index, responseData) => {
        const { matched_questions: matchesArr } = responseData;
        let currentIndex = 0;
        const traversalLimit = Math.min(matchesArr.length, 3);
        while (currentIndex < traversalLimit) {
            const currentElement = matchesArr[currentIndex];
            if (currentElement.resource_type !== 'widget') {
                defaultMatchPageCardLayoutSetter(currentElement);
                currentIndex += 1;
            }
        }
        responseData.matches_display_config = {
            display_limit: this.primaryDisplayMatchesLimit - 1,
            display_more_action_widget: wigetFactory.create('text', 'load_more_solutions').widget_data,
        };
    };
}

function SimilarQuestionsLayoutStrategyV2() {
    this.backgroundColor = '#75E6FEF1';
    this.matchScoreBackgroundColor = '#51876D';
    this.textColor = 'white';
    this.bottomTextColor = '#A8B3BA';

    this.doAction = (index, responseData) => {
        const { matched_questions: matchesArr } = responseData;
        let currentIndex = 0;
        const traversalLimit = Math.min(matchesArr.length, 3);
        while (currentIndex < traversalLimit) {
            const currentElement = matchesArr[currentIndex];
            if (currentElement.resource_type !== 'widget') {
                unsetAllPropertiesByPosition(currentElement, 'top_left');
                unsetAllPropertiesByPosition(currentElement, 'top_right');
                unsetAllPropertiesByPosition(currentElement, 'bottom_left');
                unsetAllPropertiesByPosition(currentElement, 'bottom_center');
                unsetAllPropertiesByPosition(currentElement, 'bottom_right');

                const matchItemDisplayDataLayoutManager = new MatchItemDisplayDataLayoutManager(matchesArr[currentIndex]);
                delete matchesArr[currentIndex].question_thumbnail_localized;
                matchesArr[currentIndex].question_thumbnail = '';
                matchItemDisplayDataLayoutManager.setDisplayCanvas('backgroundColor', this.backgroundColor);
                matchItemDisplayDataLayoutManager
                    .setMargin('canvas', {
                        top: 3,
                        bottom: 3,
                    })
                    .setPadding('canvas', {
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                    });
                matchItemDisplayDataLayoutManager.setDisplayByPosition('top_left');
                matchItemDisplayDataLayoutManager.setPosition('top_right');
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('text', 'string_diff_text');
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('backgroundColor', null, this.matchScoreBackgroundColor);
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('textColor', null, this.textColor);
                matchItemDisplayDataLayoutManager.setPadding('item', {
                    top: 5,
                    right: 5,
                    bottom: 5,
                    left: 5,
                });
                matchItemDisplayDataLayoutManager.setCornerRadiusProperty({
                    bottomLeft: 20,
                });
                matchItemDisplayDataLayoutManager.setPosition('bottom_left');
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('backgroundColor', null, this.backgroundColor);
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('text', '_source.ref');
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('textColor', null, this.bottomTextColor);
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('image', null, matchItemDisplayDataLayoutManager.audioIconTransparent);
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('widthSpreadPercentage', null, 0.6);
                matchItemDisplayDataLayoutManager.setPosition('bottom_center');
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('backgroundColor', null, this.backgroundColor);
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('text', '_source.subject_title');
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('textColor', null, this.bottomTextColor);
                matchItemDisplayDataLayoutManager.setPrimaryStyleProperties('widthSpreadPercentage', null, 0.3);
                // delete matchesArr[currentIndex]._source.bottom_right;
                currentIndex += 1;
            }
        }
    };
}

function SimilarQuestionsLayoutStrategyManager() {
    this.strategy = null;
    this.getStrategy = (strategyVersion) => {
        if (!this.strategy) {
            switch (strategyVersion) {
                case 'v1': {
                    const strategy = new SimilarQuestionsLayoutStrategyV1();
                    this.setStrategy(strategy);
                    break;
                }
                case 'v2': {
                    const strategy = new SimilarQuestionsLayoutStrategyV2();
                    this.setStrategy(strategy);
                    break;
                }
                default:
                    break;
            }
        }
        return this.strategy;
    };

    this.setStrategy = (strategy) => {
        this.strategy = strategy;
    };
}

function ExactMatchQuestionsLayoutStrategyV1() {
    this.backgroundColor = '#51876D';
    this.matchCardBackgroundColor = '#75E6FEF1';
    this.text = '100% Match';
    this.textColor = 'white';
    this.bottomTextColor = '#A8B3BA';
    this.doAction = (index, responseData) => {
        const { matched_questions: matchesArr } = responseData;
        const obj = matchesArr[0];
        const layoutManager = new MatchItemDisplayDataLayoutManager(obj);
        // needs to be changed as unset all the properties removes the meta data as well which we dont want
        // layoutManager.unsetAllLayoutProperties();
        layoutManager.setPosition('top_right');
        layoutManager.setPrimaryStyleProperties('backgroundColor', null, this.backgroundColor);
        layoutManager.setPrimaryStyleProperties('text', null, this.text);
        layoutManager.setPrimaryStyleProperties('textColor', null, this.textColor);
        layoutManager.setPadding('item', {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5,
        });
        layoutManager.resetCornerRadiusProperty();
        layoutManager.setCornerRadiusProperty({
            bottomLeft: 20,
        });
        layoutManager.resetMargin('item');
        layoutManager.setDisplayCanvas('backgroundColor', this.matchCardBackgroundColor);
        layoutManager.setPadding('canvas', {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        });
        layoutManager.setPosition('bottom_left');
        layoutManager.setPrimaryStyleProperties('backgroundColor', null, this.matchCardBackgroundColor);
        layoutManager.setPrimaryStyleProperties('text', '_source.ref');
        layoutManager.setPrimaryStyleProperties('textColor', null, this.bottomTextColor);
        layoutManager.setPrimaryStyleProperties('image', null, layoutManager.audioIconTransparent);
        layoutManager.setPrimaryStyleProperties('widthSpreadPercentage', null, 0.6);
        layoutManager.setPosition('bottom_center');
        layoutManager.setPrimaryStyleProperties('backgroundColor', null, this.matchCardBackgroundColor);
        layoutManager.setPrimaryStyleProperties('text', '_source.subject_title');
        layoutManager.setPrimaryStyleProperties('textColor', null, this.bottomTextColor);
        layoutManager.setPrimaryStyleProperties('widthSpreadPercentage', null, 0.3);
        obj._source.is_exact_match = true;
        delete obj.question_thumbnail_localized;
        obj.question_thumbnail = '';
    };
}

function ExactMatchQuestionsLayoutStrategyManager() {
    this.strategy = null;
    this.getStrategy = (strategyVersion) => {
        if (!this.strategy) {
            switch (strategyVersion) {
                case 'v1': {
                    const strategy = new ExactMatchQuestionsLayoutStrategyV1();
                    this.setStrategy(strategy);
                    break;
                }
                default:
                    break;
            }
        }
        return this.strategy;
    };

    this.setStrategy = (strategy) => {
        this.strategy = strategy;
    };
}

function isExactMatch(matchObj) {
    return _.get(matchObj, '_source.is_exact_match', false);
}

function D0ExperimentStrategyV1() {
    this.state = {};
    this.doAction = (index, responseData) => {
        const { matched_questions: matchesArr } = responseData;
        const matchObj = matchesArr[index];
        if (!this.state.matches_quality) {
            if (index === 0 && isExactMatch(matchObj)) {
                this.state.matches_quality = 'EXACT';
                const layoutManager = new ExactMatchQuestionsLayoutStrategyManager();
                const strategy = layoutManager.getStrategy('v1');
                strategy.doAction(index, responseData);
            } else if (matchObj.partial_score < 85) {
                this.state.matches_quality = 'POOR';
                defaultMatchPageCardLayoutSetter(matchObj);
            } else if (index >= 2) {
                this.state.matches_quality = 'SIMILAR';
                const similarQuestionsLayoutStrategyManager = new SimilarQuestionsLayoutStrategyManager();
                const similarQuestionsLayoutStrategy = similarQuestionsLayoutStrategyManager.getStrategy('v1');
                similarQuestionsLayoutStrategy.doAction(index, responseData);
            } else {
                defaultMatchPageCardLayoutSetter(matchObj);
            }

            if (this.state.matches_quality) {
                responseData.matches_quality = this.state.matches_quality;
            }
        } else if (['EXACT', 'SIMILAR', 'POOR'].includes(this.state.matches_quality)) {
            defaultMatchPageCardLayoutSetter(matchObj);
        }
    };

    this.updateState = (property, value) => {
        this.state[property] = value;
    };
}

function D0ExperimentStrategyV2() {
    this.state = {};
    this.doAction = (index, responseData) => {
        const { matched_questions: matchesArr } = responseData;
        const matchObj = matchesArr[index];
        if (!this.state.matches_quality) {
            if (index === 0 && isExactMatch(matchObj)) {
                this.state.matches_quality = 'EXACT';
                const layoutManager = new ExactMatchQuestionsLayoutStrategyManager();
                const strategy = layoutManager.getStrategy('v1');
                strategy.doAction(index, responseData);
            } else if (matchObj.partial_score < 85) {
                this.state.matches_quality = 'POOR';
                defaultMatchPageCardLayoutSetter(matchObj);
            } else if (index >= 2) {
                this.state.matches_quality = 'SIMILAR';
                const similarQuestionsLayoutStrategyManager = new SimilarQuestionsLayoutStrategyManager();
                const similarQuestionsLayoutStrategy = similarQuestionsLayoutStrategyManager.getStrategy('v2');
                similarQuestionsLayoutStrategy.doAction(index, responseData);
            } else {
                defaultMatchPageCardLayoutSetter(matchObj);
            }
            if (this.state.matches_quality) {
                responseData.matches_quality = this.state.matches_quality;
            }
        } else if (['EXACT', 'SIMILAR', 'POOR'].includes(this.state.matches_quality)) {
            defaultMatchPageCardLayoutSetter(matchObj);
        }
    };

    //  needs to be a inherited method using composition or prototype
    this.updateState = (property, value) => {
        this.state[property] = value;
    };
}

function D0ExperimentStrategyV0() {
    this.doAction = (index, responseData) => {
        const {
            matched_questions: matchesArr,
        } = responseData;
        defaultMatchPageCardLayoutSetter(matchesArr[index]);
    };
}

function MatchPageConditionalLayoutStrategyManager() {
    this.strategy = null;
    this.extractStrategy = (attachmentData) => _.get(attachmentData, 'strategy', null);
    this.getStrategy = (attachmentData) => {
        const strategyVersion = this.extractStrategy(attachmentData);
        switch (strategyVersion) {
            case 'v1': {
                this.strategy = new D0ExperimentStrategyV1();
                break;
            }
            case 'v2': {
                this.strategy = new D0ExperimentStrategyV2();
                break;
            }
            default: {
                this.strategy = new D0ExperimentStrategyV0();
                break;
            }
        }
        return this.strategy;
    };
}

module.exports = {
    MatchPageConditionalLayoutStrategyManager,
};
