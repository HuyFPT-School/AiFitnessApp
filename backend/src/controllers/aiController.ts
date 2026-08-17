import { Request, Response } from 'express';

const getApiKey = (): string => {
  return process.env.GEMINI_API_KEY || 'AIzaSyA7mjSYqhM-vgzL1vX6nmQFlX9sovZSG5g';
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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
      })
    });

    if (!geminiRes.ok) {
      throw new Error(`Gemini API returned ${geminiRes.status}`);
    }

    const data = await geminiRes.json();
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
Bạn là một Chuyên gia Dinh dưỡng Thể thao (Sports Nutritionist) & AI Food Vision Expert hàng đầu thế giới.
Hãy phân tích hình ảnh đĩa thức ăn hoặc tên món ăn được cung cấp, nhận diện chính xác từng nguyên liệu, tính toán Calo (kcal), bóc tách 3 chất đa lượng chính (Protein, Carbs, Fat) và vi chất, ước tính thời gian tập luyện để đốt cháy lượng calo này và đưa ra lời khuyên dinh dưỡng hữu ích.

YÊU CẦU TRẢ VỀ JSON THUẦN TÚY:
{
  "dishName": "Tên món ăn bằng tiếng Việt",
  "dishNameEn": "Tên tiếng Anh",
  "confidenceScore": 95,
  "servingSize": "1 đĩa tiêu chuẩn (~420g)",
  "totalCalories": 650,
  "macros": {
    "protein": 34.5,
    "carbs": 78.0,
    "fat": 22.0,
    "fiber": 4.2
  },
  "healthScore": 85,
  "glycemicIndex": "Trung bình",
  "ingredients": [
    { "name": "Nguyên liệu 1", "weightGrams": 150, "calories": 250, "protein": 25, "carbs": 2, "fat": 15 }
  ],
  "burnEstimates": [
    { "exerciseId": "squat", "exerciseNameVi": "Squat (Gánh Đùi)", "durationMinutes": 45, "repsEstimate": 420 },
    { "exerciseId": "pushup", "exerciseNameVi": "Push-up (Hít Đất)", "durationMinutes": 38, "repsEstimate": 350 },
    { "exerciseId": "jumping_jack", "exerciseNameVi": "Jumping Jacks", "durationMinutes": 28, "repsEstimate": 520 }
  ],
  "dietaryAdvice": {
    "muscleBuilding": "Lời khuyên tăng cơ",
    "fatLoss": "Lời khuyên giảm mỡ",
    "overallAssessment": "Đánh giá tổng quan"
  }
}
`;

    const parts: any[] = [{ text: systemPrompt + `\n\nThông tin món ăn: ${query || 'Món ăn dinh dưỡng'}` }];

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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
      })
    });

    if (!geminiRes.ok) {
      throw new Error(`Gemini Food Scan API error: ${geminiRes.status}`);
    }

    const data = await geminiRes.json();
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

// @desc    High-fidelity Google Natural TTS Audio Stream Proxy
// @route   GET /api/ai/tts?lang=vi&text=...
export const streamGoogleTTS = async (req: Request, res: Response): Promise<void> => {
  try {
    const text = (req.query.text as string) || 'Xin chào';
    const lang = (req.query.lang as string) || 'vi';

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
      lang
    )}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;

    const ttsRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!ttsRes.ok) {
      res.status(ttsRes.status).send('TTS upstream error');
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    const arrayBuffer = await ttsRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    High-fidelity Neural AI (VieNeu-TTS) Audio Stream Proxy
// @route   GET /api/ai/tts-neural?text=...&voice=vi_nam&speed=1.05
export const streamNeuralTTS = async (req: Request, res: Response): Promise<void> => {
  try {
    const text = (req.query.text as string) || 'Xin chào';
    const voice = (req.query.voice as string) || 'vi_nam';
    const speed = (req.query.speed as string) || '1.05';

    const pythonTTSUrl = `http://localhost:8000/synthesize?text=${encodeURIComponent(
      text
    )}&voice=${encodeURIComponent(voice)}&speed=${encodeURIComponent(speed)}`;

    try {
      const pyRes = await fetch(pythonTTSUrl);
      if (pyRes.ok) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const buffer = await pyRes.arrayBuffer();
        res.send(Buffer.from(buffer));
        return;
      }
    } catch {
      // Fallback to Google TTS if Python service is offline
    }

    // Fallback to Google TTS stream
    const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(
      text.slice(0, 200)
    )}`;
    const googleRes = await fetch(fallbackUrl);
    if (googleRes.ok) {
      res.setHeader('Content-Type', 'audio/mpeg');
      const buf = await googleRes.arrayBuffer();
      res.send(Buffer.from(buf));
      return;
    }

    res.status(500).send('TTS service unavailable');
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Generate personalized 3-phase AI workout routine (Gemini 2.5 Flash)
// @route   POST /api/ai/generate-routine
export const generateWorkoutRoutine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { goal, fitnessLevel, durationMinutes, focusArea } = req.body;
    const apiKey = getApiKey();

    const goalMap: Record<string, string> = {
      hypertrophy: 'Tăng cơ giảm mỡ (Hypertrophy & Fat Loss)',
      hiit: 'Đốt mỡ siêu tốc (HIIT & High Intensity Cardio)',
      posture: 'Chỉnh dáng & chống gù lưng (Posture & Spine Health)',
      abs: 'Săn chắc cơ bụng 6 múi (Abs & Core Strength)',
      mobility: 'Dẻo dai & phục hồi năng lượng (Mobility & Active Recovery)'
    };

    const levelMap: Record<string, string> = {
      beginner: 'Người mới bắt đầu (Beginner)',
      intermediate: 'Trung cấp (Đã tập 3-6 tháng)',
      advanced: 'Nâng cao (Advanced Athlete)'
    };

    const focusMap: Record<string, string> = {
      fullbody: 'Toàn thân (Full Body)',
      lower: 'Thân dưới (Mông - Đùi / Lower Body)',
      upper: 'Thân trên (Ngực - Tay - Vai / Upper Body)',
      core: 'Cơ bụng & Cơ lõi (Core & Abs)'
    };

    const requestedGoal = goalMap[goal] || goal || 'Tăng cơ giảm mỡ';
    const requestedLevel = levelMap[fitnessLevel] || fitnessLevel || 'Người mới bắt đầu';
    const requestedFocus = focusMap[focusArea] || focusArea || 'Toàn thân';
    const requestedDuration = Number(durationMinutes) || 20;

    const prompt = `
Bạn là Huấn luyện viên thể hình cá nhân (Elite Personal Trainer - PT) & Chuyên gia Sinh cơ học Thể thao hàng đầu.
Hãy thiết kế một "GIÁO ÁN TẬP LUYỆN CHUẨN KHOA HỌC 3 GIAI ĐOẠN" được cá nhân hóa cao cấp cho học viên sau:

THÔNG TIN HỌC VIÊN:
- Mục tiêu: ${requestedGoal}
- Trình độ thể lực: ${requestedLevel}
- Thời lượng buổi tập: ${requestedDuration} phút
- Nhóm cơ trọng tâm: ${requestedFocus}

DANH SÁCH BÀI TẬP CÓ SẴN TRONG HỆ THỐNG AI VISION CỦA ỨNG DỤNG (Ưu tiên dùng exerciseId này để người tập có thể bấm nút "Tập Với AI Camera"):
- "squat": Squat (Gánh Đùi)
- "pushup": Push-up (Hít Đất)
- "plank": Plank (Đo Ván Giữ Cố Định) [isHold: true]
- "lunge": Lunge (Chùng Chân Bước Tới)
- "bicep_curl": Bicep Curl (Cuốn Tay Trước)
- "jumping_jack": Jumping Jack (Nhảy Bật Tay Chân)
- "shoulder_press": Shoulder Press (Đẩy Vai Qua Đầu)
- "warrior_yoga": Warrior II (Tư Thế Chiến Binh Yoga) [isHold: true]
- "deadlift": Romanian Deadlift (Kéo Tạ Đùi Sau & Mông)

YÊU CẦU ĐỊNH DẠNG JSON THUẦN TÚY (Không markdown backticks):
{
  "title": "Tiêu đề giáo án cuốn hút, truyền cảm hứng",
  "goal": "${requestedGoal}",
  "level": "${requestedLevel}",
  "durationMinutes": ${requestedDuration},
  "estimatedCalories": số nguyên ước tính calo đốt cháy (ví dụ: ${Math.round(requestedDuration * 7.5)}),
  "overview": "Đoạn văn ngắn 2-3 câu giải thích tại sao giáo án này phù hợp và nguyên lý khoa học phía sau.",
  "warmUp": [
    {
      "name": "Tên động tác khởi động",
      "durationSeconds": 60,
      "instruction": "Hướng dẫn xoay khớp / làm ấm cơ ngắn gọn"
    }
  ],
  "mainRoutine": [
    {
      "exerciseId": "squat" | "pushup" | "plank" | "lunge" | "bicep_curl" | "jumping_jack" | "shoulder_press" | "warrior_yoga" | "deadlift",
      "exerciseName": "Tên tiếng Việt",
      "exerciseNameEn": "Tên tiếng Anh",
      "sets": 3,
      "reps": 12,
      "isHold": false,
      "restSeconds": 45,
      "formCue": "Mẹo then chốt giữ form chuẩn (1 câu)",
      "targetMuscle": "Nhóm cơ tác động chính",
      "gifUrl": "/exercises/squat.gif" hoặc "/dataset_videos/..."
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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
      const geminiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json' }
        })
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
          res.json({ success: true, data: JSON.parse(cleaned) });
          return;
        }
      }
    } catch (apiErr) {
      console.warn('Gemini generateRoutine error, using smart local template:', apiErr);
    }

    // Smart Fallback Template
    const fallbackRoutine = getSmartFallbackRoutine(goal, fitnessLevel, requestedDuration, focusArea);
    res.json({ success: true, data: fallbackRoutine });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function getSmartFallbackRoutine(goal: string, level: string, duration: number, focus: string) {
  const isBeginner = level === 'beginner';
  const repsMultiplier = isBeginner ? 0.8 : level === 'advanced' ? 1.3 : 1.0;

  return {
    title: `Giáo Án ${goal === 'hiit' ? 'Đốt Mỡ HIIT Siêu Tốc' : goal === 'abs' ? 'Săn Chắc Cơ Bụng 6 Múi' : 'Tăng Cơ Toàn Thân Chuẩn Khoa Học'} ${duration} Phút`,
    goal: goal || 'Tăng cơ giảm mỡ',
    level: level || 'Người mới bắt đầu',
    durationMinutes: duration,
    estimatedCalories: Math.round(duration * 8),
    overview: `Lộ trình tập luyện 3 giai đoạn tối ưu hóa khả năng kích hoạt sợi cơ và giải phóng năng lượng, được thiết kế chuyên biệt cho thể trạng ${level}.`,
    warmUp: [
      { name: 'Xoay khớp cổ chân, cổ tay & đầu gối', durationSeconds: 60, instruction: 'Xoay tròn nhẹ nhàng bôi trơn ổ khớp và tăng tiết hoạt dịch.' },
      { name: 'Xoay khớp vai & xoay hông', durationSeconds: 60, instruction: 'Mở rộng biên độ lồng ngực, đánh thức các nhóm cơ hỗ trợ.' },
      { name: 'Jumping Jacks nhịp độ nhẹ', durationSeconds: 60, instruction: 'Tăng dần nhịp tim và làm ấm toàn bộ cơ thể.' }
    ],
    mainRoutine: [
      {
        exerciseId: 'squat',
        exerciseName: 'Squat (Gánh Đùi)',
        exerciseNameEn: 'Bodyweight Squat',
        sets: isBeginner ? 3 : 4,
        reps: Math.round(12 * repsMultiplier),
        isHold: false,
        restSeconds: 45,
        formCue: 'Hạ hông xuống sâu, mở gối theo hướng mũi chân và đẩy gót đứng lên.',
        targetMuscle: 'Cơ đùi trước & Cơ mông',
        gifUrl: '/exercises/squat.gif'
      },
      {
        exerciseId: 'pushup',
        exerciseName: 'Push-up (Hít Đất)',
        exerciseNameEn: 'Standard Push-Up',
        sets: isBeginner ? 3 : 4,
        reps: Math.round(10 * repsMultiplier),
        isHold: false,
        restSeconds: 45,
        formCue: 'Khuỷu tay gập góc 45 độ so với thân người, siết cứng cơ bụng.',
        targetMuscle: 'Cơ ngực & Cơ tay sau',
        gifUrl: '/exercises/pushup.gif'
      },
      {
        exerciseId: 'lunge',
        exerciseName: 'Lunge (Chùng Chân Bước Tới)',
        exerciseNameEn: 'Forward Lunge',
        sets: 3,
        reps: Math.round(10 * repsMultiplier),
        isHold: false,
        restSeconds: 45,
        formCue: 'Gối chân trước gập 90 độ, giữ thân trên thẳng đứng thăng bằng.',
        targetMuscle: 'Cơ đùi trước & Cơ đùi sau',
        gifUrl: '/exercises/lunge.gif'
      },
      {
        exerciseId: 'plank',
        exerciseName: 'Plank (Đo Ván Giữ Cố Định)',
        exerciseNameEn: 'Forearm Plank',
        sets: 3,
        reps: Math.round(30 * repsMultiplier),
        isHold: true,
        restSeconds: 30,
        formCue: 'Thẳng hàng tuyệt đối từ vai - hông - gót chân, siết chặt cơ mông.',
        targetMuscle: 'Cơ lõi & Cơ bụng thẳng',
        gifUrl: '/exercises/plank.gif'
      }
    ],
    coolDown: [
      { name: 'Giãn cơ đùi trước (Standing Quad Stretch)', durationSeconds: 45, instruction: 'Đứng một chân, kéo gót chân chạm mông để thư giãn cơ tứ đầu.' },
      { name: 'Giãn cơ ngực và vai (Chest Wall Stretch)', durationSeconds: 45, instruction: 'Tựa cẳng tay vào tường và xoay nhẹ thân trên mở ngực.' },
      { name: 'Tư thế em bé (Child’s Pose)', durationSeconds: 60, instruction: 'Hạ hông lên gót chân, vươn dài hai tay về trước giải tỏa áp lực cột sống.' }
    ],
    coachTip: 'Uống ngay 250–350ml nước lọc và nạp 20–25g protein sau buổi tập để cơ bắp phục hồi và phát triển tối đa!'
  };
}



