const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Stamp AI server is working");
});

// Поиск компании по ИНН через DaData
app.post("/company", async (req, res) => {
  try {
    const inn = req.body.inn || req.body.INN;

    // Tilda проверяет Webhook пустым запросом.
    // Для такой проверки отвечаем успешно.
    if (!inn) {
      return res.status(200).json({
        ok: true,
        message: "Webhook is working"
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
    console.error("DaData error:", error);

    res.status(500).json({
      error: "Ошибка сервера"
    });
  }
});

// Запрос к OpenAI
app.post("/ai", async (req, res) => {
  try {
    const message =
      req.body.message ||
      req.body.prompt ||
      req.body.text;

    // Проверка webhook пустым запросом
    if (!message) {
      return res.status(200).json({
        ok: true,
        message: "AI webhook is working"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY не настроен"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-6-luna",
          instructions:
            "Ты помощник сервиса Stamp AI. Отвечай на русском языке ясно, точно и по существу.",
          input: message
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error: "Ошибка при обращении к OpenAI",
        details: data
      });
    }

    const answer =
      data.output
        ?.flatMap(item => item.content || [])
        ?.find(item => item.type === "output_text")
        ?.text || "";

    res.json({
      ok: true,
      answer: answer
    });
  } catch (error) {
    console.error("AI server error:", error);

    res.status(500).json({
      error: "Ошибка сервера при обращении к ИИ"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Stamp AI server started on port ${PORT}`);
});
