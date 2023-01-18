import {config} from "dotenv";
import fs from "fs";
import notifier from "mail-notifier";
import puppeteer from "puppeteer-core";
config();

const _env = process.env;
const chromePath = _env.CHROME_PATH;


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
    fs.writeFile("./public/" + _path + ".html", 
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
}

const deleteFile = path => {
    fs.unlink("./public/" + path + ".html", (err) => {
        if(err) throw err
    })
}

const extractVerificationCode = str => {
    const pattern = /\d+/igm;
    return str.match(pattern)[0];
}

const checkMailForVerificationCode = (callback) => {
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

export const pushToGithub = async (path,callback) => {
    let launchOptions = {  
        executablePath: chromePath,
        args: ['--start-maximized' , '--no-sandbox', '--disable-setuid-sandbox'],
        ignoreDefaultArgs: ['--disable-extensions']
    };

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setViewport({width: 1366, height: 768});

    await page.setUserAgent
            ('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

    const login = (async () => {
        await page.goto("https://github.com/login");
    
        await page.type("#login_field", _env.EMAIL);
        await page.type("#password", _env.PASS);
    
        await page.click("input[type='submit']", {delay : 2});
    
        const commit = async () => {
            await page.goto("https://github.com/udezueoluomachi/uarel/upload/main/s");
    
            const fileInput = await page.$("input[type='file']");
            await fileInput.uploadFile("./public/" + path + ".html");
            setTimeout(async () => {
                await page.type("#commit-summary-input",": Api");
                await page.click("button.js-blob-submit.btn-primary.btn");
                await browser.close();
                deleteFile(path);
                callback();
            }, 4000)
        }
    
        page.waitForNavigation({timeout : 90000})
        .then(async () => {
            let pageUrl = page.url();
            let verificationUrl = "https://github.com/sessions/verified-device"
            let veryCodeInput = "#otp";
            let submitBtn = "button[type='submit']";
    
            if(pageUrl == verificationUrl) {
                checkMailForVerificationCode( async code => {
                    await page.type(veryCodeInput, code, {delay : 4});

                    //github auto submits the form after being filled
                 //   await page.click(submitBtn, {delay : 2});
    
                    page.waitForNavigation({timeout : 90000})
                    .then(async () => {
                        commit();
                    })
                })
            }
            else if (pageUrl == "https://github.com/session") {
                login();
            }
            else {
                commit();
            }
        });
    })();
}