const { v4: uuid } = require('uuid');
const { matchers } = require('jest-json-schema');
const { getExpressApp } = require('./app');
const schema = require('./schemas/login');
const StudentRedis = require('../modules/redis/student');
const StudentMySQL = require('../modules/mysql/student');
const Constants = require('../modules/constants');
const validator = require('validator');
const Utility = require('../modules/utility');
const PhoneUtility = require('../modules/Utility.phone');
const IPUtility = require('../modules/Utility.IP');
const OtpFactory = require('../server/helpers/otpfactory/otpfactoryservices.helper');
expect.extend(matchers);

const TEST_OTP = '1234';
const TEST_PHONE_NUMBER = '4567887654';
const REGISTER_TEST_PHONE = '9336077125';
const TEST_EMAIL = "bp@yopmail.com";

describe('Test login endpoints', () => {
    let app;

    beforeAll(async () => {
        app = await getExpressApp();
    });

    test('/v4/student/login - GET request', async () => {
        const response = await app().get('/v4/student/login');
        expect(response.status).toBe(404);
    });

    test('/v4/student/login - empty request', async () => {
        const response = await app().post('/student/login');
        expect(response.status).toBe(404);
    });

    test('/v4/student/login - invalid number', async () => {
        const response = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: '98765' });
        expect(response.status).toBe(401);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Wrong mobile Number');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.status).toBe('FAILURE');
        expect(response.body.data.session_id).toBeDefined();
        expect(response.body.data.session_id).toBe(false);
    });

    test('/v4/student/login with', async () => {
        const response = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: TEST_PHONE_NUMBER });
        expect(response.status).toBe(200);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Otp is sent, Please verify');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.status).toBe('Success');
        expect(response.body.data.session_id).toBeDefined();
        expect(response.body.data.pin_exists).toBeDefined();
        expect(response.body.data.otp_over_call).toBeDefined();
        expect(response.body.data.expires_in).toBeDefined();
        expect(response.body.data.expires_in).toBe(120);
    });

    test('mock wrong_otp_count method', async () => {
        const loginResponse = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: TEST_PHONE_NUMBER });

        const mock1 = jest.spyOn(StudentRedis, 'getWrongOTPCount')
            .mockImplementationOnce(() => 3);

        const mock2 = jest.spyOn(Constants, 'getWrongOTPMaxLimit')
            .mockImplementationOnce(() => 2);

        const verifyResponse = await app()
            .post('/v4/student/verify')
            .type('form')
            .send({
                otp: TEST_OTP,
                session_id: loginResponse.body.data.session_id,
            });
        expect(verifyResponse.status).toBe(401);
        expect(verifyResponse.body.meta).toBeDefined();
        expect(verifyResponse.body.meta.code).toBeDefined();
        expect(verifyResponse.body.meta.code).toBe(401);
        expect(verifyResponse.body.meta.success).toBeDefined();
        expect(verifyResponse.body.meta.success).toBe(false);
        expect(verifyResponse.body.meta.message).toBeDefined();
        expect(verifyResponse.body.meta.message).toBe('You have entered Wrong OTP more than 5 times. User Blocked.');
        expect(verifyResponse.body.data).toBeDefined();
        expect(verifyResponse.body.data.status).toBeDefined();
        expect(verifyResponse.body.data.status).toBe('FAILURE');
        expect(verifyResponse.body.data.session_id).toBeDefined();
        expect(verifyResponse.body.data.session_id).toBe(false);
        expect(mock1).toBeCalled();
        expect(mock2).toBeCalled();
    });

    test('mock get_pin_blocked_user_redis_data to return id is blocked', async () => {
        const loginResponse = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: TEST_PHONE_NUMBER });

        const mock1 = jest.spyOn(StudentMySQL, 'getAllStudentsByPhoneGlobally')
            .mockImplementationOnce(() => [
                {
                    student_id: 152948727,
                    gcm_reg_id: 11,
                    gaid: 1234,
                    mobile: '4567887654',
                    udid: '',
                }
            ]);

        const mock2 = jest.spyOn(StudentRedis, 'getPinBlockedUserRedisData')
            .mockImplementationOnce(() => 1);

        const verifyResponse = await app()
            .post('/v4/student/verify')
            .type('form')
            .send({
                otp: TEST_OTP,
                session_id: loginResponse.body.data.session_id,
                pin_inserted: true,
                pin: 1,
            });
        expect(verifyResponse.status).toBe(404);
        expect(verifyResponse.body.meta).toBeDefined();
        expect(verifyResponse.body.meta.code).toBeDefined();
        expect(verifyResponse.body.meta.code).toBe(404);
        expect(verifyResponse.body.meta.success).toBeDefined();
        expect(verifyResponse.body.meta.success).toBe(false);
        expect(verifyResponse.body.meta.message).toBeDefined();
        expect(verifyResponse.body.meta.message).toBe('Your id is blocked for DN Pin login currently. Please try via any other method.');
        expect(verifyResponse.body.data).toBeDefined();
        expect(verifyResponse.body.data.message).toBeDefined();
        expect(verifyResponse.body.data.message).toBe('Blocked User');
        expect(mock1).toBeCalled();
        expect(mock2).toBeCalled();
    });

    test('mock get_pin_blocked_user_redis_data to return pin not matched', async () => {
        const loginResponse = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: TEST_PHONE_NUMBER });

        const mock1 = jest.spyOn(StudentMySQL, 'getAllStudentsByPhoneGlobally')
            .mockImplementationOnce(() => [
                {
                    student_id: 152948727,
                    gcm_reg_id: 11,
                    gaid: 1234,
                    mobile: '4567887654',
                    udid: '',
                }
            ]);

        const mock2 = jest.spyOn(StudentRedis, 'getPinBlockedUserRedisData')
            .mockImplementationOnce(() => 0);

        const verifyResponse = await app()
            .post('/v4/student/verify')
            .type('form')
            .send({
                otp: TEST_OTP,
                session_id: loginResponse.body.data.session_id,
                pin_inserted: true,
                pin: 1,
            });
        expect(verifyResponse.status).toBe(404);
        expect(verifyResponse.body.meta).toBeDefined();
        expect(verifyResponse.body.meta.code).toBeDefined();
        expect(verifyResponse.body.meta.code).toBe(404);
        expect(verifyResponse.body.meta.success).toBeDefined();
        expect(verifyResponse.body.meta.success).toBe(false);
        expect(verifyResponse.body.meta.message).toBeDefined();
        expect(verifyResponse.body.meta.message).toBe('Pin Not Found');
        expect(verifyResponse.body.data).toBeDefined();
        expect(verifyResponse.body.data.message).toBeDefined();
        expect(verifyResponse.body.data.message).toBe('Pin Not Exists');
        expect(mock1).toBeCalled();
        expect(mock2).toBeCalled();
    });

    test('/v4/student/login course undefined with class - validator mock', async () => {

        const mock1 = jest.spyOn(validator, 'isUUID')
            .mockImplementationOnce(() => {
                return true
            });

        const response = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: TEST_PHONE_NUMBER, class: '14', udid: "5f465e9c58ce472e" });
        expect(mock1).toBeCalled();
        expect(response.status).toBe(200);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Otp is sent, Please verify');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.status).toBe('Success');
        expect(response.body.data.session_id).toBeDefined();
        expect(response.body.data.pin_exists).toBeDefined();
        expect(response.body.data.otp_over_call).toBeDefined();
        expect(response.body.data.expires_in).toBeDefined();
        expect(response.body.data.expires_in).toBe(120);
    });
    test('/v4/student/login course undefined with class - with udid', async () => {
        const response = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: TEST_PHONE_NUMBER, class: '14', udid: "5f465e9c58ce472e" });
        expect(response.status).toBe(200);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Otp is sent, Please verify');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.status).toBe('Success');
        expect(response.body.data.session_id).toBeDefined();
        expect(response.body.data.pin_exists).toBeDefined();
        expect(response.body.data.otp_over_call).toBeDefined();
        expect(response.body.data.expires_in).toBeDefined();
        expect(response.body.data.expires_in).toBe(120);
    });

    test('/v4/student/login course undefined - login condition 4567887653', async () => {
        const response = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: '4567887653', class: '14', udid: "5f465e9c58ce472e" });
        expect(response.status).toBe(200);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Otp is sent, Please verify');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.status).toBe('Success');
        expect(response.body.data.session_id).toBeDefined();
        expect(response.body.data.pin_exists).toBeDefined();
        expect(response.body.data.otp_over_call).toBeDefined();
        expect(response.body.data.expires_in).toBeDefined();
        expect(response.body.data.expires_in).toBe(120);
    });

    test('/v4/student/login Login with US phone', async () => {
        const response = await app()
            .post('/v4/student/login')
            .set('country', 'us')
            .type('form')
            .send({ phone_number: '4567887653', class: '14', udid: "5f465e9c58ce472e" });
        expect(response.status).toBe(200);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Otp is sent, Please verify');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.status).toBe('Success');
        expect(response.body.data.session_id).toBeDefined();
        expect(response.body.data.pin_exists).toBeDefined();
        expect(response.body.data.otp_over_call).toBeDefined();
        expect(response.body.data.expires_in).toBeDefined();
        expect(response.body.data.expires_in).toBe(120);
    });
    test('/v4/student/login with email US region test number otp service false', async () => {


        const mock2 = jest.spyOn(OtpFactory, 'otpServices')
            .mockImplementationOnce(() => {
                return false
            });

        const response = await app()
            .post('/v4/student/login')
            .set('country', 'us')
            .type('form')
            .send({ login_method: 'email_id', email: TEST_EMAIL, phone_number: REGISTER_TEST_PHONE, class: '14', udid: "5f465e9c58ce472e" });
        expect(mock2).toBeCalled();
        expect(response.status).toBe(401);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Too many OTP Requests');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('FAILURE');
    });

    test('/v4/student/login course undefined - class 14 real ph number -limit reached', async () => {

        const mock1 = jest.spyOn(IPUtility, 'hasReachedLimit')
            .mockImplementationOnce(() => {
                return true
            });

        const mock2 = jest.spyOn(IPUtility, 'maxLimitReached')
            .mockImplementationOnce(() => {
                return {
                    meta: {
                        code: 401,
                        success: false,
                        message: 'Too many OTP Requests',
                    },
                    data: {
                        status: 'FAILURE',
                        session_id: false,
                    },
                };
            });

        const response = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: REGISTER_TEST_PHONE, class: '14', udid: "5f465e9c58ce472e" });
        expect(mock1).toBeCalled();
        expect(mock2).toBeCalled();
        expect(response.status).toBe(401);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Too many OTP Requests');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('FAILURE');
    });

    test('/v4/student/verify - GET request', async () => {
        const response = await app().get('/v4/student/verify');
        expect(response.status).toBe(404);
    });

    test('/v4/student/verify - empty request', async () => {
        const response = await app().post('/v4/student/verify');
        expect(response.status).toBe(400);
    });

    test('/v4/student/verify - expired OTP', async () => {
        const response = await app()
            .post('/v4/student/verify')
            .type('form')
            .send({
                otp: TEST_OTP,
                session_id: `${TEST_PHONE_NUMBER}1:${uuid()}`,
            });
        expect(response.status).toBe(401);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('OTP expired');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.status).toBe('FAILURE');
        expect(response.body.data.session_id).toBeDefined();
        expect(response.body.data.session_id).toBe(false);
    });

    test('/v4/student/verify', async () => {
        const response1 = await app()
            .post('/v4/student/login')
            .type('form')
            .send({ phone_number: TEST_PHONE_NUMBER });
        const response2 = await app()
            .post('/v4/student/verify')
            .type('form')
            .send({
                otp: TEST_OTP,
                session_id: response1.body.data.session_id,
            });
        expect(response2.status).toBe(200);
        expect(response2.body.meta.code).toBe(200);
        expect(response2.body.meta.success).toBe(true);
        expect(response2.body.meta.message).toBe('User registered');
        expect(response2.body.data.onboarding_video).toMatch(/^(https)/);
        expect(response2.body.data.intro.length).toBe(2);
        expect(response2.body).toMatchSchema(schema);
    });
});