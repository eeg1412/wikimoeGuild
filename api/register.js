const playersAccountsUtils = require("../mongodb/utils/players_accounts");
const playersInfosUtils = require("../mongodb/utils/players_infos");
const utils = require("../utils/utils");
const chalk = require("chalk");
const md5 = require("md5");
var jwt = require("jsonwebtoken");
const fs = require("fs");

module.exports = async function (req, res, next) {
  const password = req.body.password || "";
  const account = req.body.account || "";
  const nickName = req.body.nickName || "";
  const guildName = req.body.guildName || "";
  const accountTx = req.body.accountTx || "";
  const guildIcon = req.body.guildIcon || "";
  const captcha = req.body.captcha || "";
  const IP = utils.getUserIp(req);
  //   校验验证码
  if (req.session.captcha != captcha || !captcha) {
    req.session.destroy(err => {
      if (err) {
        console.info(chalk.red(IP + "验证码清理失败" + "，" + err));
      }
    });
    res.send({
      code: 0,
      msg: "验证码有误！"
    });
    return false;
  }

  //   校验格式
  if (!utils.accountCheck(account)) {
    res.send({
      code: 0,
      msg: "请输入2-16位英数字下划线减号的账号！"
    });
    return false;
  }
  if (!utils.passwordCheck(password)) {
    res.send({
      code: 0,
      msg: "请输入4-16位英数字下划线减号的密码！"
    });
    return false;
  }
  if (!utils.nickNameCheck(nickName)) {
    res.send({
      code: 0,
      msg: "请输2-8位中文、日文、英文、数字包括下划线的昵称！"
    });
    return false;
  }
  if (!utils.nickNameCheck(guildName)) {
    res.send({
      code: 0,
      msg: "请输入2-8位中文、日文、英文、数字包括下划线的公会名称！"
    });
    return false;
  }

  const jpgReg = new RegExp("data:image/jpeg;base64,");
  if (!jpgReg.test(accountTx)) {
    res.send({
      code: 0,
      msg: "图片上传失败！"
    });
    return false;
  }
  if (!jpgReg.test(guildIcon)) {
    res.send({
      code: 0,
      msg: "图片上传失败！"
    });
    return false;
  }
  //   查询账号、会长昵称、公会名称是否存在
  let accountErrorMsg = [];
  const searchParams = {
    account: account
  };
  const searchPlayerAccountData = await playersAccountsUtils.findOne(
    searchParams
  );
  if (searchPlayerAccountData) {
    accountErrorMsg.push("账号已存在");
  }
  const searchInfoParams = {
    $or: [{ nickName: nickName }, { guildName: guildName }]
  };
  const searchPlayerAccountInfoData = await playersInfosUtils.findOne(
    searchInfoParams
  );
  if (searchPlayerAccountInfoData) {
    if (searchPlayerAccountInfoData.nickName === nickName) {
      accountErrorMsg.push("会长昵称已存在");
    }
    if (searchPlayerAccountInfoData.guildName === guildName) {
      accountErrorMsg.push("公会名称已存在");
    }
  }
  if (accountErrorMsg.length > 0) {
    res.send({
      code: 0,
      msg: accountErrorMsg.join("、") + "！"
    });
    return false;
  }
  // 发行token
  let content = { account: account }; // 要生成token的主题信息
  let secretOrPrivateKey = process.env.JWT_SECRET_KEY || "wikimoeGuild"; // 这是加密的key（密钥）
  let remTime = 60 * 60 * 24;
  let token = jwt.sign(content, secretOrPrivateKey, {
    expiresIn: remTime
  });
  //   录入账号数据库
  const accountInsertData = {
    account: account,
    password: md5(password),
    token: token,
    IP: IP
  };
  const newPlayerAccount = await playersAccountsUtils.save(accountInsertData);
  // 录入账号信息数据库
  const infoInsterData = {
    account: newPlayerAccount._id,
    nickName: nickName,
    guildName: guildName
  };
  await playersInfosUtils.save(infoInsterData);
  // 写入头像文件
  const accountTxData = accountTx.replace(/^data:image\/jpeg;base64,/, "");
  fs.writeFileSync(
    `./client/accountTx/${newPlayerAccount._id}.jpg`,
    accountTxData,
    "base64"
  );
  const guildIconData = guildIcon.replace(/^data:image\/jpeg;base64,/, "");
  fs.writeFileSync(
    `./client/guildIcon/${newPlayerAccount._id}.jpg`,
    guildIconData,
    "base64"
  );
  res.send({
    code: 1,
    msg: "注册成功！",
    token: token
  });
};
