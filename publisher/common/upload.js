const IncomingForm = require("formidable").IncomingForm;

const upload = (req, res) => {
  console.log("Got request");
  console.log(req.body);
}

module.exports = upload;
