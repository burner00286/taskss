import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Cloud,
  Clock3,
  FlaskConical,
  FolderKanban,
  Goal,
  HeartPulse,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2
} from 'lucide-react';
import Dock from './components/Dock.jsx';
import DotField from './components/DotField.jsx';
import LineWaves from './components/LineWaves.jsx';
import SpecularButton from './components/SpecularButton.jsx';

const STORAGE_KEY = 'personal-time-tracker-v2';
const SESSION_KEY = 'personal-time-tracker-session';
const AUTH_USER = 'manu';
const AUTH_PASSWORD = '1234@108';
const MINUTE = 60;

const seedData = {
  projects: [
    { id: 'p1', name: 'Deep Work', color: '#14b8a6', targetHours: 12 },
    { id: 'p2', name: 'Learning', color: '#f59e0b', targetHours: 8 },
    { id: 'p3', name: 'Life Admin', color: '#6366f1', targetHours: 5 }
  ],
  tasks: [
    { id: 't1', title: 'Plan the week', projectId: 'p1', status: 'todo', priority: 'High', estimate: 60, seconds: 2700 },
    { id: 't2', title: 'Review React notes', projectId: 'p2', status: 'doing', priority: 'Medium', estimate: 90, seconds: 3600 },
    { id: 't3', title: 'Inbox cleanup', projectId: 'p3', status: 'done', priority: 'Low', estimate: 30, seconds: 1800 }
  ],
  blocks: [
    { id: 'b1', title: 'Morning focus', projectId: 'p1', day: 1, start: 9, duration: 2 },
    { id: 'b2', title: 'Study block', projectId: 'p2', day: 2, start: 14, duration: 1.5 },
    { id: 'b3', title: 'Admin sweep', projectId: 'p3', day: 4, start: 16, duration: 1 }
  ],
  schedules: [
    { id: 's1', subject: 'Data Structures', kind: 'Theory', day: 0, start: 10, duration: 1, room: 'A-204' },
    { id: 's2', subject: 'Physics Lab', kind: 'Lab', day: 2, start: 13, duration: 2, room: 'Lab 3' }
  ],
  habits: [
    { id: 'h1', name: 'Workout', target: 5, completions: {} },
    { id: 'h2', name: 'Read', target: 7, completions: {} },
    { id: 'h3', name: 'Sleep by 12', target: 6, completions: {} }
  ],
  preferences: {
    activityStart: ''
  },
  logs: {}
};

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatSeconds(total) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function hoursLabel(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display} ${suffix}`;
}

function userStorageKey(username = AUTH_USER) {
  return `${STORAGE_KEY}-${username}`;
}

function loadData(username = AUTH_USER) {
  try {
    const stored = localStorage.getItem(userStorageKey(username));
    return { ...seedData, ...(stored ? JSON.parse(stored) : {}) };
  } catch {
    return seedData;
  }
}

function Stat({ icon, label, value, subtext }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{subtext}</small>
      </div>
    </article>
  );
}

function ProjectPill({ project }) {
  return (
    <span className="project-pill" style={{ '--project-color': project?.color || '#94a3b8' }}>
      {project?.name || 'No project'}
    </span>
  );
}

function Header({ onAddTask, onLogout }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark"><Clock3 size={22} /></div>
        <div>
          <p>Personal tracker</p>
          <h1>Focus Board</h1>
        </div>
      </div>
      <div className="sync-pill"><Cloud size={16} /> manu</div>
      <SpecularButton size="md" radius={12} tint="#0f172a" tintOpacity={1} autoAnimate onClick={onAddTask}>
        <Plus size={17} /> New task
      </SpecularButton>
      <button className="logout-button" onClick={onLogout} title="Log out">
        <LogOut size={18} />
      </button>
    </header>
  );
}

function TimerPanel({ tasks, projects, activeTaskId, setActiveTaskId, isRunning, setIsRunning, resetTimer }) {
  const activeTask = tasks.find(task => task.id === activeTaskId) || tasks[0];
  const project = projects.find(item => item.id === activeTask?.projectId);
  const taskOptions = tasks.filter(task => task.status !== 'done');
  const estimateSeconds = (activeTask?.estimate || 0) * MINUTE;
  const remainingSeconds = Math.max(0, estimateSeconds - (activeTask?.seconds || 0));
  const progress = estimateSeconds ? Math.min(100, Math.round(((activeTask?.seconds || 0) / estimateSeconds) * 100)) : 0;

  return (
    <section className="panel timer-panel" id="timer">
      <div className="section-heading">
        <span><Clock3 size={18} /> Focus timer</span>
        <ProjectPill project={project} />
      </div>
      <div className="timer-face">
        <small>Time remaining</small>
        <strong>{formatSeconds(remainingSeconds)}</strong>
        <div className="progress-track timer-progress" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%`, background: project?.color }} />
        </div>
        <select value={activeTask?.id || ''} onChange={event => setActiveTaskId(event.target.value)}>
          {taskOptions.map(task => (
            <option value={task.id} key={task.id}>{task.title}</option>
          ))}
        </select>
      </div>
      <div className="timer-actions">
        <button className="icon-button primary" disabled={!activeTask || remainingSeconds === 0} onClick={() => setIsRunning(!isRunning)} title={isRunning ? 'Pause timer' : 'Start timer'}>
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button className="icon-button" onClick={resetTimer} title="Reset selected task timer">
          <RotateCcw size={20} />
        </button>
      </div>
    </section>
  );
}

function TaskBoard({ tasks, projects, updateTask, deleteTask, setActiveTaskId, setIsRunning }) {
  const columns = [
    ['todo', 'To do'],
    ['doing', 'Doing'],
    ['done', 'Done']
  ];

  return (
    <section className="task-board" id="tasks">
      {columns.map(([status, label]) => (
        <div className="task-column" key={status}>
          <div className="column-title">
            <span>{label}</span>
            <small>{tasks.filter(task => task.status === status).length}</small>
          </div>
          {tasks.filter(task => task.status === status).map(task => {
            const project = projects.find(item => item.id === task.projectId);
            const progress = Math.min(100, Math.round((task.seconds / (task.estimate * MINUTE || 1)) * 100));
            return (
              <article className="task-card" key={task.id}>
                <div className="task-topline">
                  <button
                    className="check-button"
                    onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                    title={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.status === 'done' ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                  </button>
                  <strong>{task.title}</strong>
                  <button className="ghost-icon" onClick={() => deleteTask(task.id)} title="Delete task">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="task-meta">
                  <ProjectPill project={project} />
                  <span>{task.priority}</span>
                  <span>{formatSeconds(task.seconds)}</span>
                </div>
                <div className="progress-track" aria-label={`${progress}% of estimate`}>
                  <span style={{ width: `${progress}%`, background: project?.color }} />
                </div>
                <div className="task-controls">
                  <select value={task.status} onChange={event => updateTask(task.id, { status: event.target.value })}>
                    <option value="todo">To do</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                  </select>
                  <button
                    onClick={() => {
                      setActiveTaskId(task.id);
                      setIsRunning(true);
                    }}
                  >
                    <Play size={15} /> Track
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ))}
    </section>
  );
}

function AddTaskForm({ projects, addTask }) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [priority, setPriority] = useState('Medium');
  const [estimate, setEstimate] = useState(45);

  function submit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), projectId, priority, estimate: Number(estimate) || 30 });
    setTitle('');
  }

  return (
    <form className="panel compact-form task-creator" onSubmit={submit}>
      <div className="section-heading">
        <span><Plus size={18} /> Add task</span>
      </div>
      <label>
        <span>Task</span>
        <input value={title} onChange={event => setTitle(event.target.value)} placeholder="What needs time?" />
      </label>
      <div className="form-grid">
        <label>
          <span>Project</span>
          <select value={projectId} onChange={event => setProjectId(event.target.value)}>
            {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select value={priority} onChange={event => setPriority(event.target.value)}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label>
          <span>Minutes</span>
          <input type="number" min="5" step="5" value={estimate} onChange={event => setEstimate(event.target.value)} aria-label="Estimate in minutes" />
        </label>
      </div>
      <SpecularButton size="sm" radius={10} tint="#0f172a" tintOpacity={1} type="submit">Create task</SpecularButton>
    </form>
  );
}

function CalendarView({ blocks, schedules = [], projects, addBlock, addSchedule, deleteBlock, deleteSchedule }) {
  const [draft, setDraft] = useState({ title: '', projectId: projects[0]?.id || '', day: 1, start: 9, duration: 1 });
  const [scheduleDraft, setScheduleDraft] = useState({ subject: '', kind: 'Theory', day: 0, start: 9, duration: 1, room: '' });
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 13 }, (_, index) => index + 7);

  function submit(event) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    addBlock({ ...draft, title: draft.title.trim(), day: Number(draft.day), start: Number(draft.start), duration: Number(draft.duration) });
    setDraft({ ...draft, title: '' });
  }

  function submitSchedule(event) {
    event.preventDefault();
    if (!scheduleDraft.subject.trim()) return;
    addSchedule({
      ...scheduleDraft,
      subject: scheduleDraft.subject.trim(),
      day: Number(scheduleDraft.day),
      start: Number(scheduleDraft.start),
      duration: Number(scheduleDraft.duration)
    });
    setScheduleDraft({ ...scheduleDraft, subject: '', room: '' });
  }

  return (
    <section className="calendar-layout" id="calendar">
      <aside className="calendar-sidebar">
        <form className="panel compact-form" onSubmit={submit}>
          <div className="section-heading">
            <span><CalendarDays size={18} /> Time block</span>
          </div>
          <label>
            <span>Block title</span>
            <input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Morning focus" />
          </label>
          <div className="form-grid two">
            <label>
              <span>Project</span>
              <select value={draft.projectId} onChange={event => setDraft({ ...draft, projectId: event.target.value })}>
                {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label>
              <span>Day</span>
              <select value={draft.day} onChange={event => setDraft({ ...draft, day: event.target.value })}>
                {days.map((day, index) => <option value={index} key={day}>{day}</option>)}
              </select>
            </label>
            <label>
              <span>Start</span>
              <select value={draft.start} onChange={event => setDraft({ ...draft, start: event.target.value })}>
                {hours.map(hour => <option value={hour} key={hour}>{hoursLabel(hour)}</option>)}
              </select>
            </label>
            <label>
              <span>Hours</span>
              <input type="number" min="0.5" max="6" step="0.5" value={draft.duration} onChange={event => setDraft({ ...draft, duration: event.target.value })} aria-label="Duration in hours" />
            </label>
          </div>
          <SpecularButton size="sm" radius={10} tint="#0f172a" tintOpacity={1} type="submit">Add block</SpecularButton>
        </form>

        <form className="panel compact-form" onSubmit={submitSchedule}>
          <div className="section-heading">
            <span><BookOpen size={18} /> College schedule</span>
          </div>
          <label>
            <span>Class</span>
            <input value={scheduleDraft.subject} onChange={event => setScheduleDraft({ ...scheduleDraft, subject: event.target.value })} placeholder="Subject name" />
          </label>
          <div className="form-grid two">
            <label>
              <span>Type</span>
              <select value={scheduleDraft.kind} onChange={event => setScheduleDraft({ ...scheduleDraft, kind: event.target.value })}>
                <option>Theory</option>
                <option>Lab</option>
              </select>
            </label>
            <label>
              <span>Day</span>
              <select value={scheduleDraft.day} onChange={event => setScheduleDraft({ ...scheduleDraft, day: event.target.value })}>
                {days.map((day, index) => <option value={index} key={day}>{day}</option>)}
              </select>
            </label>
            <label>
              <span>Start</span>
              <select value={scheduleDraft.start} onChange={event => setScheduleDraft({ ...scheduleDraft, start: event.target.value })}>
                {hours.map(hour => <option value={hour} key={hour}>{hoursLabel(hour)}</option>)}
              </select>
            </label>
            <label>
              <span>Hours</span>
              <input type="number" min="0.5" max="4" step="0.5" value={scheduleDraft.duration} onChange={event => setScheduleDraft({ ...scheduleDraft, duration: event.target.value })} aria-label="Class duration in hours" />
            </label>
          </div>
          <label>
            <span>Room</span>
            <input value={scheduleDraft.room} onChange={event => setScheduleDraft({ ...scheduleDraft, room: event.target.value })} placeholder="Room / lab" />
          </label>
          <SpecularButton size="sm" radius={10} tint="#0f172a" tintOpacity={1} type="submit">
            Add class
          </SpecularButton>
        </form>
      </aside>
      <div className="calendar-shell">
        <div className="calendar-grid">
          <div className="grid-spacer" />
          {days.map(day => <div className="day-head" key={day}>{day}</div>)}
          {hours.map(hour => (
            <Fragment key={hour}>
              <div className="hour-label" key={`h-${hour}`}>{hoursLabel(hour)}</div>
              {days.map((day, dayIndex) => (
                <div className="time-cell" key={`${day}-${hour}`}>
                  {schedules
                    .filter(item => item.day === dayIndex && Math.floor(item.start) === hour)
                    .map(item => (
                      <button
                        key={item.id}
                        className={`time-block class-block ${item.kind === 'Lab' ? 'lab' : 'theory'}`}
                        style={{ '--block-span': item.duration }}
                        onDoubleClick={() => deleteSchedule(item.id)}
                        title="Double click to remove"
                      >
                        <span className="class-kind">{item.kind === 'Lab' ? <FlaskConical size={13} /> : <BookOpen size={13} />} {item.kind}</span>
                        <strong>{item.subject}</strong>
                        <span>{item.room || 'College class'}</span>
                      </button>
                    ))}
                  {blocks
                    .filter(block => block.day === dayIndex && Math.floor(block.start) === hour)
                    .map(block => {
                      const project = projects.find(item => item.id === block.projectId);
                      return (
                        <button
                          key={block.id}
                          className="time-block"
                          style={{ '--project-color': project?.color, '--block-span': block.duration }}
                          onDoubleClick={() => deleteBlock(block.id)}
                          title="Double click to remove"
                        >
                          <strong>{block.title}</strong>
                          <span>{project?.name}</span>
                        </button>
                      );
                    })}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectsView({ projects, tasks, addProject }) {
  const [name, setName] = useState('');
  const [targetHours, setTargetHours] = useState(6);
  const palette = ['#14b8a6', '#f59e0b', '#6366f1', '#ef4444', '#22c55e'];
  const [color, setColor] = useState(palette[0]);

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    addProject({ name: name.trim(), color, targetHours: Number(targetHours) || 1 });
    setName('');
  }

  return (
    <section className="projects-layout" id="projects">
      <form className="panel compact-form" onSubmit={submit}>
        <div className="section-heading">
          <span><FolderKanban size={18} /> New project</span>
        </div>
        <input value={name} onChange={event => setName(event.target.value)} placeholder="Project name" />
        <div className="swatches">
          {palette.map(item => (
            <button
              type="button"
              key={item}
              className={color === item ? 'swatch selected' : 'swatch'}
              style={{ background: item }}
              onClick={() => setColor(item)}
              aria-label={`Select ${item}`}
            />
          ))}
        </div>
        <input type="number" min="1" value={targetHours} onChange={event => setTargetHours(event.target.value)} aria-label="Weekly target hours" />
        <SpecularButton size="sm" radius={10} tint="#0f172a" tintOpacity={1} type="submit">Add project</SpecularButton>
      </form>
      <div className="project-list">
        {projects.map(project => {
          const seconds = tasks.filter(task => task.projectId === project.id).reduce((sum, task) => sum + task.seconds, 0);
          const target = project.targetHours * 3600;
          const percent = Math.min(100, Math.round((seconds / target) * 100));
          return (
            <article className="project-card" key={project.id}>
              <div>
                <ProjectPill project={project} />
                <strong>{percent}%</strong>
              </div>
              <div className="progress-track tall">
                <span style={{ width: `${percent}%`, background: project.color }} />
              </div>
              <small>{formatSeconds(seconds)} tracked of {project.targetHours}h target</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ActivityGrid({ logs, activityStart, setActivityStart }) {
  const days = useMemo(() => {
    const start = activityStart ? new Date(`${activityStart}T00:00:00`) : new Date();
    if (!activityStart) start.setDate(start.getDate() - 153);
    return Array.from({ length: 154 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = todayKey(date);
      const minutes = Math.round((logs[key] || 0) / 60);
      return { key, minutes };
    });
  }, [logs, activityStart]);

  return (
    <section className="panel activity-panel">
      <div className="section-heading">
        <span><BarChart3 size={18} /> Activity grid</span>
        <label className="inline-date">
          <span>Starts</span>
          <input type="date" value={activityStart} onChange={event => setActivityStart(event.target.value)} />
        </label>
      </div>
      <div className="activity-grid">
        {days.map(day => {
          const level = day.minutes === 0 ? 0 : day.minutes < 30 ? 1 : day.minutes < 90 ? 2 : day.minutes < 180 ? 3 : 4;
          return <span key={day.key} className={`activity-cell level-${level}`} title={`${day.key}: ${day.minutes}m`} />;
        })}
      </div>
    </section>
  );
}

function HabitTracker({ habits = [], addHabit, toggleHabit, deleteHabit }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState(5);
  const weekDays = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { key: todayKey(date), label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] };
    });
  }, []);

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    addHabit({ name: name.trim(), target: Number(target) || 1 });
    setName('');
  }

  return (
    <section className="panel habit-panel">
      <div className="section-heading">
        <span><HeartPulse size={18} /> Habits</span>
        <small>This week</small>
      </div>
      <div className="habit-list">
        {habits.map(habit => {
          const done = weekDays.filter(day => habit.completions?.[day.key]).length;
          const percent = Math.min(100, Math.round((done / habit.target) * 100));
          return (
            <article className="habit-row" key={habit.id}>
              <div className="habit-title">
                <strong>{habit.name}</strong>
                <button className="ghost-icon" onClick={() => deleteHabit(habit.id)} title="Delete habit">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="habit-days">
                {weekDays.map(day => (
                  <button
                    key={day.key}
                    className={habit.completions?.[day.key] ? 'done' : ''}
                    onClick={() => toggleHabit(habit.id, day.key)}
                    title={`${habit.name}: ${day.key}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="habit-progress">
                <Goal size={15} />
                <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
                <small>{done}/{habit.target}</small>
              </div>
            </article>
          );
        })}
      </div>
      <form className="habit-create" onSubmit={submit}>
        <input value={name} onChange={event => setName(event.target.value)} placeholder="New habit" />
        <input type="number" min="1" max="7" value={target} onChange={event => setTarget(event.target.value)} aria-label="Weekly target" />
        <button type="submit"><Plus size={17} /></button>
      </form>
    </section>
  );
}

function Dashboard({ data, activeTaskId, setActiveTaskId, isRunning, setIsRunning, resetTimer, addTask, updateTask, deleteTask, setActivityStart, addHabit, toggleHabit, deleteHabit }) {
  const totalSeconds = data.tasks.reduce((sum, task) => sum + task.seconds, 0);
  const doneCount = data.tasks.filter(task => task.status === 'done').length;
  const plannedHours = data.blocks.reduce((sum, block) => sum + block.duration, 0);
  const classHours = (data.schedules || []).reduce((sum, block) => sum + block.duration, 0);

  return (
    <main className="dashboard-grid">
      <section className="hero-panel">
        <DotField dotRadius={2} dotSpacing={17} bulgeStrength={54} glowRadius={180} sparkle waveAmplitude={0.3} />
        <div className="hero-content">
          <p><Sparkles size={16} /> Build the day before it builds you</p>
          <h2>Plan blocks, run timers, and keep projects moving.</h2>
          <div className="stat-row">
            <Stat icon={<Clock3 size={19} />} label="Tracked" value={formatSeconds(totalSeconds)} subtext="all tasks" />
            <Stat icon={<CheckCircle2 size={19} />} label="Completed" value={doneCount} subtext={`${data.tasks.length} tasks`} />
            <Stat icon={<CalendarDays size={19} />} label="Planned" value={`${plannedHours}h`} subtext="this week" />
            <Stat icon={<BookOpen size={19} />} label="College" value={`${classHours}h`} subtext="fixed classes" />
          </div>
        </div>
      </section>
      <TimerPanel
        tasks={data.tasks}
        projects={data.projects}
        activeTaskId={activeTaskId}
        setActiveTaskId={setActiveTaskId}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        resetTimer={resetTimer}
      />
      <section className="work-stack">
        <ActivityGrid logs={data.logs} activityStart={data.preferences?.activityStart || ''} setActivityStart={setActivityStart} />
        <TaskBoard
          tasks={data.tasks}
          projects={data.projects}
          updateTask={updateTask}
          deleteTask={deleteTask}
          setActiveTaskId={setActiveTaskId}
          setIsRunning={setIsRunning}
        />
      </section>
      <section className="planning-row">
        <HabitTracker habits={data.habits} addHabit={addHabit} toggleHabit={toggleHabit} deleteHabit={deleteHabit} />
        <AddTaskForm projects={data.projects} addTask={addTask} />
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('manu');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (username === AUTH_USER && password === AUTH_PASSWORD) {
      setError('');
      onLogin(username);
      return;
    }
    setError('Wrong username or password.');
  }

  return (
    <main className="login-shell">
      <div className="background-waves">
        <LineWaves
          speed={0.22}
          innerLineCount={42}
          outerLineCount={28}
          warpIntensity={0.85}
          rotation={-38}
          colorCycleSpeed={0.35}
          brightness={0.28}
          color1="#14b8a6"
          color2="#f59e0b"
          color3="#8b5cf6"
          mouseInfluence={1.4}
        />
      </div>
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark"><Clock3 size={24} /></div>
        <div>
          <p>Personal tracker</p>
          <h1>Sign in to Focus Board</h1>
        </div>
        <input value={username} onChange={event => setUsername(event.target.value)} placeholder="Username" autoComplete="username" />
        <input value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" type="password" autoComplete="current-password" />
        {error && <small className="login-error">{error}</small>}
        <SpecularButton size="md" radius={12} tint="#0f172a" tintOpacity={1} type="submit" autoAnimate>
          Log in
        </SpecularButton>
        <small className="storage-note">Your planner is saved in this browser for the manu profile.</small>
      </form>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(() => localStorage.getItem(SESSION_KEY));
  const [activeView, setActiveView] = useState('dashboard');
  const [data, setData] = useState(() => loadData(session || AUTH_USER));
  const [activeTaskId, setActiveTaskId] = useState(() => data.tasks.find(task => task.status !== 'done')?.id || data.tasks[0]?.id);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (session) localStorage.setItem(userStorageKey(session), JSON.stringify(data));
  }, [data, session]);

  useEffect(() => {
    if (!isRunning || !activeTaskId) return undefined;
    const interval = setInterval(() => {
      const key = todayKey();
      setData(current => ({
        ...current,
        tasks: current.tasks.map(task => {
          if (task.id !== activeTaskId) return task;
          const target = task.estimate * MINUTE;
          const nextSeconds = Math.min(target, task.seconds + 1);
          if (nextSeconds >= target) setIsRunning(false);
          return {
            ...task,
            seconds: nextSeconds,
            status: nextSeconds >= target ? 'done' : task.status === 'todo' ? 'doing' : task.status
          };
        }),
        logs: { ...current.logs, [key]: (current.logs[key] || 0) + 1 }
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, activeTaskId]);

  function handleLogin(username) {
    localStorage.setItem(SESSION_KEY, username);
    setSession(username);
    setData(loadData(username));
    setActiveTaskId(loadData(username).tasks.find(task => task.status !== 'done')?.id || loadData(username).tasks[0]?.id);
  }

  function handleLogout() {
    setIsRunning(false);
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  function addTask(task) {
    const id = `t-${crypto.randomUUID()}`;
    setData(current => ({
      ...current,
      tasks: [{ id, status: 'todo', seconds: 0, ...task }, ...current.tasks]
    }));
    setActiveTaskId(id);
    setActiveView('tasks');
  }

  function updateTask(id, patch) {
    setData(current => ({ ...current, tasks: current.tasks.map(task => task.id === id ? { ...task, ...patch } : task) }));
  }

  function deleteTask(id) {
    setData(current => ({ ...current, tasks: current.tasks.filter(task => task.id !== id) }));
    if (activeTaskId === id) {
      setIsRunning(false);
      setActiveTaskId(data.tasks.find(task => task.id !== id)?.id);
    }
  }

  function addProject(project) {
    setData(current => ({ ...current, projects: [...current.projects, { id: `p-${crypto.randomUUID()}`, ...project }] }));
  }

  function addBlock(block) {
    setData(current => ({ ...current, blocks: [...current.blocks, { id: `b-${crypto.randomUUID()}`, ...block }] }));
  }

  function setActivityStart(activityStart) {
    setData(current => ({ ...current, preferences: { ...(current.preferences || {}), activityStart } }));
  }

  function addHabit(habit) {
    setData(current => ({
      ...current,
      habits: [...(current.habits || []), { id: `h-${crypto.randomUUID()}`, completions: {}, ...habit }]
    }));
  }

  function toggleHabit(id, dateKey) {
    setData(current => ({
      ...current,
      habits: (current.habits || []).map(habit => {
        if (habit.id !== id) return habit;
        const completions = { ...(habit.completions || {}) };
        if (completions[dateKey]) delete completions[dateKey];
        else completions[dateKey] = true;
        return { ...habit, completions };
      })
    }));
  }

  function deleteHabit(id) {
    setData(current => ({ ...current, habits: (current.habits || []).filter(habit => habit.id !== id) }));
  }

  function addSchedule(schedule) {
    setData(current => ({ ...current, schedules: [...(current.schedules || []), { id: `s-${crypto.randomUUID()}`, ...schedule }] }));
  }

  function deleteBlock(id) {
    setData(current => ({ ...current, blocks: current.blocks.filter(block => block.id !== id) }));
  }

  function deleteSchedule(id) {
    setData(current => ({ ...current, schedules: (current.schedules || []).filter(item => item.id !== id) }));
  }

  function resetTimer() {
    setData(current => ({ ...current, tasks: current.tasks.map(task => task.id === activeTaskId ? { ...task, seconds: 0 } : task) }));
  }

  const dockItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', onClick: () => setActiveView('dashboard'), className: activeView === 'dashboard' ? 'active' : '' },
    { icon: <CalendarDays size={20} />, label: 'Calendar', onClick: () => setActiveView('calendar'), className: activeView === 'calendar' ? 'active' : '' },
    { icon: <ListTodo size={20} />, label: 'Tasks', onClick: () => setActiveView('tasks'), className: activeView === 'tasks' ? 'active' : '' },
    { icon: <FolderKanban size={20} />, label: 'Projects', onClick: () => setActiveView('projects'), className: activeView === 'projects' ? 'active' : '' }
  ];

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="app-shell">
      <div className="background-waves">
        <LineWaves
          speed={0.18}
          innerLineCount={46}
          outerLineCount={30}
          warpIntensity={0.75}
          rotation={-42}
          colorCycleSpeed={0.28}
          brightness={0.2}
          color1="#14b8a6"
          color2="#f59e0b"
          color3="#8b5cf6"
          mouseInfluence={1.25}
        />
      </div>
      <Header onAddTask={() => setActiveView('tasks')} onLogout={handleLogout} />
      {activeView === 'dashboard' && (
        <Dashboard
          data={data}
          activeTaskId={activeTaskId}
          setActiveTaskId={setActiveTaskId}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          resetTimer={resetTimer}
          addTask={addTask}
          updateTask={updateTask}
          deleteTask={deleteTask}
          setActivityStart={setActivityStart}
          addHabit={addHabit}
          toggleHabit={toggleHabit}
          deleteHabit={deleteHabit}
        />
      )}
      {activeView === 'calendar' && (
        <CalendarView
          blocks={data.blocks}
          schedules={data.schedules}
          projects={data.projects}
          addBlock={addBlock}
          addSchedule={addSchedule}
          deleteBlock={deleteBlock}
          deleteSchedule={deleteSchedule}
        />
      )}
      {activeView === 'tasks' && (
        <main className="page-stack">
          <AddTaskForm projects={data.projects} addTask={addTask} />
          <TaskBoard
            tasks={data.tasks}
            projects={data.projects}
            updateTask={updateTask}
            deleteTask={deleteTask}
            setActiveTaskId={setActiveTaskId}
            setIsRunning={setIsRunning}
          />
        </main>
      )}
      {activeView === 'projects' && <ProjectsView projects={data.projects} tasks={data.tasks} addProject={addProject} />}
      <Dock items={dockItems} />
    </div>
  );
}
