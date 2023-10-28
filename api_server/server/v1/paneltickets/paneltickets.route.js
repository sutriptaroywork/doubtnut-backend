const express = require('express');
const authGuard = require('../../../middlewares/auth');
const ticketCtrl = require('./paneltickets.controller');

const router = express.Router();

router.route('/package-details').get(authGuard, ticketCtrl.packageDetails);

router.route('/categories').get(authGuard, ticketCtrl.getCategories);

router.route('/show-tickets').get(ticketCtrl.getAllTickets);

router.route('/subcategories').get(ticketCtrl.getSubCategories);

router.route('/create-ticket').post(authGuard, ticketCtrl.createTicket);

router.route('/update-ticket').post(authGuard, ticketCtrl.updateTicket);

router.route('/spocs').get(ticketCtrl.getSpocs);

router.route('/assign-resolved-reopen').post(authGuard, ticketCtrl.assignResolvedReOpen);

router.route('/get-ticket-details').get(ticketCtrl.getTicketDetails);

router.route('/ticket-actions').get(ticketCtrl.getTicketActions);
// router.route('/get-bda-tickets').get(ticketCtrl.getBdaTickets);

module.exports = router;
