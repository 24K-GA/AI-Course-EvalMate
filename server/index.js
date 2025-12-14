import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// 中间件
app.use(cors());
app.use(express.json());

// 初始化数据文件
const defaultData = {
    teams: [],
    teacherScores: [],
    peerScores: [],
    questions: [],
    session: {
        activeTeamId: null,
        timerRunning: false,
        timeLeft: 600,
        phase: 'setup',
        rushEnabled: false,
        rushWinner: null
    }
};

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Error loading data:', err);
    }
    return { ...defaultData };
}

function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error saving data:', err);
    }
}

// 初始化数据
if (!fs.existsSync(DATA_FILE)) {
    saveData(defaultData);
}

// ========== API 路由 ==========

// 获取所有数据
app.get('/api/data', (req, res) => {
    const data = loadData();
    res.json(data);
});

// 获取特定键的数据
app.get('/api/data/:key', (req, res) => {
    const data = loadData();
    const key = req.params.key;
    if (key in data) {
        res.json(data[key]);
    } else {
        res.status(404).json({ error: 'Key not found' });
    }
});

// 更新特定键的数据
app.put('/api/data/:key', (req, res) => {
    const data = loadData();
    const key = req.params.key;
    data[key] = req.body;
    saveData(data);
    res.json({ success: true });
});

// 重置所有数据
app.post('/api/reset', (req, res) => {
    saveData({ ...defaultData });
    res.json({ success: true });
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
    console.log(`EvalMate API Server running on port ${PORT}`);
});
