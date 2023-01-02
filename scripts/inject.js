const fs = require("fs");
const path = require("path");

// TODO: Make it work with release builds.

const args = process.argv;
const releaseInput = /*useBdRelease ? args[3] && args[3].toLowerCase() : */args[2] && args[2].toLowerCase();
const release = releaseInput === "canary" ? "Discord Canary" : releaseInput === "ptb" ? "Discord PTB" : "Discord";
const bdPath = /*useBdRelease ?*/ path.resolve(__dirname, "..")/* : path.resolve(__dirname, "..", "dist")*/;
const discordPath = (function() {
    let resourcePath = "";
    if (process.platform === "win32") {
        const basedir = path.join(process.env.LOCALAPPDATA, release.replace(/ /g, ""));
        if (!fs.existsSync(basedir)) throw new Error(`Cannot find directory for ${release}`);
        const version = fs.readdirSync(basedir).filter(f => fs.lstatSync(path.join(basedir, f)).isDirectory() && f.split(".").length > 1).sort().reverse()[0];
        // To account for discord_desktop_core-1 or any other number
        const coreWrap = fs.readdirSync(path.join(basedir, version, "modules")).filter(e => e.indexOf("discord_desktop_core") === 0).sort().reverse()[0];
        resourcePath = path.join(basedir, version, "modules", coreWrap, "discord_desktop_core");
    }
    else {
        let userData = process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : path.join(process.env.HOME, ".config");
        if (process.platform === "darwin") userData = path.join(process.env.HOME, "Library", "Application Support");
        const basedir = path.join(userData, release.toLowerCase().replace(" ", ""));
        if (!fs.existsSync(basedir)) return "";
        const version = fs.readdirSync(basedir).filter(f => fs.lstatSync(path.join(basedir, f)).isDirectory() && f.split(".").length > 1).sort().reverse()[0];
        if (!version) return "";
        resourcePath = path.join(basedir, version, "modules", "discord_desktop_core");
    }

    if (fs.existsSync(resourcePath)) return resourcePath;
    return "";
})();

if (!fs.existsSync(discordPath)) throw new Error(`Cannot find directory for ${release}`);

const indexJs = path.join(discordPath, "index.js");
if (fs.existsSync(indexJs)) fs.unlinkSync(indexJs);

fs.writeFileSync(indexJs, `require(${JSON.stringify(bdPath)});\nmodule.exports = require("./core.asar");`);

console.log(`Injection successful, please restart ${release}.`);
