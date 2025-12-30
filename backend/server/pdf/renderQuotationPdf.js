const puppeteer = require('puppeteer');

module.exports = async function renderQuotationPdf(html) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0"
  });

  const buffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "12mm",
      right: "12mm",
      bottom: "12mm",
      left: "12mm"
    }
  });

  await browser.close();
  return buffer;
};
