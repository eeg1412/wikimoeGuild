//检查密码格式
exports.passwordCheck = function(password) {
  return /^[\w_-]{4,16}$/.test(password); //4-16位英数字下划线减号
};
//检查账号格式
exports.accountCheck = function(account) {
  return /^[\w_-]{2,16}$/.test(account); //2-16位英数字下划线减号
};
//检查昵称格式
exports.nickNameCheck = function(nickName) {
  const textLength = String(nickName).length;
  return textLength >= 2 && textLength <= 12; //2-12
};
