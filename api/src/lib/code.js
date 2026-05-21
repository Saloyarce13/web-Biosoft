const crypto = require('crypto');

const generateNumericCode = (length = 6) => {
  if (length < 4) throw new Error('length demasiado corto');
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  return String(Math.floor(Math.random() * (max - min)) + min);
};

const hashCodeSha256 = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

module.exports = { generateNumericCode, hashCodeSha256 };

