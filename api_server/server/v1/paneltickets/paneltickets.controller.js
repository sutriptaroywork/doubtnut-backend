const _ = require('lodash');
const moment = require('moment');
const TicketConstants = require('../../../data/data');
const MailUtility = require('../../../modules/Utility.mail');

const panelTicketsMysql = require('../../../modules/mysql/panelTickets');
const Student = require('../../../modules/mysql/student');

const config = require('../../../config/config');

async function packageDetails(req, res, next) {
    try {
        const db = req.app.get('db');
        let { studentId } = req.query;
        const { mobile } = req.query;
        if (mobile) {
            const studentDetails = await Student.getStudentByPhone(
                mobile,
                db.mysql.read,
            );
            if (studentDetails.length === 0) {
                const responseData = {
                    meta: {
                        code: 500,
                        success: true,
                        message: 'STUDENT NOT FOUND',
                    },
                    data: null,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            studentId = studentDetails[0].student_id;
        }
        const results = await panelTicketsMysql.fetchPackageDetails(
            db.mysql.read,
            studentId,
        );

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                details: {
                    mobile: { mobile },
                    student_id: { studentId },
                },
                results,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getCategories(req, res, next) {
    try {
        const db = req.app.get('db');
        const results = await panelTicketsMysql.fetchCatDetails(db.mysql.read);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: results || null,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getAllTickets(req, res, next) {
    try {
        const db = req.app.get('db');
        const { emailId, entityType } = req.query;
        if (entityType === 'SPOC') {
            const promise = [];
            promise.push(panelTicketsMysql.fetchSpocTickets(
                db.mysql.read,
                emailId,
            ));
            promise.push(panelTicketsMysql.fetchTicketsCreatedBySpoc(
                db.mysql.read,
                emailId,
            ));
            const [pendingTickets, spocTickets] = await Promise.all(promise);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { pendingTickets, spocTickets },
            };
            return res.status(responseData.meta.code).json(responseData);
        } if (entityType === 'BDA') {
            const pendingTickets = await panelTicketsMysql.fetchBdaTickets(
                db.mysql.read,
                emailId,
            );
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { pendingTickets },
            };
            return res.status(responseData.meta.code).json(responseData);
        } if (entityType === 'FEEDBACK') {
            const pendingTickets = await panelTicketsMysql.fetchAllTickets(
                db.mysql.read,
            );
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { pendingTickets },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getSubCategories(req, res, next) {
    try {
        const db = req.app.get('db');
        const { categoryId } = req.query;
        const results = await panelTicketsMysql.fetchSubCatDetails(
            db.mysql.read,
            categoryId,
        );

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: results || null,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function createTicket(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            mobile,
            studentId,
            emailId,
            entityType,
            action,
            categoryId,
            subcategoryId,
            packageId,
            resourceUrl,
            issue,
        } = req.body;
        const ticketObj = {
            mobile,
            student_id: studentId,
            package_id: packageId,
            category_id: categoryId,
            subcategory_id: subcategoryId,
        };

        if (!mobile || !studentId || !categoryId || !subcategoryId) {
            const responseData = {
                meta: {
                    code: 500,
                    success: true,
                    message: 'ISSUE IN CREATING TICKETS',
                },
                data: 'please insert all fields',
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        //   insert data into ticket table
        const results = await panelTicketsMysql.insertTicket(
            db.mysql.write,
            ticketObj,
        );
        // Insert data into activity table
        const activityObj = {
            ticket_id: results.insertId,
            email_id: emailId,
            entity_type: entityType,
            action,
            comments: issue,
            resource_url: resourceUrl,
        };

        await panelTicketsMysql.insertActionIntoActivity(
            db.mysql.write,
            activityObj,
        );

        const mailData = await panelTicketsMysql.fetchSingleTicket(
            db.mysql.read,
            results.insertId,
        );

        if (results.insertId) {
            let mailBody;
            if (packageId) {
                const packageData = await panelTicketsMysql.getPackageDetailsFromPackageId(
                    db.mysql.read,
                    packageId,
                );
                mailBody = `You have received this email because there is a new ticket raised. Please find the details below:<br>
            1. MOBILE: ${mobile}<br>
            2. STUDENT ID: ${studentId}<br>
            3. CATEGORY: ${mailData[0].category}<br>
            4. SUBCATEGORY: ${mailData[0].subcategory}<br>
            5. RESOURCE URL: ${config.staticCDN}panel_ticket_resources/${resourceUrl}<br>
            6. ISSUE: ${issue}<br>
            7. PACKAGE ID: ${packageId}<br>
            8. PACKAGE DETAILS: ${packageData[0].name} || Batch Id: ${packageData[0].batch_id}<br>
            9. TICKET CREATED BY: ${entityType} Email Id: ${emailId} <br>

            Please visit this link to take action : https://expert.doubtnut.com/doubtnut/public/experts/offline-sales/details/ticketId/${results.insertId}
        `;
            } else {
                mailBody = `You have received this email because there is a new ticket raised. Please find the details below:<br>
            1. MOBILE: ${mobile}<br>
            2. STUDENT ID: ${studentId}<br>
            3. CATEGORY: ${mailData[0].category}<br>
            4. SUBCATEGORY: ${mailData[0].subcategory}<br>
            5. RESOURCE URL: ${config.staticCDN}panel_ticket_resources/${resourceUrl}<br>
            6. ISSUE: ${issue}<br>
            7. TICKET CREATED BY: ${entityType}, Email Id: ${emailId} <br>

            Please visit this link to take action : https://expert.doubtnut.com/doubtnut/public/experts/offline-sales/details/ticketId/${results.insertId}
        `;
            }

            MailUtility.sendMailViaSendGrid(
                config,
                TicketConstants.expert_panel_team.mail_details.autobotMailID,
                TicketConstants.expert_panel_team.mail_details
                    .panelTechTeamMailID,
                `NEW TICKET CREATED:- ID: ${results.insertId} By ${entityType} ${emailId}`,
                mailBody,
                TicketConstants.expert_panel_team.mail_details.panelTechTeamCCID,
            );
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    ticket_id: results.insertId,
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const responseData = {
            meta: {
                code: 500,
                success: true,
                message: 'ISSUE IN CREATING TICKETS',
            },
            data: null,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function updateTicket(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            ticketId,
            mobile,
            studentId,
            emailId,
            entityType,
            action,
            categoryId,
            subcategoryId,
            packageId,
            resourceUrl,
            issue,
        } = req.body;
        const ticketObj = {
            package_id: packageId,
            category_id: categoryId,
            status: 'PENDING',
            subcategory_id: subcategoryId,
        };

        if (!mobile || !categoryId || !subcategoryId) {
            const responseData = {
                meta: {
                    code: 500,
                    success: true,
                    message: 'ISSUE IN UPDATING TICKET',
                },
                data: 'please insert all fields',
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        //   insert data into ticket table
        const promise = [];
        promise.push(panelTicketsMysql.updateTicket(
            db.mysql.write,
            ticketObj,
            ticketId,
        ));
        // Insert data into activity table
        const activityObj = {
            ticket_id: ticketId,
            email_id: emailId,
            entity_type: entityType,
            action,
            comments: issue,
            resource_url: resourceUrl,
        };

        promise.push(panelTicketsMysql.insertActionIntoActivity(
            db.mysql.write,
            activityObj,
        ));

        const results = await Promise.all(promise);

        const mailData = await panelTicketsMysql.fetchSingleTicket(
            db.mysql.read,
            ticketId,
        );

        if (ticketId) {
            let mailBody;
            if (packageId) {
                const packageData = await panelTicketsMysql.getPackageDetailsFromPackageId(
                    db.mysql.read,
                    packageId,
                );
                mailBody = `You have received this email because ticket id ${ticketId} has been updated. Please find the details below:<br>
            1. MOBILE: ${mobile}<br>
            2. STUDENT ID: ${studentId}<br>
            3. CATEGORY: ${mailData[0].category}<br>
            4. SUBCATEGORY: ${mailData[0].subcategory}<br>
            5. RESOURCE URL: ${config.staticCDN}panel_ticket_resources/${resourceUrl}<br>
            6. ISSUE: ${issue}<br>
            7. PACKAGE ID: ${packageId}<br>
            8. PACKAGE DETAILS: ${packageData[0].name} || Batch Id: ${packageData[0].batch_id}<br>
            9. TICKET CREATED BY: ${entityType} Email Id: ${emailId} <br>

            Please visit this link to take action : https://expert.doubtnut.com/doubtnut/public/experts/offline-sales/details/ticketId/${ticketId}
        `;
            } else {
                mailBody = `You have received this email because ticket id ${ticketId} has been updated. Please find the details below:<br>
            1. MOBILE: ${mobile}<br>
            2. STUDENT ID: ${studentId}<br>
            3. CATEGORY: ${mailData[0].category}<br>
            4. SUBCATEGORY: ${mailData[0].subcategory}<br>
            5. RESOURCE URL: ${config.staticCDN}panel_ticket_resources/${resourceUrl}<br>
            6. ISSUE: ${issue}<br>
            7. TICKET CREATED BY: ${entityType}, Email Id: ${emailId} <br>

            Please visit this link to take action : https://expert.doubtnut.com/doubtnut/public/experts/offline-sales/details/ticketId/${ticketId}
        `;
            }

            MailUtility.sendMailViaSendGrid(
                config,
                TicketConstants.expert_panel_team.mail_details.autobotMailID,
                TicketConstants.expert_panel_team.mail_details
                    .panelTechTeamMailID,
                `TICKET UPDATED:- TICKET ID: ${ticketId} By ${entityType} ${emailId}`,
                mailBody,
                TicketConstants.expert_panel_team.mail_details.panelTechTeamCCID,
            );
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: results || null,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const responseData = {
            meta: {
                code: 500,
                success: true,
                message: 'ISSUE IN UPDATING TICKET',
            },
            data: null,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getSpocs(req, res, next) {
    try {
        const db = req.app.get('db');
        const { subcategoryId } = req.query;

        const results = await panelTicketsMysql.fetchSpocUsingSubCategoryId(
            db.mysql.read,
            subcategoryId,
        );
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: results || null,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getTicketDetails(req, res, next) {
    try {
        const db = req.app.get('db');
        const { ticketId } = req.query;
        /*
            ticket details from ticket table
            ticket activity table from activity table
            spoc details from spoc table
            merge activity and spoc details
         */
        const promise = [];
        promise.push(
            panelTicketsMysql.fetchSingleTicket(db.mysql.read, ticketId),
        );
        promise.push(
            panelTicketsMysql.fetchTicketActivity(db.mysql.read, ticketId),
        );
        promise.push(
            panelTicketsMysql.fetchTicketSpocsUsingTicketID(
                db.mysql.read,
                ticketId,
            ),
        );
        const [ticketDetails, ticketActivityDetails, ticketSpocDetails] = await Promise.all(promise);
        const spocGroupedByActivityID = _.groupBy(
            ticketSpocDetails,
            'activity_id',
        );
        for (let i = 0; i < ticketActivityDetails.length; i++) {
            if (spocGroupedByActivityID[ticketActivityDetails[i].id]) {
                ticketActivityDetails[i].spocs = spocGroupedByActivityID[ticketActivityDetails[i].id];
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                ticketDetails: ticketDetails[0],
                ticketActivityDetails,
                ticketSpocDetails,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function assignResolvedReOpen(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            ticketId,
            emailId,
            entityType,
            action,
            comments,
            spocEmail,
            resourceUrl,
        } = req.body;
        if (!action) {
            const responseData = {
                meta: {
                    code: 500,
                    success: true,
                    message: 'Please Select Status',
                },
                data: null,
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        const mailData = await panelTicketsMysql.fetchSingleTicket(
            db.mysql.read,
            ticketId,
        );
        let mailBody;
        if (mailData[0].package_id) {
            const packageData = await panelTicketsMysql.getPackageDetailsFromPackageId(
                db.mysql.read,
                mailData[0].package_id,
            );

            mailBody = `
            You have received this email because there is a new ticket assigned or resolved. Please find the details below:<br>
            1. MOBILE: ${mailData[0].mobile}<br>
            2. STUDENT ID: ${mailData[0].student_id}<br>
            3. CATEGORY: ${mailData[0].category}<br>
            4. SUBCATEGORY: ${mailData[0].subcategory}<br>
            5. PACKAGE ID: ${mailData[0].package_id}<br>
            6. PACKAGE DETAILS: ${packageData[0].name} || Batch Id: ${packageData[0].batch_id}<br>
            7. RESOURCE URL: ${config.staticCDN}panel_ticket_resources/${resourceUrl}<br>
            8. ISSUE: ${comments}<br>

            Please visit this link to take action : https://expert.doubtnut.com/doubtnut/public/experts/offline-sales/details/ticketId/${ticketId}
        `;
        } else {
            mailBody = `
            You have received this email because there is a new ticket assigned or resolved. Please find the details below:<br>
            1. MOBILE: ${mailData[0].mobile}<br>
            2. STUDENT ID: ${mailData[0].student_id}<br>
            3. CATEGORY: ${mailData[0].category}<br>
            4. SUBCATEGORY: ${mailData[0].subcategory}<br>
            5. RESOURCE URL: ${config.staticCDN}panel_ticket_resources/${resourceUrl}<br>
            6. ISSUE: ${comments}<br>

            Please visit this link to take action : https://expert.doubtnut.com/doubtnut/public/experts/offline-sales/details/ticketId/${ticketId}
        `;
        }
        if (entityType === 'FEEDBACK') {
            // feedback actions
            if (action === 'RESOLVE') {
                // Insert data into activity table
                // Update ticket status into ticket table
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };

                const status = 'RESOLVED';
                const promise = [];
                promise.push(
                    panelTicketsMysql.insertActionIntoActivity(
                        db.mysql.write,
                        activityObj,
                    ),
                );
                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        status,
                        ticketId,
                    ),
                );
                const results = await Promise.all(promise);

                const ccmailIds = await panelTicketsMysql.getAssignedSpocsEmail(
                    db.mysql.read,
                    ticketId,
                );

                const bdaMail = await panelTicketsMysql.getMailIdByWhichTicketCreated(
                    db.mysql.read,
                    ticketId,
                );

                MailUtility.sendMailViaSendGrid(
                    config,
                    TicketConstants.expert_panel_team.mail_details
                        .autobotMailID,
                    bdaMail[0].email_id,
                    `TICKET ID:- ${ticketId} HAS BEEN RESOLVED BY FEEDBACK AND CLOSED`,
                    mailBody,
                    _.map(ccmailIds, 'email_id'),
                );

                if (bdaMail[0].email_id.includes('.com')) {
                    // send email for .in extension in ccmail mail
                    const ccTicketCreatorMailId = bdaMail[0].email_id.replace(
                        '.com',
                        '.in',
                    );
                    MailUtility.sendMailViaSendGrid(
                        config,
                        TicketConstants.expert_panel_team.mail_details
                            .autobotMailID,
                        ccTicketCreatorMailId,
                        `TICKET ID:- ${ticketId} ACTION ${action}`,
                        mailBody,
                    );
                }

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            } if (action === 'ADDITIONAL_INFO_REQUIRED_TICKET_CREATOR') {
                // Insert data into activity table
                // Update ticket status into ticket table
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };
                const promise = [];
                promise.push(
                    panelTicketsMysql.insertActionIntoActivity(
                        db.mysql.write,
                        activityObj,
                    ),
                );
                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        action,
                        ticketId,
                    ),
                );
                const results = await Promise.all(promise);

                const bdaMail = await panelTicketsMysql.getMailIdByWhichTicketCreated(
                    db.mysql.read,
                    ticketId,
                );

                MailUtility.sendMailViaSendGrid(
                    config,
                    TicketConstants.expert_panel_team.mail_details
                        .autobotMailID,
                    bdaMail[0].email_id,
                    `TICKET ID:- ${ticketId} ACTION ${action}`,
                    mailBody,
                );

                if (bdaMail[0].email_id.includes('.com')) {
                    // send email for .in extension in ccmail mail
                    const ccTicketCreatorMailId = bdaMail[0].email_id.replace(
                        '.com',
                        '.in',
                    );
                    MailUtility.sendMailViaSendGrid(
                        config,
                        TicketConstants.expert_panel_team.mail_details
                            .autobotMailID,
                        ccTicketCreatorMailId,
                        `TICKET ID:- ${ticketId} ACTION ${action}`,
                        mailBody,
                    );
                }

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            } if (action === 'ASSIGN') {
                // Update ticket status into ticket table
                const status = 'ASSIGNED';
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };
                const result = await panelTicketsMysql.insertActionIntoActivity(
                    db.mysql.write,
                    activityObj,
                );
                // do is_active 0 for already assigned spocs before assigning new spoc in panel_student_query_assigned_spocs
                await panelTicketsMysql.updateIsActivePSQAS(
                    db.mysql.write,
                    ticketId,
                );

                const promise = [];

                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        status,
                        ticketId,
                    ),
                );

                if (spocEmail.length === 0) {
                    const responseData = {
                        meta: {
                            code: 500,
                            success: true,
                            message: 'Please Tick Mark SPOC Checkbox',
                        },
                        data: null,
                    };
                    return res
                        .status(responseData.meta.code)
                        .json(responseData);
                }
                // console.log(spocEmail.split(','));
                // console.log(spocEmail);
                const spocEmailArray = JSON.parse(spocEmail);
                // Insert data into assigned_spocs table and send email to every selected spoc
                for (let i = 0; i < spocEmailArray.length; i++) {
                    const spocsObj = {
                        activity_id: result.insertId,
                        ticket_id: ticketId,
                        email_id: spocEmailArray[i],
                    };
                    promise.push(
                        panelTicketsMysql.insertSpocsIntoAssignedSpocs(
                            db.mysql.write,
                            spocsObj,
                        ),
                    );

                    MailUtility.sendMailViaSendGrid(
                        config,
                        TicketConstants.expert_panel_team.mail_details
                            .autobotMailID,
                        spocEmailArray[i],
                        `NEW TICKET ASSIGNED TO YOU:- ID: ${ticketId}`,
                        mailBody,
                        TicketConstants.expert_panel_team.mail_details
                            .panelTechTeamCCID,
                    );
                }

                const results = await Promise.all(promise);
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            } if (action === 'ADDITIONAL_INFO_GIVEN_BY_FEEDBACK') {
                // Insert data into activity table
                // Update ticket status into ticket table
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };

                const status = 'ASSIGNED';
                const promise = [];
                promise.push(
                    panelTicketsMysql.insertActionIntoActivity(
                        db.mysql.write,
                        activityObj,
                    ),
                );
                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        status,
                        ticketId,
                    ),
                );
                const results = await Promise.all(promise);

                const ccmailIds = await panelTicketsMysql.getAssignedSpocsEmail(
                    db.mysql.read,
                    ticketId,
                );
                MailUtility.sendMailViaSendGrid(
                    config,
                    TicketConstants.expert_panel_team.mail_details
                        .autobotMailID,
                    TicketConstants.expert_panel_team.mail_details
                        .panelTechTeamMailID,
                    `TICKET ID:- ${ticketId} HAS ${action}`,
                    mailBody,
                    _.map(ccmailIds, 'email_id'),
                );

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        } else if (entityType === 'SPOC') {
            // spoc actions
            if (action === 'RESOLVE') {
                // Insert data into activity table
                // Update ticket status into ticket table
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };

                const status = 'RESOLVED_BY_SPOC';
                const promise = [];
                promise.push(
                    panelTicketsMysql.insertActionIntoActivity(
                        db.mysql.write,
                        activityObj,
                    ),
                );
                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        status,
                        ticketId,
                    ),
                );
                const results = await Promise.all(promise);

                const resolvedSpocs = await panelTicketsMysql.getResolvedSpoc(
                    db.mysql.read,
                    ticketId,
                );

                const ccmailIds = await panelTicketsMysql.getAssignedSpocsEmail(
                    db.mysql.read,
                    ticketId,
                );
                MailUtility.sendMailViaSendGrid(
                    config,
                    TicketConstants.expert_panel_team.mail_details
                        .autobotMailID,
                    TicketConstants.expert_panel_team.mail_details
                        .panelTechTeamMailID,
                    `TICKET ID:- ${ticketId}  RESOLVED BY SPOC ${resolvedSpocs[0].email_id}`,
                    mailBody,
                    _.map(ccmailIds, 'email_id'),
                );

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            } if (action === 'ADDITIONAL_INFO_REQUIRED_FEEDBACK') {
                // Insert data into activity table
                // Update ticket status into ticket table
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };
                const promise = [];
                promise.push(
                    panelTicketsMysql.insertActionIntoActivity(
                        db.mysql.write,
                        activityObj,
                    ),
                );
                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        action,
                        ticketId,
                    ),
                );
                const results = await Promise.all(promise);

                const ccmailIds = await panelTicketsMysql.getAssignedSpocsEmail(
                    db.mysql.read,
                    ticketId,
                );
                MailUtility.sendMailViaSendGrid(
                    config,
                    TicketConstants.expert_panel_team.mail_details
                        .autobotMailID,
                    TicketConstants.expert_panel_team.mail_details
                        .panelTechTeamMailID,
                    `TICKET ID:- ${ticketId} HAS ${action}`,
                    mailBody,
                    _.map(ccmailIds, 'email_id'),
                );

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            } if (action === 'ADDITIONAL_INFO_GIVEN_TICKET_CREATOR') {
                // Insert data into activity table
                // Update ticket status into ticket table
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };

                const status = 'PENDING';
                const promise = [];
                promise.push(
                    panelTicketsMysql.insertActionIntoActivity(
                        db.mysql.write,
                        activityObj,
                    ),
                );
                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        status,
                        ticketId,
                    ),
                );
                const results = await Promise.all(promise);
                console.log(results);

                MailUtility.sendMailViaSendGrid(
                    config,
                    TicketConstants.expert_panel_team.mail_details
                        .autobotMailID,
                    TicketConstants.expert_panel_team.mail_details
                        .panelTechTeamMailID,
                    `TICKET ID:- ${ticketId}`,
                    mailBody,
                );

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            } if (action === 'REOPEN') {
                // Insert data into activity table
                // Update ticket status into ticket table
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };

                const status = 'PENDING';
                const promise = [];
                promise.push(
                    panelTicketsMysql.insertActionIntoActivity(
                        db.mysql.write,
                        activityObj,
                    ),
                );
                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        status,
                        ticketId,
                    ),
                );
                const results = await Promise.all(promise);

                MailUtility.sendMailViaSendGrid(
                    config,
                    TicketConstants.expert_panel_team.mail_details
                        .autobotMailID,
                    TicketConstants.expert_panel_team.mail_details
                        .panelTechTeamMailID,
                    `TICKET ID:- ${ticketId} HAS BEEN ${action}`,
                    mailBody,
                );

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        } else if (entityType === 'BDA') {
            // bda actions
            if (action === 'ADDITIONAL_INFO_GIVEN_TICKET_CREATOR') {
                // Insert data into activity table
                // Update ticket status into ticket table
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };

                const status = 'PENDING';
                const promise = [];
                promise.push(
                    panelTicketsMysql.insertActionIntoActivity(
                        db.mysql.write,
                        activityObj,
                    ),
                );
                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        status,
                        ticketId,
                    ),
                );
                const results = await Promise.all(promise);

                MailUtility.sendMailViaSendGrid(
                    config,
                    TicketConstants.expert_panel_team.mail_details
                        .autobotMailID,
                    TicketConstants.expert_panel_team.mail_details
                        .panelTechTeamMailID,
                    `TICKET ID:- ${ticketId}`,
                    mailBody,
                );

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            } if (action === 'REOPEN') {
                // Insert data into activity table
                // Update ticket status into ticket table
                const activityObj = {
                    ticket_id: ticketId,
                    email_id: emailId,
                    entity_type: entityType,
                    action,
                    comments,
                    resource_url: resourceUrl,
                };

                const status = 'PENDING';
                const promise = [];
                promise.push(
                    panelTicketsMysql.insertActionIntoActivity(
                        db.mysql.write,
                        activityObj,
                    ),
                );
                promise.push(
                    panelTicketsMysql.updateStatusIntoTicket(
                        db.mysql.write,
                        status,
                        ticketId,
                    ),
                );
                const results = await Promise.all(promise);

                MailUtility.sendMailViaSendGrid(
                    config,
                    TicketConstants.expert_panel_team.mail_details
                        .autobotMailID,
                    TicketConstants.expert_panel_team.mail_details
                        .panelTechTeamMailID,
                    `TICKET ID:- ${ticketId} HAS BEEN ${action}`,
                    mailBody,
                );

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: results || null,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getTicketActions(req, res, next) {
    try {
        const db = req.app.get('db');
        const { entityType, emailId, ticketId } = req.query;
        const promise = [];
        const results = [];
        promise.push(panelTicketsMysql.fetchSingleTicket(db.mysql.read, ticketId));
        promise.push(panelTicketsMysql.fetchLastAssignedRow(db.mysql.read, ticketId));
        const [ticketDetails, lastAssigned] = await Promise.all(promise);
        if (entityType === 'SPOC') {
            if (ticketDetails[0].status === 'ASSIGNED') {
                const assignedSpocs = await panelTicketsMysql.fetchAssignedSpocUsingActivtyId(
                    db.mysql.read,
                    lastAssigned[0].id,
                );
                if (_.find(assignedSpocs, ['email_id', emailId])) {
                    results.push({ action: 'RESOLVE' });
                    results.push({
                        action: 'ADDITIONAL_INFO_REQUIRED_FEEDBACK',
                    });
                }
            } else if (ticketDetails[0].status === 'ADDITIONAL_INFO_REQUIRED_TICKET_CREATOR') {
                const ticketCreator = await panelTicketsMysql.fetchActivityByAction(
                    db.mysql.read,
                    ticketId,
                    'CREATE',
                );
                if (ticketCreator[0].email_id === emailId) {
                    results.push({
                        action: 'ADDITIONAL_INFO_GIVEN_TICKET_CREATOR',
                    });
                }
            } else if (ticketDetails[0].status === 'RESOLVED_BY_SPOC') {
                const promise1 = [];
                promise1.push(panelTicketsMysql.CheckActionUsingSpocEmail(
                    db.mysql.read,
                    ticketId,
                    emailId,
                    entityType,
                    lastAssigned[0].id,
                ));
                promise1.push(panelTicketsMysql.fetchAssignedSpocUsingActivtyId(
                    db.mysql.read,
                    lastAssigned[0].id,
                ));
                const [checkSpocResolvedStatus, assignedSpocs] = await Promise.all(promise1);
                console.log(checkSpocResolvedStatus);
                console.log(assignedSpocs);
                if (
                    checkSpocResolvedStatus.length === 0
                    && _.find(assignedSpocs, ['email_id', emailId])
                ) {
                    results.push({ action: 'RESOLVE' });
                }
            } else if (ticketDetails[0].status === 'RESOLVED') {
                // check if spoc is ticket creator: if yes then 48 hour query
                const ticketCreator = await panelTicketsMysql.fetchActivityByAction(
                    db.mysql.read,
                    ticketId,
                    'CREATE',
                );
                if (ticketCreator[0].email_id === emailId) {
                    // add(5, 'hours').add(30, 'minutes')
                    const diffInHours = moment().diff(
                        moment(ticketDetails[0].updated_at),
                        'hours',
                    );
                    if (diffInHours < 48) {
                        results.push({ action: 'REOPEN' });
                    }
                }
            }
        } else if (entityType === 'BDA') {
            if (ticketDetails[0].status === 'RESOLVED') {
                // check if bda is ticket creator: if yes then 48 hour query
                const ticketCreator = await panelTicketsMysql.fetchActivityByAction(
                    db.mysql.read,
                    ticketId,
                    'CREATE',
                );
                if (ticketCreator[0].email_id === emailId) {
                    // add(5, 'hours').add(30, 'minutes')
                    const diffInHours = moment().diff(
                        moment(ticketDetails[0].updated_at),
                        'hours',
                    );
                    if (diffInHours < 48) {
                        results.push({ action: 'REOPEN' });
                    }
                }
            } else if (ticketDetails[0].status === 'ADDITIONAL_INFO_REQUIRED_TICKET_CREATOR') {
                const ticketCreator = await panelTicketsMysql.fetchActivityByAction(
                    db.mysql.read,
                    ticketId,
                    'CREATE',
                );
                if (ticketCreator[0].email_id === emailId) {
                    results.push({
                        action: 'ADDITIONAL_INFO_GIVEN_TICKET_CREATOR',
                    });
                }
            }
        } else if (entityType === 'FEEDBACK') {
            if (ticketDetails[0].status === 'PENDING' || ticketDetails[0].status === 'REOPEN') {
                results.push({ action: 'RESOLVE' });
                results.push({ action: 'ASSIGN' });
                results.push({ action: 'ADDITIONAL_INFO_REQUIRED_TICKET_CREATOR' });
            } else if (ticketDetails[0].status === 'RESOLVED_BY_SPOC') {
                results.push({ action: 'RESOLVE' });
                results.push({ action: 'ASSIGN' });
            } else if (ticketDetails[0].status === 'ADDITIONAL_INFO_REQUIRED_FEEDBACK') {
                results.push({ action: 'RESOLVE' });
                results.push({ action: 'ADDITIONAL_INFO_REQUIRED_TICKET_CREATOR' });
                results.push({ action: 'ADDITIONAL_INFO_GIVEN_BY_FEEDBACK' });
            } else if (ticketDetails[0].status === 'ASSIGNED') {
                results.push({ action: 'RESOLVE' });
            } else if (ticketDetails[0].status === 'ADDITIONAL_INFO_REQUIRED_TICKET_CREATOR') {
                results.push({ action: 'RESOLVE' });
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: results || null,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    packageDetails,
    getCategories,
    getAllTickets,
    getSubCategories,
    createTicket,
    updateTicket,
    getSpocs,
    assignResolvedReOpen,
    getTicketDetails,
    getTicketActions,
};
