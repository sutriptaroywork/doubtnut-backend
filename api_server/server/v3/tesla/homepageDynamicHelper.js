const _ = require('lodash');
const freeClassHelper = require('../../helpers/freeLiveClass');

function operatorResult(userValue, operator, acceptableValue) {
    if (operator === '>') {
        return +userValue > +acceptableValue;
    }
    if (operator === '<') {
        return +userValue < +acceptableValue;
    }
    if (operator === '=') {
        return +userValue === +acceptableValue;
    }
    if (operator === '<=') {
        return +userValue <= +acceptableValue;
    }
    if (operator === '>=') {
        return +userValue >= +acceptableValue;
    }
    return false;
}

function etCheck(carousel, userValues) {
    const operator = carousel.additional_check_operator;
    const value = carousel.additional_check_value;
    const userValue = _.get(userValues, 'ET', 0);
    return operatorResult(userValue, operator, value);
}

function checkIfCarouselToBeShown(carousel, userValues) {
    const additionalCheckField = carousel.additional_check_field;
    const additionalCheckFieldAndCheckFunctionMap = {
        ET: etCheck,
    };
    return additionalCheckFieldAndCheckFunctionMap[additionalCheckField] ? (additionalCheckFieldAndCheckFunctionMap[additionalCheckField](carousel, userValues)) : true;
}
function getEtFn({ studentId }) {
    return freeClassHelper.getLast30DaysEngagement(studentId);
}
async function generateUserDataForAddtionalChecks(db, studentId, carouselsArray) {
    const fields = _.uniq(carouselsArray.map((x) => x.additional_check_field).filter((x) => x !== null));

    const generateUserDataAndFunctionMap = {
        ET: getEtFn,
    };
    const promises = [];
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        promises.push(generateUserDataAndFunctionMap[field] ? generateUserDataAndFunctionMap[field]({ studentId }) : 0);
    }
    const userValuesArr = await Promise.all(promises);
    const userValues = {};
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        userValues[field] = userValuesArr[i];
    }
    return userValues;
}

module.exports = {
    checkIfCarouselToBeShown,
    generateUserDataForAddtionalChecks,
};
