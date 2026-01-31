const API_URL = '/api';

// DOM Elements
const authForm = document.getElementById('auth-form');
const toggleAuth = document.getElementById('toggle-auth');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');

const addTaskForm = document.getElementById('add-task-form');
const taskList = document.getElementById('task-list');
const logoutBtn = document.getElementById('logout-btn');

// State
let isRegistering = false;

// --- Auth Page Logic ---
if (authForm) {
    // Check if already logged in
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
    }

    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isRegistering = !isRegistering;
        if (isRegistering) {
            formTitle.textContent = 'Crear Cuenta';
            submitBtn.textContent = 'Registrarse';
            toggleAuth.textContent = '¿Ya tienes cuenta? Inicia sesión';
            document.getElementById('form-desc').textContent = 'Únete a nosotros hoy';
        } else {
            formTitle.textContent = 'Bienvenido';
            submitBtn.textContent = 'Entrar';
            toggleAuth.textContent = '¿No tienes cuenta? Regístrate';
            document.getElementById('form-desc').textContent = 'Inicia sesión para continuar';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const endpoint = isRegistering ? '/auth/register' : '/auth/login';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Error en la solicitud');

            if (isRegistering) {
                alert('Cuenta creada con éxito. Ahora puedes iniciar sesión.');
                // Switch back to login
                toggleAuth.click();
            } else {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', data.username);
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            alert(err.message);
        }
    });
}

// --- Dashboard Logic ---
if (taskList || addTaskForm) {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'index.html';
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Load Tasks
    const loadTasks = async () => {
        try {
            const res = await fetch(`${API_URL}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) {
                localStorage.clear();
                window.location.href = 'index.html';
                return;
            }
            const tasks = await res.json();
            renderTasks(tasks);
        } catch (err) {
            console.error(err);
        }
    };

    const renderTasks = (tasks) => {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <span>${task.title}</span>
                <div class="task-actions">
                    <button class="edit-btn" onclick="editTask('${task._id}', '${task.title}')">Editar</button>
                    <button class="delete-btn" onclick="deleteTask('${task._id}')">Eliminar</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    };

    // Add Task
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('new-task-title');
            const title = titleInput.value;

            try {
                const res = await fetch(`${API_URL}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title })
                });

                if (res.ok) {
                    titleInput.value = '';
                    loadTasks();
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    // Global edit function
    window.editTask = async (id, currentTitle) => {
        const newTitle = prompt('Editar tarea:', currentTitle);
        if (newTitle && newTitle !== currentTitle) {
            try {
                const res = await fetch(`${API_URL}/tasks/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title: newTitle })
                });

                if (res.ok) {
                    loadTasks();
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    // Global delete function
    window.deleteTask = async (id) => {
        if (!confirm('¿Estás seguro?')) return;
        try {
            await fetch(`${API_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            loadTasks();
        } catch (err) {
            console.error(err);
        }
    };

    // Initialize
    loadTasks();
}
