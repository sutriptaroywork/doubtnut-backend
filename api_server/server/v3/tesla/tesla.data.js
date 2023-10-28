module.exports = {
    cricket_widget_data: {
        widget_data: {
            title: 'IPL',
            title_two: 'Scoreboard',
            tabs: [
                {
                    key: 'Recent',
                    title: 'Recent',
                    is_selected: true,
                },
                // {
                //     key: 'Live',
                //     title: 'Live',
                //     is_selected: true,
                // },
                {
                    key: 'Upcoming',
                    title: 'Upcoming',
                    is_selected: false,
                },
            ],
            items: {
                Recent: [
                    // {
                    //     match_status: 'Recent',
                    //     match_details: '30th Match, Group-1, T20I',
                    //     match_venue: 'Abu Dhabi',
                    //     team_one: 'BAN',
                    //     team_one_flag: '',
                    //     team_one_score: '(19/20 over) 50/6',
                    //     team_two: 'SA',
                    //     team_two_flag: '',
                    //     team_two_score: '(19/20 over) 50/6',
                    //     match_result: 'Bangladesh Chose to Bat',
                    //     reminder_text: 'Notify Me',
                    // },
                ],
                // Live: [
                //     {
                //         match_status: 'Live',
                //         match_details: '30th Match, Group-4, T20I',
                //         match_venue: 'Mumbai',
                //         team_one: 'IND',
                //         team_one_flag: '',
                //         team_one_score: '(19/20 over) 50/6',
                //         team_two: 'PAK',
                //         team_two_flag: '',
                //         team_two_score: '(19/20 over) 50/6',
                //         match_result: 'PAK Chose to Bat',
                //         reminder_text: 'Notify Me',
                //     },
                // ],
                Upcoming: [
                    // {
                    //     match_status: 'Upcoming',
                    //     match_details: '30th Match, Group-2, T20I',
                    //     match_venue: 'Delhi',
                    //     team_one: 'ENG',
                    //     team_one_flag: '',
                    //     team_one_score: '(19/20 over) 50/6',
                    //     team_two: 'AUS',
                    //     team_two_flag: '',
                    //     team_two_score: '(19/20 over) 50/6',
                    //     match_result: 'AUS Chose to Bat',
                    //     reminder_text: 'Notify Me',
                    // },
                ],
            },
        },
        widget_type: 'widget_ipl_scoreboard',
    },
};
