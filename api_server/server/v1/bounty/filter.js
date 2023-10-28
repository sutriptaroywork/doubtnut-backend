/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const _ = require('lodash');
const Utility = require('../../../modules/utility');


function getQueryForSubjects(subjectList) {
    const query = [];

    for (let i = 0; i < subjectList.length; i++) {
        const subject = subjectList[i];
        query.push(`( bpd.question_subject = '${subject.key}' and bpd.chapter in ( ${Utility.getPreservedQuoteString(subject.value)} ))`);
    }

    return query.join(' or ');
}


function getQueryForPrizeMoney(prizeList) {
    const query = [];

    for (let i = 0; i < prizeList.length; i++) {
        if (prizeList[i].value.includes('Yes')) {
            query.push('bpd.bounty_amount > 0 ');
        }
        if (prizeList[i].value.includes('No')) {
            query.push('bpd.bounty_amount = 0 ');
        }
    }
    return query.join(' or ');
}

function getQueryForExam(examList) {
    const query = [];

    for (let i = 0; i < examList.length; i++) {
        const examString = Utility.getPreservedQuoteString(examList[i].value);
        query.push(` bpd.exam in (${examString}) `);
    }


    return query.join(' or ');
}

function getQueryForClass(classList) {
    const query = [];
    let classString;
    const classes = classList[0].value;
    console.log('Sssssssssss', classList);
    for (let i = 0; i < classes.length; i++) {
        if (classes[i].includes('6')) {
            classString = Utility.getPreservedQuoteString(['6']);
            query.push(` bpd.student_class = ( ${classString} ) `);
        }

        if (classes[i].includes('7')) {
            classString = Utility.getPreservedQuoteString(['7']);
            query.push(` bpd.student_class = ( ${classString} ) `);
        }

        if (classes[i].includes('8')) {
            classString = Utility.getPreservedQuoteString(['8']);
            query.push(` bpd.student_class = ( ${classString} ) `);
        }
        if (classes[i].includes('9')) {
            classString = Utility.getPreservedQuoteString(['9']);
            query.push(` bpd.student_class = ( ${classString} ) `);
        }
        if (classes[i].includes('10')) {
            classString = Utility.getPreservedQuoteString(['10']);
            query.push(` bpd.student_class = ( ${classString} ) `);
        }

        if (classes[i].includes('11')) {
            classString = Utility.getPreservedQuoteString(['11']);
            query.push(` bpd.student_class = ( ${classString} ) `);
        }

        if (classes[i].includes('12')) {
            classString = Utility.getPreservedQuoteString(['12']);
            query.push(` bpd.student_class = ( ${classString} ) `);
        }

        if (classes[i].includes('Dropper/ Repeat Year')) {
            classString = Utility.getPreservedQuoteString(['13']);
            query.push(` bpd.student_class = ( ${classString} ) `);
        }

        if (classes[i].includes('Govt Exams')) {
            classString = Utility.getPreservedQuoteString(['14']);
            query.push(` bpd.student_class = ( ${classString} ) `);
        }
    }
    return query.join(' or ');
}


function getQueryForStatus(statusList) {
    const query = [];

    for (let i = 0; i < statusList.length; i++) {
        const status = statusList[i].value;


        console.log('status ##########', status);
        if (status.includes('Running')) {
            query.push(' bpd.created_at > (NOW() - INTERVAL 24 HOUR) ');
        }
        if (status.includes('Not Accepted')) {
            query.push(' bpd.is_accepted = 0 and bpd.is_answered = 1');
        } else if (status.includes('Accepted')) {
            query.push(' bpd.is_accepted = 1 ');
        }

        // if (status.includes('Accepted')) {
        //     query.push(' bad.acceptance_flag = 1 ');
        // } else if (status.includes('Not')) {
        //     query.push(' bad.acceptance_flag = 0 ');
        // }

        // TODO handle noSolutions
    }
    return query.join(' and ');
}


function doFilterOps(filter) {
    const grouped = _.groupBy(filter, (item) => item.parent_key);
    const queryList = [];
    for (const key in grouped) {
        const multi_filters = grouped[key];
        if (key == 'subject') {
            queryList.push(` ( ${getQueryForSubjects(multi_filters)} ) `);
        }
        if (key == 'status') {
            queryList.push(` ( ${getQueryForStatus(multi_filters)}) `);
        }
        if (key == 'prizeMoney') {
            queryList.push(` ( ${getQueryForPrizeMoney(multi_filters)} ) `);
        }
        if (key == 'exam') {
            queryList.push(` ( ${getQueryForExam(multi_filters)} ) `);
        }
        if (key == 'class') {
            queryList.push(` ( ${getQueryForClass(multi_filters)} ) `);
        }
    }

    if (queryList.includes(' ( ) ')) {
        _.remove(queryList, (item) => item === ' ( ) ');
    }

    return queryList.join(' and ');
}


function getFiltersToshow(subChap) {
    const subjectFilters = [];

    for (const key in subChap) {
        const stub = { display: key, parent_key: 'subject', key };

        const chapters = new Set();

        for (let i = 0; i < subChap[key].length; i++) {
            chapters.add(subChap[key][i].chapter.trim());
        }

        stub.value = [...chapters];

        subjectFilters.push(stub);
    }

    return subjectFilters;
}


function getQueryForAll(filter, sort_order) {
    let solved_solutions = [];
    let noSolution = [];
    let order;
    if (!_.isEmpty(sort_order)) {
        order = `bpd.${`${sort_order.value} ${sort_order.sort}`}, bpd.bounty_id desc`;
    } else {
        order = 'bpd.bounty_id desc';
    }

    if (filter != undefined) {
        for (let i = 0; i < filter.length; i++) {
            if (filter[i].key == 'status') {
                if (filter[i].value.includes('No Solution')) {
                    noSolution = ['no solution'];
                }
                if (filter[i].value.includes('Solved Doubts')) {
                    solved_solutions = ['solved solutions'];
                }
            }
        }
    }

    let query = doFilterOps(filter);

    if (!query.replace(/\s/g, '').length) {
        query = ' ';
    } else {
        query = ` and ${query}`;
    }

    return {
        query, order, noSolution, solved_solutions,
    };
}

module.exports = { getQueryForAll, getFiltersToshow };
