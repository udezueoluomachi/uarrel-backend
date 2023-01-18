import {config} from "dotenv";
import fs from "fs";
import notifier from "mail-notifier";
import puppeteer from "puppeteer-core";
config();

const _env = process.env;
const chromePath = _env.CHROME_PATH;

const clientId = _env.CLIENT_ID;
const clientSecret = _env.CLIENT_SECRET;
const refreshToken = _env.REFRESH_TOKEN;


const randomString = () => {
    const str = "qwertyuiopasdfghjklzxcvbnm";
    let newStr = "";
    for(let i = 0; i < 7; i++) {
        newStr += str[Math.floor(Math.random() * 7)]
    }
    return newStr;
}

export const writeFile = (url, callback) => {
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

const deleteFile = path => {
    fs.rmdir("./public/" + path, (err) => {
        if(err) throw err
    })
}

const extractVerificationCode = str => {
    const pattern = /\d+/igm;
    return str.match(pattern)[0];
}

const listenMail = (callback) => {
    const imap = {
        user: _env.EMAIL,
        password : _env.G_PASS,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        searchFilter: ["NEW", "UNSEEN", ["SINCE", new Date().toUTCString()]],
          tlsOptions: { rejectUnauthorized: false }
    };
    
    notifier(imap).on('mail',function(mail){
      if(mail.from[0].address == "noreply@github.com") {
        callback(extractVerificationCode(mail.text));
      }
    }).start()
}

//check if verification page before verifying 

//listenMail();

const pushToGithub = async path => {
    let launchOptions = {  headless : false,
        executablePath: chromePath,
        args: ['--start-maximized']
    };

    let res = {
        isSuccess : false,
        twoFAenabled : false
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setViewport({width: 1366, height: 768});

    await page.setUserAgent
            ('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

    await page.goto("https://github.com/login");

    await page.type("#login_field", _env.EMAIL, {delay : 4});
    await page.type("#password", _env.PASS, {delay : 3});

    await page.click("input[type='submit']", {delay : 2});

    //await browser.close();
}
//pushToGithub();