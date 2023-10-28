function createFilterWidget(filterText, filterKey, filterList, filterIds, selectedOptions, isMultiSelect = false, isSingle = false) {
    const filterItems = [];
    const selectedItem = [];
    if (isSingle) {
        filterList.forEach((item, index) => filterItems.push({
            filter_id: filterIds[index],
            title: item,
            is_selected: selectedOptions.includes(filterIds[index]),
        }));
    } else {
        filterList.forEach((item, index) => filterItems.push({
            filter_id: filterIds[index],
            text: item,
            is_selected: selectedOptions.includes(filterIds[index]),
        }));
    }
    filterItems.forEach((item) => {
        if (item.is_selected) {
            selectedItem.push(item.filter_id);
        }
    });
    if (!selectedItem.length) {
        if (isMultiSelect) {
            for (let i = 0; i < filterItems.length; i++) {
                filterItems[i].is_selected = true;
            }
        }
        if (!isMultiSelect) {
            filterItems[0].is_selected = true;
        }
        filterItems.forEach((item) => {
            if (item.is_selected) {
                selectedItem.push(item.filter_id);
            }
        });
    }

    const data = {
        type: 'filter_button',
        data: {
            filter_text: filterText,
            filter_key: filterKey,
            filter_text_color: '#969696',
            filter_text_size: 16,
            is_filter_text_bold: false,
            is_selected_color: '#ea532c',
            is_selected_text_color: '#ffffff',
            not_selected_color: '#f5f5f5',
            not_selected_text_color: '#858585',
            button_text_size: 13,
            filter_items: filterItems,
            is_multi_select: isMultiSelect,
        },
    };
    return { data, selectedItem };
}
module.exports = {
    createFilterWidget,
};
