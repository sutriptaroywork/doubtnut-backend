const expressGraphql = require('express-graphql');
const { buildSchema } = require('graphql');
const bl = require('./camera.bl');

const getCameraSettingsSchema = buildSchema(`
    type CameraButtonHint {
        durationSec: Int,
        content: [String]
    },
    type BottomOverlayInfo {
        title: String,
        content: String,
        imageUrl: String
    },
    type BottomOverlaySubjectList {
        subject: String,
        imageUrl: String
    },
    type BottomOverlay {
        info: BottomOverlayInfo,
        subjectList(studentClass: Int!): [BottomOverlaySubjectList]
    },
    type Query {
        cameraButtonHint(openCount: Int!): CameraButtonHint
        bottomOverlay: BottomOverlay
    }
`);

function getCameraSettings() {
    return expressGraphql((req) => ({
        schema: getCameraSettingsSchema,
        context: { user: req.user, app: req.app },
        rootValue: {
            cameraButtonHint: bl.getCameraButtonHint,
            bottomOverlay: {
                info: bl.getCameraBottomOverlayInfo,
                subjectList: bl.getCameraBottomOverlaySubjectList,
            },
        },
        customFormatErrorFn: (err) => {
            console.error(err);
            return { message: err.message, statusCode: 403 };
        },
        graphiql: true,
    }));
}

module.exports = {
    getCameraSettings,
};
