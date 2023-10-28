const jsrsasign = require('jsrsasign');
const crypto = require('crypto');
const { pki } = require('node-forge');

const gsr2 = 'MIIDujCCAqKgAwIBAgILBAAAAAABD4Ym5g0wDQYJKoZIhvcNAQEFBQAwTDEgMB4GA1UECxMXR2xvYmFsU2lnbiBSb290IENBIC0gUjIxEzARBgNVBAoTCkdsb2JhbFNpZ24xEzARBgNVBAMTCkdsb2JhbFNpZ24wHhcNMDYxMjE1MDgwMDAwWhcNMjExMjE1MDgwMDAwWjBMMSAwHgYDVQQLExdHbG9iYWxTaWduIFJvb3QgQ0EgLSBSMjETMBEGA1UEChMKR2xvYmFsU2lnbjETMBEGA1UEAxMKR2xvYmFsU2lnbjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKbPJA6+Lm8omUVCxKs+IVSbC9N/hHD6ErPLv4dfxn+G07IwXNb9rfF73OX4YJYJkhD10FPe+3t+c4isUoh7SqbKSaZeqKeMWhG8eoLrvozps6yWJQeXSpkqBy+0Hne/ig+1AnwblrjFuTosvNYSuetZfeLQBoZfXklqtTleiDTsvHgMCJiEbKjNS7SgfQx5TfC4LcshytVsW33hoCmEofnTlEnLJGKRILzdC9XZzPnqJworc5HGnRusyMvo4KD0L5CLTfuwNhv2GXqF4G3yYROIXJ/gkwpRl4pazq+r1feqCapgvdzZX99yqWATXgAByUr6P6TqBwMhAo6CygPCm48CAwEAAaOBnDCBmTAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUm+IHV2ccHsBqBt5ZtJot39wZhi4wNgYDVR0fBC8wLTAroCmgJ4YlaHR0cDovL2NybC5nbG9iYWxzaWduLm5ldC9yb290LXIyLmNybDAfBgNVHSMEGDAWgBSb4gdXZxwewGoG3lm0mi3f3BmGLjANBgkqhkiG9w0BAQUFAAOCAQEAmYFThxxol4aR7OBKuEQLq4GsJ0/WwbgcQ3izDJr86iw8bmEbTUsp9Z8FHSbBuOmDAGJFtqkIk7mpM0sYmsL4h4hO291xNBrBVNpGP+DTKqttVCL1OmLNIG+6KYnX3ZHu01yiPqFbQfXf5WRDLenVOavSot+3i9DAgBkcRcAtjOj4LaR0VknFBbVPFd5uRHg5h6h+u/N5GJG79G+dwfCMNYxdAfvDbbnvRG15RjF+Cv6pgsH/76tuIMRQyV+dTZsXjAzlAcmgQWpzU/qlULRuJQ/7TBj0/VLZjmmx6BEP3ojY+x1J96relc8geMJgEtslQIxq/H5COEBkEveegeGTLg==';

function getCert(cert) {
    let pemcert = '';
    for (let i = 0; i < cert.length; i += 64) {
        pemcert += `${cert.slice(i, i + 64)}\n`;
    }
    return `-----BEGIN CERTIFICATE-----\n${pemcert}-----END CERTIFICATE-----`;
}

const gsr2Reformatted = getCert(gsr2);
const rootCert = pki.certificateFromPem(gsr2Reformatted);
const caStore = pki.createCaStore([rootCert]);

function verifyPayload(udid, payload) {
    // 5. now we can validate the payload
    const [nonceUdid] = Buffer.from(payload.nonce, 'base64').toString('utf8').split('::');
    if (udid !== nonceUdid) {
        throw new Error('UDID mismatch');
    }
    // TODO check the timestampMs, to be within certain time say 1 hour - to consider UTC vs IST
    if (payload.apkPackageName !== 'com.doubtnutapp') {
        throw new Error('Bad source app');
    }
    // TODO check apkCertificateDigestSha256 to be from your app
    // console.log(Buffer.from(certificateToSha256DigestHex(cert).replace(/:/g, '').toLowerCase()).toString('base64'));
    // console.log(payload);
    // finally you can trust the ctsProfileMatch - true/false depending on strict security need and basicIntegrity - true, minimum to check
    if (!payload.ctsProfileMatch || !payload.basicIntegrity) {
        throw new Error('Basic integrity fail');
    }
}

// this function takes your signing certificate(should be of the form '----BEGIN CERT....data...---END CERT...') and converts into the SHA256 digest in hex, which looks like - 92:8H:N9:84:YT:94:8N.....
// we need to convert this hex digest to base64
// 1. 92:8H:N9:84:YT:94:8N.....
// 2. 928hn984yt948n - remove the colon and toLowerCase
// 3. encode it in base64
// function certificateToSha256DigestHex(certPem) {
//     const cert = pki.certificateFromPem(certPem);
//     const der = forge.asn1.toDer(pki.certificateToAsn1(cert)).getBytes();
//     const m = forge.md.sha256.create();
//     m.start();
//     m.update(der);
//     const fingerprint = m.digest()
//         .toHex()
//         .match(/.{2}/g)
//         .join(':')
//         .toUpperCase();

//     return fingerprint;
// }

function verifyChaining(x5cArray) {
    const certs = x5cArray.map((cert) => pki.certificateFromPem(cert));
    // 4. to be sure if the certificate we used to verify the signature is the valid one, we should validate the certificate chain
    // NOTE: this pki implementation does not check for certificate revocation list, which is something that you'll need to do separately
    const isChainValid = pki.verifyCertificateChain(caStore, certs);
    if (!isChainValid) {
        throw new Error('Cert chain not valid');
    }
}

function verifySignature(jwsParts, x5cArray) {
    const signature = jwsParts[2];
    const signatureBaseBuffer = Buffer.from(`${jwsParts[0]}.${jwsParts[1]}`);
    const certificate = x5cArray[0];
    const signatureBuffer = Buffer.from(signature, 'base64');
    const signatureIsValid = crypto.createVerify('sha256').update(signatureBaseBuffer).verify(certificate, signatureBuffer);
    if (!signatureIsValid) throw new Error('Failed to verify the signature!');
}

function getCertificateSubject(certificate) {
    const subjectCert = new jsrsasign.X509();
    subjectCert.readCertPEM(certificate);

    const subjectString = subjectCert.getSubjectString();
    const subjectFields = subjectString.slice(1).split('/');

    const fields = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const field of subjectFields) {
        const kv = field.split('=');
        fields[kv[0]] = kv[1];
    }
    return fields;
}

function validateCertificatePath(certificates) {
    if ((new Set(certificates)).size !== certificates.length) throw new Error('Failed to validate certificates path! Duplicate certificates detected!');

    for (let i = 0; i < certificates.length; i++) {
        const subjectPem = certificates[i];
        const subjectCert = new jsrsasign.X509();
        subjectCert.readCertPEM(subjectPem);

        let issuerPem = '';
        if (i + 1 >= certificates.length) {
            issuerPem = subjectPem;
        } else {
            issuerPem = certificates[i + 1];
        }

        const issuerCert = new jsrsasign.X509();
        issuerCert.readCertPEM(issuerPem);

        if (subjectCert.getIssuerString() !== issuerCert.getSubjectString()) throw new Error('Failed to validate certificate path! Issuers dont match!');

        const subjectCertStruct = jsrsasign.ASN1HEX.getTLVbyList(subjectCert.hex, 0, [0]);
        const algorithm = subjectCert.getSignatureAlgorithmField();
        const signatureHex = subjectCert.getSignatureValueHex();

        const signature = new jsrsasign.crypto.Signature({ alg: algorithm });
        signature.init(issuerPem);
        signature.updateHex(subjectCertStruct);

        if (!signature.verify(signatureHex)) throw new Error('Failed to validate certificate path!');
    }
    return true;
}
function verifyHeader(x5cArray) {
    const certToVerify = x5cArray[0];
    if (getCertificateSubject(certToVerify).CN !== 'attest.android.com') throw new Error('The common name is not set to "attest.android.com"!');
    validateCertificatePath(x5cArray);
}

function verifyAttestation(udid, signedAttestation) {
    try {
        // 1. decode the jws
        const jwsParts = signedAttestation.split('.');
        const header = JSON.parse(base64url.decode(jwsParts[0]));
        const payload = JSON.parse(base64url.decode(jwsParts[1]));

        const x5cArray = header.x5c.concat([gsr2]).map((cert) => getCert(cert));

        verifyHeader(x5cArray);

        verifySignature(jwsParts, x5cArray);

        verifyChaining(x5cArray);

        verifyPayload(udid, payload);
        return true;
    } catch (e) {
        console.error(e);
    }
}

module.exports = {
    verifyAttestation,
};
