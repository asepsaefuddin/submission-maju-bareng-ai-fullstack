import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import 'dotenv/config';
import { text } from 'stream/consumers';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// inisialisasi routing
app.post('/generate-text', async(req, res) => {
    const { prompt } = req.body; //object distucturing
    console.log({prompt});
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ 
            success: false,
            message: 'Prompt harus berupa string!',
            data: null
         });
         return;
    }
    try {
        const aiResponse = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash',
            contents: [
                {text: prompt}
            ],
            // untuk config lainnya bisa cek di dokumentasi
            config: {
                systemInstruction: "Harus dibalas dalam bahasa jawa, sunda atau jepang secara acak"
            }
        });
        res.status(200).json({
        success: true,
        message: 'Berhasil dijawab gemini',
        data: aiResponse.text
});
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Gagal gan, servernya kayaknya lagi bermasalah',
            data: null
        })
    }
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file gambar yang diupload', data: null });
        }

        const { prompt = 'Describe this uploaded image' } = req.body;
        const base64Image = req.file.buffer.toString('base64');

        const fs = await import('fs/promises');

        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { text: prompt },
                { inlineData: {data: base64Image, mimeType: req.file.mimetype} }
            ],
            config: {
                systemInstruction: "Jelaskan isi gambar secara singkat dan jelas (bahasa Indonesia)."
            }
        });

        await fs.unlink(req.file.path).catch(() => { });

        const text =
            aiResponse.text ??
            (aiResponse.output?.[0]?.content
                ? aiResponse.output[0].content.map(c => c.text || '').join(' ').trim()
                : null);

        res.status(200).json({
            success: true,
            message: 'Deskripsi gambar berhasil dibuat',
            data: text
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memproses gambar',
            data: null
        });
    }
});

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    const { prompt } = req.body;
    const base64Document = req.file.buffer.toString('base64');
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { text: prompt ?? "Tolong buat ringkasan dari dokumen berikut", type: 'text' },
                { inlineData: { data: base64Document, mimeType: req.file.mimetype } }
            ],
            config: {
                systemInstruction: "Buat ringkasan dokumen secara singkat dan jelas (bahasa Indonesia)."
            }
        });
        res.status(200).json({
            success: true,
            message: 'Dokumen berhasil diringkas',
            data: response.text
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memproses dokumen',
            data: null
        });
    }
});

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    const { prompt } = req.body;
    const base64Audio = req.file.buffer.toString('base64');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { text: prompt ?? "Tolong buatkan transkip dari rekaman berikut", type: 'text' },
                { inlineData: { data: base64Audio, mimeType: req.file.mimetype } }
            ],
            config: {
                systemInstruction: "Buat transkip audio secara singkat dan jelas (bahasa Indonesia)."
            }
        });
        res.status(200).json({
            success: true,
            message: 'Audio berhasil ditranskip',
            data: response.text
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memproses audio',
            data: null
        });
    }
});

app.post('/api/chat', async (req, res) => {
    console.log('BODY:', req.body);
    const conversation = req.body.conversation || req.body.messages;
    try {
        if (!Array.isArray(conversation)) throw new Error('Conversation harus berupa array');
        // Map 'content' to 'parts' for Gemini API
        const contents = conversation.map(({ role, content }) => ({ role, parts: [{ text: content }] }));
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction: "Kamu adalah asisten yang ramah dan membantu."
            }
        });
        res.status(200).json({
            success: true,
            message: 'Chat berhasil diproses',
            result: response.text
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memproses chat',
            data: null
        });
    }
});

app.post('/api/chat-stream', async (req, res) => {
    const { conversation } = req.body;
    try {
        if (!Array.isArray(conversation)) throw new Error('Conversation harus berupa array');

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const contents = conversation.map(({ role, content }) => ({ role, parts: [{ text: content }] }));
        const result = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents,
        });

        for await (const chunk of result.stream) {
            res.write(`data: ${JSON.stringify({ result: chunk.text() })}\n\n`);
        }
    } catch (error) {
        console.error('Streaming Error:', error);
        res.write(`data: ${JSON.stringify({ error: 'An error occurred during streaming.' })}\n\n`);
    } finally {
        res.end();
    }
});

app.listen(3000, () => {
    console.log('I LOVE YOU 3000');
});