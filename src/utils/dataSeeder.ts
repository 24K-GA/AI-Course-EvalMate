// 数据管理与模拟工具
import type { Team } from '../types';
import { saveTeams, getTeams, clearAllData } from '../store/storage';

const INITIAL_TEAMS: Team[] = [
    {
        id: 'team_01',
        name: "智慧交通大脑",
        groupNumber: 1,
        members: [
            { id: 'm01_1', name: "张三" },
            { id: 'm01_2', name: "李四" },
            { id: 'm01_3', name: "王五" }
        ],
        avatar: "🚗"
    },
    {
        id: 'team_02',
        name: "警务大模型助手",
        groupNumber: 2,
        members: [
            { id: 'm02_1', name: "赵六" },
            { id: 'm02_2', name: "钱七" }
        ],
        avatar: "👮"
    },
    {
        id: 'team_03',
        name: "社区安防巡逻",
        groupNumber: 3,
        members: [
            { id: 'm03_1', name: "孙八" },
            { id: 'm03_2', name: "周九" },
            { id: 'm03_3', name: "吴十" }
        ],
        avatar: "🏘️"
    },
    {
        id: 'team_04',
        name: "反诈语音机器人",
        groupNumber: 4,
        members: [
            { id: 'm04_1', name: "周杰" },
            { id: 'm04_2', name: "昆凌" }
        ],
        avatar: "📞"
    },
    {
        id: 'team_05',
        name: "校园智能导览",
        groupNumber: 5,
        members: [
            { id: 'm05_1', name: "Alice" },
            { id: 'm05_2', name: "Bob" }
        ],
        avatar: "🏫"
    },
];

export const seedData = () => {
    const current = getTeams();
    if (current.length === 0) {
        saveTeams(INITIAL_TEAMS);
        return true;
    }
    return false;
};

export const resetSystem = () => {
    clearAllData();
    saveTeams(INITIAL_TEAMS);
};
