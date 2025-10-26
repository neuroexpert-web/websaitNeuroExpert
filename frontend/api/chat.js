export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Используем рабочую модель Gemini без -latest
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GOOGLE_API_KEY;

    // Проверка наличия текста в запросе
    const userPrompt =
      req.body?.prompt ||
      'Привет! Я AI-консультант NeuroExpert на базе Google Gemini. Чем могу помочь?';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: userPrompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res
        .status(response.status)
        .json({ error: 'Ошибка выполнения запроса к Gemini API', details: data });
    }

    // Отправляем клиенту ответ модели
    res.status(200).json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res
      .status(500)
      .json({ error: 'Ошибка на сервере', details: error.message });
  }
}
