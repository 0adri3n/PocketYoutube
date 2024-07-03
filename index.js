const { app, BrowserWindow, ipcMain } = require("electron");
const { youtube } = require("scrape-youtube");
const path = require("path");
const url = require("url");
const fs = require("fs");
const DiscordRPC = require("discord-rpc");

let win;

// Window definition
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "api/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "assets/pocket.png"),
    autoHideMenuBar: true,
  });

  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "interface/index.html"),
      protocol: "file",
      slashes: true,
    })
  );

  win.on("closed", () => {
    win = null;
  });
}

// Api Part
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

ipcMain.on("change-rpc", async (event, videoTitle) => {

  console.log("API called 🤖 | Route : change-rpc");

    setActivity(videoTitle)

});

const clientId = "1258172335282851933";

const rpc = new DiscordRPC.Client({ transport: "ipc" });
DiscordRPC.register(clientId);

const startTimestamp = new Date();


rpc.on("ready", () => {
    setActivity("reset");
});

rpc.login({ clientId }).catch(console.error);

function startActivity() {

    const clientId = "1258172335282851933";

    DiscordRPC.register(clientId);
    rpc = new DiscordRPC.Client({ transport: "ipc" });

    rpc.on("ready", () => {
        console.log("Discord RPC connected!");
        setActivity("reset");
        setInterval(() => {
        setActivity("reset");
        }, 15e3);
    });

    rpc.login({ clientId }).catch((err) => {
        console.error("Error logging into Discord RPC:", err);
    });


}


async function setActivity(videoTitle) {
  if (!rpc || !win) {
    return;
  }

  if(videoTitle == "reset"){
        rpc.setActivity({
        details: "Crawling through PocketYoutube",
        largeImageKey: "pocket",
        largeImageText: "PocketYoutube",
        instance: false,
        startTimestamp,
        });
    }
    else{
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




// Window Part
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
