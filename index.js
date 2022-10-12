import puppeteer from "puppeteer";

const oksLectureUrl =
  "https://calls.mail.ru/room/0d9a6beb-2627-4a3f-a80b-432b1688d845";

const browser = await puppeteer.launch({ headless: false });
const context = browser.defaultBrowserContext();
await context.overridePermissions(oksLectureUrl, ["microphone"]);

const page = await browser.newPage();
await page.goto(oksLectureUrl);

setTimeout(async () => {
  const inputField = await page.waitForSelector(".input-0-2-85");
  inputField.type("Бракало ПИ-20в");

  const microphoneCheckbox = await page.waitForSelector(".box-0-2-100");
  microphoneCheckbox.click();

  const startWithoutCamButton = await page.waitForSelector(
    ".base-0-2-107.base-d7-0-2-149"
  );
  startWithoutCamButton.click();
}, 20000);

// setTimeout(async () => await browser.close(), 30000);
