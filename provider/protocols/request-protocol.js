"use strict";
const pipe = require("it-pipe");
const protons = require("protons");

// Define Protobuf schema
const { Request, Response } = protons(`
message Request {
  required bytes cId = 1;
}

message Response {
  required bytes cId = 1;
  required string cksum = 2;
}
`);

class RequestProtocol {
  
  // Define the codec of our request protocol
  PROTOCOL = "/planetflare/request/1.0.0";

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
          const cIdString = cId.toString();
          const remotePeerId = connection.remotePeer.toB58String();
  
          if (this.cdnManager.hasFile(cIdString)) {
            const { cksum } = this.cdnManager.getCksum(cIdString);
            const resp = Response.encode({ cId, cksum });

            try {
              // Asynchronously send response to client
              const respStream = await connection.newStream([this.PROTOCOL])
              this.send(resp, respStream.stream)
            } catch (err) {
              console.error('Could not negotiate request protocol stream with client', err);
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

module.exports = RequestProtocol;
