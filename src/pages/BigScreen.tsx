// 大屏展示页面
import { useState, useEffect } from 'react';
import { Clock, Users, MessageSquare, Trophy, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import type { Team, Question, SessionStatus } from '../types';
import { getTeams, getQuestions, getSessionStatus, saveSessionStatus, STORAGE_KEYS, subscribe } from '../store/storage';
import { getRankings, getQuestionStats, formatTime } from '../utils/scoreCalculator';
import './BigScreen.css';

export default function BigScreen() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [session, setSession] = useState<SessionStatus>(getSessionStatus());
    const [rankings, setRankings] = useState<ReturnType<typeof getRankings>>([]);
    const [questionStats, setQuestionStats] = useState<ReturnType<typeof getQuestionStats>>([]);

    // 加载数据
    const loadData = () => {
        const loadedTeams = getTeams();
        setTeams(loadedTeams);
        setQuestions(getQuestions());
        setSession(getSessionStatus());
        setRankings(getRankings(loadedTeams));
        setQuestionStats(getQuestionStats(loadedTeams));
    };

    useEffect(() => {
        loadData();

        // 订阅数据变化
        const unsubs = [
            subscribe(STORAGE_KEYS.TEAMS, loadData),
            subscribe(STORAGE_KEYS.QUESTIONS, loadData),
            subscribe(STORAGE_KEYS.SESSION, loadData),
            subscribe(STORAGE_KEYS.TEACHER_SCORES, loadData),
            subscribe(STORAGE_KEYS.PEER_SCORES, loadData),
        ];

        return () => unsubs.forEach(fn => fn());
    }, []);

    // 倒计时
    useEffect(() => {
        if (!session.timerRunning || session.timeLeft <= 0) return;

        const interval = setInterval(() => {
            const newSession = { ...session, timeLeft: session.timeLeft - 1 };
            if (newSession.timeLeft <= 0) {
                newSession.timerRunning = false;
            }
            saveSessionStatus(newSession);
        }, 1000);

        return () => clearInterval(interval);
    }, [session.timerRunning, session.timeLeft]);

    const activeTeam = teams.find(t => t.id === session.activeTeamId);
    const activeIndex = teams.findIndex(t => t.id === session.activeTeamId);
    const recentQuestions = questions
        .filter(q => q.targetTeamId === session.activeTeamId)
        .slice(-5)
        .reverse();

    // 切换团队
    const switchTeam = (direction: 'prev' | 'next') => {
        if (teams.length === 0) return;
        let newIndex = direction === 'next'
            ? (activeIndex + 1) % teams.length
            : (activeIndex - 1 + teams.length) % teams.length;

        saveSessionStatus({
            ...session,
            activeTeamId: teams[newIndex].id,
            timerRunning: false,
            timeLeft: 600,
        });
    };

    // 控制计时器
    const toggleTimer = () => {
        saveSessionStatus({ ...session, timerRunning: !session.timerRunning });
    };

    const resetTimer = () => {
        saveSessionStatus({ ...session, timeLeft: 600, timerRunning: false });
    };

    if (teams.length === 0) {
        return (
            <div className="bigscreen-empty">
                <Users size={64} />
                <h2>暂无团队数据</h2>
                <p>请先在教师端录入团队信息</p>
            </div>
        );
    }

    return (
        <div className="bigscreen">
            {/* 顶部标题栏 */}
            <header className="bigscreen-header">
                <div className="bigscreen-title">
                    <Trophy className="title-icon" />
                    <h1>AI-Course EvalMate 实训答辩</h1>
                </div>
                <div className="bigscreen-progress">
                    进度: {rankings.filter(r => r.teacherScore > 0).length} / {teams.length} 组完成
                </div>
            </header>

            {/* 主要内容区 */}
            <main className="bigscreen-main">
                {/* 当前展示团队 */}
                <section className="current-team-section">
                    <button className="nav-btn" onClick={() => switchTeam('prev')}>
                        <ChevronLeft size={32} />
                    </button>

                    <div className="current-team-card">
                        <div className="team-avatar">{activeTeam?.avatar || '👥'}</div>
                        <div className="team-info">
                            <h2>当前展示：第{activeTeam?.groupNumber}组 - {activeTeam?.name}</h2>
                            <div className="team-members">
                                成员：{activeTeam?.members.map(m => m.name).join('、')}
                            </div>
                        </div>

                        {/* 倒计时器 */}
                        <div className="timer-section">
                            <div className={`timer-display ${session.timerRunning ? 'running' : ''}`}>
                                <Clock size={24} />
                                <span>{formatTime(session.timeLeft)}</span>
                            </div>
                            <div className="timer-controls">
                                <button className="timer-btn" onClick={toggleTimer}>
                                    {session.timerRunning ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <button className="timer-btn reset" onClick={resetTimer}>重置</button>
                            </div>
                        </div>
                    </div>

                    <button className="nav-btn" onClick={() => switchTeam('next')}>
                        <ChevronRight size={32} />
                    </button>
                </section>

                {/* 排行榜和提问区 */}
                <div className="bigscreen-grid">
                    {/* 实时排行榜 */}
                    <section className="ranking-section">
                        <h3><Trophy size={20} /> 实时排行</h3>
                        <div className="ranking-list">
                            {rankings.slice(0, 8).map((r, idx) => (
                                <div
                                    key={r.teamId}
                                    className={`ranking-item ${r.teamId === session.activeTeamId ? 'active' : ''}`}
                                >
                                    <span className={`rank-number rank-${idx + 1}`}>{idx + 1}</span>
                                    <span className="rank-name">第{r.groupNumber}组</span>
                                    <span className="rank-score">{r.totalScore.toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 最新提问 */}
                    <section className="questions-section">
                        <h3><MessageSquare size={20} /> 最新提问</h3>
                        <div className="questions-list">
                            {recentQuestions.length === 0 ? (
                                <div className="no-questions">暂无提问</div>
                            ) : (
                                recentQuestions.map(q => (
                                    <div key={q.id} className="question-item animate-fade-in">
                                        <span className="question-from">第{teams.find(t => t.id === q.askingTeamId)?.groupNumber}组</span>
                                        <span className="question-content">"{q.content}"</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* 各组提问统计 */}
                <section className="stats-section">
                    <h3>🎯 各组提问统计（目标: 每组至少 3 个问题）</h3>
                    <div className="stats-grid">
                        {questionStats.map(stat => {
                            const team = teams.find(t => t.id === stat.teamId);
                            return (
                                <div
                                    key={stat.teamId}
                                    className={`stat-item ${stat.completed ? 'completed' : ''} ${stat.questionCount === 0 ? 'zero' : ''}`}
                                >
                                    <div className="stat-team">第{team?.groupNumber}组</div>
                                    <div className="stat-dots">
                                        {[0, 1, 2].map(i => (
                                            <span
                                                key={i}
                                                className={`dot ${i < stat.questionCount ? 'filled' : ''}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="stat-count">
                                        {stat.questionCount}/3
                                        {stat.completed && <span className="check">✓</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}
