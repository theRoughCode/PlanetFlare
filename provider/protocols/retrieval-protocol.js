"use strict";
const pipe = require("it-pipe");
const protons = require("protons");

// Define Protobuf schema
const { Request, Response } = protons(`
message Request {
  required string cId = 1;
}

message Response {
  required string cId = 1;
  required bytes data = 2;
}
`);

class RetrievalProtocol {
  // Define the codec of our retrieve protocol
  PROTOCOL = "/planetflare/retrieve/1.0.0";

  constructor(cdnManager) {
    this.cdnManager = cdnManager;
  }

  /**
   * A simple handler to print incoming messages to the console
   * @param {Object} params
   * @param {Connection} params.connection The connection the stream belongs to
   * @param {Stream} params.stream A pull-stream based stream to the peer
   */
  handler = async ({ connection, stream }) => {
    try {
      await pipe(stream, async function (source) {
        for await (const message of source) {
          const { cId } = Request.decode(message);
          // const remotePeerId = connection.remotePeer.toB58String();

          if (this.cdnManager.hasFile(cId)) {
            const { data } = this.cdnManager.getFile(cId);
            const resp = Response.encode({ cId, data });

            try {
              // Asynchronously send response to client
              await this.send(resp, stream);
            } catch (err) {
              console.error(
                "Could not negotiate retrieval protocol stream with client",
                err
              );
            }
          }
        }
      });

      // Replies are done on new streams, so let's close this stream so we don't leak it
      await pipe([], stream);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Writes the `message` over the given `stream`. Any direct replies
   * will be written to the console.
   *
   * @param {Buffer|String} message The message to send over `stream`
   * @param {PullStream} stream A stream over the muxed Connection to our peer
   */
  send = async (message, stream) => {
    try {
      await pipe([message], stream);
    } catch (err) {
      console.error(err);
    }
  };
}

module.exports = RetrievalProtocol;
