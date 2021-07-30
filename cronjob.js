const Queue = require("bull");
const fs = require("fs");

const deleteFileQueue = new Queue("deletefile", {
	redis: {
		host: process.env.REDIS_HOSTNAME,
		port: process.env.REDIS_PORT,
		password: process.env.REDIS_PASSWORD,
	},
});

function getFile() {
	let files = fs.readdirSync(__dirname + "/uploads");
	let file = files[files.length - 1];
	return file;
}

const deleteFile = (file) => {
	fs.unlink(`./uploads/${file}`, (err) => {
		if (err) {
			console.log(err);
		} else {
			console.log("File deleted");
		}
	});
};

deleteFileQueue.process(async (job) => {
	console.log(job.data);
	return await deleteFile(job.data.file);
});

module.exports = deleteFileQueue;
