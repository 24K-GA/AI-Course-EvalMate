// 成绩汇总页面
import { useState, useEffect } from 'react';
import { Trophy, Download, BarChart3, RefreshCw } from 'lucide-react';
import type { Team } from '../types';
import { getTeams, getTeacherScores, getPeerScores, getQuestions, clearAllData, STORAGE_KEYS, subscribe } from '../store/storage';
import { getRankings, type TeamFinalScore } from '../utils/scoreCalculator';
import './TeacherPages.css';
import './ScoreSummary.css';

export default function ScoreSummary() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [rankings, setRankings] = useState<TeamFinalScore[]>([]);

    const loadData = () => {
        const loadedTeams = getTeams();
        setTeams(loadedTeams);
        setRankings(getRankings(loadedTeams));
    };

    useEffect(() => {
        loadData();
        const unsubs = [
            subscribe(STORAGE_KEYS.TEAMS, loadData),
            subscribe(STORAGE_KEYS.TEACHER_SCORES, loadData),
            subscribe(STORAGE_KEYS.PEER_SCORES, loadData),
            subscribe(STORAGE_KEYS.QUESTIONS, loadData),
        ];
        return () => unsubs.forEach(fn => fn());
    }, []);

    // 导出CSV
    const exportCSV = () => {
        const headers = ['排名', '组号', '团队名称', '教师评分(50)', '互评均分(30)', '提问得分(20)', '总分(100)'];
        const rows = rankings.map((r, idx) => [
            idx + 1,
            `第${r.groupNumber}组`,
            r.teamName,
            r.teacherScore,
            r.peerScoreAvg,
            r.questionScore,
            r.totalScore,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `答辩成绩_${new Date().toLocaleDateString()}.csv`;
        link.click();
    };

    // 重置所有数据
    const handleReset = () => {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            clearAllData();
            loadData();
        }
    };

    const teacherCount = getTeacherScores().length;
    const peerCount = getPeerScores().length;
    const questionCount = getQuestions().length;

    return (
        <div className="teacher-page">
            <header className="page-header">
                <div>
                    <h1><Trophy size={28} /> 成绩汇总</h1>
                    <p>查看排行榜和导出成绩单</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={handleReset}>
                        <RefreshCw size={18} /> 重置数据
                    </button>
                    <button className="btn btn-primary" onClick={exportCSV}>
                        <Download size={18} /> 导出CSV
                    </button>
                </div>
            </header>

            {/* 统计概览 */}
            <div className="stats-overview">
                <div className="stat-card">
                    <div className="stat-icon teams">👥</div>
                    <div className="stat-info">
                        <div className="stat-value">{teams.length}</div>
                        <div className="stat-label">参赛团队</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon teacher">📝</div>
                    <div className="stat-info">
                        <div className="stat-value">{teacherCount}</div>
                        <div className="stat-label">教师评分</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon peer">⭐</div>
                    <div className="stat-info">
                        <div className="stat-value">{peerCount}</div>
                        <div className="stat-label">学生互评</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon question">💬</div>
                    <div className="stat-info">
                        <div className="stat-value">{questionCount}</div>
                        <div className="stat-label">提交问题</div>
                    </div>
                </div>
            </div>

            {/* 排行榜表格 */}
            <div className="ranking-table-card card card-lg">
                <div className="table-header">
                    <h2><BarChart3 size={20} /> 成绩排行榜</h2>
                </div>

                {rankings.length === 0 ? (
                    <div className="empty-state">
                        <Trophy size={64} />
                        <h3>暂无成绩数据</h3>
                        <p>请先录入团队并完成评分</p>
                    </div>
                ) : (
                    <table className="ranking-table">
                        <thead>
                            <tr>
                                <th>排名</th>
                                <th>团队</th>
                                <th>教师评分<br /><span className="th-sub">(50分)</span></th>
                                <th>互评均分<br /><span className="th-sub">(30分)</span></th>
                                <th>提问得分<br /><span className="th-sub">(20分)</span></th>
                                <th>总分<br /><span className="th-sub">(100分)</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankings.map((r, idx) => (
                                <tr key={r.teamId} className={idx < 3 ? `top-${idx + 1}` : ''}>
                                    <td className="rank-cell">
                                        <span className={`rank-badge rank-${idx + 1}`}>
                                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                        </span>
                                    </td>
                                    <td className="team-cell">
                                        <span className="team-avatar-sm">
                                            {teams.find(t => t.id === r.teamId)?.avatar}
                                        </span>
                                        <div>
                                            <div className="team-name">第{r.groupNumber}组</div>
                                            <div className="team-project">{r.teamName}</div>
                                        </div>
                                    </td>
                                    <td className="score-cell">{r.teacherScore}</td>
                                    <td className="score-cell">{r.peerScoreAvg}</td>
                                    <td className="score-cell">{r.questionScore}</td>
                                    <td className="total-cell">{r.totalScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
