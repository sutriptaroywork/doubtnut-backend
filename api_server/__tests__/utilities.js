async function getTestToken(app) {
    const response1 = await app()
        .post('/v4/student/login')
        .type('form')
        .send({ phone_number: '4567887654' });
    const response2 = await app()
        .post('/v4/student/verify')
        .type('form')
        .send({
            otp: '1234',
            session_id: response1.body.data.session_id,
        });
    return response2.body.data.token;
}

module.exports = { getTestToken };
