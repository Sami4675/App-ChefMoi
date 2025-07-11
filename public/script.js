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
// Accessibilité : gestion clavier pour les éléments interactifs
function addKeyboardAccessibility() {
    const focusables = [
        cameraIcon, uploadArea, analyzeBtn, clearBtn, cameraBtn,
        homeNav, historyNav, favoritesNav, settingsNav
    ];
    focusables.forEach(el => {
        if (el) {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            });
        }
    });
}

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
                    
                    // Extract recipe name from the response
                    const recipeName = extractRecipeName(data.ingredients);
                    
                    // Show the initial result without generated image
                    showSuccess(data.ingredients.replace(/\n/g, '<br>'), data.recipeImage);
                    showStats(data.ingredients, timeElapsed);
                    
                    // Generate image for the recipe
                    if (recipeName) {
                        generateRecipeImage(recipeName, data.ingredients);
                    }
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
        });
    }

    if (favoritesNav) {
        favoritesNav.addEventListener('click', () => {
            setActiveNav(favoritesNav);
            // Show favorites (placeholder)
        });
    }

    if (settingsNav) {
        settingsNav.addEventListener('click', () => {
            setActiveNav(settingsNav);
            // Show settings (placeholder)
        });
    }
    addKeyboardAccessibility();
});

// Compression d’image à l’upload (avant analyse)
async function compressImage(file, maxSize = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round(height * (maxSize / width));
                        width = maxSize;
                    } else {
                        width = Math.round(width * (maxSize / height));
                        height = maxSize;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    } else {
                        reject(new Error('Compression échouée'));
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Types d’images autorisés
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

async function handleFile(file) {
    if (!file) {
        showError('Aucun fichier sélectionné.');
        return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        showError('Format non supporté. Seuls les fichiers JPG, PNG et GIF sont acceptés.');
        return;
    }
    if (file.size > MAX_SIZE) {
        showError('La taille du fichier doit être inférieure à 5MB.');
        return;
    }
    // Vérification de l’extension (défense en profondeur)
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        showError('Extension de fichier non autorisée.');
        return;
    }
    try {
        const compressed = await compressImage(file);
        selectedFile = compressed;
        showPreview(compressed);
        showActionButtons();
        if (uploadArea) uploadArea.classList.add('active');
        hideResult();
        hideStats();
    } catch (e) {
        showError('Erreur lors de la compression de l’image.');
    }
}

function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" loading="lazy">`;
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
        result.innerHTML = `<div class="error" tabindex="0">${message}</div>`;
        result.style.display = 'block';
        result.querySelector('.error').focus();
    }
}

// Extract recipe name from ChatGPT response
function extractRecipeName(ingredients) {
    const lines = ingredients.split('\n');
    for (const line of lines) {
        // Look for "Nom du Plat :" format
        if (line.includes('**Nom du Plat :**')) {
            const recipeName = line.replace('**Nom du Plat :**', '').trim();
            if (recipeName && recipeName !== '') {
                return recipeName;
            }
        }
        // Fallback: look for lines with ** that contain dish names
        if (line.includes('**') && (
            line.toLowerCase().includes('tajine') || 
            line.toLowerCase().includes('couscous') ||
            line.toLowerCase().includes('pastilla') ||
            line.toLowerCase().includes('harira') ||
            line.toLowerCase().includes('kefta') ||
            line.toLowerCase().includes('briouat') ||
            line.toLowerCase().includes('tagine')
        )) {
            return line.replace(/\*\*/g, '').trim();
        }
    }
    // Default fallback
    return 'Plat Marocain';
}

// Generate recipe image using Replicate API
async function generateRecipeImage(recipeName, ingredients) {
    try {
        // Show loading message for image generation
        const resultDiv = result.querySelector('.success');
        if (resultDiv) {
            resultDiv.innerHTML += '<div class="image-loading" style="margin-top: 15px; text-align: center; color: #666;"><i class="fa-solid fa-spinner fa-spin"></i> Génération de l\'image de la recette...</div>';
        }

        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipeName: recipeName,
                ingredients: ingredients
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Remove loading message and add the generated image
            const loadingDiv = result.querySelector('.image-loading');
            if (loadingDiv) {
                loadingDiv.remove();
            }
            
            // Add the generated image to the result
            const resultDiv = result.querySelector('.success');
            if (resultDiv) {
                 const imageHtml = `<div style="margin-top: 15px; text-align: center;">
                    <h3 style="color: #2c5530; margin-bottom: 10px;">🍽️ ${recipeName}</h3>
                    <img src="${data.imageUrl}" alt="${recipeName}" style="max-width: 100%; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" loading="lazy">
                    <div style="margin-top: 8px; font-size: 0.8em; color: #666; font-style: italic;">
                        🤖 Image générée par DALL-E 3
                    </div>
                </div>`;
                resultDiv.innerHTML += imageHtml;
            }
        } else {
            // Remove loading message and show error
            const loadingDiv = result.querySelector('.image-loading');
            if (loadingDiv) {
                loadingDiv.remove();
            }
            console.error('Image generation failed:', data.error);
        }
    } catch (error) {
        // Remove loading message and show error
        const loadingDiv = result.querySelector('.image-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
        console.error('Error generating image:', error);
    }
}

function showSuccess(content, recipeImage) {
    if (result) {
        let imgHtml = recipeImage ? `<img src="${recipeImage}" alt="Recette" style="max-width:100%;border-radius:10px;margin-bottom:10px;" loading="lazy">` : '';
        result.innerHTML = `<div class="success" tabindex="0">${imgHtml}${content}</div>`;
        result.style.display = 'block';
        result.querySelector('.success').focus();
        saveToHistory(content, recipeImage);
    }
}

// Animation pour apparition des boutons d’action
function showActionButtons() {
    if (analyzeBtn) {
        analyzeBtn.style.display = 'flex';
        analyzeBtn.style.animation = 'fadeInDown 0.5s';
    }
    if (clearBtn) {
        clearBtn.style.display = 'flex';
        clearBtn.style.animation = 'fadeInDown 0.5s';
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

// Historique et favoris (localStorage)
function saveToHistory(ingredients, imageData) {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    const entry = {
        id: Date.now(),
        date: new Date().toLocaleString('fr-FR'),
        ingredients,
        image: imageData || null
    };
    history.unshift(entry);
    localStorage.setItem('history', JSON.stringify(history.slice(0, 20)));
}

function getHistory() {
    return JSON.parse(localStorage.getItem('history') || '[]');
}

function saveToFavorites(entry) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favorites.find(e => e.id === entry.id)) {
        favorites.unshift(entry);
        localStorage.setItem('favorites', JSON.stringify(favorites.slice(0, 20)));
    }
}

function removeFromFavorites(id) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites = favorites.filter(e => e.id !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function renderHistory() {
    const section = document.getElementById('historySection');
    const history = getHistory();
    section.innerHTML = '<h2>Historique des analyses</h2>';
    if (history.length === 0) {
        section.innerHTML += '<div class="empty-list">Aucune analyse récente.</div>';
        return;
    }
    section.innerHTML += '<ul class="history-list">' + history.map(entry =>
        `<li><span>${entry.date} - ${entry.ingredients.split('<br>')[0]}</span>
        <button class="fav-btn" title="Ajouter aux favoris" aria-label="Ajouter aux favoris" onclick="addFavoriteFromHistory(${entry.id})"><i class="fa fa-star"></i></button>
        <button class="share-btn" title="Partager" aria-label="Partager" onclick="shareEntry(${entry.id}, 'history')"><i class="fa fa-share"></i></button></li>`
    ).join('') + '</ul>';
}

function renderFavorites() {
    const section = document.getElementById('favoritesSection');
    const favorites = getFavorites();
    section.innerHTML = '<h2>Favoris</h2>';
    if (favorites.length === 0) {
        section.innerHTML += '<div class="empty-list">Aucun favori enregistré.</div>';
        return;
    }
    section.innerHTML += '<ul class="favorites-list">' + favorites.map(entry =>
        `<li><span>${entry.date} - ${entry.ingredients.split('<br>')[0]}</span>
        <button class="remove-btn" title="Retirer des favoris" aria-label="Retirer des favoris" onclick="removeFavorite(${entry.id})"><i class="fa fa-trash"></i></button>
        <button class="share-btn" title="Partager" aria-label="Partager" onclick="shareEntry(${entry.id}, 'favorites')"><i class="fa fa-share"></i></button></li>`
    ).join('') + '</ul>';
}

window.addFavoriteFromHistory = function(id) {
    const entry = getHistory().find(e => e.id === id);
    if (entry) {
        saveToFavorites(entry);
        renderFavorites();
    }
};
window.removeFavorite = function(id) {
    removeFromFavorites(id);
    renderFavorites();
};

window.shareEntry = function(id, type) {
    const list = type === 'history' ? getHistory() : getFavorites();
    const entry = list.find(e => e.id === id);
    if (!entry) return;
    const text = `Analyse ChefMoi (${entry.date}) :\n${entry.ingredients.replace(/<br>/g, '\n')}`;
    if (navigator.share) {
        navigator.share({
            title: 'ChefMoi - Résultat d’analyse',
            text
        }).then(() => showShareFeedback('Partagé !'));
    } else {
        navigator.clipboard.writeText(text).then(() => showShareFeedback('Copié dans le presse-papier !'));
    }
};

function showShareFeedback(msg) {
    const feedback = document.createElement('div');
    feedback.className = 'success';
    feedback.textContent = msg;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1800);
}

// Affichage/masquage des sections
function showSection(sectionId) {
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('historySection').style.display = 'none';
    document.getElementById('favoritesSection').style.display = 'none';
    if (document.getElementById(sectionId)) {
        document.getElementById(sectionId).style.display = 'block';
    }
}
function showMainContent() {
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('historySection').style.display = 'none';
    document.getElementById('favoritesSection').style.display = 'none';
}

function renderHistoryPage() {
    const section = document.getElementById('historySection');
    const history = getHistory();
    section.innerHTML = '<h2>Historique des analyses</h2>';
    if (history.length === 0) {
        section.innerHTML += '<div class="empty-list">Aucune analyse récente.</div>';
        return;
    }
    section.innerHTML += '<ul class="list">' + history.map(entry =>
        `<li>
            <div><strong>Date :</strong> ${entry.date}</div>
            ${entry.image ? `<img src="${entry.image}" alt="Image analyse" style="max-width:100px;max-height:80px;border-radius:8px;margin:8px 0;" loading="lazy">` : ''}
            <div><strong>Ingrédients :</strong><br>${entry.ingredients}</div>
            <div class="actions">
                <button class="fav-btn" title="Ajouter aux favoris" aria-label="Ajouter aux favoris" onclick="addFavoriteFromHistory(${entry.id})"><i class="fa fa-star"></i> Favori</button>
                <button class="share-btn" title="Partager" aria-label="Partager" onclick="shareEntry(${entry.id}, 'history')"><i class="fa fa-share"></i> Partager</button>
                <button class="remove-btn" title="Supprimer" aria-label="Supprimer" onclick="removeHistory(${entry.id})"><i class="fa fa-trash"></i> Supprimer</button>
            </div>
        </li>`
    ).join('') + '</ul>';
}

function renderFavoritesPage() {
    const section = document.getElementById('favoritesSection');
    const favorites = getFavorites();
    section.innerHTML = '<h2>Favoris</h2>';
    if (favorites.length === 0) {
        section.innerHTML += '<div class="empty-list">Aucun favori enregistré.</div>';
        return;
    }
    section.innerHTML += '<ul class="list">' + favorites.map(entry =>
        `<li>
            <div><strong>Date :</strong> ${entry.date}</div>
            ${entry.image ? `<img src="${entry.image}" alt="Image favori" style="max-width:100px;max-height:80px;border-radius:8px;margin:8px 0;" loading="lazy">` : ''}
            <div><strong>Ingrédients :</strong><br>${entry.ingredients}</div>
            <div class="actions">
                <button class="share-btn" title="Partager" aria-label="Partager" onclick="shareEntry(${entry.id}, 'favorites')"><i class="fa fa-share"></i> Partager</button>
                <button class="remove-btn" title="Retirer des favoris" aria-label="Retirer des favoris" onclick="removeFavorite(${entry.id})"><i class="fa fa-trash"></i> Retirer</button>
            </div>
        </li>`
    ).join('') + '</ul>';
}

window.removeHistory = function(id) {
    let history = getHistory();
    history = history.filter(e => e.id !== id);
    localStorage.setItem('history', JSON.stringify(history));
    renderHistoryPage();
};

// Paramètres
function renderSettingsPage() {
    const section = document.getElementById('settingsSection');
    section.innerHTML = `<h2>Paramètres</h2>
        <ul class="settings-list">
            <li>Vider l’historique <button onclick="clearHistory()">Vider</button></li>
            <li>Vider les favoris <button onclick="clearFavorites()">Vider</button></li>
        </ul>
        <div style="color:#aaa;font-size:0.98em;text-align:center;margin-top:18px;">Plus d’options à venir…</div>`;
}
window.clearHistory = function() {
    localStorage.removeItem('history');
    renderHistoryPage();
    showShareFeedback('Historique vidé !');
};
window.clearFavorites = function() {
    localStorage.removeItem('favorites');
    renderFavoritesPage();
    showShareFeedback('Favoris vidés !');
};

// Navigation events (remplacer)
if (historyNav) {
    historyNav.addEventListener('click', () => {
        setActiveNav(historyNav);
        hideAllSections();
        renderHistoryPage();
        document.getElementById('historySection').style.display = 'flex';
    });
}
if (favoritesNav) {
    favoritesNav.addEventListener('click', () => {
        setActiveNav(favoritesNav);
        hideAllSections();
        renderFavoritesPage();
        document.getElementById('favoritesSection').style.display = 'flex';
    });
}
if (settingsNav) {
    settingsNav.addEventListener('click', () => {
        setActiveNav(settingsNav);
        hideAllSections();
        renderSettingsPage();
        document.getElementById('settingsSection').style.display = 'flex';
    });
}
if (homeNav) {
    homeNav.addEventListener('click', () => {
        setActiveNav(homeNav);
        hideAllSections();
        document.getElementById('main-content').style.display = 'block';
    });
}
function hideAllSections() {
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('historySection').style.display = 'none';
    document.getElementById('favoritesSection').style.display = 'none';
    document.getElementById('settingsSection').style.display = 'none';
} 
