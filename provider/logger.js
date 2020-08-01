let logger = null;

class Logger {
  constructor(io) {
    this.io = io;
  }

  log(data) {
      this.io.emit('logs', data);
  }
}

const log = (...msg) => {
  if (logger != null) logger.log(msg.map(JSON.stringify).join(" "));
  console.log(...msg);
};

const initLogger = (io) => {
  logger = new Logger(io);
  return logger;
};

module.exports = {
  initLogger,
  log,
};
