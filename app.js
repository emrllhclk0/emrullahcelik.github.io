// SUPABASE BAĞLANTISI (Aynı kalıyor)
const SUPABASE_URL = 'https://dtpvbytjwccqspzbjemq.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_jiRRdwZN1bu3hW6AadyEHw_-dna0sQl';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Projeleri hafızada tutmak için global değişken
let globalProjects = [];

document.addEventListener("DOMContentLoaded", loadProjects);

async function loadProjects() {
    const gridContainer = document.getElementById('portfolio-grid');

    const { data: projects, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Hata:", error);
        gridContainer.innerHTML = `<p class="text-red-500 col-span-full text-center font-medium">Projeler yüklenirken bir sorun oluştu.</p>`;
        return;
    }

    globalProjects = projects; // Verileri globale aldık ki Modal içine atabilelim
    gridContainer.innerHTML = '';

    if (projects.length === 0) {
        gridContainer.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center text-slate-400 py-10"><i class="fa-solid fa-folder-open text-5xl mb-4 text-slate-300"></i><p class="text-lg">Henüz sergilenecek bir proje bulunmuyor.</p></div>`;
        return;
    }

    projects.forEach((project, index) => {
        const imageUrl = project.image_url || 'https://via.placeholder.com/600x400?text=Görsel+Yok';
        
        let techBadges = '';
        if (project.tech_stack && project.tech_stack.length > 0) {
            // Kartın üstünde fazla yer kaplamaması için ilk 3 teknolojiyi gösteriyoruz
            project.tech_stack.slice(0, 3).forEach(tech => {
                techBadges += `<span class="bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold mr-2 mb-2 px-2 py-1 rounded shadow-sm">${tech}</span>`;
            });
            if(project.tech_stack.length > 3) {
                techBadges += `<span class="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold mb-2 px-2 py-1 rounded shadow-sm">+${project.tech_stack.length - 3}</span>`;
            }
        }

        const cardHTML = `
            <div class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100 flex flex-col h-full overflow-hidden cursor-pointer" onclick="openModal(${index})">
                <div class="overflow-hidden relative">
                    <img class="w-full aspect-video object-cover transform group-hover:scale-110 transition-transform duration-700" src="${imageUrl}" alt="${project.title}">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <span class="text-white font-bold bg-blue-600/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-400/50 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                            Detayları İncele
                        </span>
                    </div>
                </div>

                <div class="p-6 flex flex-col flex-grow relative bg-white">
                    <h3 class="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">${project.title}</h3>
                    <p class="text-slate-600 mb-4 flex-grow text-sm leading-relaxed line-clamp-2">${project.description}</p>
                    <div class="flex flex-wrap mt-auto">
                        ${techBadges}
                    </div>
                </div>
            </div>
        `;

        gridContainer.innerHTML += cardHTML;
    });
}

// Modal (Pop-up) Açma Fonksiyonu
function openModal(index) {
    const project = globalProjects[index];
    if (!project) return;

    const modal = document.getElementById('project-modal');
    const modalContent = document.getElementById('modal-content');
    
    const imageUrl = project.image_url || 'https://via.placeholder.com/800x400?text=Görsel+Yok';
    
    let techBadges = '';
    if (project.tech_stack && project.tech_stack.length > 0) {
        project.tech_stack.forEach(tech => {
            techBadges += `<span class="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-bold mr-2 mb-2 px-3 py-1.5 rounded-lg shadow-sm">${tech}</span>`;
        });
    }

    modalContent.innerHTML = `
        <!-- Modal Kapatma Butonu -->
        <button onclick="closeModal()" class="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md">
            <i class="fa-solid fa-xmark text-xl"></i>
        </button>
        
        <img src="${imageUrl}" class="w-full h-64 md:h-80 object-cover" alt="${project.title}">
        
        <div class="p-8">
            <h2 class="text-3xl font-extrabold text-slate-900 mb-4">${project.title}</h2>
            
            <div class="flex flex-wrap mb-6 border-b border-slate-100 pb-6">
                ${techBadges}
            </div>
            
            <div class="prose max-w-none text-slate-600 leading-relaxed mb-8">
                <p>${project.description}</p>
            </div>
            
            <div class="flex flex-wrap gap-4 pt-4">
                ${project.github_url ? `<a href="${project.github_url}" target="_blank" class="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-md font-medium"><i class="fa-brands fa-github text-lg"></i> Kaynak Kodu İncele</a>` : ''}
                ${project.live_url ? `<a href="${project.live_url}" target="_blank" class="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-medium"><i class="fa-solid fa-arrow-up-right-from-square text-lg"></i> Canlı Projeye Git</a>` : ''}
            </div>
        </div>
    `;

    // Modalı Göster
    modal.classList.remove('hidden');
    // Animasyon için ufak gecikme
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
    
    // Arkadaki sayfanın kaydırılmasını engelle
    document.body.style.overflow = 'hidden';
}

// Modal (Pop-up) Kapatma Fonksiyonu
function closeModal() {
    const modal = document.getElementById('project-modal');
    const modalContent = document.getElementById('modal-content');
    
    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Kaydırmayı geri aç
    }, 300);
}