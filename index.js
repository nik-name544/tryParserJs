const parser = require("./parser");
const fs = require("fs");

const parse = async () => {
  try {
    await parser("https://www.olx.ua/nedvizhimost/")
      .then((res) => JSON.stringify(res, undefined, 2))
      .then((res) => fs.writeFileSync("JSONData.json", res));
  } catch (e) {
    console.log(e);
  }
  //   const getHTML = async (url) => {
  //     const { data } = await axios.get(url);
  //     return cheerio.load(data);
  //   };

  //   const newData = await getHTML('https://kanobu.ru/games/popular/')
  //   let JSONData = JSON.stringify(newData.html(), undefined, 2)
  //   console.log(JSONData)
  //   fs.writeFileSync('JSONData.json', JSONData)
};
parse();
