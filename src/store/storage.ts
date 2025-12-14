// 本地存储管理器 - 替代 Firebase
import type { Team, TeacherScore, PeerScore, Question, SessionStatus } from '../types';

const STORAGE_KEYS = {
    TEAMS: 'evalmate_teams',
    TEACHER_SCORES: 'evalmate_teacher_scores',
    PEER_SCORES: 'evalmate_peer_scores',
    QUESTIONS: 'evalmate_questions',
    SESSION: 'evalmate_session',
};

// 通用存储方法
function getItem<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
}

// 事件通知 - 模拟实时更新
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

// ========== 团队管理 ==========
export function getTeams(): Team[] {
    return getItem<Team[]>(STORAGE_KEYS.TEAMS, []);
}

export function saveTeams(teams: Team[]): void {
    setItem(STORAGE_KEYS.TEAMS, teams);
    notify(STORAGE_KEYS.TEAMS);
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
    return getItem<TeacherScore[]>(STORAGE_KEYS.TEACHER_SCORES, []);
}

export function saveTeacherScore(score: TeacherScore): void {
    const scores = getTeacherScores();
    const index = scores.findIndex(s => s.teamId === score.teamId);
    if (index !== -1) {
        scores[index] = score;
    } else {
        scores.push(score);
    }
    setItem(STORAGE_KEYS.TEACHER_SCORES, scores);
    notify(STORAGE_KEYS.TEACHER_SCORES);
}

export function getTeacherScoreByTeam(teamId: string): TeacherScore | undefined {
    return getTeacherScores().find(s => s.teamId === teamId);
}

// ========== 学生互评 ==========
export function getPeerScores(): PeerScore[] {
    return getItem<PeerScore[]>(STORAGE_KEYS.PEER_SCORES, []);
}

export function savePeerScore(score: PeerScore): void {
    const scores = getPeerScores();
    // 一个组只能给另一个组评一次分
    const index = scores.findIndex(s => s.fromTeamId === score.fromTeamId && s.toTeamId === score.toTeamId);
    if (index !== -1) {
        scores[index] = score;
    } else {
        scores.push(score);
    }
    setItem(STORAGE_KEYS.PEER_SCORES, scores);
    notify(STORAGE_KEYS.PEER_SCORES);
}

export function getPeerScoresForTeam(toTeamId: string): PeerScore[] {
    return getPeerScores().filter(s => s.toTeamId === toTeamId);
}

export function hasPeerScored(fromTeamId: string, toTeamId: string): boolean {
    return getPeerScores().some(s => s.fromTeamId === fromTeamId && s.toTeamId === toTeamId);
}

// ========== 学生提问 ==========
export function getQuestions(): Question[] {
    return getItem<Question[]>(STORAGE_KEYS.QUESTIONS, []);
}

export function saveQuestion(question: Question): void {
    const questions = getQuestions();
    questions.push(question);
    setItem(STORAGE_KEYS.QUESTIONS, questions);
    notify(STORAGE_KEYS.QUESTIONS);
}

export function updateQuestion(question: Question): void {
    const questions = getQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    if (index !== -1) {
        questions[index] = question;
        setItem(STORAGE_KEYS.QUESTIONS, questions);
        notify(STORAGE_KEYS.QUESTIONS);
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
export function getSessionStatus(): SessionStatus {
    return getItem<SessionStatus>(STORAGE_KEYS.SESSION, {
        activeTeamId: null,
        timerRunning: false,
        timeLeft: 600, // 10分钟
        phase: 'setup',
    });
}

export function saveSessionStatus(status: SessionStatus): void {
    setItem(STORAGE_KEYS.SESSION, status);
    notify(STORAGE_KEYS.SESSION);
}

// ========== 清空所有数据 ==========
export function clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    Object.values(STORAGE_KEYS).forEach(key => notify(key));
}

// 订阅 key 常量导出
export { STORAGE_KEYS };
