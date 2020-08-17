const TelegramBot = require('node-telegram-bot-api');
const https = require("https");

const token = 'BOT-TOKEN';
const url = "https://criptoya.com/api/buenbit/dai/ars";
const bot = new TelegramBot(token, { polling: true });

let actualLimit = 128 // ARS
let evaluationPeriod = 1 // minutes
let tradingEvaluateIntervalId

function getPrice(callback) {
    https.get(url, res => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", data => {
            body += data;
        });
        res.on("end", () => {
            body = JSON.parse(body);
            let actualValue = body.totalAsk
            console.log(`Price: $${actualValue}`)
            return callback(actualValue);
        });
    });
}

function tradingEvaluate(chatId) {
    getPrice(function (actualPrice) {
        console.log(`Evaluate: Value: $${actualPrice} - Limit: $${actualLimit}`)
        if (actualPrice <= actualLimit) {
            console.log(`Buy now!! Value: $${actualPrice} - Limit: $${actualLimit}`)
            bot.sendMessage(chatId, `Buy now!! Value: $${actualPrice} - Limit: $${actualLimit}`)
        }
    })
}

bot.onText(/^\/start/, function (msg) {
    console.log(msg);
    var chatId = msg.chat.id;
    var username = msg.chat.first_name;
    bot.sendMessage(chatId, `Hi ${username}! my name is Buenbot. Nice to meet you!`);
});

bot.onText(/^\/price/, function (msg) {
    console.log(msg);
    var chatId = msg.chat.id;
    getPrice(function (price) {
        console.log(`Price: $${price}`)
        bot.sendMessage(chatId, `Price: $${price}`)
    })
});

bot.onText(/^\/config/, function (msg) {
    console.log(msg);
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, `Limit: $${actualLimit}, Period: ${evaluationPeriod} min`)
});

bot.on('message', function (msg) {
    console.log(msg);
    console.log(msg.text)
    let actionMsg = msg.text
    var chatId = msg.chat.id;

    var actions = actionMsg.split(':')
    var command = actions[0].trim().toLowerCase()

    if (command === 'init') {
        console.log(`Init trading price!`)
        bot.sendMessage(chatId, `Init trading price! Limit: $${actualLimit}, Period: ${evaluationPeriod} min`)
        tradingEvaluateIntervalId = setInterval(function () { tradingEvaluate(chatId); }, evaluationPeriod * 60000)
    }

    if (command === 'stop') {
        console.log(`Stop trading price!`)
        bot.sendMessage(chatId, `Stop trading price!`)
        clearInterval(tradingEvaluateIntervalId)
    }

    if (command === 'period') {
        let newEvaluationPeriod = actions[1]
        if(newEvaluationPeriod !== evaluationPeriod){
            evaluationPeriod = newEvaluationPeriod
            clearInterval(tradingEvaluateIntervalId)
            tradingEvaluateIntervalId = setInterval(function () { tradingEvaluate(chatId); }, evaluationPeriod * 60000)
        }
        console.log(`Period updated to ${newEvaluationPeriod} min!`)
        bot.sendMessage(chatId, `Period updated to ${newEvaluationPeriod} min!`)
    }

    if (command === 'limit') {
        let newLimit = actions[1]
        actualLimit = newLimit
        console.log(`Limit updated to $${newLimit}!`)
        bot.sendMessage(chatId, `Limit updated to $${newLimit}!`)
    }

});
