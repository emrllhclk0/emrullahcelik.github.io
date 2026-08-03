const SUPABASE_URL = 'https://dtpvbytjwccqspzbjemq.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_jiRRdwZN1bu3hW6AadyEHw_-dna0sQl';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Sayfa yüklendiğinde oturum kontrolü yap
document.addEventListener("DOMContentLoaded", checkSession);

// Oturum (Session) Kontrolü
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        // Oturum varsa Giriş ekranını gizle, Paneli göster
        document.getElementById('loginPanel').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        fetchProjects(); // Yetkimiz onaylandığı için projeleri çekebiliriz
    } else {
        // Oturum yoksa Paneli gizle, Giriş ekranını göster
        document.getElementById('loginPanel').classList.remove('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
    }
}

// Giriş Yap İşlemi
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.innerText = "Giriş Yapılıyor...";
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Giriş başarısız! E-posta veya şifre hatalı.");
        btn.innerText = "Giriş Yap";
    } else {
        // Giriş başarılıysa ekranı güncelle
        checkSession();
        document.getElementById('loginForm').reset();
        btn.innerText = "Giriş Yap";
    }
});

// Çıkış Yap İşlemi
async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        checkSession(); // Ekranı login formuna döndür
    }
}

// --------------------------------------------------------
// AŞAĞIDAKİ KISIMLAR ESKİSİYLE BİREBİR AYNI (CRUD İşlemleri)
// --------------------------------------------------------

async function fetchProjects() {
    const listContainer = document.getElementById('projectsList');
    const { data: projects, error } = await supabaseClient.from('projects').select('*').order('created_at', { ascending: false });

    if (error) {
        listContainer.innerHTML = `<p class="text-red-500">Projeler yüklenirken hata oluştu.</p>`;
        return;
    }

    listContainer.innerHTML = '';
    if (projects.length === 0) {
        listContainer.innerHTML = `<p class="text-gray-500 italic">Henüz hiç proje eklemedin.</p>`;
        return;
    }

    projects.forEach(project => {
        const projectCard = `
            <div class="border p-4 rounded-md shadow-sm bg-gray-50 flex items-center justify-between">
                <div>
                    <h3 class="font-bold text-lg text-gray-800">${project.title}</h3>
                    <p class="text-sm text-gray-600 truncate w-48">${project.description}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick='editProject(${JSON.stringify(project)})' class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Düzenle</button>
                    <button onclick="deleteProject('${project.id}')" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Sil</button>
                </div>
            </div>
        `;
        listContainer.innerHTML += projectCard;
    });
}

async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data, error } = await supabaseClient.storage.from('portfolio-images').upload(fileName, file);
    if (error) throw error;
    const { data: publicUrlData } = supabaseClient.storage.from('portfolio-images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
}

document.getElementById('projectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "İşlem Yapılıyor...";
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
            alert("Proje başarıyla güncellendi!");
        } else {
            const { error } = await supabaseClient.from('projects').insert([projectData]);
            if (error) throw error;
            alert("Yeni proje başarıyla eklendi!");
        }
        resetForm();
        fetchProjects(); 
    } catch (error) {
        alert("Bir hata oluştu. Konsolu kontrol et.");
        console.error(error);
    } finally {
        submitBtn.innerText = "Kaydet";
        submitBtn.disabled = false;
    }
});

async function deleteProject(id) {
    if (confirm("Bu projeyi silmek istediğine emin misin reis?")) {
        const { error } = await supabaseClient.from('projects').delete().eq('id', id);
        if (error) alert("Proje silinemedi!");
        else fetchProjects();
    }
}

function editProject(project) {
    document.getElementById('formTitle').innerText = "Projeyi Düzenle";
    document.getElementById('submitBtn').innerText = "Güncelle";
    document.getElementById('cancelBtn').classList.remove('hidden');
    document.getElementById('project_id').value = project.id;
    document.getElementById('title').value = project.title;
    document.getElementById('description').value = project.description;
    document.getElementById('github_url').value = project.github_url || '';
    document.getElementById('live_url').value = project.live_url || '';
    document.getElementById('tech_stack').value = project.tech_stack ? project.tech_stack.join(', ') : '';
    document.getElementById('existing_image_url').value = project.image_url || '';
}

function resetForm() {
    document.getElementById('projectForm').reset();
    document.getElementById('project_id').value = "";
    document.getElementById('existing_image_url').value = "";
    document.getElementById('formTitle').innerText = "Yeni Proje Ekle";
    document.getElementById('submitBtn').innerText = "Kaydet";
    document.getElementById('cancelBtn').classList.add('hidden');
}