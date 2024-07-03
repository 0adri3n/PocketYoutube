// Import the necessary Electron components.
const contextBridge = require("electron").contextBridge;
const ipcRenderer = require("electron").ipcRenderer;

// White-listed channels.
const ipc = {
  render: {
    send: ["add-history"],
    sendReceive: ["get-results", "get-history", "delete-history"],
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
