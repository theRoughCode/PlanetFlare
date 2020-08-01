let logger = null;

class Logger {
  constructor(io) {
    this.io = io;
  }

  log(msg, isError = false) {
    this.io.emit("logs", { msg, isError });
  }
}

const _toString = (data) => {
  if (Array.isArray(data)) return `[${data.join(", ")}]`;
  if (typeof data === "object") return JSON.stringify(data);
  return String(data);
};

const log = (...msg) => {
  if (logger != null) logger.log(msg.map(_toString).join(" "));
  console.log(...msg);
};

const error = (...msg) => {
  if (logger != null) logger.log(msg.map(JSON.stringify).join(" "), true);
  console.error(...msg);
};

const initLogger = (io) => {
  logger = new Logger(io);
  return logger;
};

module.exports = {
  initLogger,
  log,
  error,
};
