import express from "express";
import cors from "cors";
import {config} from "dotenv";
import {pushToGithub, writeFile} from "./functions.js";
config();

const _env = process.env;
const port = _env.port || 2023;
const allowedOrigin = _env.ALLOWED_ORIGIN;

const app = express();

app.use(cors({origin : allowedOrigin}))

app.post("/", (req, res) => {
    let body = "";
    req.on("data", data => body += data );
    req.on("end", () => {
        try {
            let parsedData = JSON.parse(body);
            if(parsedData.urlInput) {
                writeFile(parsedData.urlInput, path => {
                    pushToGithub(path, () => {
                        res.status(200).json({
                            url : "https://udezueoluomachi.github.io/uarel/s/" + path + ".html"
                        })
                    })
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