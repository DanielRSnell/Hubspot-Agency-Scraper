const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const linkSchema = new Schema({
	link: { type: String, unique: true }
});

module.exports = mongoose.model("HubLink", linkSchema);
