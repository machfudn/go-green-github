import jsonfile from 'jsonfile';
import moment from 'moment-timezone';
import simpleGit from 'simple-git';

const dataPath = './data.json';
const git = simpleGit();
const commitsPerDay = 25; // Jumlah commit per hari

const today = moment().tz('Asia/Jakarta');

function getRandomTime(index) {
  // Hanya ambil jam dari 6 pagi sampai 11 malam (23)
  const hour = Math.floor(Math.random() * (24 - 6)) + 6; // 6 sampai 23
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);

  return today.clone().hour(hour).minute(minute).second(second);
}

async function commitMultipleTimes() {
  for (let i = 0; i < commitsPerDay; i++) {
    const commitTime = getRandomTime(i);

    // formattedDate untuk opsi --date git (tetap default moment.format())
    const gitDateFormatted = commitTime.format();

    // formattedDate untuk pesan commit (lebih mudah dibaca)
    // Contoh: '2025-07-11 18:55:48'
    const commitMessageFormattedDate = commitTime.format('YYYY-MM-DD HH:mm:ss');

    const data = { date: gitDateFormatted }; // Simpan format asli jika itu yang Anda inginkan di JSON
    await jsonfile.writeFile(dataPath, data, { spaces: 2 });
    await git.add([dataPath]);

    // Pesan commit menggunakan commitMessageFormattedDate
    await git.commit(`Auto commit #${i + 1} on ${commitMessageFormattedDate}`, {
      '--date': gitDateFormatted, // Opsi --date tetap menggunakan format asli untuk akurasi git
    });

    console.log(`✅ Commit #${i + 1} on ${commitMessageFormattedDate}`);
  }

  await git.push();
  console.log(`🚀 Pushed ${commitsPerDay} commits!`);
}

console.log(`📅 Hari ini (Jakarta): ${today.format('dddd, YYYY-MM-DD HH:mm:ss')}`);

// Komit setiap hari (hapus batas weekend)
commitMultipleTimes();
