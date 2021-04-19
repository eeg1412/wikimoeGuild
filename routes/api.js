var express = require("express");
var router = express.Router();

var apiReg = require("../api/register");
var apiLogin = require("../api/login");
const apiCaptcha = require("../api/captcha");
const apiGetPlayerInfo = require("../api/getPlayerInfo");

// post
router.post("/register", apiReg);
router.post("/login", apiLogin);

// get
router.get("/captcha", apiCaptcha);
router.get("/getPlayerInfo", apiGetPlayerInfo);

module.exports = router;
