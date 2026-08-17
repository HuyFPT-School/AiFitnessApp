const mongoose = require('mongoose');

const mongoUri =
  process.env.MONGO_URI ||
  'mongodb://huylmnse181744_db_user:HvqaBt0DKPNwl2Ac@ac-jlbdfux-shard-00-00.zkxc7w1.mongodb.net:27017,ac-jlbdfux-shard-00-01.zkxc7w1.mongodb.net:27017,ac-jlbdfux-shard-00-02.zkxc7w1.mongodb.net:27017/FitnessApp?ssl=true&authSource=admin';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos';

// Default mappings for core standard exercises if needed
const CORE_MAPPINGS = {
  squat: `${CDN_BASE}/3220-f9lVSSI.gif`,
  pushup: `${CDN_BASE}/0426-A6wtbuL.gif`,
  lunge: `${CDN_BASE}/1775-VO2qeJg.gif`,
  bicep_curl: `${CDN_BASE}/0001-2gPfomN.gif`,
  deadlift: `${CDN_BASE}/1756-gEyURal.gif`,
  shoulder_press: `${CDN_BASE}/0010-8K0w2yA.gif`,
  plank: `${CDN_BASE}/0426-A6wtbuL.gif`,
  jumping_jack: `${CDN_BASE}/3220-f9lVSSI.gif`,
  warrior_yoga: `${CDN_BASE}/1775-VO2qeJg.gif`
};

async function updateDbGifs() {
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB Atlas successfully');

  const db = mongoose.connection.db;
  const exercises = await db.collection('exercises').find({}).toArray();
  console.log(`📦 Found ${exercises.length} exercises in database\n`);

  let updatedCount = 0;

  for (const ex of exercises) {
    let newGifUrl = ex.gifUrl;

    if (ex.gifUrl) {
      const match = ex.gifUrl.match(/([0-9]{4}-[a-zA-Z0-9_-]+\.gif)/i);
      if (match) {
        newGifUrl = `${CDN_BASE}/${match[1]}`;
      } else if (ex.gifUrl.startsWith('/exercises/')) {
        const key = ex.gifUrl.replace('/exercises/', '').replace('.gif', '');
        if (CORE_MAPPINGS[key]) {
          newGifUrl = CORE_MAPPINGS[key];
        }
      }
    }

    if (newGifUrl && newGifUrl !== ex.gifUrl) {
      await db.collection('exercises').updateOne(
        { _id: ex._id },
        { $set: { gifUrl: newGifUrl } }
      );
      updatedCount++;
      console.log(`🔄 [${ex.nameVi}]: ${ex.gifUrl} ➔ ${newGifUrl}`);
    }
  }

  console.log(`\n🎉 HOÀN TẤT! Đã cập nhật ${updatedCount}/${exercises.length} bài tập sang link CDN toàn cầu vĩnh viễn!`);
  await mongoose.disconnect();
}

updateDbGifs().catch(console.error);
