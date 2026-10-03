const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Stamp AI server is working");
});

app.post("/company", async (req, res) => {
  try {
    const { inn } = req.body;

    if (!inn) {
      return res.status(400).json({
        error: "Введите ИНН"
      });
    }

    const response = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${process.env.DADATA_API_KEY}`
        },
        body: JSON.stringify({
          query: inn
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Ошибка при обращении к DaData",
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Ошибка сервера"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Stamp AI server started on port ${PORT}`);
});
