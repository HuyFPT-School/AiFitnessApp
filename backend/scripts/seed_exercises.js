const mongoose = require('mongoose');

const uri = 'mongodb://huylmnse181744_db_user:HvqaBt0DKPNwl2Ac@ac-jlbdfux-shard-00-00.zkxc7w1.mongodb.net:27017,ac-jlbdfux-shard-00-01.zkxc7w1.mongodb.net:27017,ac-jlbdfux-shard-00-02.zkxc7w1.mongodb.net:27017/FitnessApp?ssl=true&authSource=admin';

const EXERCISES_SEED = [
  {
    nameVi: 'Squat (Gánh Đùi)',
    nameEn: 'Bodyweight Squat',
    category: 'Legs',
    difficulty: 'Dễ',
    caloriesPerMinute: 8,
    targetMuscles: ['Cơ đùi trước (Quadriceps)', 'Cơ mông (Glutes)', 'Cơ đùi sau (Hamstrings)', 'Cơ lõi (Core)'],
    iconName: 'Activity',
    description: 'Vua của các bài tập thân dưới giúp phát triển sức mạnh đùi, mông và sự thăng bằng.',
    keyFormRules: [
      'Góc gối ở điểm sâu nhất cần < 100° (đùi song song sàn)',
      'Đầu gối hướng theo mũi chân, không chụm gối vào trong (Knee valgus)',
      'Thân người giữ góc nghiêng tự nhiên ~60°-75°, không gập lưng quá sâu',
      'Gót chân chạm đất vững chắc suốt chuyển động'
    ],
    commonMistakes: [
      'Hạ hông chưa đủ sâu (nửa rep)',
      'Gối chụm vào trong (nguy cơ chấn thương dây chằng)',
      'Lưng bị cong hoặc gập người chúc về phía trước',
      'Nhấc gót chân lên khi hạ người'
    ],
    defaultTargetReps: 12,
    isHoldExercise: false,
    cameraAdvice: 'Đứng cách camera 2-3 mét, góc nhìn hơi chếch (45 độ) hoặc nhìn nghiêng cạnh bên để AI quét rõ góc gối và lưng.',
    gifUrl: '/exercises/squat.gif',
    customBiomechanics: {
      primaryAngle: 'leftKnee',
      minAngle: 75,
      maxAngle: 165,
      repThresholdDown: 95,
      repThresholdUp: 155
    },
    isCustom: false
  },
  {
    nameVi: 'Push-up (Hít Đất)',
    nameEn: 'Standard Push-Up',
    category: 'Chest',
    difficulty: 'Trung bình',
    caloriesPerMinute: 9,
    targetMuscles: ['Cơ ngực (Pectorals)', 'Cơ tay sau (Triceps)', 'Cơ vai trước (Anterior Deltoids)', 'Cơ bụng'],
    iconName: 'Zap',
    description: 'Bài tập thể trọng kinh điển cho thân trên, tăng sức mạnh ngực, vai và cơ lõi.',
    keyFormRules: [
      'Khuỷu tay gập góc < 90° ở đáy chuyển động',
      'Khuỷu tay tạo góc 45° so với thân người (không bạnh 90° sang 2 bên)',
      'Toàn bộ cơ thể (vai - hông - gót chân) tạo thành một đường thẳng (góc hông ~170°-180°)',
      'Không võng lưng hoặc nhô mông lên cao'
    ],
    commonMistakes: [
      'Võng lưng dưới (thả lỏng cơ bụng)',
      'Bạnh khuỷu tay quá rộng làm ép khớp vai',
      'Chỉ gật đầu thay vì hạ toàn bộ ngực',
      'Đẩy mông lên hình chóp tam giác'
    ],
    defaultTargetReps: 10,
    isHoldExercise: false,
    cameraAdvice: 'Đặt điện thoại/laptop ngang tầm sàn nhà hoặc trên ghế thấp, hướng camera vuông góc với cạnh bên cơ thể.',
    gifUrl: '/exercises/pushup.gif',
    customBiomechanics: {
      primaryAngle: 'leftElbow',
      minAngle: 70,
      maxAngle: 165,
      repThresholdDown: 90,
      repThresholdUp: 155
    },
    isCustom: false
  },
  {
    nameVi: 'Plank (Đo Ván Giữ Cố Định)',
    nameEn: 'Forearm Plank',
    category: 'Core',
    difficulty: 'Trung bình',
    caloriesPerMinute: 6,
    targetMuscles: ['Cơ bụng thẳng (Rectus Abdominis)', 'Cơ bụng ngang', 'Cơ lưng dưới', 'Cơ mông'],
    iconName: 'Shield',
    description: 'Bài tập đẳng trường (isometric) rèn luyện độ bền bỉ cơ lõi và cột sống vững chắc.',
    keyFormRules: [
      'Thẳng hàng tuyệt đối: Tai - Vai - Hông - Gót chân nằm trên một trục thẳng (170° - 180°)',
      'Khuỷu tay đặt ngay dưới khớp vai, góc 90°',
      'Siết chặt cơ mông và gồng chắc thành bụng',
      'Mắt nhìn chéo xuống sàn, giữ cổ trung tính không ngửa hay gập'
    ],
    commonMistakes: [
      'Võng hông xuống sàn gây đau thắt lưng',
      'Nhô mông quá cao làm giảm tải lực vào cơ bụng',
      'Gồng cứng vai và ngửa cổ nhìn về trước',
      'Nín thở trong lúc giữ'
    ],
    defaultTargetReps: 30,
    isHoldExercise: true,
    idealHoldDurationSec: 30,
    cameraAdvice: 'Đặt camera ngang tầm người từ góc nhìn nghiêng bên hông cách 2 mét để AI kiểm tra độ thẳng cột sống.',
    gifUrl: '/exercises/plank.gif',
    customBiomechanics: {
      primaryAngle: 'leftHip',
      minAngle: 160,
      maxAngle: 180,
      repThresholdDown: 165,
      repThresholdUp: 180
    },
    isCustom: false
  },
  {
    nameVi: 'Lunge (Chùng Chân Bước Tới)',
    nameEn: 'Forward Lunge',
    category: 'Legs',
    difficulty: 'Trung bình',
    caloriesPerMinute: 8,
    targetMuscles: ['Cơ đùi trước', 'Cơ đùi sau', 'Cơ mông', 'Cơ bắp chân'],
    iconName: 'Flame',
    description: 'Tăng cường sức mạnh đơn chân (unilateral), cải thiện khả năng thăng bằng và linh hoạt hông.',
    keyFormRules: [
      'Gối chân trước gập góc 90°, không đẩy vượt quá xa đầu ngón chân',
      'Gối chân sau hạ sát sàn cách ~3-5cm, tạo góc ~90°',
      'Thân trên giữ thẳng đứng 90° so với mặt đất',
      'Trọng tâm phân bổ đều giữa hai chân'
    ],
    commonMistakes: [
      'Đầu gối chân trước đâm quá xa về phía trước',
      'Nghiêng ngả thân người sang hai bên',
      'Bước quá ngắn khiến góc gối bị gò bó'
    ],
    defaultTargetReps: 10,
    isHoldExercise: false,
    cameraAdvice: 'Đặt máy cách 2.5m chếch góc 45 độ để thấy rõ cả 2 đầu gối và trục thân người.',
    gifUrl: '/exercises/lunge.gif',
    customBiomechanics: {
      primaryAngle: 'leftKnee',
      minAngle: 80,
      maxAngle: 165,
      repThresholdDown: 95,
      repThresholdUp: 155
    },
    isCustom: false
  },
  {
    nameVi: 'Bicep Curl (Cuốn Tay Trước)',
    nameEn: 'Bicep Curls',
    category: 'Arms',
    difficulty: 'Dễ',
    caloriesPerMinute: 5,
    targetMuscles: ['Cơ tay trước (Biceps Brachii)', 'Cơ cánh tay trước (Brachialis)'],
    iconName: 'Dumbbell',
    description: 'Bài tập cô lập tăng kích thước và sức mạnh con chuột bắp tay.',
    keyFormRules: [
      'Khóa cố định cùi chỏ sát sườn, không để cùi chỏ trôi ra trước hay sau',
      'Gập tay tối đa đưa góc khuỷu tay < 50°',
      'Duỗi thẳng có kiểm soát đưa góc khuỷu tay > 155°',
      'Không đung đưa lưng hoặc dùng đà quán tính'
    ],
    commonMistakes: [
      'Vung cùi chỏ ra phía trước để dùng đà',
      'Ưỡn người ra sau khi nâng tạ nặng',
      'Chưa duỗi hết tay ở đáy chuyển động'
    ],
    defaultTargetReps: 12,
    isHoldExercise: false,
    cameraAdvice: 'Đứng đối diện trực diện hoặc nghiêng 30 độ trước camera, cách 1.5 - 2 mét.',
    gifUrl: '/exercises/bicep_curl.gif',
    customBiomechanics: {
      primaryAngle: 'leftElbow',
      minAngle: 45,
      maxAngle: 165,
      repThresholdDown: 60,
      repThresholdUp: 150
    },
    isCustom: false
  },
  {
    nameVi: 'Jumping Jack (Nhảy Bật Tay Chân)',
    nameEn: 'Jumping Jacks',
    category: 'Core',
    difficulty: 'Dễ',
    caloriesPerMinute: 11,
    targetMuscles: ['Tim mạch (Cardio)', 'Cơ bắp chân', 'Cơ vai', 'Cơ đùi trong/ngoài'],
    iconName: 'HeartPulse',
    description: 'Bài tập cardio toàn thân kích hoạt nhịp tim, đốt mỡ và tăng độ dẻo dai.',
    keyFormRules: [
      'Bật nhảy dang rộng 2 chân hơn vai, đồng thời vung 2 tay qua đầu chạm nhau',
      'Tiếp đất êm bằng nửa bàn chân trước để giảm áp lực lên khớp gối',
      'Duy trì nhịp thở đều đặn, không gồng cứng cơ vai'
    ],
    commonMistakes: [
      'Tiếp đất dằn bằng cả gót chân gây chấn động cột sống',
      'Tay không đưa hết tầm qua đầu',
      'Mất nhịp phối hợp giữa tay và chân'
    ],
    defaultTargetReps: 20,
    isHoldExercise: false,
    cameraAdvice: 'Đứng trực diện camera cách 2.5 - 3 mét để thấy trọn vẹn toàn thân từ đầu đến chân.',
    gifUrl: '/dataset_videos/3220-f9lVSSI.gif',
    customBiomechanics: {
      primaryAngle: 'leftShoulder',
      minAngle: 30,
      maxAngle: 160,
      repThresholdDown: 40,
      repThresholdUp: 145
    },
    isCustom: false
  },
  {
    nameVi: 'Shoulder Press (Đẩy Vai)',
    nameEn: 'Overhead Shoulder Press',
    category: 'Shoulders',
    difficulty: 'Trung bình',
    caloriesPerMinute: 7,
    targetMuscles: ['Cơ vai (Deltoids)', 'Cơ tay sau (Triceps)', 'Cơ cầu vai (Trapezius)'],
    iconName: 'ChevronUp',
    description: 'Xây dựng cơ bắp vai vạm vỡ và tăng cường sức mạnh đẩy thân trên.',
    keyFormRules: [
      'Bắt đầu với khuỷu tay ngang ngực/vai tạo góc 90°',
      'Đẩy thẳng tạ lên đỉnh đầu cho đến khi duỗi thẳng tay (góc khuỷu > 160°)',
      'Không ưỡn lưng dưới quá mức khi đẩy nặng',
      'Hạ tạ có kiểm soát trở lại vị trí ngang cằm/tai'
    ],
    commonMistakes: [
      'Ưỡn cong thắt lưng để hỗ trợ đẩy',
      'Đẩy tạ lệch ra phía trước thay vì đẩy thẳng trục trên đỉnh đầu',
      'Khóa khớp khuỷu tay quá đột ngột'
    ],
    defaultTargetReps: 10,
    isHoldExercise: false,
    cameraAdvice: 'Đứng hoặc ngồi trước camera cách 2m thấy rõ từ thắt lưng lên trên đầu.',
    gifUrl: '/dataset_videos/0426-A6wtbuL.gif',
    customBiomechanics: {
      primaryAngle: 'leftElbow',
      minAngle: 85,
      maxAngle: 165,
      repThresholdDown: 95,
      repThresholdUp: 155
    },
    isCustom: false
  },
  {
    nameVi: 'Warrior II (Tư Thế Chiến Binh Yoga)',
    nameEn: 'Warrior II Pose (Virabhadrasana)',
    category: 'Yoga',
    difficulty: 'Trung bình',
    caloriesPerMinute: 5,
    targetMuscles: ['Cơ đùi trong', 'Cơ hông', 'Cơ vai', 'Cơ lõi'],
    iconName: 'Smile',
    description: 'Tư thế yoga kinh điển giúp mở rộng hông, kéo giãn lồng ngực và rèn luyện tâm trí vững vàng.',
    keyFormRules: [
      'Gối chân trước gập 90°, hướng thẳng hàng với ngón chân thứ hai',
      'Chân sau duỗi thẳng hoàn toàn, mép bàn chân áp sát thảm',
      'Hai tay dang ngang song song mặt đất, vai thả lỏng',
      'Thân người ở vị trí trung tâm, không đổ nghiêng về phía trước'
    ],
    commonMistakes: [
      'Gối chân trước bị sụp vào trong',
      'Thân người bị chồm quá nhiều về phía chân trước',
      'Vai bị co rút gồng cứng lên sát tai'
    ],
    defaultTargetReps: 30,
    isHoldExercise: true,
    idealHoldDurationSec: 30,
    cameraAdvice: 'Đặt máy cách 2.5m nhìn trực diện để thấy toàn bộ sải tay và sải chân chiến binh.',
    gifUrl: '/dataset_videos/1775-VO2qeJg.gif',
    customBiomechanics: {
      primaryAngle: 'leftKnee',
      minAngle: 85,
      maxAngle: 175,
      repThresholdDown: 90,
      repThresholdUp: 170
    },
    isCustom: false
  }
];

mongoose.connect(uri).then(async () => {
  const collection = mongoose.connection.collection('exercises');

  console.log('🌱 Đang đồng bộ danh mục bài tập vào MongoDB Atlas...');

  for (const ex of EXERCISES_SEED) {
    await collection.updateOne(
      { nameVi: ex.nameVi },
      { $set: { ...ex, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    console.log('   ✅ Đã nạp:', ex.nameVi);
  }

  const count = await collection.countDocuments();
  console.log(`\n🎉 HOÀN TẤT! Tổng số bài tập trong MongoDB Atlas: ${count}`);
  process.exit(0);
}).catch(err => {
  console.error('❌ Lỗi kết nối:', err);
  process.exit(1);
});
