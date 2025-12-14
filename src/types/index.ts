// 核心类型定义

// 团队成员
export interface TeamMember {
  id: string;
  name: string;
}

// 团队
export interface Team {
  id: string;
  name: string;          // 如：智慧交通大脑
  groupNumber: number;   // 组号：1, 2, 3...
  members: TeamMember[];
  avatar: string;        // emoji
}

// 教师评分 (满分50)
export interface TeacherScore {
  teamId: string;
  completeness: number;   // 内容完整性 (10)
  quality: number;        // 成果质量 (20)
  presentation: number;   // 表达与展示 (10)
  defense: number;        // 答辩表现 (10)
  total: number;          // 总分 (50)
  timestamp: number;
}

// 学生互评 (满分30)
export interface PeerScore {
  fromTeamId: string;     // 评分的组
  toTeamId: string;       // 被评分的组
  content: number;        // 展示内容 (10)
  collaboration: number;  // 团队协作 (10)
  interaction: number;    // 互动与答辩 (10)
  total: number;          // 总分 (30)
  timestamp: number;
}

// 学生提问
export interface Question {
  id: string;
  askingTeamId: string;   // 提问的组
  askingTeamName: string;
  targetTeamId: string;   // 被提问的展示组
  content: string;        // 问题内容
  timestamp: number;
  // 教师评分 (满分20)
  scored: boolean;
  relevance: number;      // 相关性 (5)
  depth: number;          // 深度性 (10)
  inspiration: number;    // 启发性 (5)
  totalScore: number;     // 总分 (20)
}

// 团队提问统计
export interface TeamQuestionStats {
  teamId: string;
  questionCount: number;  // 已提问次数
  targetCount: number;    // 目标次数 (3)
  completed: boolean;     // 是否达标
}

// 会话状态
export interface SessionStatus {
  activeTeamId: string | null;  // 当前展示的团队
  timerRunning: boolean;
  timeLeft: number;             // 剩余秒数
  phase: 'setup' | 'presenting' | 'scoring' | 'finished';
}

// 团队综合成绩
export interface TeamFinalScore {
  teamId: string;
  teamName: string;
  groupNumber: number;
  teacherScore: number;       // 教师分 (0-50)
  peerScoreAvg: number;       // 互评均分 (0-30)
  questionScore: number;      // 提问分 (0-20)
  totalScore: number;         // 总分 (0-100)
}
