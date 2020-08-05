const IncomingForm = require("formidable").IncomingForm;

const upload = (req, res) => {
  const form = new IncomingForm();

  form.on("file", (field, file) => {

  });

  form.on("end", () => {

  });

  form.parse(req);
}

module.exports = upload;