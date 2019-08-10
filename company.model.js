const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const hubspotSchema = new Schema({
	name: String,
	website: { type: String, unique: true },
	level: String,
	location: String,
	desc: String,
	hubspot: { type: String, unique: true },
	specialty: String
});

module.exports = mongoose.model("Hubspot", hubspotSchema);
