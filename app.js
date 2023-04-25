const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");

const imageStatsFile = "imageStats.json";

const readImageStats = () => {
  const data = fs.readFileSync(imageStatsFile);
  return JSON.parse(data);
};

const writeImageStats = (imageStats) => {
  fs.writeFileSync(imageStatsFile, JSON.stringify(imageStats, null, 2));
};

app.get("/", (req, res) => {
  fs.readdir("images", (err, files) => {
    const randomIndex = Math.floor(Math.random() * files.length);
    const randomImage = files[randomIndex];
    const imageJson = JSON.parse(fs.readFileSync(`imageData/${path.parse(randomImage).name}.json`, "utf-8"));
    res.render("index", { imageFile: randomImage, attributes: imageJson.attributes });
  });
});

app.post("/rate", (req, res) => {
  const { imageFile, rating } = req.body;
  const imageStats = readImageStats();

  if (!imageStats[imageFile]) {
    imageStats[imageFile] = { likes: 0, dislikes: 0, attributes: {} };
  }
  if (rating === "like") {
    imageStats[imageFile].likes += 1;
  } else if (rating === "dislike") {
    imageStats[imageFile].dislikes += 1;
  }

  const imageJson = JSON.parse(fs.readFileSync(`imageData/${path.parse(imageFile).name}.json`, "utf-8"));
  imageJson.attributes.forEach((attribute) => {
    if (!imageStats[imageFile].attributes[attribute.trait_type]) {
      imageStats[imageFile].attributes[attribute.trait_type] = { [attribute.value]: { likes: 0, dislikes: 0 } };
    } else if (!imageStats[imageFile].attributes[attribute.trait_type][attribute.value]) {
      imageStats[imageFile].attributes[attribute.trait_type][attribute.value] = { likes: 0, dislikes: 0 };
    }

    if (rating === "like") {
      imageStats[imageFile].attributes[attribute.trait_type][attribute.value].likes += 1;
    } else if (rating === "dislike") {
      imageStats[imageFile].attributes[attribute.trait_type][attribute.value].dislikes += 1;
    }
  });

  writeImageStats(imageStats);
  res.redirect("/");
});

app.get("/stats", (req, res) => {
  const imageStats = readImageStats();
  res.render("stats", { imageStats });
});

app.use("/images", express.static(path.join(__dirname, "images")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
