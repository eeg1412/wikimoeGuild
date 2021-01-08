//检查密码格式
exports.passwordCheck = function(password) {
  return /^[\w_-]{4,16}$/.test(password); //4-16位英数字下划线减号
};
//检查密码格式
exports.accountCheck = function(account) {
  return /^[\w_-]{2,16}$/.test(account); //2-16位英数字下划线减号
};
//检查昵称格式
exports.nickNameCheck = function(nickName) {
  return /^[\u4E00-\u9FA5\u0800-\u4e00A-Za-z0-9_]{2,8}$/.test(nickName); //2-8位中文、日文、英文、数字包括下划线
};
