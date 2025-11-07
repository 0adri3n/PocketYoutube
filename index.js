const { app, BrowserWindow, ipcMain } = require("electron");
const express = require("express");
const { youtube } = require("scrape-youtube");
const path = require("path");
const url = require("url");
const fs = require("fs");
const DiscordRPC = require("discord-rpc");
const yaml = require("js-yaml");

let win;


function createWindow() {
  const server = express();
  server.use(express.static(path.join(__dirname, "interface")));

  server.use('/assets', express.static(path.join(__dirname, 'assets')));
  server.use(express.static(path.join(__dirname, 'interface')));

  const listener = server.listen(0, () => {
    const port = listener.address().port;

    win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "api/preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        autoplayPolicy: "no-user-gesture-required",
      },
      icon: path.join(__dirname, "assets/pocket.png"),
      autoHideMenuBar: true,
    });

    win.webContents.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );

    win.loadURL(`http://localhost:${port}/index.html`);

    win.on("closed", () => {
      win = null;
      listener.close();
    });
  });
}


ipcMain.handle("get-results", async (event, search) => {
  console.log("API called 🤖 | Route : get-results");
  const { videos } = await youtube.search(search);
  return videos;
});

ipcMain.on("add-history", async (event, search) => {
  console.log("API called 🤖 | Route : add-history");

  const historyFilePath = path.join(__dirname, "cache/history.log");

  let historyList = [];
  try {
    const data = fs.readFileSync(historyFilePath, "utf-8");
    historyList = data.split("\n").filter((line) => line.trim() !== "");
  } catch (error) {
    console.error("Error reading history.log:", error);
  }

  if (!historyList.includes(search)) {
    const historyItem = search + "\n";

    fs.appendFile(historyFilePath, historyItem, (err) => {
      if (err) {
        console.error("Error writing to history.log:", err);
        return;
      }
      console.log("Search history added to history.log");
    });
  } else {
    console.log("Search already exists in history.log");
  }
});

ipcMain.handle("get-history", async (event) => {
  console.log("API called 🤖 | Route : get-history");

  const historyFilePath = path.join(__dirname, "cache/history.log");

  try {
    const data = fs.readFileSync(historyFilePath, "utf-8");
    const historyList = data.split("\n").filter((line) => line.trim() !== "");

    return historyList;
  } catch (error) {
    console.error("Error reading history.log:", error);
    return [];
  }
});

ipcMain.handle("delete-history", async (event, search) => {
  console.log("API called 🤖 | Route : delete-history");

  const historyFilePath = path.join(__dirname, "cache/history.log");

  try {
    const data = fs.readFileSync(historyFilePath, "utf-8");
    let historyList = data.split("\n").filter((line) => line.trim() !== "");

    historyList = historyList.filter((item) => item !== search);

    fs.writeFileSync(historyFilePath, historyList.join("\n"));
    console.log("Search history deleted from history.log");
  } catch (error) {
    console.error("Error deleting from history.log:", error);
  }
});


ipcMain.on("clear-history", async (event) => {
  console.log("API called 🤖 | Route : clear-history");

  const historyFilePath = path.join(__dirname, "cache/history.log");

  try {
    const data = fs.readFileSync(historyFilePath, "utf-8");
    let historyList = data.split("\n").filter((line) => line.trim() !== "");

    fs.writeFileSync(historyFilePath, "");
    console.log("Search history cleared from history.log");
  } catch (error) {
    console.error("Error clearing from history.log:", error);
  }
});


ipcMain.on("like-video", async (event, video) => {
  console.log("API called 🤖 | Route : like-video");

  const likedVideosFilePath = path.join(__dirname, "cache/liked_videos.log");

  let likedVideosList = [];
  try {
    const data = fs.readFileSync(likedVideosFilePath, "utf-8");
    likedVideosList = data.split("\n").filter((line) => line.trim() !== "");
  } catch (error) {
    console.error("Error reading liked_videos.log:", error);
  }

  const videoData = JSON.stringify(video);

  if (!likedVideosList.includes(videoData)) {
    fs.appendFile(likedVideosFilePath, videoData + "\n", (err) => {
      if (err) {
        console.error("Error writing to liked_videos.log:", err);
        return;
      }
      console.log("Video liked and added to liked_videos.log");
    });
  } else {
    console.log("Video already liked and present in liked_videos.log");
  }
});

ipcMain.handle("get-likes", async (event) => {
  console.log("API called 🤖 | Route : get-likes");

  const likesFilePath = path.join(__dirname, "cache/liked_videos.log");

  try {
    const data = fs.readFileSync(likesFilePath, "utf-8");
    const likesList = data.split("\n").filter((line) => line.trim() !== "");
    return likesList;
  } catch (error) {
    console.error("Error reading liked_videos.log:", error);
    return [];
  }
});

ipcMain.handle("check-like", async (event, video) => {
  console.log("API called 🤖 | Route : check-like");

  const likedVideosFilePath = path.join(__dirname, "cache/liked_videos.log");

  let likedVideosList = [];
  try {
    const data = fs.readFileSync(likedVideosFilePath, "utf-8");
    likedVideosList = data.split("\n").filter((line) => line.trim() !== "");
  } catch (error) {
    console.error("Error reading liked_videos.log:", error);
  }

  const { id, title, thumbnail, description } = video;
  const videoData = JSON.stringify({ id, title, thumbnail, description });

  if (!likedVideosList.includes(videoData)) {
    return false;
  } else {
    return true;
  }
});

ipcMain.handle("check-discord-rpc", async (event) => {
  console.log("API called 🤖 | Route : check-discord-rpc");

  const configFile = path.join(__dirname, "config/config.yaml");

  try {
    const config = yaml.load(fs.readFileSync(configFile, "utf8"));

    const discordRpcEnabled = config["discord-rpc"] === true;

    return discordRpcEnabled;
  } catch (error) {
    console.error("Error reading config.yaml:", error);
    return false; 
  }
});

ipcMain.on("switch-rpc", async (event, newValue) => {
  console.log("API called 🤖 | Route : change-rpc");

  const configFile = path.join(__dirname, "config/config.yaml");

  try {
    const config = yaml.load(fs.readFileSync(configFile, "utf8"));

    config["discord-rpc"] = !config["discord-rpc"];

    fs.writeFileSync(configFile, yaml.dump(config));

    return config["discord-rpc"];
  } catch (error) {
    console.error("Error reading or writing config.yaml:", error);
    return false;
  }
});
ipcMain.on("delete-like", async (event, videoId) => {

  console.log("API called 🤖 | Route : delete-like");

  const likedVideosFilePath = path.join(__dirname, "cache/liked_videos.log");

  try {
    const data = fs.readFileSync(likedVideosFilePath, "utf-8");
    let likedVideosList = data.split("\n").filter((line) => line.trim() !== "");

    likedVideosList = likedVideosList.filter((item) => {
      try {
        const video = JSON.parse(item);
        return video.id !== videoId;
      } catch (error) {
        console.error("Error parsing line:", item, error);
        return true;
      }
    });

    fs.writeFileSync(likedVideosFilePath, likedVideosList.join("\n"));
    console.log("Like deleted from liked_videos.log");
  } catch (error) {
    console.error("Error deleting from liked_videos.log:", error);
  }
});


ipcMain.on("change-rpc", async (event, videoTitle) => {

  console.log("API called 🤖 | Route : change-rpc");

  const configFile = path.join(__dirname, "config/config.yaml");

  try {
    const config = yaml.load(fs.readFileSync(configFile, "utf8"));

    var discordRpcEnabled = config["discord-rpc"] === true;
  } catch (error) {
    console.error("Error reading config.yaml:", error);
    var discordRpcEnabled = false;
  }

  if (discordRpcEnabled) {
      setActivity(videoTitle);

  }


});

const clientId = "1258172335282851933";

const rpc = new DiscordRPC.Client({ transport: "ipc" });
DiscordRPC.register(clientId);

const startTimestamp = new Date();

const configFile = path.join(__dirname, "config/config.yaml");


try {
  const config = yaml.load(fs.readFileSync(configFile, "utf8"));

  var discordRpcEnabled = config["discord-rpc"] === true;

} catch (error) {
  console.error("Error reading config.yaml:", error);
  var discordRpcEnabled = false;
}
if(discordRpcEnabled){



  rpc.on("ready", () => {
    setActivity("reset");
  });

  rpc.login({ clientId }).catch(console.error);
}


async function setActivity(videoTitle) {
  if (!rpc || !win) {
    return;
  }


  if (videoTitle == "reset") {
    rpc.setActivity({
      details: "Crawling through PocketYoutube",
      largeImageKey: "pocket",
      largeImageText: "PocketYoutube",
      instance: false,
      startTimestamp,
    });
  } else {
    const startTimestamp = new Date();
    rpc.setActivity({
      details: "Watching a video on PocketYoutube",
      state: videoTitle,
      startTimestamp,
      largeImageKey: "pocket",
      largeImageText: "PocketYoutube",
      instance: false,
    });
  }


}


app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    rpc.destroy();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
