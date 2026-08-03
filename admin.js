const SUPABASE_URL = 'https://dtpvbytjwccqspzbjemq.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_jiRRdwZN1bu3hW6AadyEHw_-dna0sQl';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State
let currentTab = 'projects';

document.addEventListener("DOMContentLoaded", checkSession);

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    const colors = type === 'success' 
        ? 'bg-green-100 border-green-200 text-green-800' 
        : type === 'error' 
            ? 'bg-red-100 border-red-200 text-red-800' 
            : 'bg-blue-100 border-blue-200 text-blue-800';
            
    const icon = type === 'success' 
        ? '<i class="fa-solid fa-circle-check text-green-600"></i>' 
        : type === 'error' 
            ? '<i class="fa-solid fa-circle-exclamation text-red-600"></i>' 
            : '<i class="fa-solid fa-circle-info text-blue-600"></i>';

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${colors} toast-enter`;
    toast.innerHTML = `${icon} <span class="font-medium text-sm">${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 400); // Wait for animation
    }, 3000);
}

// --- AUTHENTICATION ---
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        document.getElementById('loginPanel').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        document.getElementById('adminPanel').classList.add('flex');
        fetchProjects(); 
    } else {
        document.getElementById('loginPanel').classList.remove('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('flex');
    }
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Giriş Yapılıyor...';
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        showToast('E-posta veya şifre hatalı.', 'error');
        btn.innerHTML = originalText;
    } else {
        checkSession();
        document.getElementById('loginForm').reset();
        btn.innerHTML = originalText;
        showToast('Başarıyla giriş yapıldı!', 'success');
    }
});

async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        checkSession();
        showToast('Çıkış yapıldı.', 'info');
    }
}

// --- TAB SWITCHING ---
function switchTab(tabId) {
    currentTab = tabId;
    
    // Buton Stilleri
    const tabProjects = document.getElementById('tab-projects');
    const tabMessages = document.getElementById('tab-messages');
    
    tabProjects.className = tabId === 'projects' 
        ? "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors bg-indigo-600/20 text-indigo-400 border border-indigo-500/20"
        : "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors";
        
    tabMessages.className = tabId === 'messages' 
        ? "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors bg-indigo-600/20 text-indigo-400 border border-indigo-500/20"
        : "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors";

    // İçerik Göster/Gizle
    document.getElementById('projectsContent').classList.toggle('hidden', tabId !== 'projects');
    document.getElementById('messagesContent').classList.toggle('hidden', tabId !== 'messages');
    
    // Header güncellemeleri
    const titleObj = document.getElementById('pageTitle');
    const addBtn = document.getElementById('addNewBtn');
    
    if (tabId === 'projects') {
        titleObj.innerText = 'Projeler Yönetimi';
        addBtn.classList.remove('hidden');
        fetchProjects();
    } else {
        titleObj.innerText = 'Gelen Mesajlar';
        addBtn.classList.add('hidden');
        fetchMessages();
    }
}

// --- PROJECTS MANAGEMENT ---
async function fetchProjects() {
    const tbody = document.getElementById('projectsTableBody');
    const { data: projects, error } = await supabaseClient.from('projects').select('*').order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-red-500">Hata oluştu.</td></tr>`;
        return;
    }

    document.getElementById('totalProjectsCount').innerText = projects.length;

    if (projects.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-slate-400">Henüz proje eklenmemiş.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    projects.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors group";
        
        const imgUrl = p.image_url || 'https://via.placeholder.com/150';
        const techStr = p.tech_stack ? p.tech_stack.slice(0,3).join(', ') + (p.tech_stack.length > 3 ? '...' : '') : '-';

        tr.innerHTML = `
            <td class="px-6 py-4 flex items-center gap-4">
                <img src="${imgUrl}" class="w-12 h-12 rounded-lg object-cover border border-slate-200">
                <div>
                    <p class="font-bold text-slate-800">${p.title}</p>
                    <div class="flex gap-2 text-xs mt-1">
                        ${p.github_url ? `<a href="${p.github_url}" target="_blank" class="text-indigo-500 hover:underline"><i class="fa-brands fa-github"></i> Kod</a>` : ''}
                        ${p.live_url ? `<a href="${p.live_url}" target="_blank" class="text-blue-500 hover:underline"><i class="fa-solid fa-link"></i> Canlı</a>` : ''}
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium border border-slate-200">${techStr}</span>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick='editProject(${JSON.stringify(p).replace(/'/g, "&#39;")})' class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-colors" title="Düzenle">
                        <i class="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button onclick="deleteProject('${p.id}')" class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors" title="Sil">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Project Modal Logic
function openProjectModal() {
    const modal = document.getElementById('projectModal');
    const content = document.getElementById('projectModalContent');
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    const content = document.getElementById('projectModalContent');
    
    modal.classList.add('opacity-0');
    content.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        resetProjectForm();
    }, 300);
}

function resetProjectForm() {
    document.getElementById('projectForm').reset();
    document.getElementById('project_id').value = "";
    document.getElementById('existing_image_url').value = "";
    document.getElementById('formTitle').innerText = "Yeni Proje Ekle";
}

function editProject(project) {
    document.getElementById('formTitle').innerText = "Projeyi Düzenle";
    document.getElementById('project_id').value = project.id;
    document.getElementById('title').value = project.title;
    document.getElementById('description').value = project.description;
    document.getElementById('github_url').value = project.github_url || '';
    document.getElementById('live_url').value = project.live_url || '';
    document.getElementById('tech_stack').value = project.tech_stack ? project.tech_stack.join(', ') : '';
    document.getElementById('existing_image_url').value = project.image_url || '';
    
    openProjectModal();
}

async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabaseClient.storage.from('portfolio-images').upload(fileName, file);
    if (error) throw error;
    const { data: publicUrlData } = supabaseClient.storage.from('portfolio-images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
}

document.getElementById('projectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Kaydediliyor';
    submitBtn.disabled = true;

    try {
        const id = document.getElementById('project_id').value;
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const githubUrl = document.getElementById('github_url').value;
        const liveUrl = document.getElementById('live_url').value;
        const techStackInput = document.getElementById('tech_stack').value;
        const techStack = techStackInput.split(',').map(item => item.trim()).filter(item => item !== "");
        
        let imageUrl = document.getElementById('existing_image_url').value;
        const fileInput = document.getElementById('image_file');

        if (fileInput.files.length > 0) {
            imageUrl = await uploadImage(fileInput.files[0]);
        }

        const projectData = { title, description, tech_stack: techStack, github_url: githubUrl, live_url: liveUrl, image_url: imageUrl };

        if (id) {
            const { error } = await supabaseClient.from('projects').update(projectData).eq('id', id);
            if (error) throw error;
            showToast('Proje güncellendi.', 'success');
        } else {
            const { error } = await supabaseClient.from('projects').insert([projectData]);
            if (error) throw error;
            showToast('Yeni proje eklendi!', 'success');
        }
        closeProjectModal();
        fetchProjects(); 
    } catch (error) {
        showToast('Bir hata oluştu.', 'error');
        console.error(error);
    } finally {
        submitBtn.innerHTML = 'Kaydet';
        submitBtn.disabled = false;
    }
});

async function deleteProject(id) {
    if (confirm("Projeyi silmek istediğinize emin misiniz?")) {
        const { error } = await supabaseClient.from('projects').delete().eq('id', id);
        if (error) {
            showToast('Proje silinemedi.', 'error');
        } else {
            showToast('Proje başarıyla silindi.', 'success');
            fetchProjects();
        }
    }
}

// --- MESSAGES (INBOX) MANAGEMENT ---
async function fetchMessages() {
    const tbody = document.getElementById('messagesTableBody');
    const { data: messages, error } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Mesajlar çekilemedi. Lütfen 'messages' tablosunu kontrol edin.</td></tr>`;
        return;
    }

    if (!messages || messages.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Henüz hiç mesajınız yok.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    messages.forEach(msg => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors group cursor-pointer";
        tr.onclick = (e) => {
            // Eğer sil butonuna tıklandıysa modalı açma
            if(e.target.closest('button')) return;
            openMessageModal(msg);
        };
        
        const date = new Date(msg.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
        const shortMsg = msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message;

        tr.innerHTML = `
            <td class="px-6 py-4">
                <p class="font-bold text-slate-800 truncate">${msg.name}</p>
                <p class="text-xs text-slate-500 truncate">${msg.email}</p>
            </td>
            <td class="px-6 py-4 text-slate-600 max-w-xs truncate">${shortMsg}</td>
            <td class="px-6 py-4 text-slate-500 text-xs">${date}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="deleteMessage('${msg.id}')" class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600 inline-flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100" title="Sil">
                    <i class="fa-solid fa-trash text-xs"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openMessageModal(msg) {
    document.getElementById('msgModalName').innerText = msg.name;
    const emailEl = document.getElementById('msgModalEmail');
    emailEl.innerText = msg.email;
    emailEl.href = `mailto:${msg.email}`;
    document.getElementById('msgModalText').innerText = msg.message;
    document.getElementById('msgModalDate').innerText = new Date(msg.created_at).toLocaleString('tr-TR');

    const modal = document.getElementById('messageModal');
    const content = document.getElementById('messageModalContent');
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95', 'opacity-0');
    }, 10);
}

function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    const content = document.getElementById('messageModalContent');
    
    modal.classList.add('opacity-0');
    content.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

async function deleteMessage(id) {
    if (confirm("Bu mesajı kalıcı olarak silmek istediğinize emin misiniz?")) {
        const { error } = await supabaseClient.from('messages').delete().eq('id', id);
        if (error) {
            showToast('Mesaj silinemedi.', 'error');
        } else {
            showToast('Mesaj silindi.', 'success');
            fetchMessages();
        }
    }
}