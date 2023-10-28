const Stories = require("../../../modules/stories");

function adFormatter(item) {
    item.type = "ad";
    const buttons_data = [{deeplink: item.cta_url, cta_text:item.cta_text, cta_text_color: "", cta_bg_color: ""}];
    const captions_data = {deeplink: item.cta_url, cta_text:item.caption, cta_text_color: "", cta_bg_color: ""};
    item.ad_actions = {buttons : buttons_data, caption: captions_data};
    const position = item.position;
    delete item.position;
    delete item.cta_text;
    delete item.cta_url;
    const widget = {stories :  [item],
                    type : "ad",
                    position: position,

    };
    return widget;
}

async function getAdsData(db, ccmIds, locale) {
    const data = await Stories.getAdsByCcmIds(db, ccmIds, locale);
    const widget = data.map((item) => adFormatter(item));
    return widget;
}

module.exports = {getAdsData};
