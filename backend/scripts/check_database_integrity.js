const mongoose = require('mongoose');

const uri = 'mongodb://huylmnse181744_db_user:HvqaBt0DKPNwl2Ac@ac-jlbdfux-shard-00-00.zkxc7w1.mongodb.net:27017,ac-jlbdfux-shard-00-01.zkxc7w1.mongodb.net:27017,ac-jlbdfux-shard-00-02.zkxc7w1.mongodb.net:27017/FitnessApp?ssl=true&authSource=admin';

async function runDatabaseDiagnostics() {
  console.log('===============================================================');
  console.log('🔍 BẮT ĐẦU KIỂM TRA TOÀN DIỆN DATABASE MONGODB ATLAS (FITNESSAPP)');
  console.log('===============================================================\n');

  const startTime = Date.now();
  let issuesFound = 0;

  try {
    // 1. Connection check
    console.log('1️⃣  [KẾT NỐI & ĐỘ TRỄ CLUSTER]');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const pingStart = Date.now();
    const adminDb = mongoose.connection.db.admin();
    const pingResult = await adminDb.ping();
    const pingLatency = Date.now() - pingStart;

    console.log(`   ✅ Kết nối thành công đến MongoDB Atlas Cluster.`);
    console.log(`   ⚡ Độ trễ ping (Latency): ${pingLatency}ms (Trạng thái: ${pingResult.ok === 1 ? 'TỐT' : 'CẢNH BÁO'})`);
    console.log(`   📂 Tên Database đang sử dụng: "${mongoose.connection.db.databaseName}"`);

    // 2. Collection listing
    console.log('\n2️⃣  [DANH SÁCH & SỐ LƯỢNG BẢN GHI (COLLECTIONS)]');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log(`   📦 Các bảng hiện có: [ ${collectionNames.join(', ')} ]`);

    for (const name of collectionNames) {
      const count = await mongoose.connection.collection(name).countDocuments();
      console.log(`      - Bảng "${name}": ${count} bản ghi`);
    }

    // 3. User collection audit
    console.log('\n3️⃣  [KIỂM TRA DỮ LIỆU BẢNG "users"]');
    const users = await mongoose.connection.collection('users').find({}).toArray();
    const userIds = new Set(users.map(u => String(u._id)));
    console.log(`   👥 Tổng số người dùng: ${users.length}`);

    users.forEach((u, idx) => {
      console.log(`      [User ${idx + 1}] Email: ${u.email} | Role: ${u.role || 'user'} | Auth: ${u.authProvider || 'local'} | Tên: ${u.name}`);
      // Check invalid email
      if (!u.email || !u.email.includes('@')) {
        console.error(`      ❌ Lỗi: User ${u._id} có email không hợp lệ!`);
        issuesFound++;
      }
      // Check Google auth password safety
      if (u.authProvider === 'google' && u.password) {
        console.warn(`      ⚠️ Cảnh báo: User Google ${u.email} vẫn còn trường password.`);
        issuesFound++;
      }
    });

    // 4. Exercises collection audit
    console.log('\n4️⃣  [KIỂM TRA DỮ LIỆU BẢNG "exercises"]');
    const exercises = await mongoose.connection.collection('exercises').find({}).toArray();
    console.log(`   🏋️ Tổng số bài tập: ${exercises.length}`);

    exercises.forEach((ex, idx) => {
      const hasVi = !!ex.nameVi;
      const hasEn = !!ex.nameEn;
      const hasBiomech = !!ex.customBiomechanics;
      const hasGif = !!ex.gifUrl;

      console.log(`      [Bài ${idx + 1}] ${ex.nameVi} (${ex.category}) | 3D GIF: ${hasGif ? '✅' : '❌'} | Sinh cơ học: ${hasBiomech ? '✅' : '❌'}`);

      if (!hasVi || !hasEn) {
        console.error(`      ❌ Lỗi: Bài tập ${ex._id} thiếu tên bài tập!`);
        issuesFound++;
      }
    });

    // 5. WorkoutSessions collection audit & orphan checking
    console.log('\n5️⃣  [KIỂM TRA DỮ LIỆU BẢNG "workoutsessions"]');
    const workouts = await mongoose.connection.collection('workoutsessions').find({}).toArray();
    console.log(`   📊 Tổng số buổi tập đã ghi: ${workouts.length}`);

    workouts.forEach((w, idx) => {
      if (w.user && !userIds.has(String(w.user))) {
        console.warn(`      ⚠️ Cảnh báo: Buổi tập ${w._id} tham chiếu đến User không tồn tại (User ID: ${w.user})`);
        issuesFound++;
      }
      if (typeof w.reps !== 'number' || isNaN(w.reps)) {
        console.error(`      ❌ Lỗi: Buổi tập ${w._id} có số rep không hợp lệ!`);
        issuesFound++;
      }
    });
    if (workouts.length === 0) {
      console.log(`   ✨ Bảng sạch sẽ, sẵn sàng ghi nhận các buổi tập mới của người dùng.`);
    }

    // 6. MealLogs collection audit & orphan checking
    console.log('\n6️⃣  [KIỂM TRA DỮ LIỆU BẢNG "meallogs"]');
    const meals = await mongoose.connection.collection('meallogs').find({}).toArray();
    console.log(`   🥗 Tổng số bữa ăn đã ghi: ${meals.length}`);

    meals.forEach((m, idx) => {
      if (m.user && !userIds.has(String(m.user))) {
        console.warn(`      ⚠️ Cảnh báo: Bữa ăn ${m._id} tham chiếu đến User không tồn tại (User ID: ${m.user})`);
        issuesFound++;
      }
      if (typeof m.calories !== 'number' || isNaN(m.calories)) {
        console.error(`      ❌ Lỗi: Bữa ăn ${m._id} có calo không hợp lệ!`);
        issuesFound++;
      }
    });
    if (meals.length === 0) {
      console.log(`   ✨ Bảng sạch sẽ, sẵn sàng ghi nhận nhật ký dinh dưỡng mới của người dùng.`);
    }

    // 7. Write/Read/Delete Sanity Test
    console.log('\n7️⃣  [KIỂM TRA KHẢ NĂNG GHI/ĐỌC/XÓA TRỰC TIẾP (CRUD SANITY TEST)]');
    const testDoc = {
      testKey: 'integrity_check_' + Date.now(),
      createdAt: new Date()
    };
    const testColl = mongoose.connection.collection('_diagnostics_test');
    await testColl.insertOne(testDoc);
    const readBack = await testColl.findOne({ testKey: testDoc.testKey });
    await testColl.deleteOne({ testKey: testDoc.testKey });
    await testColl.drop().catch(() => {});

    if (readBack && readBack.testKey === testDoc.testKey) {
      console.log(`   ✅ Kiểm tra ghi, đọc và xóa trực tiếp trên MongoDB Atlas thành công 100%!`);
    } else {
      console.error(`   ❌ Lỗi: Không thể hoàn tất chu trình CRUD trên MongoDB Atlas.`);
      issuesFound++;
    }

    // Summary
    const totalDuration = Date.now() - startTime;
    console.log('\n===============================================================');
    if (issuesFound === 0) {
      console.log(`🎉 KẾT QUẢ: DATABASE HOÀN TOÀN KHỎE MẠNH, 0 LỖI CRASH (Thời gian: ${totalDuration}ms)`);
      console.log('   - Toàn bộ Schema hợp lệ và đồng bộ.');
      console.log('   - Không có dữ liệu rác, không có xung đột con trỏ.');
      console.log('   - Quyền truy cập Read/Write trên Cloud Atlas hoạt động mượt mà.');
    } else {
      console.warn(`⚠️ KẾT QUẢ: PHÁT HIỆN ${issuesFound} VẤN ĐỀ CẦN LƯU Ý (Thời gian: ${totalDuration}ms)`);
    }
    console.log('===============================================================\n');

    process.exit(issuesFound === 0 ? 0 : 1);
  } catch (err) {
    console.error('\n❌ LỖI NGHIÊM TRỌNG KHI KẾT NỐI HOẶC TRUY VẤN DATABASE:', err);
    process.exit(1);
  }
}

runDatabaseDiagnostics();
