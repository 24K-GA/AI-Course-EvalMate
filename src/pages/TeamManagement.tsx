// 教师端 - 团队管理页面
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Users } from 'lucide-react';
import type { Team, TeamMember } from '../types';
import { getTeams, saveTeams, STORAGE_KEYS, subscribe } from '../store/storage';
import { generateId } from '../utils/scoreCalculator';
import './TeacherPages.css';

export default function TeamManagement() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [newMemberName, setNewMemberName] = useState('');

    const avatars = ['🚀', '🎯', '💡', '🔥', '⭐', '🏆', '🎨', '🤖', '📊', '🌟', '🎮', '💻'];

    useEffect(() => {
        setTeams(getTeams());
        return subscribe(STORAGE_KEYS.TEAMS, () => setTeams(getTeams()));
    }, []);

    // 添加新团队
    const addTeam = () => {
        if (!newTeamName.trim()) return;

        const newTeam: Team = {
            id: generateId(),
            name: newTeamName.trim(),
            groupNumber: teams.length + 1,
            members: [],
            avatar: avatars[teams.length % avatars.length],
        };

        saveTeams([...teams, newTeam]);
        setNewTeamName('');
        setEditingTeam(newTeam);
    };

    // 删除团队
    const deleteTeam = (teamId: string) => {
        if (!confirm('确定删除该团队吗？')) return;
        const newTeams = teams
            .filter(t => t.id !== teamId)
            .map((t, idx) => ({ ...t, groupNumber: idx + 1 }));
        saveTeams(newTeams);
        if (editingTeam?.id === teamId) setEditingTeam(null);
    };

    // 更新团队
    const updateTeam = (team: Team) => {
        const newTeams = teams.map(t => t.id === team.id ? team : t);
        saveTeams(newTeams);
        setEditingTeam(team);
    };

    // 添加成员
    const addMember = () => {
        if (!editingTeam || !newMemberName.trim()) return;

        const newMember: TeamMember = {
            id: generateId(),
            name: newMemberName.trim(),
        };

        updateTeam({
            ...editingTeam,
            members: [...editingTeam.members, newMember],
        });
        setNewMemberName('');
    };

    // 删除成员
    const deleteMember = (memberId: string) => {
        if (!editingTeam) return;
        updateTeam({
            ...editingTeam,
            members: editingTeam.members.filter(m => m.id !== memberId),
        });
    };

    return (
        <div className="teacher-page">
            <header className="page-header">
                <div>
                    <h1><Users size={28} /> 团队管理</h1>
                    <p>录入和编辑参与答辩的团队信息</p>
                </div>
                <div className="team-count">
                    共 <strong>{teams.length}</strong> 个团队
                </div>
            </header>

            <div className="team-management-grid">
                {/* 团队列表 */}
                <div className="teams-panel card">
                    <h2>团队列表</h2>

                    {/* 添加新团队 */}
                    <div className="add-team-form">
                        <input
                            type="text"
                            className="input"
                            placeholder="输入团队/项目名称..."
                            value={newTeamName}
                            onChange={e => setNewTeamName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTeam()}
                        />
                        <button className="btn btn-primary" onClick={addTeam}>
                            <Plus size={18} /> 添加
                        </button>
                    </div>

                    {/* 团队列表 */}
                    <div className="teams-list">
                        {teams.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} />
                                <p>暂无团队，请添加</p>
                            </div>
                        ) : (
                            teams.map(team => (
                                <div
                                    key={team.id}
                                    className={`team-item ${editingTeam?.id === team.id ? 'active' : ''}`}
                                    onClick={() => setEditingTeam(team)}
                                >
                                    <span className="team-avatar">{team.avatar}</span>
                                    <div className="team-info">
                                        <div className="team-name">第{team.groupNumber}组：{team.name}</div>
                                        <div className="team-member-count">{team.members.length} 名成员</div>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={e => { e.stopPropagation(); deleteTeam(team.id); }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 团队编辑面板 */}
                <div className="edit-panel card">
                    {editingTeam ? (
                        <>
                            <div className="edit-header">
                                <h2>编辑团队</h2>
                                <button className="btn btn-ghost" onClick={() => setEditingTeam(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* 团队基本信息 */}
                            <div className="form-group">
                                <label>团队名称</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editingTeam.name}
                                    onChange={e => updateTeam({ ...editingTeam, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>选择图标</label>
                                <div className="avatar-picker">
                                    {avatars.map(avatar => (
                                        <button
                                            key={avatar}
                                            className={`avatar-option ${editingTeam.avatar === avatar ? 'selected' : ''}`}
                                            onClick={() => updateTeam({ ...editingTeam, avatar })}
                                        >
                                            {avatar}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 成员管理 */}
                            <div className="form-group">
                                <label>团队成员</label>
                                <div className="add-member-form">
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="输入成员姓名..."
                                        value={newMemberName}
                                        onChange={e => setNewMemberName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addMember()}
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={addMember}>
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <div className="members-list">
                                    {editingTeam.members.map(member => (
                                        <div key={member.id} className="member-item">
                                            <span>{member.name}</span>
                                            <button
                                                className="btn btn-ghost btn-icon btn-sm"
                                                onClick={() => deleteMember(member.id)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {editingTeam.members.length === 0 && (
                                        <div className="empty-members">暂无成员</div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <Edit2 size={48} />
                            <p>点击左侧团队进行编辑</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
