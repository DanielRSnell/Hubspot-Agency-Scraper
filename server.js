const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const mongoose = require("mongoose");
const Hubspot = require("./company.model");
const HubLink = require("./website.model");
const fs = require("fs");
const stringify = require("csv-stringify");

mongoose.connect(`mongodb://dsnell:Redskins1@ds239387.mlab.com:39387/hofacker`);

async function ScrapeAgencyLinks() {
	const links = [];
	const total = 3609;
	const pageSize = 100;
	const numberOfPages = Math.round(3609 / 100);

	for (var i = 0; i < numberOfPages; i++) {
		links.push(`https://www.hubspot.com/agencies/united-states?limit=100&page=${i + 1}`);
	}

	const partner = [];

	await links.forEach(async (item) => {
		const data = await axios.get(item).then((res) => res.data);
		const $ = await cheerio.load(data);

		await $(".directories__link").each(function(i, elem) {
			const schema = {
				link: `https://hubspot.com${$(this).attr("href")}`
			};

			const NewLink = new HubLink(schema);
			NewLink.save().then(() => console.log(`${schema.link} saved`)).catch((e) => e);
		});
	});

	return Promise.all(partner);
}

async function ScrapeAgencyInfo() {
	const data = await HubLink.find().then((res) => res);
	console.log(data);
	const arr = await [];
	await data.forEach(async (item, index) => {
		setTimeout(async () => {
			const response = await axios.get(item.link).then((res) => res.data).catch((e) => e);
			const $ = cheerio.load(response);
			const industry = [];
			$(".industry > ul > li").each(function(i, elem) {
				industry[i] = $(this)
					.text()
					.split("  ")
					.join("")
					.replace(/\n/g, ", ")
					.split(" ,  , ")
					.join(", ")
					.split(", ")
					.join(", ")
					.split(", All Industries,  , ")
					.join("")
					.split(" ,  ")
					.join("");
			});
			const schema = {
				name: await $(".partners-details__hero-text > h2").text(),
				location: await $(".partners-details__hero-location").text(),
				website: await $(".partners-details__hero-website").attr("href"),
				level: await $(".partners-details__hero-icon").text(),
				hubspot: item.link,
				desc: await $(".partners-details__about-container > p").text(),
				specialty: industry.join(", ")
			};
			console.log(schema);
			const Company = new Hubspot(schema);
			Company.save().then(() => console.log(`${schema.name} saved`)).catch((e) => e);
		}, index * 250);
	});
	return await Promise.all(arr);
}

const app = express();

app.get("/build/links", async (req, res) => {
	ScrapeAgencyLinks();
	res.send("Building Links");
});

app.get("/build/info", async (req, res) => {
	ScrapeAgencyInfo();
	res.send("Building Profiles");
});

const columns = {
	name: "name",
	website: "website",
	location: "location",
	hubspot: "hubspot",
	desc: "desc",
	specialty: "specialty"
};

app.get("/", async (req, res) => {
	const data = await Hubspot.find().then((res) => res);
	stringify(data, { header: true, columns: columns }, (err, output) => {
		if (err) throw err;
		fs.writeFile("out.csv", output, (err) => {
			if (err) throw err;
			console.log("CSV saved");
		});
	});
	res.send(JSON.stringify(data));
});

app.listen(8080);
