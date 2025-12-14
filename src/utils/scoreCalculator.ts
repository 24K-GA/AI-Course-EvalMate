// 成绩计算工具
import type { Team, TeamFinalScore, TeamQuestionStats } from '../types';
import { getTeacherScores, getPeerScores, getQuestions } from '../store/storage';

// 重新导出类型供其他模块使用
export type { TeamFinalScore, TeamQuestionStats };

// 计算团队互评平均分 (满分30)
export function calculatePeerAverage(toTeamId: string): number {
    const peerScores = getPeerScores().filter(s => s.toTeamId === toTeamId);
    if (peerScores.length === 0) return 0;

    const totals = peerScores.map(s => s.total);

    // 如果超过3个评分，去掉最高最低分
    if (totals.length > 3) {
        totals.sort((a, b) => a - b);
        totals.shift(); // 去掉最低
        totals.pop();   // 去掉最高
    }

    return totals.reduce((sum, t) => sum + t, 0) / totals.length;
}

// 计算团队提问得分 (满分20)
// 这里取该团队所有提问的平均分
export function calculateQuestionScore(askingTeamId: string): number {
    const questions = getQuestions().filter(q => q.askingTeamId === askingTeamId && q.scored);
    if (questions.length === 0) return 0;

    const total = questions.reduce((sum, q) => sum + q.totalScore, 0);
    return total / questions.length;
}

// 计算团队最终成绩
export function calculateTeamFinalScore(team: Team): TeamFinalScore {
    const teacherScore = getTeacherScores().find(s => s.teamId === team.id);
    const teacherTotal = teacherScore?.total ?? 0;

    const peerAvg = calculatePeerAverage(team.id);
    const questionScore = calculateQuestionScore(team.id);

    // 总分 = 教师分(50) + 互评均分(30) + 提问分(20) = 100
    const totalScore = teacherTotal + peerAvg + questionScore;

    return {
        teamId: team.id,
        teamName: team.name,
        groupNumber: team.groupNumber,
        teacherScore: teacherTotal,
        peerScoreAvg: Math.round(peerAvg * 10) / 10,
        questionScore: Math.round(questionScore * 10) / 10,
        totalScore: Math.round(totalScore * 10) / 10,
    };
}

// 获取所有团队的排行榜
export function getRankings(teams: Team[]): TeamFinalScore[] {
    return teams
        .map(team => calculateTeamFinalScore(team))
        .sort((a, b) => b.totalScore - a.totalScore);
}

// 获取各组提问统计
export function getQuestionStats(teams: Team[]): TeamQuestionStats[] {
    const questions = getQuestions();

    return teams.map(team => {
        const count = questions.filter(q => q.askingTeamId === team.id).length;
        return {
            teamId: team.id,
            questionCount: count,
            targetCount: 3,
            completed: count >= 3,
        };
    });
}

// 生成唯一ID
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化时间 (秒 -> MM:SS)
export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
