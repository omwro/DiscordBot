var Discord = require('discord.io');
var fs = require("fs");
var logger = require('winston');
var auth = require('./auth.json');
var Hirez = require('hirez.js');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

var hirez = new Hirez({
    devId: auth.HiRez_devId,
    authKey: auth.HiRez_authKey
});

// Message when running the server
bot.on('ready', function (evt) {
    console.log("The Omer Discord Bot is now RUNNING");
});

// Triggered on message commands
bot.on('message', function (user, userID, channelID, message, evt) {
    command = message.toLowerCase(); // Converts it all lower case
    prefix = "."; // The first letter of the message to be called
    if (command.startsWith(prefix)) { // Checks of the message starts with the prefix
        cmd = command.substr(1); // removing the prefix from the message for easier read
        try { // Trying if it does perform the the commands without any issues
            if (cmd == "help") { // The help message with command information
                msg = "Commands for this bot:\n\n" +
                    "Minigames: \n" +
                    "\`.minigame rock\` / \`.minigame paper\` / \`.minigame scissor\`\n\n" +
                    "Random Games Selector:\n" +
                    "\`.games random\`\n" +
                    "\`.games show\`\n" +
                    "\`.games add [game name]\`\n" +
                    "\`.games remove [game id]\`\n\n" +
                    "Smite Commands:\n" +
                    "\`.smite random god\`\n" +
                    "\`.smite show gods\`\n\n" +
                    "Thanks for using this bot.\n" +
                    "Feel feel to ask me anything";
                bot.sendMessage({
                    to: channelID,
                    message: msg
                });
            } else if (cmd.startsWith("minigame")) { // If the message request to play a minigame
                minigameName = cmd.split(" ")[1]; // Get the minigame name
                sps = ["rock", "paper", "sciccor"]; // The Steen, Papier, Schaar possibilities
                if (sps.includes(minigameName)) {
                    bot.sendMessage({
                        to: channelID,
                        message: sps[Math.floor(Math.random() * sps.length)] // Select a Random possibility
                    });
                }
            } else if (cmd.startsWith("games")) {
                gamefunction = cmd.split(" ")[1]; // Get the minigame name
                if (gamefunction === "random") {
                    var gamelist = JSON.parse(fs.readFileSync("./games.json", "utf8"));
                    bot.sendMessage({
                        to: channelID,
                        message: "The random game is " + gamelist[Math.floor(Math.random() * gamelist.length)]
                    });
                } else if (gamefunction === "show") {
                    var gamelist = JSON.parse(fs.readFileSync("./games.json", "utf8"));
                    console.log(gamelist);
                    var liststring = "";
                    for (var i = 0; i < gamelist.length; i++) {
                        liststring += "[" + i + "] " + gamelist[i] + "\n";
                    }
                    bot.sendMessage({
                        to: channelID,
                        message: liststring
                    });
                } else if (gamefunction === "add") {
                    newGameName = cmd.slice(10);
                    list = JSON.parse(fs.readFileSync("./games.json", "utf8"));
                    if (!list.includes(newGameName)) {
                        list.push(newGameName);
                        fs.writeFile("./games.json", JSON.stringify(list), (err) => {
                            if (err) {
                                bot.sendMessage({
                                    to: channelID,
                                    message: err
                                });
                                return;
                            }
                            bot.sendMessage({
                                to: channelID,
                                message: newGameName + " is addes to the list"
                            });
                        });
                    } else {
                        bot.sendMessage({
                            to: channelID,
                            message: newGameName + " already exist in the list"
                        });
                    }
                } else if (gamefunction === "remove") {
                    oldGameName = cmd.slice(13);
                    var list = JSON.parse(fs.readFileSync("./games.json", "utf8"));
                    if (list.includes(oldGameName)) {
                        index = list.indexOf(oldGameName);
                        list.splice(index, 1);
                        fs.writeFile("./games.json", JSON.stringify(list), (err) => {
                            if (err) {
                                bot.sendMessage({
                                    to: channelID,
                                    message: err
                                });
                                return;
                            }
                            bot.sendMessage({
                                to: channelID,
                                message: oldGameName + " is removed from the list"
                            });
                        });
                    } else {
                        bot.sendMessage({
                            to: channelID,
                            message: oldGameName + " doesn't exist in the list"
                        });
                    }
                }
            } else if (cmd.startsWith("smite")) {
                smitefunction = cmd.split(" ")[1]; // Get the smitefunction name
                hirez.smite('pc').session.generate()
                    .then((res) => {
                        if (smitefunction.startsWith("random")) {
                            if (cmd.includes("god")) {
                                godlist = [];
                                hirez.smite('pc').getGods().then((result) => {
                                    for (var i = 0; i < result.length; i++) {
                                        godlist[i] = {
                                            "Name": result[i].Name,
                                            "Title": result[i].Title,
                                            "Role": result[i].Roles,
                                            "Pantheon": result[i].Pantheon
                                        };
                                    }
                                    randomGod = godlist[Math.floor(Math.random() * godlist.length)];
                                    msg = "God: **" + randomGod.Name + "**\n" +
                                        "Title: " + randomGod.Title + "\n" +
                                        "Role: " + randomGod.Role + "\n" +
                                        "Pantheon: " + randomGod.Pantheon + "\n";
                                    bot.sendMessage({
                                        to: channelID,
                                        message: msg
                                    });
                                });
                            }
                        } else if (smitefunction.startsWith("show")) {
                            if (cmd.includes("god") || cmd.includes("gods")) {
                                hirez.smite('pc').getGods().then((result) => {
                                    msg = "";
                                    for (var i = 0; i < result.length; i++) {
                                        msg += "[" + (i + 1) + "] " + result[i].Name + "\n";
                                    }
                                    bot.sendMessage({
                                        to: channelID,
                                        message: msg
                                    });
                                });
                            }
                        }
                    });
            }
        } catch
            (error) { // if the Bot fails, it puts an error
            bot.sendMessage({
                to: channelID,
                message: error
            });
        }
    }
});
