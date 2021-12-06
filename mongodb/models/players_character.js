var mongoose = require("mongoose");
var Schema = mongoose.Schema;
// Schema
var players_characters = new Schema({
  account: { type: Schema.Types.ObjectId, ref: "players_accounts" },
  name: String, //名字
  fullName: String, //全名
  status: { type: Number, default: 0 },
  powerCage: {
    type: Number,
    default: Number(process.env.DEFAULT_MAX_POWER_CAGE) || 96000
  },
  STRLV: { type: Number, default: 1 },
  STREXP: { type: Number, default: 0 },
  MAGLV: { type: Number, default: 1 },
  MAGEXP: { type: Number, default: 0 },
  SPDLV: { type: Number, default: 1 },
  SPDEXP: { type: Number, default: 0 },
  HPLV: { type: Number, default: 1 },
  HPEXP: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  EXP: { type: Number, default: 0 },
  weapon: { type: Schema.Types.ObjectId, ref: "players_weapons" },
  armor: { type: Schema.Types.ObjectId, ref: "players_armors" },
  accessory: { type: Schema.Types.ObjectId, ref: "players_accessory" },
  creatDate: {
    type: Date,
    default: Date.now
  } //录入时间
});

module.exports = mongoose.model("players_characters", players_characters);
