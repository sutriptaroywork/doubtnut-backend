function getResourceByResourceReference(client, resourceReference) {
    return client.getAsync(`course_homework_${resourceReference}`);
}
function setResourceByResourceReference(client, resourceReference, data) {
    return client.setAsync(`course_homework_${resourceReference}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 30);
}
function setAssortmentsByResourceReference(client, resourceReference, data) {
    return client.setAsync(`course_assortment_resource_${resourceReference}`, JSON.stringify(data), 'Ex', 60 * 60);
}

function getAssortmentsByResourceReference(client, resourceReference) {
    return client.getAsync(`course_assortment_resource_${resourceReference}`);
}
function setCheckPushed(client, studentID, questionID, data) {
    return client.setAsync(`course_homework_push_${studentID}_${questionID}`, JSON.stringify(data), 'Ex', 60 * 60);
}

function checkPushed(client, studentID, questionID) {
    return client.getAsync(`course_homework_push_${studentID}_${questionID}`);
}
function setWhatsappOptinSource(client, mobile, data) {
    return client.setAsync(`course_homework_wa_${mobile}`, JSON.stringify(data), 'Ex', 60 * 60 * 6);
}

function getWhatsappOptinSource(client, mobile) {
    return client.getAsync(`course_homework_wa_${mobile}`);
}
module.exports = {
    getResourceByResourceReference,
    setResourceByResourceReference,
    setAssortmentsByResourceReference,
    getAssortmentsByResourceReference,
    setCheckPushed,
    checkPushed,
    getWhatsappOptinSource,
    setWhatsappOptinSource,
};
