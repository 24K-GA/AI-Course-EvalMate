// 本地存储管理器 - 使用后端 API 同步
import type { Team, TeacherScore, PeerScore, Question, SessionStatus } from '../types';

// API 配置
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 缓存和轮询
let dataCache: Record<string, unknown> = {};
let lastFetch = 0;
const CACHE_TTL = 500; // 缓存有效期 500ms

const STORAGE_KEYS = {
    TEAMS: 'teams',
    TEACHER_SCORES: 'teacherScores',
    PEER_SCORES: 'peerScores',
    QUESTIONS: 'questions',
    SESSION: 'session',
};

// 事件通知
const listeners: Map<string, Set<() => void>> = new Map();

export function subscribe(key: string, callback: () => void): () => void {
    if (!listeners.has(key)) {
        listeners.set(key, new Set());
    }
    listeners.get(key)!.add(callback);
    return () => listeners.get(key)?.delete(callback);
}

function notify(key: string): void {
    listeners.get(key)?.forEach(cb => cb());
}

// API 请求封装
async function fetchData<T>(key: string): Promise<T> {
    try {
        const now = Date.now();
        if (now - lastFetch < CACHE_TTL && key in dataCache) {
            return dataCache[key] as T;
        }

        const response = await fetch(`${API_BASE}/data/${key}`);
        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        dataCache[key] = data;
        lastFetch = now;
        return data;
    } catch (err) {
        console.error('Fetch error:', err);
        // 回退到本地存储
        return getLocalItem<T>(key);
    }
}

async function saveData<T>(key: string, value: T): Promise<void> {
    try {
        dataCache[key] = value;
        await fetch(`${API_BASE}/data/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value),
        });
        notify(key);
    } catch (err) {
        console.error('Save error:', err);
        // 回退到本地存储
        setLocalItem(key, value);
        notify(key);
    }
}

// 本地存储回退
function getLocalItem<T>(key: string, defaultValue?: T): T {
    try {
        const item = localStorage.getItem(`evalmate_${key}`);
        return item ? JSON.parse(item) : defaultValue as T;
    } catch {
        return defaultValue as T;
    }
}

function setLocalItem<T>(key: string, value: T): void {
    localStorage.setItem(`evalmate_${key}`, JSON.stringify(value));
}

// ========== 团队管理 ==========
export function getTeams(): Team[] {
    // 同步返回缓存，异步更新
    fetchData<Team[]>(STORAGE_KEYS.TEAMS).then(data => {
        dataCache[STORAGE_KEYS.TEAMS] = data;
    });
    return (dataCache[STORAGE_KEYS.TEAMS] as Team[]) || getLocalItem<Team[]>(STORAGE_KEYS.TEAMS, []);
}

export async function getTeamsAsync(): Promise<Team[]> {
    return fetchData<Team[]>(STORAGE_KEYS.TEAMS);
}

export function saveTeams(teams: Team[]): void {
    saveData(STORAGE_KEYS.TEAMS, teams);
}

export function addTeam(team: Team): void {
    const teams = getTeams();
    teams.push(team);
    saveTeams(teams);
}

export function updateTeam(team: Team): void {
    const teams = getTeams();
    const index = teams.findIndex(t => t.id === team.id);
    if (index !== -1) {
        teams[index] = team;
        saveTeams(teams);
    }
}

export function deleteTeam(teamId: string): void {
    const teams = getTeams().filter(t => t.id !== teamId);
    saveTeams(teams);
}

// ========== 教师评分 ==========
export function getTeacherScores(): TeacherScore[] {
    fetchData<TeacherScore[]>(STORAGE_KEYS.TEACHER_SCORES).then(data => {
        dataCache[STORAGE_KEYS.TEACHER_SCORES] = data;
    });
    return (dataCache[STORAGE_KEYS.TEACHER_SCORES] as TeacherScore[]) || getLocalItem<TeacherScore[]>(STORAGE_KEYS.TEACHER_SCORES, []);
}

export function saveTeacherScore(score: TeacherScore): void {
    const scores = getTeacherScores();
    const index = scores.findIndex(s => s.teamId === score.teamId);
    if (index !== -1) {
        scores[index] = score;
    } else {
        scores.push(score);
    }
    saveData(STORAGE_KEYS.TEACHER_SCORES, scores);
}

export function getTeacherScoreByTeam(teamId: string): TeacherScore | undefined {
    return getTeacherScores().find(s => s.teamId === teamId);
}

// ========== 学生互评 ==========
export function getPeerScores(): PeerScore[] {
    fetchData<PeerScore[]>(STORAGE_KEYS.PEER_SCORES).then(data => {
        dataCache[STORAGE_KEYS.PEER_SCORES] = data;
    });
    return (dataCache[STORAGE_KEYS.PEER_SCORES] as PeerScore[]) || getLocalItem<PeerScore[]>(STORAGE_KEYS.PEER_SCORES, []);
}

export function savePeerScore(score: PeerScore): void {
    const scores = getPeerScores();
    const index = scores.findIndex(s => s.fromTeamId === score.fromTeamId && s.toTeamId === score.toTeamId);
    if (index !== -1) {
        scores[index] = score;
    } else {
        scores.push(score);
    }
    saveData(STORAGE_KEYS.PEER_SCORES, scores);
}

export function getPeerScoresForTeam(toTeamId: string): PeerScore[] {
    return getPeerScores().filter(s => s.toTeamId === toTeamId);
}

export function hasPeerScored(fromTeamId: string, toTeamId: string): boolean {
    return getPeerScores().some(s => s.fromTeamId === fromTeamId && s.toTeamId === toTeamId);
}

// ========== 学生提问 ==========
export function getQuestions(): Question[] {
    fetchData<Question[]>(STORAGE_KEYS.QUESTIONS).then(data => {
        dataCache[STORAGE_KEYS.QUESTIONS] = data;
    });
    return (dataCache[STORAGE_KEYS.QUESTIONS] as Question[]) || getLocalItem<Question[]>(STORAGE_KEYS.QUESTIONS, []);
}

export function saveQuestion(question: Question): void {
    const questions = getQuestions();
    questions.push(question);
    saveData(STORAGE_KEYS.QUESTIONS, questions);
}

export function updateQuestion(question: Question): void {
    const questions = getQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    if (index !== -1) {
        questions[index] = question;
        saveData(STORAGE_KEYS.QUESTIONS, questions);
    }
}

export function getQuestionsForTeam(targetTeamId: string): Question[] {
    return getQuestions().filter(q => q.targetTeamId === targetTeamId);
}

export function getQuestionsByAskingTeam(askingTeamId: string): Question[] {
    return getQuestions().filter(q => q.askingTeamId === askingTeamId);
}

export function getTeamQuestionCount(askingTeamId: string): number {
    return getQuestionsByAskingTeam(askingTeamId).length;
}

// ========== 会话状态 ==========
const defaultSession: SessionStatus = {
    activeTeamId: null,
    timerRunning: false,
    timeLeft: 600,
    phase: 'setup',
    rushEnabled: false,
    rushWinner: null,
};

export function getSessionStatus(): SessionStatus {
    fetchData<SessionStatus>(STORAGE_KEYS.SESSION).then(data => {
        if (data) dataCache[STORAGE_KEYS.SESSION] = data;
    });
    return (dataCache[STORAGE_KEYS.SESSION] as SessionStatus) || getLocalItem<SessionStatus>(STORAGE_KEYS.SESSION, defaultSession);
}

export function saveSessionStatus(status: SessionStatus): void {
    saveData(STORAGE_KEYS.SESSION, status);
}

// ========== 抢答功能 ==========
export function startRush(): void {
    const session = getSessionStatus();
    saveSessionStatus({
        ...session,
        rushEnabled: true,
        rushWinner: null,
    });
}

export function stopRush(): void {
    const session = getSessionStatus();
    saveSessionStatus({
        ...session,
        rushEnabled: false,
    });
}

export function tryRush(teamId: string, teamName: string, groupNumber: number): boolean {
    const session = getSessionStatus();
    if (!session.rushEnabled || session.rushWinner) {
        return false;
    }

    saveSessionStatus({
        ...session,
        rushEnabled: false,
        rushWinner: {
            teamId,
            teamName,
            groupNumber,
            timestamp: Date.now(),
        },
    });
    return true;
}

export function clearRushWinner(): void {
    const session = getSessionStatus();
    saveSessionStatus({
        ...session,
        rushWinner: null,
    });
}

// ========== 清空所有数据 ==========
export async function clearAllData(): Promise<void> {
    try {
        await fetch(`${API_BASE}/reset`, { method: 'POST' });
        dataCache = {};
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(`evalmate_${key}`);
            notify(key);
        });
    } catch (err) {
        console.error('Reset error:', err);
    }
}

// ========== 轮询更新 ==========
let pollingInterval: number | null = null;

export function startPolling(intervalMs = 1000): void {
    if (pollingInterval) return;

    pollingInterval = window.setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/data`);
            if (!response.ok) return;

            const data = await response.json();
            const keys = Object.keys(STORAGE_KEYS) as (keyof typeof STORAGE_KEYS)[];

            for (const key of keys) {
                const storageKey = STORAGE_KEYS[key];
                const newValue = JSON.stringify(data[storageKey]);
                const oldValue = JSON.stringify(dataCache[storageKey]);

                if (newValue !== oldValue) {
                    dataCache[storageKey] = data[storageKey];
                    notify(storageKey);
                }
            }
        } catch (err) {
            // 静默失败，继续使用缓存
        }
    }, intervalMs);
}

export function stopPolling(): void {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// 自动开始轮询
startPolling();

export { STORAGE_KEYS };
