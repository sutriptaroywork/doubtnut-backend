const passport = require('passport');
const passportJWT = require('passport-jwt');

const ExtractJWT = passportJWT.ExtractJwt;
const _ = require('lodash');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./config');
const Student = require('../modules/student');
const StudentContainer = require('../modules/containers/student');
const Utility = require('../modules/utility');

const JWTStrategy = passportJWT.Strategy;

function passportStrategy(db, redis) {
    passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.jwt_secret,
    },
    ((jwtPayload, cb) => StudentContainer.getById(jwtPayload.id, db)
        .then((user) => {
            console.log('user');
            console.log(user);
            user[0].isDropper = false;
            if (user[0].student_class === '13') {
                user[0].student_class = '12';
                user[0].isDropper = true;
            }
        })
        .catch((err) => {
            cb(err, null);
        }))));
}

function googleOAuthPassportStrategy(db, redis) {
    passport.use(new GoogleStrategy({
        clientID: config.social_logins.google.clientId,
        clientSecret: config.social_logins.google.clientSecret,
        callbackURL: '/v1/student/auth-google-callback',
        proxy: true,
    },
    (async (req, token, tokenSecret, profile, done) => {
        const userDetails = profile._json;
        const {
            email, given_name, family_name,
        } = userDetails;
        const emailExists = await Student.checkStudentByEmail(db.mysql.read, email);
        if (emailExists && emailExists.length) {
            const user = emailExists[0];
            done(null, {
                student_id: user.student_id,
                auth_client: 'GMAIL',
            });
        } else {
            const insert_student_obj = {};
            insert_student_obj.student_email = email;
            if (!_.isEmpty(given_name)) {
                insert_student_obj.student_fname = given_name;
            }
            if (_.isEmpty(family_name)) {
                insert_student_obj.student_lname = family_name;
            }
            const student_username = Utility.generateUsername(1);
            insert_student_obj.student_username = student_username;
            const insertedDetails = await Student.insertNewUser(db.mysql.write, insert_student_obj);
            const student_id = insertedDetails.insertId;
            done(null, {
                student_id,
                auth_client: 'GMAIL',
            });
        }
    })));
}

function facebookOAuthPassportStrategy(db, redis) {
    passport.use(new FacebookStrategy({
        clientID: config.social_logins.facebook.clientId,
        clientSecret: config.social_logins.facebook.clientSecret,
        callbackURL: '/v1/student/auth-facebook-callback',
        profileFields: ['id', 'emails', 'name'],
        proxy: true,
    },
    (async (req, token, tokenSecret, profile, done) => {
        const userDetails = profile._json;
        const {
            id, email, first_name, last_name,
        } = userDetails;
        const emailExists = await Student.checkStudentByEmail(db.mysql.read, email);
        if (emailExists && emailExists.length) {
            const user = emailExists[0];
            done(null, {
                student_id: user.student_id,
                auth_client: 'FACEBOOK',

            });
        } else {
            const insert_student_obj = {
                student_email: email,
            };
            if (!_.isEmpty(first_name)) {
                insert_student_obj.student_fname = first_name;
            }
            if (!_.isEmpty(last_name)) {
                insert_student_obj.student_lname = last_name;
            }
            if (!_.isEmpty(id)) {
                insert_student_obj.email_verification_code = id;
            }
            const student_username = Utility.generateUsername(1);
            insert_student_obj.student_username = student_username;
            const insertedDetails = await Student.insertNewUser(db.mysql.write, insert_student_obj);
            const student_id = insertedDetails.insertId;
            done(null, {
                student_id,
                auth_client: 'FACEBOOK',
            });
        }
    })));
}



module.exports = {
    passportStrategy,
    googleOAuthPassportStrategy,
    facebookOAuthPassportStrategy,
};
