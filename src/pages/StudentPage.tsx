// 学生端 - 互评与提问页面
import { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import type { Team, PeerScore, Question, SessionStatus } from '../types';
import {
    getTeams,
    getSessionStatus,
    hasPeerScored,
    savePeerScore,
    saveQuestion,
    getQuestionsByAskingTeam,
    STORAGE_KEYS,
    subscribe
} from '../store/storage';
import { generateId } from '../utils/scoreCalculator';
import './StudentPage.css';

export default function StudentPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [session, setSession] = useState<SessionStatus>(getSessionStatus());
    const [myTeamId, setMyTeamId] = useState<string | null>(null);
    const [myQuestions, setMyQuestions] = useState<Question[]>([]);

    // 互评分数
    const [peerScores, setPeerScores] = useState({
        content: 8,        // 展示内容 (10)
        collaboration: 8,  // 团队协作 (10)
        interaction: 8,    // 互动与答辩 (10)
    });
    const [peerSubmitted, setPeerSubmitted] = useState(false);

    // 提问
    const [questionText, setQuestionText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadData = () => {
        const loadedTeams = getTeams();
        setTeams(loadedTeams);
        setSession(getSessionStatus());

        if (myTeamId) {
            setMyQuestions(getQuestionsByAskingTeam(myTeamId));

            // 检查是否已评分
            const activeTeamId = getSessionStatus().activeTeamId;
            if (activeTeamId && myTeamId !== activeTeamId) {
                setPeerSubmitted(hasPeerScored(myTeamId, activeTeamId));
            }
        }
    };

    useEffect(() => {
        loadData();
        const unsubs = [
            subscribe(STORAGE_KEYS.TEAMS, loadData),
            subscribe(STORAGE_KEYS.SESSION, loadData),
            subscribe(STORAGE_KEYS.PEER_SCORES, loadData),
            subscribe(STORAGE_KEYS.QUESTIONS, loadData),
        ];
        return () => unsubs.forEach(fn => fn());
    }, [myTeamId]);

    // 当session变化时检查评分状态
    useEffect(() => {
        if (myTeamId && session.activeTeamId && myTeamId !== session.activeTeamId) {
            setPeerSubmitted(hasPeerScored(myTeamId, session.activeTeamId));
        } else {
            setPeerSubmitted(false);
        }
    }, [session.activeTeamId, myTeamId]);

    const activeTeam = teams.find(t => t.id === session.activeTeamId);
    const myTeam = teams.find(t => t.id === myTeamId);
    const myQuestionCount = myQuestions.length;
    const totalPeerScore = peerScores.content + peerScores.collaboration + peerScores.interaction;

    // 提交互评
    const handleSubmitPeerScore = () => {
        if (!myTeamId || !session.activeTeamId || myTeamId === session.activeTeamId) return;

        const score: PeerScore = {
            fromTeamId: myTeamId,
            toTeamId: session.activeTeamId,
            content: peerScores.content,
            collaboration: peerScores.collaboration,
            interaction: peerScores.interaction,
            total: totalPeerScore,
            timestamp: Date.now(),
        };

        savePeerScore(score);
        setPeerSubmitted(true);
    };

    // 提交问题
    const handleSubmitQuestion = () => {
        if (!myTeamId || !session.activeTeamId || !questionText.trim()) return;
        if (myTeamId === session.activeTeamId) return; // 不能给自己提问

        setSubmitting(true);

        const question: Question = {
            id: generateId(),
            askingTeamId: myTeamId,
            askingTeamName: myTeam?.name || '',
            targetTeamId: session.activeTeamId,
            content: questionText.trim(),
            timestamp: Date.now(),
            scored: false,
            relevance: 0,
            depth: 0,
            inspiration: 0,
            totalScore: 0,
        };

        saveQuestion(question);
        setQuestionText('');
        setSubmitting(false);
        setMyQuestions([...myQuestions, question]);
    };

    // 选择我的团队
    if (!myTeamId) {
        return (
            <div className="student-page">
                <div className="team-selection card card-lg">
                    <h1>👋 欢迎参加答辩互评</h1>
                    <p>请选择你所在的团队</p>

                    <div className="team-selection-grid">
                        {teams.length === 0 ? (
                            <div className="empty-state">
                                <AlertCircle size={48} />
                                <p>暂无团队数据，请等待教师录入</p>
                            </div>
                        ) : (
                            teams.map(team => (
                                <button
                                    key={team.id}
                                    className="team-select-btn"
                                    onClick={() => setMyTeamId(team.id)}
                                >
                                    <span className="team-avatar">{team.avatar}</span>
                                    <div className="team-info">
                                        <div className="team-name">第{team.groupNumber}组</div>
                                        <div className="team-project">{team.name}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-page">
            {/* 顶部状态栏 */}
            <header className="student-header">
                <div className="my-team-info">
                    <span className="team-avatar">{myTeam?.avatar}</span>
                    <div>
                        <div className="team-label">我是</div>
                        <div className="team-name">第{myTeam?.groupNumber}组 - {myTeam?.name}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setMyTeamId(null)}>
                        切换
                    </button>
                </div>

                <div className="question-progress">
                    <div className="progress-label">
                        我的提问进度
                        <span className={myQuestionCount >= 3 ? 'completed' : ''}>
                            {myQuestionCount}/3
                            {myQuestionCount >= 3 && <CheckCircle size={14} />}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min(myQuestionCount / 3, 1) * 100}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* 当前展示团队 */}
            {activeTeam && activeTeam.id !== myTeamId ? (
                <div className="current-presentation card">
                    <div className="presentation-header">
                        <span className="team-avatar-lg">{activeTeam.avatar}</span>
                        <div className="presentation-info">
                            <h2>当前展示：第{activeTeam.groupNumber}组 - {activeTeam.name}</h2>
                            <p>{activeTeam.members.map(m => m.name).join('、')}</p>
                        </div>
                    </div>
                </div>
            ) : activeTeam?.id === myTeamId ? (
                <div className="current-presentation card my-turn">
                    <div className="presentation-header">
                        <span className="team-avatar-lg">{activeTeam?.avatar}</span>
                        <div className="presentation-info">
                            <h2>🎤 现在是你们团队的展示时间！</h2>
                            <p>加油，好好表现！</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="current-presentation card waiting">
                    <div className="presentation-info">
                        <h2>⏳ 等待开始...</h2>
                        <p>请等待教师选择展示团队</p>
                    </div>
                </div>
            )}

            {/* 主要内容区 */}
            {activeTeam && activeTeam.id !== myTeamId && (
                <div className="student-main-grid">
                    {/* 互评卡片 */}
                    <div className="peer-scoring-card card">
                        <div className="card-header">
                            <h3><Star size={20} /> 互评打分</h3>
                            {peerSubmitted && (
                                <span className="badge badge-success">
                                    <CheckCircle size={14} /> 已提交
                                </span>
                            )}
                        </div>

                        <div className="score-items">
                            {[
                                { key: 'content', label: '展示内容', desc: '逻辑清晰' },
                                { key: 'collaboration', label: '团队协作', desc: '分工明确' },
                                { key: 'interaction', label: '互动与答辩', desc: '回答准确' },
                            ].map(item => (
                                <div key={item.key} className="score-item">
                                    <div className="score-item-header">
                                        <span className="score-label">{item.label}</span>
                                        <span className="score-value">{peerScores[item.key as keyof typeof peerScores]}</span>
                                    </div>
                                    <div className="score-item-desc">{item.desc}</div>
                                    <div className="score-buttons">
                                        {[6, 7, 8, 9, 10].map(num => (
                                            <button
                                                key={num}
                                                className={`score-btn ${peerScores[item.key as keyof typeof peerScores] === num ? 'active' : ''}`}
                                                onClick={() => setPeerScores({ ...peerScores, [item.key]: num })}
                                                disabled={peerSubmitted}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="card-footer">
                            <div className="total-score">
                                <span className="score-number">{totalPeerScore}</span>
                                <span className="score-max">/ 30</span>
                            </div>
                            <button
                                className={`btn ${peerSubmitted ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={handleSubmitPeerScore}
                                disabled={peerSubmitted}
                            >
                                {peerSubmitted ? '已提交' : '提交评分'}
                            </button>
                        </div>
                    </div>

                    {/* 提问卡片 */}
                    <div className="question-card card">
                        <div className="card-header">
                            <h3><MessageSquare size={20} /> 提出问题</h3>
                            <span className={`question-count ${myQuestionCount >= 3 ? 'completed' : ''}`}>
                                {myQuestionCount}/3 个问题
                            </span>
                        </div>

                        <div className="question-input-wrapper">
                            <textarea
                                className="question-input"
                                placeholder="输入你想问的问题..."
                                value={questionText}
                                onChange={e => setQuestionText(e.target.value)}
                                rows={3}
                            />
                            <button
                                className="btn btn-primary submit-question-btn"
                                onClick={handleSubmitQuestion}
                                disabled={!questionText.trim() || submitting}
                            >
                                <Send size={18} />
                                {submitting ? '提交中...' : '提交问题'}
                            </button>
                        </div>

                        {/* 我提过的问题 */}
                        <div className="my-questions">
                            <h4>我的提问记录</h4>
                            {myQuestions.length === 0 ? (
                                <div className="no-questions">还没有提问，快去提问吧！</div>
                            ) : (
                                <div className="questions-list">
                                    {myQuestions.map(q => (
                                        <div key={q.id} className="question-item">
                                            <span className="question-target">
                                                → 第{teams.find(t => t.id === q.targetTeamId)?.groupNumber}组
                                            </span>
                                            <span className="question-text">"{q.content}"</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
