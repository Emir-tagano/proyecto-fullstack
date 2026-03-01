import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [rates, setRates] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');

    const [amount, setAmount] = useState(1);
    const [targetCurrency, setTargetCurrency] = useState('MXN');

    useEffect(() => {
        fetchTasks();
        fetchRates();
    }, [page]);

    const fetchTasks = async () => {
        try {
            const response = await api.get(`/tasks?page=${page}&limit=5`);
            setTasks(response.data.tasks);
            setTotalPages(response.data.totalPages);
        } catch (err) {
            console.error('Error fetching tasks', err);
        }
    };

    const fetchRates = async () => {
        try {
            const response = await api.get('/external/rates');
            setRates(response.data.rates);
        } catch (err) {
            console.error('Error fetching rates', err);
        }
    };

    const addTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', { title: newTask });
            setNewTask('');
            fetchTasks();
        } catch (err) {
            console.error('Error adding task', err);
        }
    };

    const toggleTask = async (id, completed) => {
        try {
            await api.put(`/tasks/${id}`, { completed: !completed });
            fetchTasks();
        } catch (err) {
            console.error('Error updating task', err);
        }
    };

    const deleteTask = async (id) => {
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
        } catch (err) {
            console.error('Error deleting task', err);
        }
    };

    const startEditing = (task) => {
        setEditingTaskId(task._id);
        setEditingTitle(task.title);
    };

    const cancelEditing = () => {
        setEditingTaskId(null);
        setEditingTitle('');
    };

    const saveEdit = async (id) => {
        if (!editingTitle.trim()) return;
        try {
            await api.put(`/tasks/${id}`, { title: editingTitle });
            setEditingTaskId(null);
            fetchTasks();
        } catch (err) {
            console.error('Error saving task', err);
        }
    };

    const convertValue = () => {
        if (!rates || !rates[targetCurrency]) return 0;
        return (amount * rates[targetCurrency]).toFixed(2);
    };

    const completedCount = tasks.filter(t => t.completed).length;

    return (
        <div className="dashboard">
            <header className="glass-header">
                <h1>Task Management & Market Rates</h1>
                <div className="user-info">
                    <span>Welcome, <strong>{user?.username}</strong> <span className="role-badge">{user?.role}</span></span>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="dashboard-top-grid">
                    <section className="rates-section glass-card">
                        <h3>Currency Rates (USD Base)</h3>
                        {rates ? (
                            <div className="rates-grid">
                                <div className="rate-item"><span>MXN:</span> {rates.MXN.toFixed(2)}</div>
                                <div className="rate-item"><span>EUR:</span> {rates.EUR.toFixed(2)}</div>
                                <div className="rate-item"><span>GBP:</span> {rates.GBP.toFixed(2)}</div>
                            </div>
                        ) : (
                            <p>Loading rates...</p>
                        )}

                        <div className="converter-tool">
                            <h4>Quick Converter</h4>
                            <div className="converter-form">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    min="1"
                                />
                                <span>USD =</span>
                                <select value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)}>
                                    <option value="MXN">MXN</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                                <span className="result">{convertValue()}</span>
                            </div>
                        </div>
                    </section>

                    <section className="stats-section glass-card">
                        <h3>Task Overview</h3>
                        <div className="stats-summary">
                            <div className="stat-circle">
                                <span>{tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%</span>
                                <small>Completion</small>
                            </div>
                            <div className="stat-details">
                                <p>Total displayed: {tasks.length}</p>
                                <p>Completed: {completedCount}</p>
                            </div>
                        </div>
                    </section>
                </div>

                <section className="tasks-section glass-card">
                    <h2>Your Tasks</h2>
                    <form onSubmit={addTask} className="task-form">
                        <input
                            type="text"
                            placeholder="Add a new task..."
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            required
                        />
                        <button type="submit">+</button>
                    </form>

                    <ul className="task-list">
                        {tasks.map(task => (
                            <li key={task._id} className={task.completed ? 'completed' : ''}>
                                {editingTaskId === task._id ? (
                                    <div className="edit-container">
                                        <input
                                            type="text"
                                            className="edit-input"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="edit-actions">
                                            <button onClick={() => saveEdit(task._id)} className="save-btn">Save</button>
                                            <button onClick={cancelEditing} className="cancel-btn">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="task-text" onClick={() => toggleTask(task._id, task.completed)}>
                                            <div className="checkbox">{task.completed ? '✓' : ''}</div>
                                            <span>{task.title}</span>
                                        </div>
                                        <div className="task-actions">
                                            <button onClick={() => startEditing(task)} className="edit-btn">✎</button>
                                            <button onClick={() => deleteTask(task._id)} className="delete-btn">×</button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="pagination">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                        <span>Page {page} of {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
