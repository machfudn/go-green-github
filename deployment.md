# Panduan Deployment Standalone Bot di Ubuntu / VPS

Dokumen ini menjelaskan cara menjalankan bot `go-green-github` secara mandiri pada server Ubuntu / VPS menggunakan **Linux Cron**. Pendekatan ini **100% independen dari GitHub Actions**, sehingga kebal terhadap masalah kuota menit, spending limit $0, atau kendala billing pada akun GitHub.

---

## Ringkasan Alur Kerja

1. **VPS** memiliki cron job harian pada jam 07:05 WIB (00:05 UTC).
2. Cron mengeksekusi `./run.sh`.
3. Script melakukan `git pull --rebase` agar repositori selalu up-to-date.
4. Script memanggil `node dist/index.js` untuk membuat commit acak sepanjang jam kerja pada file `data.json`.
5. Script melakukan `git push origin main` ke GitHub menggunakan **SSH Deploy Key**.

---

## Bagian 1: Pengaturan pada Repositori GitHub

### 1.1 Nonaktifkan Trigger Cron di GitHub Actions
Agar GitHub Actions tidak lagi mencoba berjalan setiap hari dan tidak memunculkan eror billing/spending limit:

Buka file [`.github/workflows/auto-green.yml`](file:///.github/workflows/auto-green.yml) dan beri komentar `#` pada baris `schedule`:

```yaml
on:
  # schedule:
  #   - cron: '5 0 * * *' # Dinonaktifkan karena sudah dipindah ke VPS Cron
  workflow_dispatch:
```

*(Tetap pertahankan `workflow_dispatch` jika sewaktu-waktu ingin menjalankan manual dari web).*

### 1.2 Buat & Pasang SSH Deploy Key
Agar VPS dapat melakukan `git push` tanpa memasukkan password atau token:

1. **Generate SSH key di VPS** (lihat langkah di [Bagian 2.2](#22-generate-ssh-deploy-key)).
2. Salin isi public key yang dihasilkan VPS (`~/.ssh/go_green_deploy.pub`).
3. Buka repositori `machfudn/go-green-github` di GitHub browser.
4. Buka menu **Settings** > **Deploy keys** (di menu sebelah kiri).
5. Klik **Add deploy key**:
   - **Title**: `VPS Auto-Green Runner`
   - **Key**: *Paste isi public key tadi (dimulai dengan `ssh-ed25519 ...`)*
   - **PENTING**: Centang kotak checkbox ☑️ **Allow write access**.
6. Klik **Add key**.

---

## Bagian 2: Pengaturan pada Ubuntu / VPS

### 2.1 Install Dependensi Sistem (Git & Node.js 20 LTS)
Login ke VPS via SSH, lalu jalankan perintah berikut:

```bash
# Update package list & install git, curl
sudo apt update && sudo apt install -y git curl

# Install Node.js 20 LTS (NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi instalasi (minimal Node v20+ dan Git)
node -v
npm -v
git --version
```

---

### 2.2 Generate SSH Deploy Key
Jalankan perintah ini di VPS:

```bash
# Generate key pair khusus tanpa passphrase agar automasi berjalan
ssh-keygen -t ed25519 -C "vps-go-green-bot" -f ~/.ssh/go_green_deploy -N ""

# Tampilkan isi public key untuk disalin ke GitHub Deploy Keys
cat ~/.ssh/go_green_deploy.pub
```

Konfigurasikan SSH client agar otomatis menggunakan key ini saat mengakses GitHub:
```bash
cat << 'EOF' >> ~/.ssh/config

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/go_green_deploy
    StrictHostKeyChecking accept-new
EOF

chmod 600 ~/.ssh/config ~/.ssh/go_green_deploy
```

Uji koneksi SSH ke GitHub:
```bash
ssh -T git@github.com
```
*Jika muncul pesan: `Hi machfudn/go-green-github! You've successfully authenticated...`, berarti koneksi SSH berhasil!*

---

### 2.3 Konfigurasi Identitas Git di VPS
Agar commit diatribusikan dengan benar ke akun GitHub Anda:

```bash
git config --global user.name "Machfudin"
git config --global user.email "90607773+machfudn@users.noreply.github.com"
```

---

### 2.4 Clone Repositori & Build Project
```bash
# Clone menggunakan URL SSH
cd ~
git clone git@github.com:machfudn/go-green-github.git
cd go-green-github

# Install dependencies dan build TypeScript ke dist/
npm ci
npm run build

# Beri izin eksekusi pada script runner
chmod +x run.sh
```

---

### 2.5 Uji Coba Manual
Jalankan script secara manual untuk memastikan commit dan push berhasil:

```bash
./run.sh
```

Output yang diharapkan:
```text
Selesai: 7 commit hari ini, 1x push.
```
Cek profil GitHub Anda di browser untuk memastikan kontribusi hari ini sudah tercatat hijau.

---

### 2.6 Pasang Penjadwalan Otomatis (Crontab)

Buka konfigurasi cron di VPS:
```bash
crontab -e
```

Tambahkan baris berikut di baris paling bawah:

#### Opsi A: Jika Jam VPS Menggunakan Waktu Indonesia Barat (WIB / GMT+7)
Cek timezone VPS dengan perintah `timedatectl`. Jika timezone VPS adalah `Asia/Jakarta`:
```cron
# Eksekusi setiap hari jam 07:05 WIB
5 7 * * * /home/ubuntu/go-green-github/run.sh >> /home/ubuntu/go-green-github/bot.log 2>&1
```

#### Opsi B: Jika Jam VPS Menggunakan Default UTC (GMT+0)
Sebagian besar VPS default-nya menggunakan jam UTC (07:05 WIB = 00:05 UTC):
```cron
# Eksekusi setiap hari jam 00:05 UTC (07:05 WIB)
5 0 * * * /home/ubuntu/go-green-github/run.sh >> /home/ubuntu/go-green-github/bot.log 2>&1
```

*(Sesuaikan path `/home/ubuntu/...` jika nama user VPS Anda berbeda, misal `/root/...`).*

---

## Bagian 3: Pemeliharaan & Troubleshooting

### Memeriksa Log Eksekusi
Anda dapat memantau log hasil eksekusi kapan saja di VPS:
```bash
tail -n 50 /home/ubuntu/go-green-github/bot.log
```

### Mengubah Konfigurasi Jadwal & Rentang Jam
Jika ingin mengubah jumlah commit atau rentang jam, Anda cukup mengedit variabel di file [`run.sh`](file:///run.sh) di VPS:
- `WEEKDAY_MIN` / `WEEKDAY_MAX`: Jumlah commit pada hari kerja (default: 5 - 10).
- `WEEKEND_MIN` / `WEEKEND_MAX`: Jumlah commit pada akhir pekan & hari libur nasional (default: 1 - 3).
- `START_HOUR` / `END_HOUR`: Rentang jam commit acak (default: 8 s.d. 17 WIB).
