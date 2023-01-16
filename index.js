import express from "express";
import cors from "cors";
import {config} from "dotenv";
import fs from "fs";
import {
    randomString
} from "./functions.js";

config();

const port = process.env.port || 2023;
const allowedOrigin = process.env.ALLOWED_ORIGIN;

const app = express();

app.use(cors({origin : allowedOrigin}))

app.post("/", (req, res) => {
    let body = "";
    req.on("data", data => body += data );
    req.on("end", () => {
        try {
            let parsedData = JSON.parse(body);
            if(parsedData.urlInput) {
                res.status(200).json({
                    url : "http://localhost:5500"
                })
            }
            else {
                res.status(200).json({
                    error : "urlInput not found"
                })
            }
        }
        catch(err) {
            res.status(200).json({
                error : `Could not parse data\n ${err}`
            })
        }
    })
})

app.listen(port, () => console.log(`Server is listening on port ${port}`))