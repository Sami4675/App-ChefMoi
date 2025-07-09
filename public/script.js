// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const uploadBtn = document.getElementById('uploadBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const stats = document.getElementById('stats');
const ingredientCount = document.getElementById('ingredientCount');
const analysisTime = document.getElementById('analysisTime');

// State variables
let selectedFile = null;
let startTime = null;

// Upload button click
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

// Upload area click
uploadArea.addEventListener('click', () => {
    fileInput.click();
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

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Clear button click
clearBtn.addEventListener('click', () => {
    selectedFile = null;
    preview.innerHTML = '';
    analyzeBtn.style.display = 'none';
    clearBtn.style.display = 'none';
    uploadBtn.style.display = 'flex';
    hideResult();
    hideStats();
    fileInput.value = '';
});

// Analyze button click
analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        showError('Please select an image first.');
        return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);

    loading.style.display = 'block';
    analyzeBtn.disabled = true;
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
            showSuccess(data.ingredients.replace(/\n/g, '<br>'));
            showStats(data.ingredients, timeElapsed);
        } else {
            showError(data.error || 'Failed to analyze image.');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Error:', error);
    } finally {
        loading.style.display = 'none';
        analyzeBtn.disabled = false;
    }
});

// File handling functions
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file.');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB.');
        return;
    }

    selectedFile = file;
    showPreview(file);
    analyzeBtn.style.display = 'flex';
    clearBtn.style.display = 'flex';
    uploadBtn.style.display = 'none';
    hideResult();
    hideStats();
}

function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
}

// UI state functions
function hideResult() {
    result.style.display = 'none';
    result.className = 'result';
}

function hideStats() {
    stats.style.display = 'none';
}

function showStats(ingredients, time) {
    const ingredientList = ingredients.split('\n').filter(item => item.trim().length > 0);
    ingredientCount.textContent = ingredientList.length;
    analysisTime.textContent = `${time}s`;
    stats.style.display = 'flex';
}

function showError(message) {
    result.innerHTML = `<span class="status-indicator error"></span><strong>Error:</strong> ${message}`;
    result.className = 'result error';
    result.style.display = 'block';
}

function showSuccess(content) {
    result.innerHTML = `
        <span class="status-indicator"></span><strong>✅ Analysis Complete!</strong>
        <div class="ingredients-list">${content}</div>
    `;
    result.className = 'result success';
    result.style.display = 'block';
} 