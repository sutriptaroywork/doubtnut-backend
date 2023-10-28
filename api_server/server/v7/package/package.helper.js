function getMyPlansWidget(packageList, emiDue) {
    // transform
    for (let i = 0; i < packageList.length; i++) {
        packageList[i].deeplink = emiDue ? `doubtnutapp://vip?assortment_id=${packageList[i].assortment_id}` : `doubtnutapp://course_details?id=${packageList[i].assortment_id}`;
    }
    return {
        type: 'my_plan',
        data: {
            items: packageList,
        },
    };
}

module.exports = {
    getMyPlansWidget,
};
