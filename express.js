const express = require("express");
const cors = require("cors");
const EventEmitter = require('events');
const Stream = new EventEmitter(); // my event emitter instance
const mysql = require('mysql2');

const app = express();

// Enable cors
app.use(
    cors({
        credentials: true,
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    })
);


app.get('/stream', function (request, response) {

    try {

        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'test'
        });

        response.setHeader('Content-Type', 'text/event-stream')
        response.setHeader('Cache-Control', 'no-cache')
        response.setHeader('Connection', 'keep-alive')

        let text = ""

        request.on("close", () => {
            clearInterval(t)
        })

        Stream.on("push", function (event, msg) {

            text = text === "" ? text += msg : text + " " + msg
            const resData = { msg: text, time: new Date().getTime() }
            // This code is just for testing pupose so ignore sql injection issues

            // Create chat table with two columns id and text to store the streaming data
            connection.query(`INSERT INTO chat (id, text) VALUES (1, '${text}') ON DUPLICATE KEY UPDATE name='${text}'`).stream().on("data", () => {
                response.write(`event: ${String(event)}\n`);
                response.write("data:" + JSON.stringify(resData) + "\n\n");
            })

        });

        const t = setInterval(() => {
            Stream.emit("push", "message", "I love Programming!");
        }, 250)

        setTimeout(() => {
            clearInterval(t)
            response.emit("close")
        }, 20500)
    }
    catch (error) {
        console.log(error)
    }
});


// Capturing uncaught exceptions
process.on("uncaughtException", (error) => {
    console.log(`unhandledException: ${error.message}`);
    console.log("stack trace: ", error.stack);
});

// Capturing unhandled rejections
process.on("unhandledRejection", (error) => {
    console.log(`unhandledRejection: ${error.message}`);
    console.log(`Stack trace: ${error.stack}`);
});


app.listen(3001, () => {
    console.log(`Server listening on: 3001`);
});