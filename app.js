// API Configuration
const API_BASE = 'http://localhost:3000/api';

// State Management
let currentUser = null;
let authToken = localStorage.getItem('token');
let allTags = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('newsForm').addEventListener('submit', handleNewsSubmit);
}

// Authentication
function checkAuth() {
    if (authToken) {
        fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
        .then(res => res.json())
        .then(user => {
            currentUser = user;
            updateNavMenu();
            showTimeline();
        })
        .catch(() => {
            logout();
        });
    } else {
        updateNavMenu();
        showLogin();
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', authToken);
            showToast('登录成功！', 'success');
            updateNavMenu();
            showTimeline();
        }
    })
    .catch(() => showToast('登录失败，请检查服务器连接', 'error'));
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', authToken);
            showToast('注册成功！', 'success');
            updateNavMenu();
            showTimeline();
        }
    })
    .catch(() => showToast('注册失败，请检查服务器连接', 'error'));
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    updateNavMenu();
    showLogin();
    showToast('已退出登录', 'success');
}

// Navigation
function updateNavMenu() {
    const navMenu = document.getElementById('navMenu');

    if (currentUser) {
        navMenu.innerHTML = `
            <div class="nav-user">
                <span>👤 ${currentUser.username} (${currentUser.role === 'admin' ? '管理员' : '用户'})</span>
            </div>
            <button class="btn btn-secondary" onclick="showTimeline()">时间线</button>
            <button class="btn btn-primary" onclick="showAddNewsForm()">添加新闻</button>
            ${currentUser.role === 'admin' ? '<button class="btn btn-secondary" onclick="showAdmin()">管理面板</button>' : ''}
            <button class="btn btn-secondary" onclick="logout()">退出</button>
        `;
    } else {
        navMenu.innerHTML = `
            <button class="btn btn-primary" onclick="showLogin()">登录</button>
            <button class="btn btn-secondary" onclick="showRegister()">注册</button>
        `;
    }
}

// Section Management
function hideAllSections() {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
}

function showLogin() {
    hideAllSections();
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('loginForm').reset();
}

function showRegister() {
    hideAllSections();
    document.getElementById('registerSection').style.display = 'block';
    document.getElementById('registerForm').reset();
}

function showTimeline() {
    hideAllSections();
    document.getElementById('timelineSection').style.display = 'block';
    loadTimeline();
}

function showAddNewsForm() {
    if (!currentUser) {
        showToast('请先登录', 'error');
        showLogin();
        return;
    }
    hideAllSections();
    document.getElementById('newsFormSection').style.display = 'block';
    document.getElementById('newsFormTitle').textContent = '添加新闻';
    document.getElementById('newsForm').reset();
    document.getElementById('newsId').value = '';
    document.getElementById('newsDate').value = new Date().toISOString().split('T')[0];
    loadTagsForForm();
}

function showEditNewsForm(newsId) {
    if (!currentUser) {
        showToast('请先登录', 'error');
        return;
    }

    fetch(`${API_BASE}/news/${newsId}`)
        .then(res => res.json())
        .then(news => {
            hideAllSections();
            document.getElementById('newsFormSection').style.display = 'block';
            document.getElementById('newsFormTitle').textContent = '编辑新闻';
            document.getElementById('newsId').value = news.id;
            document.getElementById('newsTitle').value = news.title;
            document.getElementById('newsDate').value = news.news_date;
            document.getElementById('newsSource').value = news.source || '';
            document.getElementById('newsRegion').value = news.region || '';
            document.getElementById('newsImportance').value = news.importance;
            document.getElementById('newsContent').value = news.content;
            document.getElementById('newsImpact').value = news.impact_analysis || '';

            loadTagsForForm(news.tag_ids || []);
        })
        .catch(() => showToast('加载新闻失败', 'error'));
}

function showNewsDetail(newsId) {
    fetch(`${API_BASE}/news/${newsId}`)
        .then(res => res.json())
        .then(news => {
            hideAllSections();
            document.getElementById('newsDetailSection').style.display = 'block';

            const importanceStars = '⭐'.repeat(news.importance);
            const tagsHtml = news.tags.map((tag, i) =>
                `<span class="tag" style="background: ${news.tag_colors[i]}">${tag}</span>`
            ).join('');

            document.getElementById('newsDetailContent').innerHTML = `
                <div class="news-detail-header">
                    <h1 class="news-detail-title">${news.title}</h1>
                    <div class="news-detail-meta">
                        <span>📅 ${news.news_date}</span>
                        <span>📍 ${news.region || '未知地区'}</span>
                        <span>📰 ${news.source || '未知来源'}</span>
                        <span class="importance-stars">${importanceStars}</span>
                        <span>✍️ ${news.author_name || '未知'}</span>
                    </div>
                    <div class="timeline-tags">${tagsHtml}</div>
                </div>
                <div class="news-detail-content">${news.content}</div>
                ${news.impact_analysis ? `
                    <div class="impact-analysis">
                        <h3>📊 影响解读</h3>
                        <p>${news.impact_analysis}</p>
                    </div>
                ` : ''}
                ${currentUser ? `
                    <div class="form-actions" style="margin-top: 2rem;">
                        <button class="btn btn-primary" onclick="showEditNewsForm(${news.id})">编辑</button>
                        ${currentUser.role === 'admin' ? `
                            <button class="btn btn-danger" onclick="deleteNews(${news.id})">删除</button>
                        ` : ''}
                    </div>
                ` : ''}
            `;
        })
        .catch(() => showToast('加载新闻详情失败', 'error'));
}

function showAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('需要管理员权限', 'error');
        return;
    }
    hideAllSections();
    document.getElementById('adminSection').style.display = 'block';
    loadUsers();
}

function showAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(tab => tab.style.display = 'none');

    event.target.classList.add('active');
    document.getElementById(`${tabName}Tab`).style.display = 'block';

    if (tabName === 'users') loadUsers();
    if (tabName === 'tags') loadTagsManagement();
    if (tabName === 'stats') loadStats();
}

// Timeline
function loadTimeline() {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';

    const params = new URLSearchParams();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const region = document.getElementById('regionFilter').value;
    const importance = document.getElementById('importanceFilter').value;

    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (region) params.append('region', region);
    if (importance) params.append('importance', importance);

    fetch(`${API_BASE}/news?${params.toString()}`)
        .then(res => res.json())
        .then(newsList => {
            if (newsList.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>暂无新闻数据</p>
                        ${currentUser ? '<button class="btn btn-primary" onclick="showAddNewsForm()" style="margin-top: 1rem;">添加第一条新闻</button>' : ''}
                    </div>
                `;
                return;
            }

            container.innerHTML = newsList.map(news => {
                const importanceClass = news.importance >= 4 ? 'high-importance' : news.importance >= 3 ? 'medium-importance' : '';
                const importanceStars = '⭐'.repeat(news.importance);
                const tagsHtml = news.tags.map((tag, i) =>
                    `<span class="tag" style="background: ${news.tag_colors[i]}">${tag}</span>`
                ).join('');

                return `
                    <div class="timeline-item ${importanceClass}" onclick="showNewsDetail(${news.id})">
                        <div class="timeline-date">📅 ${news.news_date}</div>
                        <div class="timeline-title">${news.title}</div>
                        <div class="timeline-meta">
                            <span>📍 ${news.region || '未知地区'}</span>
                            <span>📰 ${news.source || '未知来源'}</span>
                            <span class="importance-stars">${importanceStars}</span>
                        </div>
                        <div class="timeline-tags">${tagsHtml}</div>
                        <div class="timeline-preview">${news.content.substring(0, 150)}...</div>
                    </div>
                `;
            }).join('');
        })
        .catch(() => {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>加载失败，请检查服务器连接</p></div>';
        });
}

function applyFilters() {
    loadTimeline();
}

function resetFilters() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('regionFilter').value = '';
    document.getElementById('importanceFilter').value = '';
    loadTimeline();
}

// News Management
function handleNewsSubmit(e) {
    e.preventDefault();

    const newsId = document.getElementById('newsId').value;
    const newsData = {
        title: document.getElementById('newsTitle').value,
        content: document.getElementById('newsContent').value,
        source: document.getElementById('newsSource').value,
        news_date: document.getElementById('newsDate').value,
        region: document.getElementById('newsRegion').value,
        importance: parseInt(document.getElementById('newsImportance').value),
        impact_analysis: document.getElementById('newsImpact').value,
        tag_ids: Array.from(document.querySelectorAll('.tag-checkbox:checked')).map(cb => parseInt(cb.value))
    };

    const url = newsId ? `${API_BASE}/news/${newsId}` : `${API_BASE}/news`;
    const method = newsId ? 'PUT' : 'POST';

    fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newsData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast(newsId ? '新闻更新成功！' : '新闻添加成功！', 'success');
            showTimeline();
        }
    })
    .catch(() => showToast('操作失败', 'error'));
}

function deleteNews(newsId) {
    if (!confirm('确定要删除这条新闻吗？')) return;

    fetch(`${API_BASE}/news/${newsId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('新闻已删除', 'success');
            showTimeline();
        }
    })
    .catch(() => showToast('删除失败', 'error'));
}

// Tags
function loadTagsForForm(selectedTags = []) {
    fetch(`${API_BASE}/tags`)
        .then(res => res.json())
        .then(tags => {
            allTags = tags;
            const container = document.getElementById('tagsContainer');
            container.innerHTML = tags.map(tag => `
                <input type="checkbox" id="tag_${tag.id}" class="tag-checkbox" value="${tag.id}"
                    ${selectedTags.includes(tag.id) ? 'checked' : ''}>
                <label for="tag_${tag.id}" class="tag-label" style="background: ${selectedTags.includes(tag.id) ? tag.color : 'transparent'}; color: ${selectedTags.includes(tag.id) ? 'white' : '#333'}">
                    ${tag.name}
                </label>
            `).join('');

            // Add event listeners for tag selection
            document.querySelectorAll('.tag-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const label = this.nextElementSibling;
                    const tag = allTags.find(t => t.id === parseInt(this.value));
                    if (this.checked) {
                        label.style.background = tag.color;
                        label.style.color = 'white';
                    } else {
                        label.style.background = 'transparent';
                        label.style.color = '#333';
                    }
                });
            });
        });
}

function loadTagsManagement() {
    fetch(`${API_BASE}/tags`)
        .then(res => res.json())
        .then(tags => {
            const container = document.getElementById('tagsList');
            container.innerHTML = tags.map(tag => `
                <div class="tag-card">
                    <div class="tag-info">
                        <div class="tag-color" style="background: ${tag.color}"></div>
                        <div>
                            <div style="font-weight: 500">${tag.name}</div>
                            <div style="font-size: 0.8rem; color: #999">${tag.category || '未分类'}</div>
                        </div>
                    </div>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem"
                            onclick="deleteTag(${tag.id})">删除</button>
                </div>
            `).join('');
        });
}

function showAddTagForm() {
    const name = prompt('请输入标签名称:');
    if (!name) return;

    const category = prompt('请输入标签分类 (政治/经济/科技/环境):');
    const color = prompt('请输入标签颜色 (十六进制，如 #e74c3c):', '#3498db');

    fetch(`${API_BASE}/tags`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name, category, color })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('标签添加成功！', 'success');
            loadTagsManagement();
        }
    })
    .catch(() => showToast('添加失败', 'error'));
}

function deleteTag(tagId) {
    if (!confirm('确定要删除这个标签吗？')) return;

    fetch(`${API_BASE}/tags/${tagId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('标签已删除', 'success');
            loadTagsManagement();
        }
    })
    .catch(() => showToast('删除失败', 'error'));
}

// Admin Functions
function loadUsers() {
    fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(users => {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <select onchange="updateUserRole(${user.id}, this.value)"
                            ${user.id === currentUser.id ? 'disabled' : ''}>
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>用户</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理员</option>
                    </select>
                </td>
                <td>${new Date(user.created_at).toLocaleDateString('zh-CN')}</td>
                <td>
                    ${user.id !== currentUser.id ? `
                        <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem"
                                onclick="deleteUser(${user.id})">删除</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    })
    .catch(() => showToast('加载用户列表失败', 'error'));
}

function updateUserRole(userId, role) {
    fetch(`${API_BASE}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ role })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('用户角色已更新', 'success');
        }
    })
    .catch(() => showToast('更新失败', 'error'));
}

function deleteUser(userId) {
    if (!confirm('确定要删除这个用户吗？')) return;

    fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
        } else {
            showToast('用户已删除', 'success');
            loadUsers();
        }
    })
    .catch(() => showToast('删除失败', 'error'));
}

function loadStats() {
    Promise.all([
        fetch(`${API_BASE}/news?limit=1000`).then(r => r.json()),
        fetch(`${API_BASE}/users`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.json()),
        fetch(`${API_BASE}/tags`).then(r => r.json())
    ])
    .then(([news, users, tags]) => {
        const regions = {};
        const importanceCount = {};
        let totalImportance = 0;

        news.forEach(n => {
            if (n.region) {
                regions[n.region] = (regions[n.region] || 0) + 1;
            }
            importanceCount[n.importance] = (importanceCount[n.importance] || 0) + 1;
            totalImportance += n.importance;
        });

        const avgImportance = news.length > 0 ? (totalImportance / news.length).toFixed(1) : 0;

        document.getElementById('statsContainer').innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${news.length}</div>
                <div class="stat-label">新闻总数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${users.length}</div>
                <div class="stat-label">注册用户</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${tags.length}</div>
                <div class="stat-label">标签数量</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${avgImportance}</div>
                <div class="stat-label">平均重要度</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.keys(regions).length}</div>
                <div class="stat-label">涉及地区</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${importanceCount[5] || 0}</div>
                <div class="stat-label">极重要新闻</div>
            </div>
        `;
    })
    .catch(() => showToast('加载统计信息失败', 'error'));
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
