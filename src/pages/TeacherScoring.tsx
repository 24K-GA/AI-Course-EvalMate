// 教师端 - 现场评分页面
import { useState, useEffect } from 'react';
import { Star, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Team, TeacherScore, SessionStatus } from '../types';
import { getTeams, getTeacherScoreByTeam, saveTeacherScore, getSessionStatus, saveSessionStatus, STORAGE_KEYS, subscribe } from '../store/storage';
import './TeacherPages.css';

export default function TeacherScoring() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [session, setSession] = useState<SessionStatus>(getSessionStatus());
    const [scores, setScores] = useState({
        completeness: 8,   // 内容完整性 (10)
        quality: 16,       // 成果质量 (20)
        presentation: 8,   // 表达与展示 (10)
        defense: 8,        // 答辩表现 (10)
    });
    const [submitted, setSubmitted] = useState(false);

    const loadData = () => {
        const loadedTeams = getTeams();
        setTeams(loadedTeams);
        setSession(getSessionStatus());

        // 如果没有选中团队，选中第一个
        const currentSession = getSessionStatus();
        if (!currentSession.activeTeamId && loadedTeams.length > 0) {
            saveSessionStatus({ ...currentSession, activeTeamId: loadedTeams[0].id });
        }
    };

    useEffect(() => {
        loadData();
        const unsubs = [
            subscribe(STORAGE_KEYS.TEAMS, loadData),
            subscribe(STORAGE_KEYS.SESSION, () => setSession(getSessionStatus())),
        ];
        return () => unsubs.forEach(fn => fn());
    }, []);

    // 当切换团队时，加载已有评分
    useEffect(() => {
        if (!session.activeTeamId) return;

        const existingScore = getTeacherScoreByTeam(session.activeTeamId);
        if (existingScore) {
            setScores({
                completeness: existingScore.completeness,
                quality: existingScore.quality,
                presentation: existingScore.presentation,
                defense: existingScore.defense,
            });
            setSubmitted(true);
        } else {
            setScores({ completeness: 8, quality: 16, presentation: 8, defense: 8 });
            setSubmitted(false);
        }
    }, [session.activeTeamId]);

    const activeTeam = teams.find(t => t.id === session.activeTeamId);
    const activeIndex = teams.findIndex(t => t.id === session.activeTeamId);
    const totalScore = scores.completeness + scores.quality + scores.presentation + scores.defense;

    // 切换团队
    const switchTeam = (direction: 'prev' | 'next') => {
        if (teams.length === 0) return;
        let newIndex = direction === 'next'
            ? (activeIndex + 1) % teams.length
            : (activeIndex - 1 + teams.length) % teams.length;

        saveSessionStatus({ ...session, activeTeamId: teams[newIndex].id });
    };

    // 提交评分
    const handleSubmit = () => {
        if (!session.activeTeamId) return;

        const teacherScore: TeacherScore = {
            teamId: session.activeTeamId,
            ...scores,
            total: totalScore,
            timestamp: Date.now(),
        };

        saveTeacherScore(teacherScore);
        setSubmitted(true);
    };

    const ScoreSlider = ({
        label,
        max,
        value,
        onChange
    }: {
        label: string;
        max: number;
        value: number;
        onChange: (v: number) => void;
    }) => (
        <div className="score-slider">
            <div className="slider-header">
                <label>{label}</label>
                <span className="slider-value">{value} / {max}</span>
            </div>
            <div className="slider-track-wrapper">
                <div
                    className="slider-track-fill"
                    style={{ width: `${(value / max) * 100}%` }}
                />
                <input
                    type="range"
                    min="0"
                    max={max}
                    value={value}
                    onChange={e => onChange(parseInt(e.target.value))}
                    className="slider-input"
                />
            </div>
        </div>
    );

    if (teams.length === 0) {
        return (
            <div className="teacher-page">
                <div className="empty-page">
                    <Star size={64} />
                    <h2>暂无团队</h2>
                    <p>请先在"团队管理"中添加团队</p>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-page">
            <header className="page-header">
                <div>
                    <h1><Star size={28} /> 教师评分</h1>
                    <p>为当前展示团队打分（满分50分）</p>
                </div>
            </header>

            {/* 团队选择器 */}
            <div className="team-selector">
                <button className="nav-btn" onClick={() => switchTeam('prev')}>
                    <ChevronLeft size={24} />
                </button>

                <div className="current-team">
                    <span className="team-avatar-lg">{activeTeam?.avatar}</span>
                    <div>
                        <h2>第{activeTeam?.groupNumber}组：{activeTeam?.name}</h2>
                        <p>{activeTeam?.members.map(m => m.name).join('、')}</p>
                    </div>
                    {submitted && (
                        <span className="badge badge-success">
                            <CheckCircle size={14} /> 已评分
                        </span>
                    )}
                </div>

                <button className="nav-btn" onClick={() => switchTeam('next')}>
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* 评分卡片 */}
            <div className="scoring-card card card-lg">
                <div className="scoring-grid">
                    <ScoreSlider
                        label="内容完整性（10分）"
                        max={10}
                        value={scores.completeness}
                        onChange={v => setScores({ ...scores, completeness: v })}
                    />
                    <ScoreSlider
                        label="成果质量（20分）"
                        max={20}
                        value={scores.quality}
                        onChange={v => setScores({ ...scores, quality: v })}
                    />
                    <ScoreSlider
                        label="表达与展示（10分）"
                        max={10}
                        value={scores.presentation}
                        onChange={v => setScores({ ...scores, presentation: v })}
                    />
                    <ScoreSlider
                        label="答辩表现（10分）"
                        max={10}
                        value={scores.defense}
                        onChange={v => setScores({ ...scores, defense: v })}
                    />
                </div>

                <div className="scoring-footer">
                    <div className="total-score">
                        <span className="score-number">{totalScore}</span>
                        <span className="score-max">/ 50</span>
                    </div>
                    <button
                        className={`btn ${submitted ? 'btn-secondary' : 'btn-primary'} btn-lg`}
                        onClick={handleSubmit}
                    >
                        {submitted ? '更新评分' : '提交评分'}
                    </button>
                </div>
            </div>

            {/* 快速切换 */}
            <div className="quick-nav">
                <h3>快速切换</h3>
                <div className="team-buttons">
                    {teams.map(team => {
                        const hasScore = !!getTeacherScoreByTeam(team.id);
                        return (
                            <button
                                key={team.id}
                                className={`team-btn ${session.activeTeamId === team.id ? 'active' : ''} ${hasScore ? 'scored' : ''}`}
                                onClick={() => saveSessionStatus({ ...session, activeTeamId: team.id })}
                            >
                                第{team.groupNumber}组
                                {hasScore && <CheckCircle size={12} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
