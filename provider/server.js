const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const next = require("next");
const PlanetFlare = require("./planetflare");
const { initLogger } = require("./logger");
const { CACHE_STRATEGIES } = require("./strategies/cache-strategy");
const { PAYMENT_STRATEGIES } = require("./strategies/payment-strategy");

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const port = 3000;

initLogger(io);
const planetflare = new PlanetFlare(io);

io.on("connect", (socket) => {
  if (planetflare.ready) {
    socket.emit("status", {
      ready: true,
      peerId: planetflare.peerId,
      location: planetflare.location,
      paymentStrategies: Object.keys(PAYMENT_STRATEGIES),
      cacheStrategies: Object.keys(CACHE_STRATEGIES),
      pfcAbi: planetflare.abi,
      pfcContractAddress: planetflare.contractAddress,
    });

    socket.on(
      "command",
      async ({ command, args }) =>
        await planetflare.handleCommand(command, args)
    );
  }
  socket.on("start", planetflare.start);
  socket.on("shutdown", planetflare.stop);
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
