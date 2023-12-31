const express = require('express');
const validate = require('express-validation');
const paramValidation = require('./routeValidation');

const searchCtrl = require('./search.controller');
const searchCtrlV2 = require('../../v2/search/search.controller');
const handleTydLogFilters = require('../../../middlewares/handleTydLogFilters');
const handleTydSourcePanelQueryOcrSearchCompatible = require('../../../middlewares/handleTydSourcePanelQueryOcrSearchCompatible');
const sendResponse = require('../../../middlewares/sendResponse');
const router = express.Router();

router.route('/get-duplicate-dn-questions-cluster').post(searchCtrl.getDnQuestionsDuplicates);
router.route('/get-duplicate-dn-questions-cluster-details/:id/:locale').get(searchCtrl.getDnQuestionsDuplicatesDetails);
router.route('/:page/:tab/:text').get(validate(paramValidation.search.search), searchCtrl.search);
router.route('/getTrendingSuggestions').get(searchCtrl.getSuggestions);
router.route('/get-lang-matches-from-search-service').post(searchCtrl.getLanguageMatchesFromSearchService);
router.route('/get-global-matches-from-search-service').post(searchCtrl.getGlobalMatchesFromSearchService);
router.route('/get-matches-from-search-service').post(searchCtrl.getMatchesFromSearchService);
router.route('/get-matches').post(handleTydSourcePanelQueryOcrSearchCompatible, searchCtrl.getTydSuggestions);
router.route('/get-custom-matches').post(validate(paramValidation.search.getCustomMatches), searchCtrl.getCustomMatches);
router.route('/get-question-data/:question_id').get(searchCtrl.getQuestionData);
router.route('/get-filtered-user-questions').post(searchCtrl.getRecentUserQuestionsByFilters);
router.route('/get-chapter-list').get(searchCtrl.getChapterListForDropdown);
router.route('/get-grouped-question-by-studentid').post(searchCtrl.getQuestionAskStatsByStudentId);
router.route('/get-questions-by-studentid/:student_id').get(searchCtrl.getQuestionsByStudentId);
router.route('/get-laguage-bumped-user-questions').post(searchCtrl.getLanguageBumpQids);
router.route('/get-laguage-bumped-user-question-details').post(searchCtrl.getLangBumpQidDetails);
router.route('/get-user-question-data/:question_id').get(searchCtrl.getUserQuestionsDataByQid);
router.route('/get-by-user-question-ocr').get(searchCtrl.getByUserQuestionOcr);
router.route('/duplicate-solutions').get(searchCtrl.getDuplicateSolutions);
router.route('/get-advance-search-logs/:page').get(searchCtrl.getAdvanceSearchLogs);
router.route('/get-advance-search-logs-qid-details').post(searchCtrl.getAdvanceSearchLogViewIdDetails);
router.route('/get-similar-user-questions-cluster/:page').get(searchCtrl.getSimilarUserQuestionsClusters);
router.route('/get-similar-user-questions-cluster-details/:id').get(searchCtrl.getSimilarUserQuestionsClusterDetails);
router.route('/get-user-questions-match-position/:match_position').get(searchCtrl.getUserQuestionsByPosition);
router.route('/get-user-typed-questions/:page').get(searchCtrl.getTypedQuestions);
router.route('/get-user-recent-questions/:student_id&:question_id').get(searchCtrl.getUserRecentQuestions);
router.route('/get-variants-by-flagid/:flag_id').get(searchCtrl.getAllVariantsByFlagId);
router.route('/get-user-unmatched-clusters').post(searchCtrl.getUserUnmatchedQuestionsDetails);
router.route('/update-unmatched-by-question-id').post(searchCtrl.updateUnmatchedQuestionRowByExpert);
router.route('/update-unmatched-by-cluster-id').post(searchCtrl.updateUnmatchedClusterByExpert);
router.route('/update-matched-qid-unmatched-clusters').post(searchCtrl.updateMatchedQuestionsForTextClusters);
router.route('/get-questions-by-cluster-id/:video_language&:cluster_id').get(searchCtrl.getClusterQuestionByClusterId);
router.route('/get-questions-by-question-id/:video_language&:question_id').get(searchCtrl.getClusterQuestionByQuestionId);
router.route('/get-panel-dropdown-config').get(searchCtrl.getAnswerPanelDropwdownConfig);
router.route('/get-new-user-questions').post(searchCtrl.getNewUserQuestions);
router.route('/get-unmatched-clusters-subjects').get(searchCtrl.getSubjectsByUserUnmatchedClusters);
router.route('/get-backpress-matches-for-panel').post(searchCtrl.getBackPressMatchesForPanel);
router.route('/get-tyd-suggestions-logs').post(handleTydLogFilters, searchCtrl.getTydSuggestionsLogs);
router.route('/get-tyd-suggestions-session').post(handleTydLogFilters, searchCtrl.getTydSuggestionsSession);
router.route('/get-user-question-panel-cluster-types').get(searchCtrl.getUserQuestionClusterTypes);
router.route('/get-master-iteration-data-for-test-dataset').post(searchCtrl.getPanelMasterIterationData);
router.route('/update-ask-matchrate-test-dataset').post(searchCtrl.updateAskMatchRateTestDatasetInMongo);
router.route('/get-user-questions-test-dataset').post(searchCtrl.getUserQuestionsForTestDataset);
router.route('/stepwise-computation').post(searchCtrl.getStepwiseComputationSolution);
router.route('/get-questions-by-package-language').get(searchCtrl.getQuestionsByPackageLanguage, searchCtrlV2.getCustomMatches);
router.route('/update-duplicate-questions-for-package-language').post(searchCtrl.updateDuplicateQuestionInElastic);
router.route('/get-questions-by-package-language-for-qc').get(searchCtrl.getQuestionsByPackageLanguageForQc);
router.route('/view-duplicate-question-details-by-package-language/:questionId').get(searchCtrl.viewQuestionByPackageLanguageForQc);
router.route('/submit-qc-feedback-for-duplicate-tagging').post(searchCtrl.submitQcFeedbackDuplicateTagging);
router.route('/add-to-solution-scrape-queue').post(searchCtrl.addToWebScrapePipeline, sendResponse);

module.exports = router;
