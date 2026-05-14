import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  AlertCircle,
  ListTodo,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  dueDate: string; // ISO string or simple date-time string
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
}

export default function TaskCenter() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Audit Kepatuhan Pajak (PSAK 71)', dueDate: '2026-05-20T10:00', completed: false, priority: 'HIGH', category: 'COMPLIANCE' },
    { id: '2', title: 'Sinkronisasi Gateway IBKR/CGS', dueDate: '2026-05-14T15:00', completed: true, priority: 'MEDIUM', category: 'OPERATIONAL' },
    { id: '3', title: 'Review Portofolio High-Net-Worth', dueDate: '2026-05-15T09:00', completed: false, priority: 'HIGH', category: 'ASSET MGMT' },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addTask = () => {
    if (!newTaskTitle || !newTaskDate || !newTaskTime) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      dueDate: `${newTaskDate}T${newTaskTime}`,
      completed: false,
      priority: 'MEDIUM',
      category: 'GENERAL'
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskDate('');
    setNewTaskTime('');
    setIsAdding(false);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'No Date';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#deff9a]/10 border border-[#deff9a]/20 flex items-center justify-center">
            <ListTodo className="w-6 h-6 text-[#deff9a]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">MANAJEMEN TUGAS OPERASIONAL</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Internal Work Order & Task Tracking</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#deff9a] text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-white transition-all flex items-center gap-2"
        >
          {isAdding ? <ChevronRight className="w-3 h-3 rotate-90" /> : <Plus className="w-3 h-3" />}
          NEW TASK
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl border border-[#deff9a]/20 bg-zinc-900/50 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Task Description</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task description..." 
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#deff9a]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Due Date</label>
                  <input 
                    type="date" 
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#deff9a]/50 [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time</label>
                  <input 
                    type="time" 
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#deff9a]/50 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white"
              >
                CANCEL
              </button>
              <button 
                onClick={addTask}
                className="bg-[#deff9a] text-black px-6 py-2 rounded-lg text-xs font-bold hover:bg-white transition-all shadow-lg shadow-[#deff9a]/10"
              >
                CREATE TASK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3">
        {tasks.map(task => (
          <motion.div 
            key={task.id}
            layout
            className={`p-4 rounded-2xl border ${task.completed ? 'border-white/5 bg-zinc-950/30' : 'border-white/10 bg-zinc-900/40'} flex items-center justify-between group hover:border-[#deff9a]/20 transition-all`}
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleTask(task.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.completed ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-zinc-700 hover:border-[#deff9a]'
                }`}
              >
                {task.completed && <CheckCircle2 className="w-4 h-4" />}
              </button>
              
              <div>
                <h3 className={`text-sm font-bold ${task.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold border border-white/5 uppercase">
                    {task.category}
                  </span>
                  <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${
                    task.completed ? 'text-zinc-600' : 
                    isOverdue(task.dueDate) ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {isOverdue(task.dueDate) && !task.completed ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    DUE: {formatDate(task.dueDate)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                task.priority === 'HIGH' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                task.priority === 'MEDIUM' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                {task.priority}
              </div>
              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
