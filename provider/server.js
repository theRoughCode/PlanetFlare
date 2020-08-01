const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const next = require("next");
const PlanetFlare = require("./planetflare");
const { initLogger } = require('./logger');

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const port = 3000;

const logger = initLogger(io);
const planetflare = new PlanetFlare(io);
planetflare.start();

io.on("connect", (socket) => {
  if (planetflare.ready)
    socket.emit("status", {
      ready: true,
      peerId: planetflare.peerId,
      location: planetflare.location,
    });
});

nextApp.prepare().then(() => {
  app.get("*", (req, res) => nextHandler(req, res));

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`Listening on http://localhost:${port}`);
  });
});

// Watch for "close" command and run shutdown script
process.stdin.on("data", async (data) => {
  // Remove trailing newline
  data = data.toString().trim();
  const [command, ...args] = data.split(" ");
  await planetflare.handleCommand(command, args);
});
