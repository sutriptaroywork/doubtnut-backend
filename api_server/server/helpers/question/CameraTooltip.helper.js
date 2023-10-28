const _ = require('lodash');
const cameraBl = require('../../v2/camera/camera.bl');

function CameraTooltipStrategyV1() {
    this.setCameraButtonHintData = (country, locale) => ({
        durationSec: 1500,
        content: ['Question ki Photo khicho, Solution Paao'],
    });
}

function CameraTooltipStrategyV2() {
    this.setCameraButtonHintData = (country, locale) => ({
        durationSec: 1500,
        content: ['Only Math, Physics, Chemistry, Biology solution'],
    });
}

function CameraTooltipStrategyV3() {
    this.setCameraButtonHintData = (country, locale) => ({
        durationSec: 1500,
        content: ['Only Math, Physics, Chemistry, Biology solution'],
    });
}

function CameraTooltipDefaultStrategy() {
    this.setCameraButtonHintData = (country, locale) => cameraBl.getCameraButtonHintNew(country, locale);
}

function CameraTooltipStrategyManager() {
    this.strategy = null;
    this.extractStrategyVersion = (tooltipAttachment) => _.get(tooltipAttachment, 'strategy', null);
    this.getStrategy = (tooltipAttachment) => {
        const strategyVersion = this.extractStrategyVersion(tooltipAttachment);
        if (this.strategy == null) {
            switch (strategyVersion) {
                case 'v1': {
                    const strategy = new CameraTooltipStrategyV1();
                    this.setStrategy(strategy);
                    break;
                }
                case 'v2': {
                    const strategy = new CameraTooltipStrategyV2();
                    this.setStrategy(strategy);
                    break;
                }
                case 'v3': {
                    const strategy = new CameraTooltipStrategyV3();
                    this.setStrategy(strategy);
                    break;
                }
                case 'v0': {
                    const strategy = new CameraTooltipDefaultStrategy();
                    this.setStrategy(strategy);
                    break;
                }
                default: {
                    const strategy = new CameraTooltipDefaultStrategy();
                    this.setStrategy(strategy);
                    break;
                }
            }
        }
        return this.strategy;
    };

    this.setStrategy = (strategy) => {
        this.strategy = strategy;
    };
}

module.exports = {
    CameraTooltipStrategyManager,
};
