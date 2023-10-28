const _ = require('lodash');
const { getExpressApp } = require('./app');
const { getTestToken } = require('./utilities');

describe('Test home endpoint', () => {
    let app;
    let jwt;

    beforeAll(async () => {
        app = await getExpressApp();
        jwt = await getTestToken(app);
    });

    test('/v3/tesla/feed - no access token', async () => {
        const response = await app().get('/v3/tesla/feed');
        expect(response.status).toBe(401);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Unauthorized');
        expect(response.body.data).toBeDefined();
        expect(response.body.data).toBe('Unauthorized');
    });

    test('/v3/tesla/feed', async () => {
        jest.setTimeout(50000);
        const response = await app()
            .get('/v3/tesla/feed')
            .query({ page: '1', source: 'home', home_page_experiment: true })
            .set({ 'X-Auth-Token': jwt, version_code: 929, 'Content-Type': 'application/json' });
        expect(response.status).toBe(200);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Success');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.feeddata.length).toBeGreaterThanOrEqual(1);
        _.each(response.body.data.feeddata, (test) => {
            if (test.widget_type === 'widget_top_option') {
                _.each(test.widget_data.items || [], (item) => {
                    expect(item.id).toBeDefined();
                    expect(typeof item.id).toBe('number');
                    expect(item.title).toBeDefined();
                    expect(item.icon).toBeDefined();
                    expect(item.icon).toContain('https://');
                    expect(item.deepLink).toBeDefined();
                    // expect(item.deepLink).toContain('doubtnutapp://')
                });
            }

            if (test.widget_type === 'widget_parent') {
                _.each(test.widget_data.items || [], (item) => {
                    if (item.type === 'widget_course_v2') {
                        expect(item.data.id).toBeDefined();
                        expect(typeof item.data.id).toBe('number');
                        expect(item.data.title).toBeDefined();
                        expect(item.data.assortment_id).toBeDefined();
                        expect(typeof item.data.assortment_id).toBe('number');
                        expect(item.data.set_width).toBeDefined();
                        expect(item.data.buy_deeplink).toBeDefined();
                        expect(item.data.image_bg).toBeDefined();
                        expect(item.data.bottom_left_bg_color).toBeDefined();
                        expect(item.data.bottom_left_bg_color).toBeDefined();
                        expect(item.data.bottom_left_text1_color).toBeDefined();
                        expect(item.data.bottom_left_text1_size).toBeDefined();
                        expect(item.data.bottom_left_text2_color).toBeDefined();
                        expect(item.data.bottom_left_text2_size).toBeDefined();
                        // expect(item.data.starting_at_text).toBeDefined();
                        expect(item.data.bottom_right_bg_color).toBeDefined();
                        expect(item.data.bottom_right_text_color).toBeDefined();
                        expect(item.data.bottom_right_text_size).toBeDefined();
                        expect(item.data.strikethrough_text_color).toBeDefined();
                        expect(item.data.strikethrough_text_size).toBeDefined();
                        expect(item.data.discount_color).toBeDefined();
                        expect(item.data.bottom_payment_text).toBeDefined();
                        expect(item.data.bottom_payment_text_color).toBeDefined();
                        expect(item.data.bottom_payment_text_size).toBeDefined();
                        expect(item.data.discount_text_size).toBeDefined();
                        expect(item.data.title_one_color).toBeDefined();
                        expect(item.data.title_two_color).toBeDefined();
                        expect(item.data.course_type).toBeDefined();
                        expect(item.data.deeplink).toBeDefined();
                        expect(item.data.registered_text_color).toBeDefined();
                        expect(item.data.amount_to_pay).toBeDefined();
                        // expect(item.data.amount_strike_through).toBeDefined();
                        expect(item.data.monthly_price).toBeDefined();
                        expect(item.data.buy_text).toBeDefined();
                        // expect(item.data.discount).toBeDefined();
                        expect(item.data.button_state).toBeDefined();
                        expect(item.data.demo_video_thumbnail).toBeDefined();
                        expect(item.data.powered_by_text).toBeDefined();
                        expect(item.data.powered_by_text_color).toBeDefined();
                        expect(item.data.powered_by_text_size).toBeDefined();
                        expect(item.data.video_deeplink).toBeDefined();
                        expect(item.data.title_color).toBeDefined();
                        expect(item.data.title_color_size).toBeDefined();
                        expect(item.data.medium_text).toBeDefined();
                        expect(item.data.medium_text_color).toBeDefined();
                        expect(item.data.medium_text_size).toBeDefined();
                        expect(item.data.rating_text).toBeDefined();
                        expect(item.data.rating_text_color).toBeDefined();
                        expect(item.data.rating_text_size).toBeDefined();
                        expect(item.data.amount_to_pay_text_color).toBeDefined();
                        expect(item.data.amount_to_pay_text_size).toBeDefined();
                        expect(item.data.is_buy_now_enable).toBeDefined();
                        expect(item.data.rating_icon_url).toBeDefined();
                        // expect(item.data.duration_icon_url).toBeDefined();
                        expect(item.data.duration_text).toBeDefined();
                        expect(item.data.duration_text_size).toBeDefined();
                        expect(item.data.duration_text_color).toBeDefined();
                        expect(item.data.video_icon_url).toBeDefined();
                    }
                });
            }

            if (test.widget_type === 'widget_nudge') {
                expect(test.widget_data.widget_id).toBeDefined();
                expect(test.widget_data.nudge_type).toBeDefined();
                // expect(test.widget_data.title).toBeDefined();
                expect(test.widget_data.title_color).toBeDefined();
                expect(test.widget_data.title_size).toBeDefined();
                // expect(test.widget_data.subtitle).toBeDefined();
                expect(test.widget_data.subtitle_color).toBeDefined();
                expect(test.widget_data.subtitle_size).toBeDefined();
                // expect(test.widget_data.cta_text).toBeDefined();
                expect(test.widget_data.cta_text_size).toBeDefined();
                expect(test.widget_data.cta_text_color).toBeDefined();
                expect(test.widget_data.deeplink).toBeDefined();
                expect(test.widget_data.is_banner).toBeDefined();
                expect(test.widget_data.bg_image_url).toBeDefined();
                // expect(test.widget_data.bg_color).toBeDefined();
                expect(test.widget_data.close_image_url).toBeDefined();
                expect(test.widget_data.image_url).toBeDefined();
                expect(test.widget_data.ratio).toBeDefined();
            } // end widget_nudge

            if (test.widget_type === 'widget_autoplay') {
                _.each(test.widget_data.items || [], (item) => {
                    if (item.type == 'video_banner_autoplay_child') {
                        expect(item.data.id).toBeDefined();
                        expect(typeof item.data.id).toBe('number');
                        expect(item.data.image_url).toBeDefined();
                        expect(item.data.deeplink).toBeDefined();
                        // expect(item.data.deepLink).toContain('doubtnutapp://');
                        expect(item.data.default_mute).toBeDefined();
                        expect(item.data.video_resource.resource).toBeDefined();
                        expect(item.data.video_resource.auto_play_duration).toBeDefined();
                    }
                });
            } // end widget_autoplay

            if (test.widget_type === 'horizontal_list') {
                expect(test.widget_data._id).toBeDefined();
                expect(test.widget_data.title).toBeDefined();
                // expect(test.widget_data.carousel_id).toBeDefined();
                // expect(test.widget_data.show_view_all).toBeDefined();
                expect(test.widget_data.sharing_message).toBeDefined();
                if (test.widget_data.type === 'BOARD_EXAM_2021') {
                    expect(test.widget_data.type).toBeDefined();
                    expect(test.widget_data.data_type).toBeDefined();
                    expect(test.widget_data.carousel_order).toBeDefined();
                    expect(test.widget_data.scroll_type).toBeDefined();
                    expect(test.widget_data.scroll_size).toBeDefined();
                    expect(test.widget_data.data_limit).toBeDefined();
                    expect(test.widget_data.created_at).toBeDefined();
                    expect(test.widget_data.view_all).toBeDefined();
                    // expect(test.widget_data.secondary_data).toBeDefined();
                    expect(test.widget_data.is_active).toBeDefined();
                    expect(test.widget_data.updated_at).toBeDefined();
                    expect(test.widget_data.is_delete).toBeDefined();
                    expect(test.widget_data.class).toBeDefined();
                    expect(test.widget_data.mapped_playlist_id).toBeDefined();
                    expect(test.widget_data.locale).toBeDefined();
                    expect(test.widget_data.min_version_code).toBeDefined();
                    expect(test.widget_data.max_version_code).toBeDefined();
                    expect(test.widget_data.flagVariant).toBeDefined();
                    expect(test.widget_data.description).toBeDefined();
                    // expect(typeof test.widget_data.widget_id).toBe('number');
                }
                _.each(test.widget_data.items || [], (item) => {
                    expect(item.title).toBeDefined();
                    // expect(item.subtitle).toBeDefined();
                    expect(item.show_whatsapp).toBeDefined();
                    expect(item.show_video).toBeDefined();
                    expect(item.image_url).toBeDefined();
                    expect(item.card_width).toBeDefined();
                    expect(item.deeplink).toBeDefined();
                    // expect(item.aspect_ratio).toBeDefined();
                    expect(item.id).toBeDefined();
                });
            } // end horizontal_list

            if (test.widget_type === 'widget_khelo_jeeto_banner') {
                if (test.widget_data === 'khelo_jeeto_v2') {
                    expect(test.widget_data.type).toBeDefined();
                    expect(test.widget_data.background_color).toBeDefined();
                    expect(test.widget_data.card_ratio).toBeDefined();
                    expect(test.widget_data.card_width).toBeDefined();
                    expect(test.widget_data.cta_text).toBeDefined();
                    expect(test.widget_data.deeplink).toBeDefined();
                    expect(test.widget_data.id).toBeDefined();
                    expect(test.widget_data.image).toBeDefined();
                    expect(test.widget_data.image_background_color).toBeDefined();
                    expect(test.widget_data.subtitle).toBeDefined();
                    expect(test.widget_data.subtitle_color).toBeDefined();
                    expect(test.widget_data.title_color).toBeDefined();
                    expect(test.widget_data.title).toBeDefined();
                }
            } // end widget_khelo_jeeto_banner
        });
    });
});
