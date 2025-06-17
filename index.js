import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import fs from "fs";

const dataPath = "./data.json";
const git = simpleGit();

// Jumlah commit dalam satu hari (supaya hijau gelap/full)
const commitsPerDay = 30;

// Fungsi untuk waktu acak dalam sehari
function getRandomTime(index) {
  const hour = Math.floor(index / 2); // Biarkan tersebar sepanjang hari
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  return moment().hour(hour).minute(minute).second(second);
}

const today = moment();
const day = today.day(); // 0 (Minggu) - 6 (Sabtu)

async function commitMultipleTimes() {
  for (let i = 0; i < commitsPerDay; i++) {
    const commitTime = getRandomTime(i);
    const formattedDate = commitTime.format();

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

if (day === 0 || day === 6) {
  commitMultipleTimes();
} else {
  console.log("⏸️ Bukan hari Sabtu atau Minggu. Tidak commit.");
}
