function getCategoryIconsWidget({
    data,
    carousel,
    studentLocale,
    myCoursesIcon,
    viewAllIcon,
    maxlength,
    versionCode,
    ceoIcon,
    source,
    assortmentID,
}) {
    let items = [];
    for (let i = 0; i < data.length; i++) {
        // prefix to be shown if favorite_category_icons caraousel
        let prefix = '';
        if (data[i].add_prefix > 0 && carousel.data_type === 'favorite_category_icons') {
            prefix = studentLocale === 'hi' ? data[i].description_hindi : data[i].description;
        }
        const titleSuffix = studentLocale === 'hi' ? data[i].title_hindi : data[i].title;
        items.push({
            icon_id: data[i].id,
            icon: data[i].image_url,
            title_one: data[i].add_prefix && carousel.data_type === 'favorite_category_icons' ? `${prefix} ${titleSuffix}` : titleSuffix,
            title_one_text_size: '10',
            title_one_text_color: '#250440',
            deeplink: data[i].deeplink,
            ...(source && {
                extra_params: {
                    source,
                    assortment_id: assortmentID,
                },
            }),
        });
    }
    if (ceoIcon) {
        if (!(carousel.data_type === 'favorite_category_icons' && data.length === 4)) {
            items.unshift(ceoIcon);
        }
    }
    if (myCoursesIcon) {
        items.unshift(myCoursesIcon);
    }
    if (maxlength && viewAllIcon && carousel.data_type === 'favorite_category_icons') {
        items = items.splice(0, maxlength - 1);
        items.push(viewAllIcon);
    }

    return {
        type: carousel.data_type === 'favorite_category_icons' ? 'widget_favourite_explore_card' : 'widget_explore_card',
        data: {
            style: 1,
            icon: carousel.image_url ? carousel.image_url : '',
            title_one: studentLocale === 'hi' ? carousel.title_hindi : carousel.title,
            title_one_text_size: '16',
            title_one_text_color: '#303030',
            title_two: studentLocale === 'hi' ? carousel.subtitle_hindi : carousel.sharing_message,
            title_two_text_size: '11',
            title_two_text_color: '#777777',
            ...((!(carousel.data_type === 'favorite_category_icons' && +versionCode >= 970)) && { action_text: carousel.data_type === 'favorite_category_icons' && studentLocale === 'hi' ? 'सारी केटेगरी देखे' : carousel.action_text }),
            action_text_size: '11',
            action_text_color: '#54138a',
            action_deeplink: carousel.action_deeplink ? carousel.action_deeplink : '',
            background_color: '#ffffff',
            header_background_color: carousel.secondary_data,
            ...(carousel.data_type === 'favorite_category_icons' && { footer_background_color: '#efe9f3' }),
            items,
        },
        layout_config: {
            margin_top: 10,
            margin_bottom: 10,
            margin_left: 10,
            margin_right: 10,
        },
    };
}

module.exports = {
    getCategoryIconsWidget,
};
