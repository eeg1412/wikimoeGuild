const playersCharacter = require("../models/players_character");

exports.save = async function (parmas) {
  // document作成
  const playersCharacterData = new playersCharacter(parmas);
  // document保存
  return await playersCharacterData.save();
};

exports.findOne = async function (parmas) {
  // document查询
  return await playersCharacter.findOne(parmas);
};
exports.find = async function (parmas) {
  // document查询
  return await playersCharacter.find(parmas);
};

exports.updateOne = async function (filters, parmas) {
  // document查询
  return await playersCharacter.updateOne(filters, parmas);
};
