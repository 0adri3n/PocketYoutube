// Import the necessary Electron components.
const contextBridge = require("electron").contextBridge;
const ipcRenderer = require("electron").ipcRenderer;

// White-listed channels.
const ipc = {
  render: {
    send: ["add-history", "change-rpc", "like-video", "delete-like", "clear-history", "switch-rpc"],
    sendReceive: ["get-results", "get-history", "delete-history", "get-likes", "check-like", "check-discord-rpc"],
  },
};

// Exposed protected methods in the render process.
contextBridge.exposeInMainWorld(
  // Allowed 'ipcRenderer' methods.
  "ipcRender",
  {
    send: (channel, args) => {
      let validChannels = ipc.render.send;
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, args);
      }
    },
    invoke: (channel, args) => {
      let validChannels = ipc.render.sendReceive;
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, args);
      }
    },
  }
);
