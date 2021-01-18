var mongoose = require("mongoose");
var Schema = mongoose.Schema;
// Schema
var players_infos = new Schema({
  account: { type: Schema.Types.ObjectId, ref: "players_accounts" },
  nickName: String,
  guildName: String,
  worldLevel: { type: Number, default: 1 },
  diamond: { type: Number, default: 0 },
  money: { type: Number, default: 0 },
  guildPoint: { type: Number, default: 0 },
  characterCount: { type: Number, default: 0 }
});

module.exports = mongoose.model("players_infos", players_infos);
