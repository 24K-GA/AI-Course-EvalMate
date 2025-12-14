// 教师端 - 提问评定页面 (课后使用)
import { useState, useEffect } from 'react';
import { MessageSquare, Star, CheckCircle, AlertCircle } from 'lucide-react';
import type { Team, Question } from '../types';
import { getTeams, getQuestions, updateQuestion, STORAGE_KEYS, subscribe } from '../store/storage';
import './TeacherPages.css';

export default function QuestionScoring() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [scores, setScores] = useState({
        relevance: 3,    // 相关性 (5)
        depth: 6,        // 深度性 (10)
        inspiration: 3,  // 启发性 (5)
    });

    const loadData = () => {
        setTeams(getTeams());
        setQuestions(getQuestions());
    };

    useEffect(() => {
        loadData();
        const unsubs = [
            subscribe(STORAGE_KEYS.TEAMS, loadData),
            subscribe(STORAGE_KEYS.QUESTIONS, loadData),
        ];
        return () => unsubs.forEach(fn => fn());
    }, []);

    // 按提问团队分组
    const getQuestionsByTeam = (teamId: string) => {
        return questions.filter(q => q.askingTeamId === teamId);
    };

    // 获取未评分的提问数
    const getUnscoredCount = (teamId: string) => {
        return getQuestionsByTeam(teamId).filter(q => !q.scored).length;
    };

    // 开始评分
    const startScoring = (question: Question) => {
        setEditingQuestion(question);
        if (question.scored) {
            setScores({
                relevance: question.relevance,
                depth: question.depth,
                inspiration: question.inspiration,
            });
        } else {
            setScores({ relevance: 3, depth: 6, inspiration: 3 });
        }
    };

    // 提交评分
    const handleSubmit = () => {
        if (!editingQuestion) return;

        const totalScore = scores.relevance + scores.depth + scores.inspiration;

        updateQuestion({
            ...editingQuestion,
            scored: true,
            relevance: scores.relevance,
            depth: scores.depth,
            inspiration: scores.inspiration,
            totalScore,
        });

        setEditingQuestion(null);
    };

    const selectedTeamQuestions = selectedTeamId ? getQuestionsByTeam(selectedTeamId) : [];
    const totalScore = scores.relevance + scores.depth + scores.inspiration;

    return (
        <div className="teacher-page">
            <header className="page-header">
                <div>
                    <h1><MessageSquare size={28} /> 提问评定</h1>
                    <p>评定各团队提问的质量（满分20分）</p>
                </div>
                <div className="stats-summary">
                    <span className="stat">
                        <MessageSquare size={16} />
                        共 {questions.length} 个提问
                    </span>
                    <span className="stat warning">
                        <AlertCircle size={16} />
                        待评 {questions.filter(q => !q.scored).length} 个
                    </span>
                </div>
            </header>

            <div className="question-scoring-grid">
                {/* 左侧：团队列表 */}
                <div className="teams-panel card">
                    <h2>选择团队</h2>
                    <div className="teams-list">
                        {teams.map(team => {
                            const teamQuestions = getQuestionsByTeam(team.id);
                            const unscoredCount = getUnscoredCount(team.id);

                            return (
                                <div
                                    key={team.id}
                                    className={`team-item ${selectedTeamId === team.id ? 'active' : ''}`}
                                    onClick={() => setSelectedTeamId(team.id)}
                                >
                                    <span className="team-avatar">{team.avatar}</span>
                                    <div className="team-info">
                                        <div className="team-name">第{team.groupNumber}组</div>
                                        <div className="team-stats">
                                            {teamQuestions.length} 个提问
                                            {unscoredCount > 0 && (
                                                <span className="badge badge-warning">{unscoredCount} 待评</span>
                                            )}
                                            {unscoredCount === 0 && teamQuestions.length > 0 && (
                                                <span className="badge badge-success">已完成</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 中间：提问列表 */}
                <div className="questions-panel card">
                    <h2>
                        {selectedTeamId
                            ? `第${teams.find(t => t.id === selectedTeamId)?.groupNumber}组的提问`
                            : '请选择团队'}
                    </h2>

                    {selectedTeamId ? (
                        <div className="questions-list">
                            {selectedTeamQuestions.length === 0 ? (
                                <div className="empty-state">
                                    <MessageSquare size={48} />
                                    <p>该团队暂无提问</p>
                                </div>
                            ) : (
                                selectedTeamQuestions.map(question => (
                                    <div
                                        key={question.id}
                                        className={`question-card ${editingQuestion?.id === question.id ? 'active' : ''}`}
                                        onClick={() => startScoring(question)}
                                    >
                                        <div className="question-header">
                                            <span className="question-target">
                                                提问对象：第{teams.find(t => t.id === question.targetTeamId)?.groupNumber}组
                                            </span>
                                            {question.scored ? (
                                                <span className="badge badge-success">
                                                    <CheckCircle size={12} /> {question.totalScore}分
                                                </span>
                                            ) : (
                                                <span className="badge badge-warning">待评分</span>
                                            )}
                                        </div>
                                        <div className="question-content">"{question.content}"</div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <MessageSquare size={48} />
                            <p>请在左侧选择一个团队</p>
                        </div>
                    )}
                </div>

                {/* 右侧：评分面板 */}
                <div className="scoring-panel card">
                    <h2>评分面板</h2>

                    {editingQuestion ? (
                        <>
                            <div className="current-question">
                                <p>"{editingQuestion.content}"</p>
                                <span className="question-meta">
                                    提问对象：第{teams.find(t => t.id === editingQuestion.targetTeamId)?.groupNumber}组
                                </span>
                            </div>

                            <div className="score-inputs">
                                <div className="score-input-group">
                                    <label>相关性（5分）</label>
                                    <div className="score-buttons">
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <button
                                                key={v}
                                                className={`score-btn ${scores.relevance === v ? 'active' : ''}`}
                                                onClick={() => setScores({ ...scores, relevance: v })}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="score-input-group">
                                    <label>深度性（10分）</label>
                                    <div className="score-buttons">
                                        {[2, 4, 6, 8, 10].map(v => (
                                            <button
                                                key={v}
                                                className={`score-btn ${scores.depth === v ? 'active' : ''}`}
                                                onClick={() => setScores({ ...scores, depth: v })}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="score-input-group">
                                    <label>启发性（5分）</label>
                                    <div className="score-buttons">
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <button
                                                key={v}
                                                className={`score-btn ${scores.inspiration === v ? 'active' : ''}`}
                                                onClick={() => setScores({ ...scores, inspiration: v })}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="scoring-footer">
                                <div className="total-score">
                                    <span className="score-number">{totalScore}</span>
                                    <span className="score-max">/ 20</span>
                                </div>
                                <button className="btn btn-primary" onClick={handleSubmit}>
                                    {editingQuestion.scored ? '更新评分' : '提交评分'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <Star size={48} />
                            <p>点击左侧问题开始评分</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
