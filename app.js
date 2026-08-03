// SUPABASE BAĞLANTISI
const SUPABASE_URL = 'https://dtpvbytjwccqspzbjemq.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_jiRRdwZN1bu3hW6AadyEHw_-dna0sQl';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Variables
let globalProjects = [];
let currentCategory = 'All';
let currentLang = localStorage.getItem('lang') || 'tr'; // Default Turkish

// --- DİL SÖZLÜĞÜ (i18n) ---
const translations = {
    tr: {
        hero_badge: "🚀 Yazılım Geliştirici",
        hero_hi: "Merhaba, Ben",
        hero_desc: "Mobil ve web platformlarında ölçeklenebilir, modern ve kullanıcı odaklı projeler geliştiren tutkulu bir yazılımcıyım. Fikirleri sadece kod satırlarına değil; performansı yüksek, yaşayan ve değer katan ürünlere dönüştürmeyi hedefliyorum. Sürekli öğreniyor, modern teknolojilerle sınırlarımı zorluyorum.",
        dev_env: "Geliştirme Ortamım",
        btn_github: "GitHub Profilim",
        btn_contact: "Bana Ulaşın",
        btn_projects: "Projeleri İncele",
        projects_title: "Öne Çıkan Projelerim",
        projects_subtitle: "Geliştirdiğim modern web ve mobil uygulamalardan bazıları. Detayları incelemek için kartlara tıklayabilirsiniz.",
        filter_all: "Tümü",
        projects_loading: "Projeler vitrine diziliyor...",
        projects_empty: "Henüz sergilenecek bir proje bulunmuyor.",
        projects_error: "Projeler yüklenirken bir sorun oluştu.",
        card_inspect: "Detayları İncele",
        github_title: "Kodlama Geçmişim",
        github_subtitle: "GitHub üzerindeki günlük kod katkılarım ve aktivitelerim.",
        contact_title: "İletişime Geçin",
        contact_subtitle: "Projeler, iş teklifleri veya sadece merhaba demek için mesaj bırakabilirsiniz.",
        form_name: "İsim Soyisim",
        form_email: "E-Posta Adresi",
        form_message: "Mesajınız",
        form_send: "Mesajı Gönder",
        form_success: "Mesajınız başarıyla gönderildi! Size en kısa sürede dönüş yapacağım.",
        form_error: "Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        footer_rights: "Tüm hakları saklıdır.",
        modal_source: "Kaynak Kodu İncele",
        modal_live: "Canlı Projeye Git"
    },
    en: {
        hero_badge: "🚀 Software Developer",
        hero_hi: "Hi, I am",
        hero_desc: "I am a passionate software developer building scalable, modern, and user-centric projects on mobile and web platforms. I aim to turn ideas not just into lines of code, but into high-performing, living, and value-adding products. I constantly learn and push my boundaries with modern technologies.",
        dev_env: "Development Environment",
        btn_github: "My GitHub Profile",
        btn_contact: "Contact Me",
        btn_projects: "View Projects",
        projects_title: "Featured Projects",
        projects_subtitle: "Some of the modern web and mobile applications I have developed. Click on the cards to see the details.",
        filter_all: "All",
        projects_loading: "Arranging projects...",
        projects_empty: "There are no projects to display yet.",
        projects_error: "An error occurred while loading projects.",
        card_inspect: "View Details",
        github_title: "Coding History",
        github_subtitle: "My daily code contributions and activities on GitHub.",
        contact_title: "Get in Touch",
        contact_subtitle: "You can leave a message for projects, job offers, or just to say hi.",
        form_name: "Full Name",
        form_email: "Email Address",
        form_message: "Your Message",
        form_send: "Send Message",
        form_success: "Your message has been sent successfully! I will get back to you soon.",
        form_error: "An error occurred while sending the message. Please try again later.",
        footer_rights: "All rights reserved.",
        modal_source: "View Source Code",
        modal_live: "Go to Live Project"
    }
};

// --- BAŞLATMA (Initialization) ---
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initLang();
    loadProjects();
    initContactForm();
});

// --- KARANLIK MOD (Dark Mode) ---
function initTheme() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    // Icon'u ayarla
    const isDark = document.documentElement.classList.contains('dark');
    themeIcon.className = isDark ? "fa-solid fa-sun text-yellow-400" : "fa-solid fa-moon text-slate-600";

    themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const currentlyDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', currentlyDark ? 'dark' : 'light');
        themeIcon.className = currentlyDark ? "fa-solid fa-sun text-yellow-400" : "fa-solid fa-moon text-slate-600";
    });
}

// --- ÇOKLU DİL (i18n) ---
function initLang() {
    const langToggleBtn = document.getElementById('langToggleBtn');
    const langIcon = document.getElementById('langIcon');

    applyTranslations(currentLang);
    langIcon.innerText = currentLang === 'tr' ? 'EN' : 'TR';

    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'tr' ? 'en' : 'tr';
        localStorage.setItem('lang', currentLang);
        applyTranslations(currentLang);
        langIcon.innerText = currentLang === 'tr' ? 'EN' : 'TR';
        renderProjects(); // Kartlardaki "Detayları İncele" metnini de çevirir
    });
}

function applyTranslations(lang) {
    const dict = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            // Eğer buton içinde ikon varsa onu korumak için sadece metin olan span'i değiştirebiliriz.
            // Biz tasarımda ikon ve metni ayırdığımız için direkt innerHTML veya textContent değiştirebiliriz
            el.innerHTML = dict[key]; 
        }
    });
}

function t(key) {
    return translations[currentLang][key] || key;
}


// --- PROJELERİ YÜKLEME VE FİLTRELEME ---
async function loadProjects() {
    const gridContainer = document.getElementById('portfolio-grid');

    const { data: projects, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Hata:", error);
        gridContainer.innerHTML = `<p class="text-red-500 col-span-full text-center font-medium">${t('projects_error')}</p>`;
        return;
    }

    globalProjects = projects || [];
    renderProjects();
}

function filterProjects(category) {
    currentCategory = category;
    
    // Buton stillerini güncelle
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'text-white', 'dark:bg-white', 'dark:text-slate-900', 'active', 'shadow-md');
        btn.classList.add('bg-white', 'text-slate-600', 'dark:bg-slate-800', 'dark:text-slate-300');
        
        if(btn.innerText.includes(category) || (category === 'All' && btn.innerText.includes(t('filter_all')))) {
            btn.classList.remove('bg-white', 'text-slate-600', 'dark:bg-slate-800', 'dark:text-slate-300');
            btn.classList.add('bg-slate-800', 'text-white', 'dark:bg-white', 'dark:text-slate-900', 'active', 'shadow-md');
        }
    });

    renderProjects();
}

function renderProjects() {
    const gridContainer = document.getElementById('portfolio-grid');
    gridContainer.innerHTML = '';

    const filteredProjects = currentCategory === 'All' 
        ? globalProjects 
        : globalProjects.filter(p => p.tech_stack && p.tech_stack.includes(currentCategory));

    if (filteredProjects.length === 0) {
        gridContainer.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center text-slate-400 py-10"><i class="fa-solid fa-folder-open text-5xl mb-4 text-slate-300"></i><p class="text-lg" data-i18n="projects_empty">${t('projects_empty')}</p></div>`;
        return;
    }

    filteredProjects.forEach((project) => {
        // Asıl listedeki indexini bulmamız lazım ki Modal doğru açılabilisin
        const originalIndex = globalProjects.findIndex(p => p.id === project.id);
        const imageUrl = project.image_url || 'https://via.placeholder.com/600x400?text=Görsel+Yok';
        
        let techBadges = '';
        if (project.tech_stack && project.tech_stack.length > 0) {
            project.tech_stack.slice(0, 3).forEach(tech => {
                techBadges += `<span class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-xs font-bold mr-2 mb-2 px-2 py-1 rounded shadow-sm">${tech}</span>`;
            });
            if(project.tech_stack.length > 3) {
                techBadges += `<span class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-bold mb-2 px-2 py-1 rounded shadow-sm">+${project.tech_stack.length - 3}</span>`;
            }
        }

        const cardHTML = `
            <div class="group bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100 dark:border-slate-700 flex flex-col h-full overflow-hidden cursor-pointer" onclick="openModal(${originalIndex})">
                <div class="overflow-hidden relative">
                    <img class="w-full aspect-video object-cover transform group-hover:scale-110 transition-transform duration-700" src="${imageUrl}" alt="${project.title}">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <span class="text-white font-bold bg-blue-600/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-400/50 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                            ${t('card_inspect')}
                        </span>
                    </div>
                </div>

                <div class="p-6 flex flex-col flex-grow relative bg-white dark:bg-slate-800">
                    <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">${project.title}</h3>
                    <p class="text-slate-600 dark:text-slate-400 mb-4 flex-grow text-sm leading-relaxed line-clamp-2">${project.description}</p>
                    <div class="flex flex-wrap mt-auto">
                        ${techBadges}
                    </div>
                </div>
            </div>
        `;

        gridContainer.innerHTML += cardHTML;
    });
}

// --- MODAL (POP-UP) ---
function openModal(index) {
    const project = globalProjects[index];
    if (!project) return;

    const modal = document.getElementById('project-modal');
    const modalContent = document.getElementById('modal-content');
    
    const imageUrl = project.image_url || 'https://via.placeholder.com/800x400?text=Görsel+Yok';
    
    let techBadges = '';
    if (project.tech_stack && project.tech_stack.length > 0) {
        project.tech_stack.forEach(tech => {
            techBadges += `<span class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 text-sm font-bold mr-2 mb-2 px-3 py-1.5 rounded-lg shadow-sm">${tech}</span>`;
        });
    }

    modalContent.innerHTML = `
        <button onclick="closeModal()" class="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md">
            <i class="fa-solid fa-xmark text-xl"></i>
        </button>
        
        <img src="${imageUrl}" class="w-full h-64 md:h-80 object-cover" alt="${project.title}">
        
        <div class="p-8">
            <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">${project.title}</h2>
            
            <div class="flex flex-wrap mb-6 border-b border-slate-100 dark:border-slate-700 pb-6">
                ${techBadges}
            </div>
            
            <div class="prose max-w-none text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                <p>${project.description}</p>
            </div>
            
            <div class="flex flex-wrap gap-4 pt-4">
                ${project.github_url ? `<a href="${project.github_url}" target="_blank" class="flex-1 flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-md font-medium"><i class="fa-brands fa-github text-lg"></i> ${t('modal_source')}</a>` : ''}
                ${project.live_url ? `<a href="${project.live_url}" target="_blank" class="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-medium"><i class="fa-solid fa-arrow-up-right-from-square text-lg"></i> ${t('modal_live')}</a>` : ''}
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('project-modal');
    const modalContent = document.getElementById('modal-content');
    
    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}


// --- İLETİŞİM FORMU (Supabase) ---
function initContactForm() {
    const form = document.getElementById('contactForm');
    const statusDiv = document.getElementById('contactStatus');
    const submitBtn = document.getElementById('contactSubmitBtn');

    if(!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const message = document.getElementById('contactMessage').value;

        // Butonu disabled yap
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Gönderiliyor...';
        
        const { error } = await supabaseClient
            .from('messages')
            .insert([
                { name: name, email: email, message: message }
            ]);

        statusDiv.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700');

        if (error) {
            console.error('Mesaj gönderilemedi:', error);
            statusDiv.classList.add('bg-red-100', 'text-red-700', 'dark:bg-red-900/30', 'dark:text-red-400');
            statusDiv.innerText = t('form_error');
        } else {
            statusDiv.classList.add('bg-green-100', 'text-green-700', 'dark:bg-green-900/30', 'dark:text-green-400');
            statusDiv.innerText = t('form_success');
            form.reset();
        }

        // Butonu eski haline getir
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span data-i18n="form_send">${t('form_send')}</span> <i class="fa-solid fa-paper-plane"></i>`;
    });
}