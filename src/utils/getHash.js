var crypto = require('crypto');

module.exports = function (value, times=5000) {
  if (times <= 0) return "";

  for (let i = 0; i < times; i++) {
      let hashCreator = crypto.createHash('sha256');
      value = hashCreator.update(value).digest('hex');
  }

  return value;
}
