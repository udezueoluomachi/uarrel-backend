import express from "express";
import cors from "cors";
import {config} from "dotenv";
import fs from "fs";
config();

const _env = process.env;
const port = _env.port || 2023;
const allowedOrigin = _env.ALLOWED_ORIGIN;
const chromePath = _env.CHROME_PATH;


/*functions*/
const randomString = () => {
    const str = "qwertyuiopasdfghjklzxcvbnm";
    let newStr = "";
    for(let i = 0; i < 7; i++) {
        newStr += str[Math.floor(Math.random() * 7)]
    }
    return newStr;
}

const writeFile = (url, callback) => {
    let _path = randomString();
    fs.mkdir("./public/" + _path, (err) => {
        if(err) throw err;
        fs.writeFile("./public/" + _path + "/index.html", 
        `
        <!DOCTYPE html>
        <html lang="en" dir="ltr">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="refresh" content="0; url=${url}">
            <title>Redirecting to ${url}</title>
        </head>
        <body>
            <p>Redirecting to ${url}</p>
        </body>
        </html>
        `, (err) => {
            if(err) throw err;
            callback(_path)
        })
    })
}

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