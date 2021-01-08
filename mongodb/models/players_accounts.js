var mongoose = require("mongoose");
var Schema = mongoose.Schema;
// Schema
var players_accounts = new Schema({
  account: String,
  password: String,
  token: String,
  IP: String,
  creatDate: {
    type: Date,
    default: Date.now
  } //录入时间
});

module.exports = mongoose.model("players_accounts", players_accounts);
