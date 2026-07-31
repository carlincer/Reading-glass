export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: '이미지 데이터가 전달되지 않았습니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel 환경 변수(GEMINI_API_KEY)가 설정되지 않았습니다.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: '이미지에 보이는 모든 글자(한글, 영어, 숫자)를 정확하게 읽어서 반환해줘. 설명이나 인삿말 없이 오직 읽은 텍스트만 출력해줘. 만약 글자가 전혀 없다면 "글자를 찾을 수 없습니다"라고만 답해줘.'
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: image
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error Detail:', JSON.stringify(data));
      const apiErrorMsg = data.error?.message || 'Gemini API 호출 실패';
      return res.status(response.status).json({ error: `API 오류: ${apiErrorMsg}` });
    }

    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return res.status(200).json({ text: extractedText });
  } catch (error) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
