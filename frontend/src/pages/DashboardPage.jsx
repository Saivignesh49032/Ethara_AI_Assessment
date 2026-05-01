import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ListTodo,
  TrendingUp,
  Zap,
  Bookmark,
  Bug,
  CheckSquare
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format } from 'date-fns';

import { getProjects } from '../api/projects';
import { getProjectTasks } from '../api/tasks';
import useAuthStore from '../store/authStore';

import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    done: 0,
    overdue: 0
  });
  const [myTasks, setMyTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [typeData, setTypeData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const { projects } = await getProjects();
      
      const tasksPromises = projects.map(p => getProjectTasks(p.id));
      const tasksResults = await Promise.all(tasksPromises);
      
      let allTasks = [];
      let projectStats = [];
      let types = { EPIC: 0, STORY: 0, TASK: 0, BUG: 0 };

      tasksResults.forEach((res, index) => {
        const projectTasks = res.tasks || [];
        const project = projects[index];
        
        allTasks = [...allTasks, ...projectTasks.map(t => ({ ...t, project }))];
        
        const doneCount = projectTasks.filter(t => t.status === 'DONE').length;
        const totalCount = projectTasks.length;
        const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
        
        projectStats.push({
          name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
          progress,
          total: totalCount
        });

        projectTasks.forEach(t => {
          if (types[t.type] !== undefined) types[t.type]++;
          else types['TASK']++;
        });
      });

      const now = new Date();
      const overdue = allTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE');

      setStats({
        total: allTasks.length,
        inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
        done: allTasks.filter(t => t.status === 'DONE').length,
        overdue: overdue.length
      });

      setOverdueTasks(overdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
      setMyTasks(allTasks.filter(t => t.assigneeId === user.id && t.status !== 'DONE').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setChartData(projectStats);
      setTypeData(Object.entries(types).map(([name, value]) => ({ name, value })));

    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#818cf8', '#4ade80', '#fbbf24', '#f87171'];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'EPIC': return <Zap size={14} className="text-purple-400" />;
      case 'STORY': return <Bookmark size={14} className="text-green-400" />;
      case 'BUG': return <Bug size={14} className="text-red-400" />;
      default: return <CheckSquare size={14} className="text-blue-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar pr-2 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">Overview of your team's velocity and tasks.</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Active Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium text-text-primary">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, icon: ListTodo, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Completed', value: stats.done, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' }
        ].map((stat, i) => (
          <div key={i} className="bg-bg-secondary p-5 rounded-2xl border border-border flex items-center gap-4 hover:border-accent/30 transition-colors">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{stat.label}</p>
              <h4 className="text-2xl font-bold text-text-primary">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-bg-secondary p-6 rounded-2xl border border-border flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-text-primary mb-1">Project Velocity</h3>
          <p className="text-sm text-text-secondary mb-6">Completion rates per project</p>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-bg-tertiary)' }}
                  contentStyle={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', borderRadius: '0.75rem' }}
                />
                <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--color-accent)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Type Distribution */}
        <div className="bg-bg-secondary p-6 rounded-2xl border border-border flex flex-col">
          <h3 className="text-lg font-bold text-text-primary mb-1">Work Distribution</h3>
          <p className="text-sm text-text-secondary mb-6">By issue type</p>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', borderRadius: '0.75rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {typeData.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-text-secondary uppercase">{t.name}</span>
                <span className="text-text-primary font-bold ml-auto">{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks & Overdue */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-bg-secondary p-6 rounded-2xl border border-border flex flex-col max-h-[400px]">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-text-primary">Assigned to Me</h3>
               <Badge variant="default">{myTasks.length}</Badge>
             </div>
             <div className="overflow-y-auto space-y-2 custom-scrollbar pr-2">
               {myTasks.length > 0 ? myTasks.map(t => (
                 <Link key={t.id} to={`/projects/${t.project.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-primary hover:border-accent/50 transition-all group">
                   {getTypeIcon(t.type)}
                   <div className="truncate flex-1">
                     <p className="text-sm font-semibold truncate group-hover:text-accent transition-colors">{t.title}</p>
                     <p className="text-[10px] text-text-secondary uppercase">{t.project.name} • {t.status}</p>
                   </div>
                   <ChevronRight size={14} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                 </Link>
               )) : <div className="py-10 text-center text-text-secondary text-sm">No tasks assigned.</div>}
             </div>
           </div>

           <div className="bg-bg-secondary p-6 rounded-2xl border border-border flex flex-col max-h-[400px]">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                 <Clock size={18} className="text-red-400" /> Overdue
               </h3>
               <Badge variant="HIGH" className="bg-red-500/10 text-red-400 border-red-500/20">{overdueTasks.length}</Badge>
             </div>
             <div className="overflow-y-auto space-y-2 custom-scrollbar pr-2">
               {overdueTasks.length > 0 ? overdueTasks.map(t => (
                 <Link key={t.id} to={`/projects/${t.project.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all group">
                   <AlertCircle size={14} className="text-red-400" />
                   <div className="truncate flex-1">
                     <p className="text-sm font-semibold truncate group-hover:text-red-400 transition-colors">{t.title}</p>
                     <p className="text-[10px] text-red-400/70 uppercase">Due {format(new Date(t.dueDate), 'MMM d')}</p>
                   </div>
                 </Link>
               )) : <div className="py-10 text-center text-text-secondary text-sm">No overdue tasks.</div>}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default DashboardPage;
