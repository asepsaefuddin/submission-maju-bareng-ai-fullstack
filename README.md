# Asep AI Chatbot - Fullstack Submission

### Welcome to Repository Asep AI Chatbot in this repository you can clone repo for submission Maju Bareng AI With Hacktiv8 

## Cara Install & Menjalankan

1. **Clone repo ini**
	```bash
	git clone https://github.com/asepsaefuddin/submission-maju-bareng-ai-fullstack.git
	cd submission-maju-bareng-ai-fullstack
	```
2. **Install dependencies**
	```bash
	npm install
	```
3. **Buat .env dan isi sesuai .env.example**
	```bash
	GEMINI_API_KEY=<your api key>
	```
4. **Jalankan server**
	```bash
	npm run start
	# atau
	node index.js
	```
5. **Buka di browser**
	Kunjungi [http://localhost:3000](http://localhost:3000)

## Fitur Utama

- Chat AI (Gemini) dengan UI modern
- Upload gambar (image)
- Upload dokumen (.pdf, .docx, .xlsx, .csv, .pptx, .txt)
- Upload audio (rekaman suara)
- Preview nama file sebelum kirim
- Mic input (speech-to-text)
- Chat bubble & UI fancy
- Jawaban AI ramah, bisa custom persona

## Endpoint API

| Endpoint                  | Method | Deskripsi                                    |
|--------------------------|--------|-----------------------------------------------|
| `/api/chat`              | POST   | Chat dengan AI (text saja)                    |
| `/generate-text`       | POST   | Chat prompt AI (text saja)               |
| `/generate-from-image`   | POST   | Upload gambar + prompt, dapat deskripsi AI    |
| `/generate-from-document`| POST   | Upload dokumen + prompt, dapat ringkasan AI   |
| `/generate-from-audio`   | POST   | Upload audio + prompt, dapat transkrip AI     |
