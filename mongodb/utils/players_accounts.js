const playersAccounts = require('../models/players_accounts');

exports.save = async function (parmas) {
    // document作成
    const playersAccountsData = new playersAccounts(parmas);
    // document保存
    return await playersAccountsData.save()
}


exports.findOne = async function (parmas) {
    // document查询
    return await playersAccounts.findOne(parmas);
}

exports.updateOne = async function (filters, parmas) {
    // document查询
    return await playersAccounts.updateOne(filters, parmas);
}