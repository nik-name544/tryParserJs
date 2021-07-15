const request = require("request");
const cheerio = require("cheerio");
const moment = require("moment");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askQuestion(question) {
  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      if (!answer || answer === "y") {
        return resolve(true);
      }
      return resolve(false);
    });
  });
}

async function getPage(url) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: url,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
      (e, res, body) => {
        if (e) {
          return reject(e);
        }

        return resolve(cheerio.load(body, { decodeEntities: false }));
      }
    );
  });
}

async function getAdsFromPage(url, page1) {
  let res = [];
  const page = await getPage(url);
  const ads = page("#offers_table table").each((i, el) => {
    res.push(page(el));
  });
  console.log(`page ${page1}: found ${ads.length}`);
  const nextPage = page('a[data-cy="page-link-next"]');
  if (nextPage.get(0) && (await askQuestion("Next page "))) {
    const nextAds = await getAdsFromPage(nextPage.attr("href"), ++page1);
    res = res.concat(nextAds);
  }
  return res;
}

async function getDetails(url) {
  const openPage = await getPage(url);
  const id = openPage('div[data-cy="ad-footer-bar-section"]>span')
    .text()
    .trim();
  const date = openPage('span[data-cy="ad-posted-at"]').text().trim();
  const descr = openPage('div[data-cy="ad_description"]>div').text().trim();
  const title = openPage('h1[data-cy="ad_title"]').text().trim();
  const seller = openPage("h2.css-owpmn2-Text").text().trim();
  let props = [];
  let photos = [];
  let dirtyProps = openPage("li.css-ox1ptj").text().trim();
  dirtyProps = dirtyProps.replace(/([а-я0-9])([А-Я0-9])/g, "$1 $2");
  props.push(dirtyProps);
  photos.push(openPage('img[data-testid="swiper-image"]').attr("src"));
  openPage('img[data-testid="swiper-image-lazy"]').each((el, i) => {
    if (i.name === "img") {
      photos.push(i.attribs["data-src"]);
    }
  });

  return {
    id: id,
    date: date,
    descr: descr,
    seller: seller,
    photos: photos,
    props: props,
    title: title,
  };
}

async function run(url) {
  const res = [];
  const ads = await getAdsFromPage(url, 1);
  let total = ads.length;
  console.log(`total ads found: ${ads.length}`);

  for (const ad of ads) {
    if (
      !(await askQuestion(
        "Open this ad " + ad.find("a.detailsLink").text().trim() + "?"
      ))
    ) {
      continue;
    }
    let offerData = {
      price: ad.find(".price strong").text().trim(),
      href: ad
        .find("a.detailsLink")
        .attr("href")
        .replace(/\.html.*/, ".html"),
    };

    const details = await getDetails(offerData.href);
    offerData = Object.assign(offerData, details);

    res.push(offerData);
    console.log("left: " + --total + " ads");
  }
  return res;
}

module.exports = async function parser(url) {
  try {
    const ads = await run(url);
    return ads;
  } catch (e) {
    throw e;
  }
};
