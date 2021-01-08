const playersInfos = require("../models/players_infos");

exports.save = async function (parmas) {
  // document作成
  const playersInfosData = new playersInfos(parmas);
  // document保存
  return await playersInfosData.save();
};

exports.findOne = async function (parmas) {
  // document查询
  return await playersInfos.findOne(parmas);
};

exports.updateOne = async function (filters, parmas) {
  // document查询
  return await playersInfos.updateOne(filters, parmas);
};
