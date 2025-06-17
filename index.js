import jsonfile from "jsonfile";
import moment from "moment-timezone";
import simpleGit from "simple-git";
import fs from "fs";

const dataPath = "./data.json";
const git = simpleGit();
const commitsPerDay = 30;

// Ambil tanggal hari ini dalam zona waktu Jakarta
const today = moment().tz("Asia/Jakarta");
const day = today.day(); // 0 = Minggu, 6 = Sabtu

function getRandomTime(index) {
  const hour = Math.floor(index / 2); // Sebar sepanjang hari
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);

  // Ambil clone dari hari ini agar tidak pakai waktu sekarang (UTC)
  return today.clone().hour(hour).minute(minute).second(second);
}

async function commitMultipleTimes() {
  for (let i = 0; i < commitsPerDay; i++) {
    const commitTime = getRandomTime(i);
    const formattedDate = commitTime.format(); // ISO format

    const data = { date: formattedDate };

    await jsonfile.writeFile(dataPath, data, { spaces: 2 });
    await git.add([dataPath]);
    await git.commit(`Auto commit #${i + 1} on ${formattedDate}`, {
      "--date": formattedDate,
    });

    console.log(`✅ Commit #${i + 1} on ${formattedDate}`);
  }

  await git.push();
  console.log(`🚀 Pushed ${commitsPerDay} commits!`);
}

console.log(`📅 Hari ini (Jakarta): ${today.format("dddd, YYYY-MM-DD HH:mm:ss")}`);

if (day === 0 || day === 6) {
  commitMultipleTimes();
} else {
  console.log("⏸️ Bukan hari Sabtu atau Minggu. Tidak commit.");
}
