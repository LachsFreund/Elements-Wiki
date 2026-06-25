const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static("."));

app.get("/load", (req, res) => {

    const data = fs.readFileSync("saves.json", "utf8");

    res.send(data);
});

app.post("/save", (req, res) => {

    fs.writeFileSync(
        "saves.json",
        JSON.stringify(req.body, null, 4)
    );

    res.send({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});