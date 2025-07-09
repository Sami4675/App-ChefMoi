// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const cameraIcon = document.getElementById('cameraIcon');
const cameraBtn = document.getElementById('cameraBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const stats = document.getElementById('stats');
const ingredientCount = document.getElementById('ingredientCount');
const analysisTime = document.getElementById('analysisTime');

// Navigation elements
const homeNav = document.getElementById('homeNav');
const historyNav = document.getElementById('historyNav');
const favoritesNav = document.getElementById('favoritesNav');
const settingsNav = document.getElementById('settingsNav');

// State variables
let selectedFile = null;
let startTime = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Camera icon click
    if (cameraIcon) {
        cameraIcon.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    // Camera button click (bottom nav)
    if (cameraBtn) {
        cameraBtn.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    // Upload area click
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });

        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    }

    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    // Clear button click
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            selectedFile = null;
            if (preview) preview.innerHTML = '';
            if (analyzeBtn) analyzeBtn.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'none';
            if (uploadArea) uploadArea.classList.remove('active');
            hideResult();
            hideStats();
            if (fileInput) fileInput.value = '';
        });
    }

    // Analyze button click
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            if (!selectedFile) {
                showError('Veuillez sélectionner une image d\'abord.');
                return;
            }

            const formData = new FormData();
            formData.append('image', selectedFile);

            if (loading) loading.style.display = 'block';
            if (analyzeBtn) analyzeBtn.disabled = true;
            hideResult();
            hideStats();
            startTime = Date.now();

            try {
                const response = await fetch('/api/analyze-image', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    const endTime = Date.now();
                    const timeElapsed = ((endTime - startTime) / 1000).toFixed(1);
                    showSuccess(data.ingredients.replace(/\n/g, '<br>'), data.recipeImage);
                    showStats(data.ingredients, timeElapsed);
                } else {
                    showError(data.error || 'Échec de l\'analyse de l\'image.');
                }
            } catch (error) {
                showError('Erreur réseau. Veuillez réessayer.');
                console.error('Error:', error);
            } finally {
                if (loading) loading.style.display = 'none';
                if (analyzeBtn) analyzeBtn.disabled = false;
            }
        });
    }

    // Navigation event listeners
    if (homeNav) {
        homeNav.addEventListener('click', () => {
            setActiveNav(homeNav);
            // Show main content
        });
    }

    if (historyNav) {
        historyNav.addEventListener('click', () => {
            setActiveNav(historyNav);
            // Show history (placeholder)
            showError('Fonction historique bientôt disponible !');
        });
    }

    if (favoritesNav) {
        favoritesNav.addEventListener('click', () => {
            setActiveNav(favoritesNav);
            // Show favorites (placeholder)
            showError('Fonction favoris bientôt disponible !');
        });
    }

    if (settingsNav) {
        settingsNav.addEventListener('click', () => {
            setActiveNav(settingsNav);
            // Show settings (placeholder)
            showError('Fonction paramètres bientôt disponible !');
        });
    }
});

// File handling functions
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Veuillez sélectionner un fichier image.');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showError('La taille du fichier doit être inférieure à 5MB.');
        return;
    }

    selectedFile = file;
    showPreview(file);
    if (analyzeBtn) analyzeBtn.style.display = 'flex';
    if (clearBtn) clearBtn.style.display = 'flex';
    if (uploadArea) uploadArea.classList.add('active');
    hideResult();
    hideStats();
}

function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        }
    };
    reader.readAsDataURL(file);
}

// UI state functions
function hideResult() {
    if (result) {
        result.style.display = 'none';
        result.className = 'result';
    }
}

function hideStats() {
    if (stats) {
        stats.style.display = 'none';
    }
}

function showStats(ingredients, time) {
    if (stats && ingredientCount && analysisTime) {
        const ingredientList = ingredients.split('\n').filter(item => item.trim().length > 0);
        ingredientCount.textContent = ingredientList.length;
        analysisTime.textContent = `${time}s`;
        stats.style.display = 'flex';
    }
}

function showError(message) {
    if (result) {
        result.innerHTML = `<span class="status-indicator error"></span><strong>Erreur :</strong> ${message}`;
        result.className = 'result error';
        result.style.display = 'block';
    }
}

function showSuccess(content, recipeImage) {
    if (result) {
        let imageHtml = '';
        if (recipeImage && recipeImage.url) {
            imageHtml = `
                <div class="recipe-image-container">
                    <img src="${recipeImage.url}" alt="${recipeImage.alt || 'Recette Marocaine'}" class="recipe-image">
                    <div class="image-credit">
                        Photo par <a href="${recipeImage.unsplash_url}" target="_blank" rel="noopener">${recipeImage.photographer}</a> sur Unsplash
                    </div>
                </div>
            `;
        }
        
        result.innerHTML = `
            <span class="status-indicator"></span><strong>✅ Recette Marocaine Prête !</strong>
            ${imageHtml}
            <div class="ingredients-list">${content}</div>
        `;
        result.className = 'result success';
        result.style.display = 'block';
    }
}

// Navigation functionality
function setActiveNav(navElement) {
    // Remove active class from all nav items
    [homeNav, historyNav, favoritesNav, settingsNav].forEach(nav => {
        if (nav) nav.classList.remove('active');
    });
    
    // Add active class to clicked nav item
    if (navElement) navElement.classList.add('active');
} 