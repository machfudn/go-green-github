<h1 align="center">Selamat datang di Go Green - Github! 👋</h1>

Bot otomatis yang membuat commit dengan timestamp acak ke `data.json` lalu push, supaya grafik kontribusi GitHub tetap hijau setiap hari.

## Cara kerja

- Workflow GitHub Actions jalan **sekali sehari** pukul 00:05 UTC (07:05 WIB) lewat cron.
- Script menentukan hari (Senin–Minggu) dan cek `holidays.json`:
  - **Hari kerja** (Senin–Jumat, bukan libur): commit **5–10** kali.
  - **Akhir pekan atau libur nasional/cuti bersama**: commit **1–3** kali.
- Setiap commit memakai waktu acak dalam jendela jam **08:00–17:00 WIB**, unik dan terurut.
- Semua commit dalam satu run, lalu **1x push**.

## TechStack

- **TypeScript**
- **Yaml**
- **Node.js** (runtime, `simple-git`)

## Pengaturan (env di workflow)

| Variable       | Default        | Keterangan                    |
| -------------- | -------------- | ----------------------------- |
| `GIT_USER`     | `Machfudin`    | Nama untuk git identity       |
| `GIT_EMAIL`    | (wajib diisi)  | Email noreply `ID+username@...` |
| `WEEKDAY_MIN`  | `5`            | Minimal commit hari kerja     |
| `WEEKDAY_MAX`  | `10`           | Maksimal commit hari kerja    |
| `WEEKEND_MIN`  | `1`            | Minimal commit akhir pekan/libur |
| `WEEKEND_MAX`  | `3`            | Maksimal commit akhir pekan/libur |
| `START_HOUR`   | `8`            | Jam mulai jendela commit (WIB) |
| `END_HOUR`     | `17`           | Jam selesai jendela commit (WIB) |
| `TZ`           | `Asia/Jakarta` | Zona waktu                     |

## Menjaga `holidays.json`

Daftar libur nasional & cuti bersama **tidak otomatis** — diisi manual per tahun dari
SKB 3 Menteri (https://setneg.go.id). Saat tahun berganti tanpa data, semua hari kerja
memakai rentang `WEEKDAY_MIN..WEEKDAY_MAX`.

Format:

```json
{
  "2026": [{ "date": "2026-01-01", "name": "Tahun Baru", "type": "national" }]
}
```

## Development

```sh
npm install
npm run build   # tsc -> dist/
npm test        # node:test via tsx (folder test/ tidak di-push)
npm run dev     # jalankan langsung dari src/
```

## 👤 Author

- **Machfudin** - [machfudn](https://github.com/machfudn)
