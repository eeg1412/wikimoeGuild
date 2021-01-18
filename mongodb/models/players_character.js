var mongoose = require("mongoose");
var Schema = mongoose.Schema;
// Schema
var players_characters = new Schema({
  account: { type: Schema.Types.ObjectId, ref: "players_accounts" },
  name: String,//名字
  fullName: String,//全名
  explorationLevel: { type: Number, default: 1 },//探索等级
  manufacturingLevel: { type: Number, default: 1 },//制造等级
  cookingLevel: { type: Number, default: 1 },//料理等级
  battleLevel: { type: Number, default: 1 },//战斗等级
  attributePoints: { type: Number, default: 0 },//属性点
  powerLevel: { type: Number, default: 0 },//属性-力量-影响物理攻击
  constitutionLevel: { type: Number, default: 0 },//属性-体质-影响生命值
  intelligenceLevel: { type: Number, default: 0 },//属性-智力-影响魔法攻击
  agileLevel: { type: Number, default: 0 },//属性-敏捷-影响速度
});

module.exports = mongoose.model("players_characters", players_characters);
