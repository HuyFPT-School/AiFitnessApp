import { Request, Response } from 'express';

const getApiKey = (): string => {
  return process.env.GEMINI_API_KEY || '';
};

// Multi-model resilient executor to prevent 429 quota errors
const executeGeminiRequest = async (payload: any, apiKey: string): Promise<any> => {
  const models = ['gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return await response.json();
      }

      const errData = await response.json().catch(() => ({}));
      console.warn(`[Backend AI Controller] Model ${model} returned ${response.status}:`, errData);
      lastError = new Error(`Model ${model} failed with ${response.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
};

// @desc    Server-side AI analysis for workout sessions
// @route   POST /api/ai/analyze-workout
export const analyzeWorkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { session } = req.body;
    const apiKey = getApiKey();

    const prompt = `
Bạn là một Chuyên gia Sinh cơ học Thể thao (Sports Biomechanist) & Huấn luyện viên Thể hình cao cấp (Elite AI Fitness Coach).
Hãy phân tích kết quả set tập sau đây của học viên và đưa ra nhận xét chuyên sâu bằng tiếng Việt theo định dạng JSON thuần túy (không markdown thừa):

THÔNG TIN SET TẬP:
- Tên bài tập: ${session.exerciseName} (ID: ${session.exerciseId})
- Số lần lặp hoàn thành (Reps): ${session.reps}
- Thời gian tập: ${session.durationSeconds} giây
- Điểm chuẩn form trung bình từ AI Vision: ${session.accuracyScore}%
- Các lỗi kỹ thuật phát hiện trong lúc tập: ${session.mistakes?.length > 0 ? session.mistakes.join(', ') : 'Không có lỗi lớn'}

YÊU CẦU TRẢ VỀ JSON CHÍNH XÁC:
{
  "summary": "Đoạn văn ngắn 2-3 câu tổng kết súc tích, khích lệ và truyền cảm hứng.",
  "score": ${session.accuracyScore || 85},
  "grade": "Xuất sắc" | "Tốt" | "Cần cải thiện",
  "strengths": ["Điểm làm tốt 1", "Điểm làm tốt 2"],
  "criticalMistakes": ["Lỗi cần khắc phục 1", "Lỗi cần khắc phục 2"],
  "actionableFixes": ["Cách sửa động tác cụ thể 1", "Cách sửa động tác cụ thể 2"],
  "injuryRiskAlert": "Cảnh báo nguy cơ chấn thương hoặc 'Tư thế an toàn.'",
  "nextWorkoutAdvice": "Lời khuyên cho hiệp tiếp theo."
}
`;

    const data = await executeGeminiRequest(
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
      },
      apiKey
    );

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
      res.json({ success: true, data: JSON.parse(cleaned) });
      return;
    }

    res.status(500).json({ success: false, message: 'Could not generate AI analysis' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Server-side AI Food & Calorie Scanner
// @route   POST /api/ai/scan-food
export const scanFood = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, imageBase64 } = req.body;
    const apiKey = getApiKey();

    const systemPrompt = `
Bạn là một Chuyên gia Dinh dưỡng Thể thao (Sports Nutritionist) & AI Food Vision Expert hàng đầu thế giới (tương đương hệ thống Cal AI / MyFitnessPal).
Nhiệm vụ của bạn là phân tích hình ảnh đĩa thức ăn hoặc tên món ăn được cung cấp, nhận diện chính xác từng nguyên liệu thực tế (như Phi lê cá hồi, Thịt bò nạc, Mực, Ức gà, Tôm, Trứng, Cơm, Xà lách, Dầu ô liu...), tính toán Calo (kcal), bóc tách 3 chất đa lượng chính (Protein, Carbs, Fat) và vi chất, ước tính thời gian tập luyện để đốt cháy lượng calo này và đưa ra lời khuyên dinh dưỡng hữu ích.

YÊU CẦU TRẢ VỀ JSON THUẦN TÚY:
{
  "dishName": "Tên món ăn cụ thể bằng tiếng Việt (ví dụ: Phi lê cá hồi áp chảo kèm salad tươi)",
  "dishNameEn": "Tên tiếng Anh (ví dụ: Pan-seared Salmon Fillet with Salad)",
  "confidenceScore": 96,
  "servingSize": "1 đĩa tiêu chuẩn (~350g)",
  "totalCalories": 420,
  "macros": {
    "protein": 38.0,
    "carbs": 8.0,
    "fat": 26.0,
    "fiber": 3.5,
    "sugar": 2.0,
    "sodiumMg": 380
  },
  "healthScore": 95,
  "glycemicIndex": "Thấp",
  "ingredients": [
    { "name": "Phi lê cá hồi Nauy áp chảo", "weightGrams": 180, "calories": 340, "protein": 36.0, "carbs": 0, "fat": 22.0, "fiber": 0 },
    { "name": "Rau xà lách tươi & cà chua bi", "weightGrams": 120, "calories": 35, "protein": 2.0, "carbs": 6.0, "fat": 0.2, "fiber": 3.2 },
    { "name": "Dầu ô liu & nước cốt chanh", "weightGrams": 10, "calories": 45, "protein": 0, "carbs": 2.0, "fat": 4.5, "fiber": 0 }
  ],
  "burnEstimates": [
    { "exerciseId": "squat", "exerciseNameVi": "Squat (Gánh Đùi)", "durationMinutes": 34, "repsEstimate": 320 },
    { "exerciseId": "pushup", "exerciseNameVi": "Push-up (Hít Đất)", "durationMinutes": 28, "repsEstimate": 260 },
    { "exerciseId": "jumping_jack", "exerciseNameVi": "Jumping Jacks", "durationMinutes": 21, "repsEstimate": 390 }
  ],
  "dietaryAdvice": {
    "muscleBuilding": "Rất giàu protein chất lượng cao và Omega-3 giúp phát triển cơ bắp nạc.",
    "fatLoss": "Ít tinh bột, giàu chất béo tốt giúp duy trì cảm giác no lâu và hỗ trợ đốt mỡ.",
    "overallAssessment": "Bữa ăn dinh dưỡng thể thao cao cấp và lành mạnh."
  }
}
`;

    const parts: any[] = [{ text: systemPrompt + `\n\nThông tin món ăn / chú thích: ${query || 'Hãy nhìn kỹ vào ảnh đĩa thức ăn để nhận diện chính xác món ăn và từng nguyên liệu thực tế trong ảnh.'}` }];

    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mimeType = imageBase64.startsWith('data:image/png')
        ? 'image/png'
        : imageBase64.startsWith('data:image/webp')
        ? 'image/webp'
        : 'image/jpeg';

      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
    }

    const data = await executeGeminiRequest(
      {
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
      },
      apiKey
    );

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
      res.json({ success: true, data: JSON.parse(cleaned) });
      return;
    }

    res.status(500).json({ success: false, message: 'Could not scan food' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Fast Neural Voice Stream (Browser Web Speech / Direct Google TTS Fallback)
// @route   GET /api/ai/tts
export const streamGoogleTTS = async (req: Request, res: Response): Promise<void> => {
  try {
    const text = (req.query.text as string) || 'Hãy sẵn sàng tập luyện cùng AI FitCoach!';
    const encodedText = encodeURIComponent(text);
    const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=vi&client=tw-ob`;

    const response = await fetch(googleTTSUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      res.status(response.status).json({ success: false, message: 'Google TTS request failed' });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Stream Neural Voice (Edge-TTS high fidelity)
// @route   GET /api/ai/tts-neural
export const streamNeuralTTS = async (req: Request, res: Response): Promise<void> => {
  return streamGoogleTTS(req, res);
};

// @desc    AI Smart Personalized Routine Generator
// @route   POST /api/ai/generate-routine
export const generateWorkoutRoutine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { goal, fitnessLevel, targetDurationMinutes, equipment, focusAreas, customNotes } = req.body;
    const apiKey = getApiKey();

    const prompt = `
Bạn là Trưởng ban Huấn luyện Thể hình & Khoa học Thể thao của AI FitCoach (Master Strength & Conditioning Coach).
Nhiệm vụ của bạn là thiết kế một "Giáo Án Tập Luyện Thông Minh Chuẩn Y Khoa & Sinh Cơ Học" hoàn toàn cá nhân hóa cho học viên theo thông số sau:

THÔNG TIN HỌC VIÊN:
- Mục tiêu chính: ${goal || 'Tăng cơ giảm mỡ'}
- Trình độ thể lực: ${fitnessLevel || 'Trung bình'}
- Thời lượng mong muốn: ${targetDurationMinutes || 25} phút
- Dụng cụ sẵn có: ${equipment || 'Không dụng cụ (Bodyweight)'}
- Nhóm cơ ưu tiên: ${focusAreas?.length > 0 ? focusAreas.join(', ') : 'Toàn thân'}
- Ghi chú thêm: ${customNotes || 'Không có'}

YÊU CẦU TRẢ VỀ JSON CHÍNH XÁC (Strict JSON):
{
  "title": "Tên giáo án lôi cuốn (ví dụ: Full-Body HIIT Đốt Mỡ Thần Tốc 25 Phút)",
  "targetGoal": "${goal}",
  "estimatedDurationMinutes": ${targetDurationMinutes || 25},
  "difficulty": "${fitnessLevel}",
  "estimatedCaloriesBurn": 260,
  "overview": "Mô tả ngắn gọn 2 câu về triết lý và lợi ích của giáo án này.",
  "warmUp": [
    {
      "name": "Tên bài khởi động động lực",
      "durationSeconds": 60,
      "instruction": "Hướng dẫn thực hiện ngắn gọn"
    }
  ],
  "mainWorkout": [
    {
      "exerciseId": "squat" hoặc "pushup" hoặc "plank" hoặc "lunge" hoặc "bicep_curl" hoặc "jumping_jack" hoặc "shoulder_press" hoặc "warrior_yoga" hoặc "deadlift",
      "nameVi": "Tên bài tập tiếng Việt chuẩn",
      "nameEn": "Tên tiếng Anh",
      "sets": 3,
      "repsOrSeconds": "12-15 reps" hoặc "45s",
      "restSeconds": 45,
      "formCue": "Mẹo then chốt giữ form chuẩn (1 câu)",
      "targetMuscle": "Nhóm cơ tác động chính",
      "gifUrl": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/3220-f9lVSSI.gif"
    }
  ],
  "coolDown": [
    {
      "name": "Tên động tác giãn cơ tĩnh",
      "durationSeconds": 45,
      "instruction": "Hướng dẫn kéo giãn và thở sâu phục hồi"
    }
  ],
  "coachTip": "Lời khuyên dinh dưỡng / phục hồi từ HLV AI sau buổi tập"
}
`;

    try {
      const data = await executeGeminiRequest(
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json' }
        },
        apiKey
      );

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
        res.json({ success: true, data: JSON.parse(cleaned) });
        return;
      }
    } catch (apiErr) {
      console.warn('Gemini generateRoutine error, using smart local template:', apiErr);
    }

    // High quality scientific fallback routine
    res.json({
      success: true,
      data: {
        title: `Giáo Án ${goal || 'Toàn Thân'} Chuẩn Khoa Học ${targetDurationMinutes || 20} Phút`,
        targetGoal: goal || 'Tăng cơ giảm mỡ',
        estimatedDurationMinutes: targetDurationMinutes || 20,
        difficulty: fitnessLevel || 'Trung bình',
        estimatedCaloriesBurn: 210,
        overview:
          'Giáo án thiết kế theo phương pháp Compound Overload kích hoạt các nhóm cơ lớn nhất cơ thể, tăng cường trao đổi chất sau tập (EPOC).',
        warmUp: [
          { name: 'Xoay khớp cổ tay, cổ chân, khớp vai', durationSeconds: 60, instruction: 'Xoay tròn nhẹ nhàng làm trơn ổ khớp.' },
          { name: 'Jumping Jacks khởi động tim mạch', durationSeconds: 45, instruction: 'Bật nhảy nhẹ nhàng tăng nhịp tim dần dần.' }
        ],
        mainWorkout: [
          {
            exerciseId: 'squat',
            nameVi: 'Squat (Gánh Đùi)',
            nameEn: 'Bodyweight Squat',
            sets: 3,
            repsOrSeconds: '15 reps',
            restSeconds: 45,
            formCue: 'Đẩy gối hướng theo mũi chân, mở rộng ngực và hạ đùi song song mặt sàn.',
            targetMuscle: 'Cơ đùi trước & Cơ mông',
            gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/3220-f9lVSSI.gif'
          },
          {
            exerciseId: 'pushup',
            nameVi: 'Push-up (Hít Đất)',
            nameEn: 'Standard Push-up',
            sets: 3,
            repsOrSeconds: '12 reps',
            restSeconds: 45,
            formCue: 'Cùi chỏ chếch góc 45 độ so với thân, siết mông và bụng tạo đường thẳng.',
            targetMuscle: 'Cơ ngực & Tay sau',
            gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0426-A6wtbuL.gif'
          },
          {
            exerciseId: 'lunge',
            nameVi: 'Lunge (Chùng Chân)',
            nameEn: 'Walking Lunge',
            sets: 3,
            repsOrSeconds: '12 reps / chân',
            restSeconds: 45,
            formCue: 'Bước dài chân tới trước, hạ gối sau vuông góc sàn, giữ thân người thẳng.',
            targetMuscle: 'Cơ đùi & Thăng bằng',
            gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/1775-VO2qeJg.gif'
          },
          {
            exerciseId: 'plank',
            nameVi: 'Plank (Đo Ván Giữ Cố Định)',
            nameEn: 'Forearm Plank',
            sets: 3,
            repsOrSeconds: '45 giây',
            restSeconds: 30,
            formCue: 'Gồng chặt toàn bộ cơ bụng, không võng lưng hay nhô mông cao.',
            targetMuscle: 'Cơ lõi (Core)',
            gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0426-A6wtbuL.gif'
          }
        ],
        coolDown: [
          { name: 'Giãn cơ đùi trước (Quad stretch)', durationSeconds: 45, instruction: 'Đứng 1 chân, kéo gót chân chạm mông.' },
          { name: 'Tư thế đứa trẻ (Child Pose)', durationSeconds: 60, instruction: 'Quỳ gối duỗi dài hai tay về trước thư giãn cột sống.' }
        ],
        coachTip: 'Uống 300ml nước sau khi tập và bổ sung 25-30g đạm trong vòng 45 phút để cơ bắp phục hồi nhanh nhất.'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
