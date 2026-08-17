import {
  GeminiAnalysisResult,
  WorkoutSessionSummary,
  ChatMessage,
  FoodScanResult
} from '../types';
import { StorageService } from './storageService';
import { ApiClient } from './apiClient';

export class GeminiService {
  private static getApiKey(): string {
    const settings = StorageService.getSettings();
    return settings.geminiApiKey?.trim() || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  }

  private static async executeGemini(payload: any, apiKey: string): Promise<any> {
    const models = ['gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash'];
    let lastError: any = null;

    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          return await response.json();
        }

        const errData = await response.json().catch(() => ({}));
        console.warn(`[GeminiService] Model ${model} returned ${response.status}:`, errData);
        lastError = new Error(`Model ${model} failed with ${response.status}`);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }

  public static async analyzeWorkoutSession(
    session: WorkoutSessionSummary
  ): Promise<GeminiAnalysisResult> {
    // 1. Try Backend Proxy First
    try {
      const backendResult = await ApiClient.analyzeWorkout(session);
      if (backendResult && backendResult.summary) {
        return backendResult;
      }
    } catch {
      // Fallback
    }

    const apiKey = this.getApiKey();

    const prompt = `
Bạn là một Chuyên gia Sinh cơ học Thể thao (Sports Biomechanist) & Huấn luyện viên Thể hình cao cấp (Elite AI Fitness Coach).
Hãy phân tích kết quả set tập sau đây của học viên và đưa ra nhận xét chuyên sâu bằng tiếng Việt theo định dạng JSON thuần túy (không markdown thừa):

THÔNG TIN SET TẬP:
- Tên bài tập: ${session.exerciseName} (ID: ${session.exerciseId})
- Số lần lặp hoàn thành (Reps): ${session.reps}
- Thời gian tập: ${session.durationSeconds} giây
- Điểm chuẩn form trung bình từ AI Vision: ${session.accuracyScore}%
- Các lỗi kỹ thuật phát hiện trong lúc tập: ${session.mistakes.length > 0 ? session.mistakes.join(', ') : 'Không có lỗi lớn'}

YÊU CẦU TRẢ VỀ JSON CHÍNH XÁC:
{
  "summary": "Đoạn văn ngắn 2-3 câu tổng kết súc tích, khích lệ và truyền cảm hứng.",
  "score": ${session.accuracyScore},
  "grade": "Xuất sắc" | "Tốt" | "Cần cải thiện",
  "strengths": ["Điểm làm tốt 1", "Điểm làm tốt 2"],
  "criticalMistakes": ["Lỗi cần khắc phục 1", "Lỗi cần khắc phục 2"],
  "actionableFixes": ["Cách sửa động tác cụ thể 1", "Cách sửa động tác cụ thể 2"],
  "injuryRiskAlert": "Cảnh báo nguy cơ chấn thương hoặc 'Tư thế an toàn.'",
  "nextWorkoutAdvice": "Lời khuyên cho hiệp tiếp theo."
}
`;

    try {
      const data = await this.executeGemini(
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        },
        apiKey
      );

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned) as GeminiAnalysisResult;
      }
    } catch (err) {
      console.warn('Gemini API call failed, using fallback:', err);
    }

    const score = Math.max(50, Math.min(100, session.accuracyScore || 85));
    const grade: 'Xuất sắc' | 'Tốt' | 'Cần cải thiện' =
      score >= 85 ? 'Xuất sắc' : score >= 70 ? 'Tốt' : 'Cần cải thiện';

    return {
      summary: `Bạn đã hoàn thành bài tập ${session.exerciseName} với ${session.reps} reps và đạt độ chuẩn form ${score}%. Tinh thần tập luyện rất tuyệt vời!`,
      score,
      grade,
      strengths: [
        `Duy trì liên tục ${session.reps} lần lặp trong ${session.durationSeconds} giây`,
        'Kiểm soát nhịp độ động tác và trục cột sống tương đối ổn định'
      ],
      criticalMistakes: session.mistakes.slice(0, 2),
      actionableFixes: [
        'Hít thở sâu bằng mũi khi hạ người, gồng chắc cơ bụng và thở dứt khoát bằng miệng khi phát lực.',
        'Tập trung vào cảm nhận cơ bắp đích và kiểm soát chuyển động chậm ở pha hạ (eccentric).'
      ],
      injuryRiskAlert:
        score >= 80
          ? 'Mức độ an toàn tốt, hãy chú ý khởi động xoay kỹ các khớp trước mỗi buổi tập.'
          : 'Lưu ý kiểm soát khớp gối và thắt lưng để tránh áp lực dồn vào sụn khớp.',
      nextWorkoutAdvice:
        'Nghỉ ngơi 60-90 giây, uống một ngụm nước nhỏ và bước vào hiệp tiếp theo với sự tập trung cao độ!'
    };
  }

  public static async chatWithCoach(
    history: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    const apiKey = this.getApiKey();

    const systemInstruction = {
      parts: [
        {
          text: `Bạn là AI FitCoach - Huấn luyện viên Thể hình, Giảng viên Sinh cơ học & Chuyên gia Dinh dưỡng AI cá nhân số 1 Việt Nam (chuẩn quốc tế NASM, NSCA, ISSA).
Nhiệm vụ của bạn là tư vấn chi tiết, khoa học và sâu sắc cho mọi thắc mắc của học viên (kỹ thuật từng bài tập, mẹo bảo vệ khớp và cột sống, cách chọn động tác an toàn, chế độ ăn tăng cơ giảm mỡ...).

Quy tắc trả lời:
- Luôn trả lời đầy đủ, chi tiết, giải thích rõ nguyên nhân cơ chế sinh học và đưa ra giải pháp từng bước cụ thể (Step-by-step).
- Liệt kê các bài tập rõ ràng với tên bài tập, cách thực hiện chuẩn, và mẹo giữ an toàn cho cột sống / khớp.
- Sử dụng tiếng Việt chuẩn mực, có emoji thể thao sinh động (💪, 🏋️, 🔥, 🥗, 🛡️, ✨).
- Không trả lời ngắn cụt hay chung chung. Hãy là một người thầy, một HLV tận tâm và thông thái.`
        }
      ]
    };

    // Filter out greeting messages and sanitize turns
    const filteredHistory = history.filter(m => m.id !== 'welcome' && m.id !== 'welcome_reset');
    const contents: any[] = [];

    for (const msg of filteredHistory.slice(-8)) {
      const role = msg.sender === 'user' ? 'user' : 'model';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        continue;
      }
      contents.push({
        role,
        parts: [{ text: msg.text }]
      });
    }

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts = [{ text: userMessage }];
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
    }

    try {
      const data = await this.executeGemini(
        {
          systemInstruction,
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          }
        },
        apiKey
      );

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return rawText.trim();
      }
    } catch (err) {
      console.warn('Gemini chat failed, using fallback:', err);
    }

    return `Cảm ơn câu hỏi của bạn về "${userMessage}". 💪\n\nĐể đạt hiệu quả tối ưu:\n1. **Dinh dưỡng chuẩn**: Đảm bảo nạp đủ lượng Protein (1.6 - 2.2g/kg thể trọng) và bù nước đầy đủ.\n2. **Kiểm soát form**: Luôn ưu tiên độ chuẩn xác của động tác trước khi tăng tạ hay tăng reps.\n3. **Hít thở đúng**: Hít vào khi hạ người, gồng siết cơ bụng và thở ra khi đẩy người lên.\n\nBạn có thể bật camera trong tab **Phòng Tập** hoặc **Quét Dinh Dưỡng** để tôi phân tích nhé! 🔥`;
  }

  /* ==========================================================================
     ADVANCED MULTIMODAL FOOD & CALORIE SCANNER (GEMINI AI VISION + NLP)
     ========================================================================== */

  public static async analyzeFood(
    queryOrDescription: string,
    imageBase64?: string
  ): Promise<FoodScanResult> {
    // 1. Try Backend Proxy First
    try {
      const backendResult = await ApiClient.scanFood(queryOrDescription, imageBase64);
      if (backendResult && backendResult.dishName) {
        return backendResult;
      }
    } catch {
      // Fallback
    }

    const apiKey = this.getApiKey();

    const systemPrompt = `
Bạn là một Chuyên gia Dinh dưỡng Thể thao (Sports Nutritionist) & AI Food Vision Expert hàng đầu thế giới (tương đương hệ thống MyFitnessPal / MacroFactor / Cal AI).
Nhiệm vụ của bạn là phân tích hình ảnh đĩa thức ăn hoặc tên món ăn được cung cấp, nhận diện chính xác từng nguyên liệu thực tế (như Phi lê cá hồi, Thịt bò, Mực ống, Ức gà, Tôm, Trứng, Cơm, Xà lách...), tính toán Calo (kcal), bóc tách 3 chất đa lượng chính (Protein, Carbs, Fat) và vi chất (Fiber, Sugar, Sodium), ước tính chỉ số đường huyết (Glycemic Index), tính toán thời gian tập luyện chính xác để đốt cháy lượng calo này và đưa ra lời khuyên dinh dưỡng hữu ích.

YÊU CẦU TRẢ VỀ JSON THUẦN TÚY (Strict JSON Schema):
{
  "dishName": "Tên món ăn cụ thể bằng tiếng Việt (ví dụ: Phi lê cá hồi áp chảo sốt chanh / Bò bít tết măng tây)",
  "dishNameEn": "Tên tiếng Anh (ví dụ: Pan-seared Salmon Fillet with Salad)",
  "confidenceScore": 95,
  "servingSize": "1 đĩa tiêu chuẩn (~350g)",
  "totalCalories": 480,
  "macros": {
    "protein": 38.0,
    "carbs": 12.0,
    "fat": 24.0,
    "fiber": 4.2,
    "sugar": 3.0,
    "sodiumMg": 520
  },
  "healthScore": 94,
  "glycemicIndex": "Thấp",
  "ingredients": [
    {
      "name": "Phi lê cá hồi Nauy áp chảo",
      "weightGrams": 180,
      "calories": 360,
      "protein": 36.0,
      "carbs": 0,
      "fat": 22.0,
      "fiber": 0
    },
    {
      "name": "Rau xà lách tươi & cà chua bi",
      "weightGrams": 120,
      "calories": 40,
      "protein": 2.0,
      "carbs": 7.0,
      "fat": 0.2,
      "fiber": 3.5
    },
    {
      "name": "Dầu ô liu nguyên chất & xốt chanh",
      "weightGrams": 15,
      "calories": 80,
      "protein": 0,
      "carbs": 1.0,
      "fat": 8.5,
      "fiber": 0
    }
  ],
  "burnEstimates": [
    {
      "exerciseId": "squat",
      "exerciseNameVi": "Squat (Gánh Đùi)",
      "durationMinutes": 38,
      "repsEstimate": 360
    },
    {
      "exerciseId": "pushup",
      "exerciseNameVi": "Push-up (Hít Đất)",
      "durationMinutes": 32,
      "repsEstimate": 300
    },
    {
      "exerciseId": "jumping_jack",
      "exerciseNameVi": "Jumping Jacks (Nhảy Bật)",
      "durationMinutes": 24,
      "repsEstimate": 450
    },
    {
      "exerciseId": "lunge",
      "exerciseNameVi": "Lunge (Chùng Chân)",
      "durationMinutes": 35,
      "repsEstimate": 320
    }
  ],
  "dietaryAdvice": {
    "muscleBuilding": "Rất giàu đạm hoàn chỉnh và axit béo Omega-3 chống viêm, hỗ trợ tối đa phục hồi và phát triển cơ nạc.",
    "fatLoss": "Hàm lượng tinh bột thấp kết hợp chất béo lành mạnh giúp tạo cảm giác no lâu, duy trì trạng thái đốt mỡ tự nhiên.",
    "overallAssessment": "Bữa ăn dinh dưỡng thể thao chuẩn mực cao, dồi dào vi chất và đạm sinh học hấp thu tốt.",
    "healthierAlternative": "Hạn chế xốt bơ hoặc sốt kem ngậy để tối ưu lượng calo nạp vào."
  }
}
`;

    try {
      const parts: any[] = [{ text: systemPrompt + `\n\nHãy phân tích kỹ hình ảnh thức ăn hoặc tên món: ${queryOrDescription}` }];

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

      const data = await this.executeGemini(
        {
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        },
        apiKey
      );

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned) as FoodScanResult;
        if (imageBase64) {
          parsed.imageBase64 = imageBase64;
        }
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini food scan API error, using rich local nutrition database fallback:', err);
    }

    return this.getLocalFoodAnalysis(queryOrDescription, imageBase64);
  }

  private static getLocalFoodAnalysis(query: string, imageBase64?: string): FoodScanResult {
    const q = query.toLowerCase();

    // 1. Phở bò
    if (q.includes('phở') || q.includes('pho') || q.includes('bò')) {
      return {
        dishName: 'Phở Bò Tái Nạm Hà Nội',
        dishNameEn: 'Vietnamese Beef Pho Noodle Soup',
        confidenceScore: 94,
        servingSize: '1 tô lớn (~650ml)',
        totalCalories: 485,
        macros: { protein: 32, carbs: 64, fat: 12, fiber: 2.5, sugar: 4.2, sodiumMg: 1150 },
        healthScore: 85,
        glycemicIndex: 'Trung bình',
        ingredients: [
          { name: 'Bánh phở tươi truyền thống', weightGrams: 200, calories: 220, protein: 4.5, carbs: 50, fat: 0.5, fiber: 1.0 },
          { name: 'Thịt bò nạc tái & nạm mềm', weightGrams: 120, calories: 180, protein: 26, carbs: 0, fat: 8, fiber: 0 },
          { name: 'Nước hầm xương bò & thảo mộc', weightGrams: 300, calories: 70, protein: 1.5, carbs: 12, fat: 3.5, fiber: 0.5 },
          { name: 'Hành hoa, giá đỗ & rau thơm', weightGrams: 50, calories: 15, protein: 0.8, carbs: 2.5, fat: 0.1, fiber: 1.0 }
        ],
        burnEstimates: [
          { exerciseId: 'squat', exerciseNameVi: 'Squat (Gánh Đùi)', durationMinutes: 38, repsEstimate: 360 },
          { exerciseId: 'pushup', exerciseNameVi: 'Push-up (Hít Đất)', durationMinutes: 32, repsEstimate: 300 },
          { exerciseId: 'jumping_jack', exerciseNameVi: 'Jumping Jacks', durationMinutes: 24, repsEstimate: 450 }
        ],
        dietaryAdvice: {
          muscleBuilding: 'Lượng protein cao từ thịt bò nạc dồi dào sắt sinh học và kẽm giúp tối ưu cơ bắp.',
          fatLoss: 'Ăn ít bánh phở lại và hạn chế húp cạn nước dùng đậm gia vị để giảm bớt lượng Natri.',
          overallAssessment: 'Bữa ăn giàu năng lượng và cân đối cho người tập luyện thể thao.',
          healthierAlternative: 'Yêu cầu quán lấy thịt bò phi lê nạc và nước dùng trong, không lấy mỡ gầu.'
        },
        imageBase64
      };
    }

    // 2. Cơm tấm
    if (q.includes('cơm tấm') || q.includes('com tam') || q.includes('sườn') || q.includes('suon')) {
      return {
        dishName: 'Cơm Tấm Sườn Bì Chả Trứng Ốp La',
        dishNameEn: 'Broken Rice with Grilled Pork & Egg',
        confidenceScore: 92,
        servingSize: '1 đĩa đầy đủ (~480g)',
        totalCalories: 680,
        macros: { protein: 36, carbs: 82, fat: 24, fiber: 3.8, sugar: 7.5, sodiumMg: 980 },
        healthScore: 78,
        glycemicIndex: 'Cao',
        ingredients: [
          { name: 'Cơm tấm dẻo nấu chín', weightGrams: 220, calories: 280, protein: 5.5, carbs: 62, fat: 0.8, fiber: 1.5 },
          { name: 'Sườn heo nướng mật ong', weightGrams: 130, calories: 260, protein: 22, carbs: 8, fat: 15, fiber: 0 },
          { name: 'Trứng gà ốp la lòng đào', weightGrams: 50, calories: 90, protein: 6.5, carbs: 0.5, fat: 7.0, fiber: 0 },
          { name: 'Chả trứng hấp & bì heo', weightGrams: 40, calories: 40, protein: 2.0, carbs: 1.5, fat: 1.2, fiber: 0.3 },
          { name: 'Dưa leo, cà chua & mỡ hành', weightGrams: 40, calories: 10, protein: 0.5, carbs: 2.0, fat: 0.5, fiber: 1.0 }
        ],
        burnEstimates: [
          { exerciseId: 'squat', exerciseNameVi: 'Squat (Gánh Đùi)', durationMinutes: 52, repsEstimate: 500 },
          { exerciseId: 'pushup', exerciseNameVi: 'Push-up (Hít Đất)', durationMinutes: 45, repsEstimate: 420 },
          { exerciseId: 'jumping_jack', exerciseNameVi: 'Jumping Jacks', durationMinutes: 34, repsEstimate: 620 }
        ],
        dietaryAdvice: {
          muscleBuilding: 'Lượng carb lớn giúp phục hồi nhanh kho Glycogen trong cơ bắp sau buổi tập nặng.',
          fatLoss: 'Nên giảm 1/2 lượng cơm tấm và không dùng mỡ hành để tiết kiệm 180 calo dư thừa.',
          overallAssessment: 'Bữa ăn giàu đạm nhưng có chỉ số đường huyết tương đối cao.',
          healthierAlternative: 'Dùng sườn cốt lết áp chảo ít dầu và đổi sang cơm tấm gạo lứt.'
        },
        imageBase64
      };
    }

    // 3. Salad ức gà
    if (q.includes('salad') || q.includes('ức gà') || q.includes('chicken') || q.includes('gà')) {
      return {
        dishName: 'Salad Ức Gà Áp Chảo Sốt Mè Rang',
        dishNameEn: 'Grilled Chicken Breast Salad with Sesame Dressing',
        confidenceScore: 96,
        servingSize: '1 tô salad (~350g)',
        totalCalories: 360,
        macros: { protein: 38, carbs: 14, fat: 16, fiber: 6.2, sugar: 4.0, sodiumMg: 420 },
        healthScore: 95,
        glycemicIndex: 'Thấp',
        ingredients: [
          { name: 'Ức gà ta nạc áp chảo tiêu đen', weightGrams: 160, calories: 190, protein: 34, carbs: 0, fat: 4.5, fiber: 0 },
          { name: 'Xà lách Romaine & bắp cải tím', weightGrams: 120, calories: 30, protein: 2.0, carbs: 5.5, fat: 0.3, fiber: 4.0 },
          { name: 'Cà chua bi & dưa chuột baby', weightGrams: 50, calories: 20, protein: 1.0, carbs: 3.5, fat: 0.2, fiber: 1.5 },
          { name: 'Sốt mè rang Nhật Bản & dầu ô liu', weightGrams: 20, calories: 120, protein: 1.0, carbs: 5.0, fat: 11.0, fiber: 0.7 }
        ],
        burnEstimates: [
          { exerciseId: 'squat', exerciseNameVi: 'Squat (Gánh Đùi)', durationMinutes: 28, repsEstimate: 260 },
          { exerciseId: 'pushup', exerciseNameVi: 'Push-up (Hít Đất)', durationMinutes: 24, repsEstimate: 220 },
          { exerciseId: 'jumping_jack', exerciseNameVi: 'Jumping Jacks', durationMinutes: 18, repsEstimate: 320 }
        ],
        dietaryAdvice: {
          muscleBuilding: 'Cung cấp 38g Protein tinh khiết với lượng chất béo bão hòa cực thấp.',
          fatLoss: 'Món ăn vàng trong làng siết mỡ (Cutting), tạo cảm giác no kéo dài nhờ hàm lượng chất xơ dồi dào.',
          overallAssessment: 'Bữa ăn chuẩn mẫu cho dân tập Gym và Fitness chuyên nghiệp.',
          healthierAlternative: 'Dùng sốt sữa chua Hy Lạp thay cho sốt mè béo để giảm thêm 80 calo.'
        },
        imageBase64
      };
    }

    // 4. Cá hồi / Hải sản
    if (q.includes('cá') || q.includes('ca') || q.includes('hồi') || q.includes('hoi') || q.includes('salmon') || q.includes('mực') || q.includes('tôm')) {
      return {
        dishName: 'Phi Lê Cá Hồi Áp Chảo Kèm Salad Tươi',
        dishNameEn: 'Pan-seared Salmon Fillet with Fresh Garden Salad',
        confidenceScore: 96,
        servingSize: '1 đĩa (~350g)',
        totalCalories: 420,
        macros: { protein: 38, carbs: 8, fat: 26, fiber: 3.5, sugar: 2.0, sodiumMg: 380 },
        healthScore: 96,
        glycemicIndex: 'Thấp',
        ingredients: [
          { name: 'Phi lê cá hồi Nauy áp chảo', weightGrams: 180, calories: 340, protein: 36, carbs: 0, fat: 22, fiber: 0 },
          { name: 'Rau xà lách tươi & cà chua bi', weightGrams: 120, calories: 35, protein: 2, carbs: 6, fat: 0.2, fiber: 3.2 },
          { name: 'Dầu ô liu & giấm chanh', weightGrams: 10, calories: 45, protein: 0, carbs: 1, fat: 4.5, fiber: 0 }
        ],
        burnEstimates: [
          { exerciseId: 'squat', exerciseNameVi: 'Squat (Gánh Đùi)', durationMinutes: 34, repsEstimate: 320 },
          { exerciseId: 'pushup', exerciseNameVi: 'Push-up (Hít Đất)', durationMinutes: 28, repsEstimate: 260 },
          { exerciseId: 'jumping_jack', exerciseNameVi: 'Jumping Jacks', durationMinutes: 21, repsEstimate: 390 }
        ],
        dietaryAdvice: {
          muscleBuilding: 'Dồi dào đạm và Omega-3 chống viêm mô cơ hiệu quả sau các buổi tập cường độ cao.',
          fatLoss: 'Carb cực thấp, giàu chất béo tốt giúp tăng độ nhạy Insulin và hỗ trợ đốt mỡ tự nhiên.',
          overallAssessment: 'Bữa ăn thượng hạng cho sức khỏe tim mạch và phát triển cơ bắp nạc.',
          healthierAlternative: 'Áp chảo không dầu hoặc nướng nồi chiên không dầu để giữ vị ngọt tự nhiên.'
        },
        imageBase64
      };
    }

    // Generic Balanced Fitness Meal Fallback
    const cleanDishName = query.trim() || 'Khẩu Phần Ăn Thể Hình Tiêu Chuẩn';
    return {
      dishName: cleanDishName,
      dishNameEn: 'Healthy Fitness Balanced Meal',
      confidenceScore: 90,
      servingSize: '1 khẩu phần tiêu chuẩn (~400g)',
      totalCalories: 520,
      macros: { protein: 32, carbs: 56, fat: 16, fiber: 5.4, sugar: 4.5, sodiumMg: 620 },
      healthScore: 88,
      glycemicIndex: 'Trung bình',
      ingredients: [
        { name: 'Nguồn đạm nạc (Thịt / Cá / Trứng)', weightGrams: 150, calories: 230, protein: 28, carbs: 1, fat: 8, fiber: 0 },
        { name: 'Tinh bột phức (Cơm / Khoai / Bánh)', weightGrams: 160, calories: 210, protein: 4, carbs: 45, fat: 1, fiber: 2.2 },
        { name: 'Rau xanh & củ quả tươi', weightGrams: 120, calories: 35, protein: 1.5, carbs: 7, fat: 0.2, fiber: 3.2 },
        { name: 'Gia vị & dầu ô liu áp chảo', weightGrams: 10, calories: 45, protein: 0, carbs: 0.5, fat: 5, fiber: 0 }
      ],
      burnEstimates: [
        { exerciseId: 'squat', exerciseNameVi: 'Squat (Gánh Đùi)', durationMinutes: 40, repsEstimate: 380 },
        { exerciseId: 'pushup', exerciseNameVi: 'Push-up (Hít Đất)', durationMinutes: 35, repsEstimate: 320 },
        { exerciseId: 'jumping_jack', exerciseNameVi: 'Jumping Jacks', durationMinutes: 26, repsEstimate: 470 }
      ],
      dietaryAdvice: {
        muscleBuilding: 'Bữa ăn cung cấp đủ 32g protein để kích hoạt quá trình tổng hợp protein cơ bắp (MPS).',
        fatLoss: 'Tỷ lệ calo và đạm rất hợp lý, có thể duy trì đều đặn trong thực đơn hằng ngày.',
        overallAssessment: 'Khẩu phần ăn cân bằng, giàu năng lượng sạch và lành mạnh.',
        healthierAlternative: 'Tăng lượng rau xanh để tăng vitamin khoáng chất và cảm giác no lâu.'
      },
      imageBase64
    };
  }
}
