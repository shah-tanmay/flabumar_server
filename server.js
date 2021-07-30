const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const multer = require("multer");
const app = express();
const fs = require("fs");
const server = http.createServer(app);
const io = socketio(server);
require("dotenv").config();
const sha256 = require("sha256");
const deleteFileQueue = require("./cronjob");

app.use(require("cors")());
app.use(express.static("./uploads"));
app.use(express.static("./stickers"));

const secret = sha256(process.env.SECRET);

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads");
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + secret + path.extname(file.originalname));
	},
});

var upload = multer({ storage: storage });

app.io = io;

app.post("/upload", upload.single("image"), (req, res) => {
	const imageFolder = "./uploads";
	console.log(req.body);
	const user = req.body.user;
	const id = req.body.id;
	const room = req.body.url + req.body.roomcode;
	fs.readdir(imageFolder, (err, files) => {
		if (
			[".pdf", ".docx", ".doc", ".txt", ".ppt", ".pptx"].some((char) =>
				files[files.length - 1].endsWith(char),
			)
		) {
			type = "file";
		} else {
			type = "image";
		}
		message = files[files.length - 1];
		const data = {
			file: message,
		};
		const options = {
			delay: 1800000,
			attempts: 3,
		};
		deleteFileQueue.add(data, options);

		req.app.io.to(room).emit("recieveMessage", { user, id, message, type });
	});
	res.send();
});

app.get("/getStickers", (req, res) => {
	let fileArray = [];
	fs.readdir("./stickers", (err, files) => {
		files.forEach((file) => {
			fileArray.push(file);
		});
		res.status(200).send(fileArray);
	});
});

io.on("connection", (socket) => {
	socket.on("joinPrivateRoom", (data) => {
		const room = data.url + data.code;
		console.log(room);
		socket.join(room);
		socket.on(
			"sendMessage",
			({
				user,
				id,
				message,
				type,
				replyTo,
				repliedMessage,
				repliedMessageName,
			}) => {
				io.to(room).emit("recieveMessage", {
					user,
					id,
					message,
					type,
					replyTo,
					repliedMessage,
					repliedMessageName,
				});
				console.log(repliedMessageName);
			},
		);
	});
});

server.listen(5000, () => {
	console.log("Server is up on port 5000");
});

module.exports = io;
// 2eFBV2sGRQFNKncTUUHLbepJ3ClYdEBl
