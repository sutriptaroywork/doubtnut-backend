module.exports = {
    testingNumbers: ['4567887654', '4567887653'],
    responses: {
        invalidPhoneNumber: {
            meta: {
                code: 401,
                success: false,
                message: 'Wrong mobile Number',
            },
            data: {
                status: 'FAILURE',
                session_id: false,
            },
        },
        maxLimitReached: {
            meta: {
                code: 401,
                success: false,
                message: 'Too many OTP Requests',
            },
            data: {
                status: 'FAILURE',
                session_id: false,
            },
        },
    },
};
