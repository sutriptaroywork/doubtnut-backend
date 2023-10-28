### This doc specifies a broad view of redis key patterns and their meaning

- **USER:PROFILE:\<SID\>**
  - **USER** - students table
  - **VIDEO_VIEW_COUNT** - 
  - **LATEST_VIEW_ID** - 
  - **HISTORY** - last 5 viewd videos
  - **SRP** - homepage srp playlist question id list
  - **NON_SRP** - homepage non-srp playlist question id list
  - **lc_count** - how much time live class has been showed
  - **lc_show** - would live class be showed on the next session
  - **lc_exp** - live class experiment is ongoing or not
  - **lc_sf_count** - live class short form session count
- **QUESTION:\<QID\>**
  - **STATS** - likes/dislikes/views
  - **PERSONALISATION_DATA** - redundant data
  - **Q:\<language\>** - localized ocr
  - **ANSWER** - question table + answer table
  - **ANSWER_OLD** - redundant data
  - **HTML** - mathjax
  - **META** - questions meta
  - **SRP_PLAYLIST** - 
  - **NON_SRP_PLAYLIST** - 
- **answer_video_resources:\<ANSID\>** - answer_video_resources table
- **LIBRARY_NEW_BOOK_\<ID\>_\<CLASS\>_\<SUB\>_\<QID\>** - 
- **LIBRARY_CACHE_ID_\<PLAYLISTID\>_\<VERSIONCODE\>** - new_library data
- **LIBRARY_NCERT_PLAYLIST_DATA_\<PLAYLISTID\>** - ncert data
- **LIBRARY_RESOURCE_DATA_\<PLAYLISTID\>_\<VERSIONCODE\>_\<ID\>_\<language\>** - library resource data
- **LIBRARY_GET_ALL_CACHE_\<CLASS\>_\<VERSIONCODE\>** - new_library data
- **latest_question_ask_history_\<SID\>** - user latest question asked
- **QUESTIONS_CHAPTER_DATA_\<QID\>** - redundant data
- **app_open_nudge_\<ID\>** -
- **user_liveclass_watch_count:\<SID\>** - no ttl
- **user_video_view_count:\<SID\>** - 
- **user_active_device_id_\<SID\>** - redundant data
- **feed_gcm_id_\<SID\>** - redundant data
- **course_assortment_resource_\<ID\>_undefined** - blank data
- **course_homework_\<QID\>** - blank data
- **\<QID\>_hi** - localized redundant data without ttl
- **question_summary_image_ \<QID\>** - blank data with space in key
- **user_video_ads_watch_count:\<SID\>_\<ID\>** - 
- **nudge_pop_up_\<ID>\ - to store app activities for homepage backpress nudge pop up.
- **app_open_nudge_\<ID>\ - to store number of times app opened.