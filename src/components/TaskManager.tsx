import React, { useState } from 'react';
import {
  Plus, Trash2, CheckCircle2, Clock, AlertCircle, Circle, ChevronDown,
  Calendar, User, Tag, X
} from 'lucide-react';
import {
  useEventContext,
  PlannerEvent,
  EventTask,
  TaskStatus,
  TASK_STATUS_LABELS,
  TaskLinkedType,
} from '@/contexts/EventContext';

const GOLD = '#C9A24A';

const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  TODO: { bg: 'rgba(156,163,175,0.1)', text: '#6B7280', icon: <Circle className="w-3.5 h-3.5" /> },
  DOING: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', icon: <Clock className="w-3.5 h-3.5" /> },
  DONE: { bg: 'rgba(34,197,94,0.1)', text: '#22C55E', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  BLOCKED: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

interface TaskManagerProps {
  event: PlannerEvent;
}

const TaskManager: React.FC<TaskManagerProps> = ({ event }) => {
  const { addTask, updateTask, removeTask } = useEventContext();
  const tasks = event.tasks || [];

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLinkedType, setNewLinkedType] = useState<TaskLinkedType>('EVENT');
  const [newLinkedId, setNewLinkedId] = useState(event.id);
  const [newAssigned, setNewAssigned] = useState('');
  const [newDue, setNewDue] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');

  const filteredTasks = filterStatus === 'ALL' ? tasks : tasks.filter(t => t.status === filterStatus);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask(event.id, {
      linkedType: newLinkedType,
      linkedId: newLinkedId || event.id,
      title: newTitle.trim(),
      description: newDesc,
      assignedTo: newAssigned,
      dueAt: newDue ? new Date(newDue).toISOString() : '',
      status: 'TODO',
      tags: [],
    });
    setNewTitle('');
    setNewDesc('');
    setNewAssigned('');
    setNewDue('');
    setShowAdd(false);
  };

  const cycleStatus = (task: EventTask) => {
    const order: TaskStatus[] = ['TODO', 'DOING', 'DONE', 'BLOCKED'];
    const idx = order.indexOf(task.status);
    const next = order[(idx + 1) % order.length];
    updateTask(event.id, task.id, { status: next });
  };

  const getLinkedLabel = (task: EventTask): string => {
    if (task.linkedType === 'EVENT') return 'Event';
    if (task.linkedType === 'PROGRAM') {
      const prog = (event.programs || []).find(p => p.id === task.linkedId);
      return prog ? prog.programName : 'Program';
    }
    if (task.linkedType === 'MOMENT') {
      const mom = (event.moments || []).find(m => m.id === task.linkedId);
      return mom ? mom.name : 'Moment';
    }
    if (task.linkedType === 'PROPOSAL_ITEM') {
      const li = event.lineItems.find(i => i.id === task.linkedId);
      return li ? li.name : 'Line Item';
    }
    return task.linkedType;
  };

  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const doingCount = tasks.filter(t => t.status === 'DOING').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const blockedCount = tasks.filter(t => t.status === 'BLOCKED').length;

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
          Tasks & Checklist
        </h2>
        <div className="flex items-center gap-2">
          {/* Status counts */}
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.TODO.bg, color: STATUS_COLORS.TODO.text }}>{todoCount}</span>
            <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.DOING.bg, color: STATUS_COLORS.DOING.text }}>{doingCount}</span>
            <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.DONE.bg, color: STATUS_COLORS.DONE.text }}>{doneCount}</span>
            {blockedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: STATUS_COLORS.BLOCKED.bg, color: STATUS_COLORS.BLOCKED.text }}>{blockedCount}</span>
            )}
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all hover:shadow-sm"
            style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}
          >
            <Plus className="w-3 h-3" /> Add Task
          </button>
        </div>
      </div>
      <div className="h-px mb-4" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />

      {/* Filter */}
      <div className="flex items-center gap-1.5 mb-4">
        {(['ALL', 'TODO', 'DOING', 'DONE', 'BLOCKED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border"
            style={{
              backgroundColor: filterStatus === s ? GOLD : '#FFF',
              color: filterStatus === s ? '#FFF' : '#999',
              borderColor: filterStatus === s ? GOLD : '#EFEFEF',
            }}
          >
            {s === 'ALL' ? 'All' : TASK_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <div className="mb-4 p-4 rounded-xl border" style={{ borderColor: 'rgba(201,162,74,0.15)', backgroundColor: '#FAFAF7' }}>
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
              style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-xs outline-none resize-none"
              style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Link To</label>
                <select
                  value={newLinkedType}
                  onChange={(e) => { setNewLinkedType(e.target.value as TaskLinkedType); setNewLinkedId(event.id); }}
                  className="w-full h-7 text-[10px] rounded-md border px-2 outline-none"
                  style={{ borderColor: '#EFEFEF' }}
                >
                  <option value="EVENT">Event</option>
                  <option value="PROGRAM">Program</option>
                  <option value="MOMENT">Moment</option>
                  <option value="PROPOSAL_ITEM">Line Item</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Assigned To</label>
                <input
                  type="text"
                  value={newAssigned}
                  onChange={(e) => setNewAssigned(e.target.value)}
                  placeholder="Name..."
                  className="w-full h-7 text-[10px] rounded-md border px-2 outline-none"
                  style={{ borderColor: '#EFEFEF' }}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="w-full h-7 text-[10px] rounded-md border px-2 outline-none"
                  style={{ borderColor: '#EFEFEF' }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg text-[10px] font-medium" style={{ backgroundColor: GOLD, color: '#FFF' }}>
                Add Task
              </button>
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-[10px] text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(201,162,74,0.2)' }} />
          <p className="text-xs text-gray-400">
            {filterStatus === 'ALL' ? 'No tasks yet. Add your first task above.' : `No ${TASK_STATUS_LABELS[filterStatus as TaskStatus].toLowerCase()} tasks.`}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredTasks.map(task => {
            const sc = STATUS_COLORS[task.status];
            const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'DONE';

            return (
              <div
                key={task.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors hover:bg-black/[0.01]"
                style={{ borderColor: 'rgba(201,162,74,0.08)' }}
              >
                {/* Status Toggle */}
                <button
                  onClick={() => cycleStatus(task)}
                  className="mt-0.5 flex-shrink-0 transition-colors"
                  style={{ color: sc.text }}
                  title={`Status: ${TASK_STATUS_LABELS[task.status]} — click to cycle`}
                >
                  {sc.icon}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-xs font-medium ${task.status === 'DONE' ? 'line-through' : ''}`}
                      style={{ color: task.status === 'DONE' ? '#9CA3AF' : '#1A1A1A' }}
                    >
                      {task.title}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" /> {getLinkedLabel(task)}
                    </span>
                    {task.assignedTo && (
                      <span className="flex items-center gap-0.5">
                        <User className="w-2.5 h-2.5" /> {task.assignedTo}
                      </span>
                    )}
                    {task.dueAt && (
                      <span className="flex items-center gap-0.5" style={{ color: isOverdue ? '#EF4444' : undefined }}>
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(task.dueAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {isOverdue && ' (overdue)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeTask(event.id, task.id)}
                  className="p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-gray-300 hover:text-red-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskManager;
