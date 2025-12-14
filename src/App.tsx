// 主应用入口 - 路由配置
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Monitor,
  Users,
  Star,
  MessageSquare,
  Trophy,
  GraduationCap,
  Menu,
  X,
  Database
} from 'lucide-react';

// 页面组件
import BigScreen from './pages/BigScreen';
import TeamManagement from './pages/TeamManagement';
import TeacherScoring from './pages/TeacherScoring';
import QuestionScoring from './pages/QuestionScoring';
import ScoreSummary from './pages/ScoreSummary';
import StudentPage from './pages/StudentPage';
import { resetSystem } from './utils/dataSeeder';

import './App.css';

// 首页 - 角色选择
function HomePage() {
  const handleSeed = () => {
    if (confirm('是否初始化演示数据？这会清除现有数据。')) {
      resetSystem();
      alert('数据已重置为演示状态');
      window.location.reload();
    }
  };

  return (
    <div className="home-page">
      <div className="home-container animate-fade-in-up">
        <div className="home-header">
          <div className="logo-wrapper">
            <div className="logo">
              <Star className="logo-icon" fill="currentColor" />
            </div>
          </div>
          <h1>AI-Course EvalMate</h1>
          <p>人工智能课程实训答辩互评系统</p>
        </div>

        <div className="role-cards">
          <Link to="/bigscreen" className="role-card bigscreen">
            <div className="role-icon-wrapper">
              <Monitor size={32} />
            </div>
            <div className="role-content">
              <h2>大屏展示</h2>
              <p>用于投影，展示实时排行和提问统计</p>
            </div>
          </Link>

          <Link to="/teacher" className="role-card teacher">
            <div className="role-icon-wrapper">
              <GraduationCap size={32} />
            </div>
            <div className="role-content">
              <h2>教师端</h2>
              <p>团队管理、现场评分、提问评定</p>
            </div>
          </Link>

          <Link to="/student" className="role-card student">
            <div className="role-icon-wrapper">
              <Users size={32} />
            </div>
            <div className="role-content">
              <h2>学生端</h2>
              <p>互评打分、提交问题</p>
            </div>
          </Link>
        </div>

        <div className="home-footer">
          <p>© 2024 AI-Course EvalMate. 支持本地存储，无需联网。</p>
          <button onClick={handleSeed} className="btn-seed">
            <Database size={14} /> 模拟录入数据
          </button>
        </div>
      </div>
    </div>
  );
}

// 教师端布局
function TeacherLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { path: '/teacher', icon: Users, label: '团队管理', exact: true },
    { path: '/teacher/scoring', icon: Star, label: '现场评分' },
    { path: '/teacher/questions', icon: MessageSquare, label: '提问评定' },
    { path: '/teacher/summary', icon: Trophy, label: '成绩汇总' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="teacher-layout">
      {/* 侧边栏 */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <div className="sidebar-icon-box">
              <Star size={18} fill="currentColor" />
            </div>
            <span>EvalMate</span>
          </Link>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path, item.exact) ? 'fill-current' : ''} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/bigscreen" className="btn btn-special w-full">
            <Monitor size={18} /> <span>打开大屏</span>
          </Link>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className={`main-content ${sidebarOpen ? 'expanded' : 'collapsed'}`}>
        <Routes>
          <Route index element={<TeamManagement />} />
          <Route path="scoring" element={<TeacherScoring />} />
          <Route path="questions" element={<QuestionScoring />} />
          <Route path="summary" element={<ScoreSummary />} />
        </Routes>
      </main>
    </div>
  );
}

// 主应用
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bigscreen" element={<BigScreen />} />
        <Route path="/teacher/*" element={<TeacherLayout />} />
        <Route path="/student" element={<StudentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
