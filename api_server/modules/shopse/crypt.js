const crypto = require('crypto');
const config = require('../../config/config');
const ALGO = 'aes-256-gcm';
const SECRET_KEY = config.SHOPSE.SECRET_KEY;
const IV_KEY  = config.SHOPSE.IV_KEY;

function encryptWithAES256GCM(msg) {
  key = Buffer.from(SECRET_KEY, 'base64');
  iv = Buffer.from(IV_KEY, "binary");

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = cipher.update(msg, 'utf8');
  const finalstr = cipher.final();
  const tag = cipher.getAuthTag();
  const res = Buffer.concat([encrypted, finalstr, tag]);
  return res.toString('base64');
}

function decryptAes256Gcm_1(encdata) {
  const encrypted_data_bytes = Buffer.from(encdata, 'base64');
  let secret_key = Buffer.from(SECRET_KEY, 'base64');

  let decipher = crypto.createDecipheriv('aes-256-gcm', secret_key, IV_KEY);
  let temp = encrypted_data_bytes.length-16;
  let auth_tag = encrypted_data_bytes.slice(temp);
  decipher.setAuthTag(auth_tag);

  let remaining_msg = encrypted_data_bytes.slice(0, temp);
  return decipher.update(remaining_msg, 'base64', 'utf8') + decipher.final('utf8');
}

module.exports.encrypt = encryptWithAES256GCM;
module.exports.decrypt = decryptAes256Gcm_1;
