const PALETTE = [
    { name: 'Глубокий сине-зелёный', color: '#1f455b' },
    { name: 'Серо-голубой', color: '#9ca9b4' },
    { name: 'Светлая бумага', color: '#e8e3dc' },
    { name: 'Песочно-бежевый', color: '#c8ae9e' },
    { name: 'Тёплая охра', color: '#b04e47' }
];

const PREBUILT_LEVELS = [
    {
        id: 'forest-spirit',
        name: 'Лесной дух',
        description: 'Пау́жная сцена в духе Ghibli и Ukiyo-e.',
        size: 20,
        displayColor: 4,
        pattern: createForestSpirit()
    },
    {
        id: 'flying-temple',
        name: 'Летающий храм',
        description: 'Пиксельный храм среди облаков.',
        size: 15,
        displayColor: 0,
        pattern: createFlyingTemple()
    },
    {
        id: 'moon-cat',
        name: 'Лунный кот',
        description: 'Маленькая магическая композиция.',
        size: 10,
        displayColor: 2,
        pattern: createMoonCat()
    }
];

let currentLevel = null;
let currentPattern = [];
let currentState = [];
let currentFillColor = 1;
let currentTool = 'fill';
let currentMode = 'play';
let currentSize = 15;
let customLevels = [];
let showErrors = false;
let isPointerDown = false;

const sizeSelect = document.getElementById('sizeSelect');
const modeSelect = document.getElementById('modeSelect');
const levelSelect = document.getElementById('levelSelect');
const boardContainer = document.getElementById('boardContainer');
const paletteContainer = document.getElementById('palette');
const levelNameInput = document.getElementById('levelName');
const levelDescInput = document.getElementById('levelDesc');
const customLevelsPanel = document.getElementById('customLevels');
const messageEl = document.getElementById('message');
const progressEl = document.getElementById('progress');
const saveLevelBtn = document.getElementById('saveLevelBtn');
const newLevelBtn = document.getElementById('newLevelBtn');
const resetBtn = document.getElementById('resetBtn');
const checkBtn = document.getElementById('checkBtn');
const revealBtn = document.getElementById('revealBtn');
const toolSelect = document.getElementById('toolSelect');
const levelTitleEl = document.getElementById('levelTitle');
const levelDescText = document.getElementById('levelDescText');
const modeLabelEl = document.getElementById('modeLabel');

function createGrid(size, fill = 0) {
    return Array.from({ length: size }, () => Array(size).fill(fill));
}

function copyGrid(grid) {
    return grid.map(row => [...row]);
}

function fillRect(grid, x, y, w, h, color) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const px = x + dx;
            const py = y + dy;
            if (grid[py] && grid[py][px] !== undefined) {
                grid[py][px] = color;
            }
        }
    }
}

function fillCircle(grid, cx, cy, radius, color) {
    for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy <= radius * radius && grid[y] && grid[y][x] !== undefined) {
                grid[y][x] = color;
            }
        }
    }
}

function createForestSpirit() {
    const grid = createGrid(20);
    fillCircle(grid, 10, 7, 5, 4);
    fillRect(grid, 7, 12, 6, 5, 4);
    fillRect(grid, 2, 1, 16, 3, 1);
    fillRect(grid, 0, 6, 6, 3, 1);
    fillRect(grid, 14, 6, 6, 3, 1);
    fillRect(grid, 5, 3, 10, 2, 2);
    fillRect(grid, 8, 4, 4, 1, 5);
    fillRect(grid, 9, 5, 2, 1, 5);
    fillRect(grid, 4, 10, 12, 2, 1);
    fillRect(grid, 6, 16, 8, 2, 2);
    return grid;
}

function createFlyingTemple() {
    const grid = createGrid(15);
    fillRect(grid, 5, 2, 5, 2, 4);
    fillRect(grid, 4, 4, 7, 1, 5);
    fillRect(grid, 3, 5, 9, 2, 4);
    fillRect(grid, 6, 7, 3, 3, 4);
    fillRect(grid, 1, 0, 13, 2, 2);
    fillRect(grid, 0, 8, 3, 1, 2);
    fillRect(grid, 12, 8, 3, 1, 2);
    fillRect(grid, 2, 10, 11, 1, 2);
    fillCircle(grid, 12, 4, 3, 3);
    fillRect(grid, 0, 11, 15, 2, 1);
    fillRect(grid, 3, 13, 9, 1, 4);
    return grid;
}

function createMoonCat() {
    const grid = createGrid(10);
    fillCircle(grid, 5, 5, 4, 5);
    fillRect(grid, 2, 1, 2, 2, 4);
    fillRect(grid, 6, 1, 2, 2, 4);
    grid[3][2] = 0;
    grid[3][7] = 0;
    fillRect(grid, 3, 5, 4, 1, 3);
    fillRect(grid, 4, 6, 2, 1, 3);
    fillRect(grid, 3, 3, 1, 1, 3);
    fillRect(grid, 6, 3, 1, 1, 3);
    return grid;
}

function getLineClues(line) {
    const clues = [];
    let count = 0;
    for (const cell of line) {
        if (cell > 0) {
            count += 1;
        } else if (count > 0) {
            clues.push(count);
            count = 0;
        }
    }
    if (count > 0) clues.push(count);
    return clues.length ? clues : [0];
}

function getRowClues(pattern) {
    return pattern.map(row => getLineClues(row));
}

function getColClues(pattern) {
    const columns = [];
    const size = pattern.length;
    for (let x = 0; x < size; x++) {
        const col = [];
        for (let y = 0; y < size; y++) {
            col.push(pattern[y][x]);
        }
        columns.push(getLineClues(col));
    }
    return columns;
}

function renderPalette() {
    paletteContainer.innerHTML = '';
    PALETTE.forEach((item, index) => {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'swatch';
        if (index === currentFillColor) swatch.classList.add('active');
        swatch.style.backgroundColor = item.color;
        swatch.title = item.name;
        swatch.addEventListener('click', () => {
            currentFillColor = index;
            renderPalette();
        });
        paletteContainer.appendChild(swatch);
    });
}

function renderLevelCards() {
    const cards = document.getElementById('levelCards');
    cards.innerHTML = '';
    const allLevels = [...PREBUILT_LEVELS, ...customLevels];
    if (!allLevels.length) {
        cards.innerHTML = '<div class="note">Нет доступных уровней.</div>';
        return;
    }
    allLevels.forEach(level => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'level-card';
        card.innerHTML = `
            <strong>${level.name}</strong>
            <small>${level.description}</small>
            <span>${level.size}×${level.size}</span>
        `;
        card.addEventListener('click', () => {
            modeSelect.value = 'play';
            currentMode = 'play';
            loadLevel(level, false);
        });
        cards.appendChild(card);
    });
}

function renderCustomLevels() {
    const built = customLevels.length ? customLevels : [];
    customLevelsPanel.innerHTML = '';
    if (!built.length) {
        customLevelsPanel.innerHTML = '<div class="note">Пока нет сохранённых уровней.</div>';
        return;
    }
    built.forEach(level => {
        const item = document.createElement('div');
        item.className = 'custom-item';
        item.innerHTML = `
            <strong>${level.name}</strong>
            <div class="custom-row">
                <span>${level.size}×${level.size}</span>
                <button data-id="${level.id}" class="load-btn">Загрузить</button>
                <button data-id="${level.id}" class="delete-btn">Удалить</button>
            </div>
        `;
        customLevelsPanel.appendChild(item);
    });
    customLevelsPanel.querySelectorAll('.load-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            const saved = customLevels.find(level => level.id === id);
            if (saved) {
                currentMode = 'play';
                modeSelect.value = 'play';
                loadLevel(saved, false);
            }
        });
    });
    customLevelsPanel.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            customLevels = customLevels.filter(level => level.id !== id);
            saveCustomLevelStorage();
            populateLevelSelect();
            renderCustomLevels();
            renderLevelCards();
            showMessage('Уровень удалён.');
        });
    });
}

function showMessage(text) {
    messageEl.textContent = text;
}

function updateProgress() {
    const filled = currentState.flat().filter(value => value === 1).length;
    const total = currentPattern.length * currentPattern.length;
    progressEl.textContent = `Прогресс: ${filled} / ${total}`;
    modeLabelEl.textContent = currentMode === 'create' ? 'Режим: Создание' : 'Режим: Играть';
}

function createBoard() {
    boardContainer.innerHTML = '';
    const size = currentPattern.length;
    const rowClues = getRowClues(currentPattern);
    const colClues = getColClues(currentPattern);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const corner = document.createElement('th');
    corner.className = 'corner';
    headerRow.appendChild(corner);

    colClues.forEach(clue => {
        const cell = document.createElement('th');
        cell.className = 'clue-cell';
        const stack = document.createElement('div');
        stack.className = 'clue-stack';
        clue.forEach(value => {
            const item = document.createElement('span');
            item.textContent = value;
            stack.appendChild(item);
        });
        cell.appendChild(stack);
        headerRow.appendChild(cell);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let y = 0; y < size; y++) {
        const row = document.createElement('tr');
        const rowHeader = document.createElement('th');
        rowHeader.className = 'row-clue';
        rowHeader.textContent = rowClues[y].join(' ');
        row.appendChild(rowHeader);

        for (let x = 0; x < size; x++) {
            const cell = document.createElement('td');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            const state = currentState[y][x];
            const patternValue = currentPattern[y][x];

            if (state === 1) {
                cell.classList.add('filled');
                const fillColor = currentMode === 'create' ? PALETTE[patternValue - 1]?.color || PALETTE[currentFillColor].color : PALETTE[currentLevel.displayColor]?.color || PALETTE[currentFillColor].color;
                cell.style.setProperty('--cell-color', fillColor);
            } else if (state === 2) {
                cell.classList.add('cross');
            }

            if (showErrors && currentMode === 'play') {
                const isFilled = state === 1;
                const expected = currentPattern[y][x] > 0;
                if (isFilled !== expected) {
                    cell.classList.add('wrong');
                }
            }

            row.appendChild(cell);
        }
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    boardContainer.appendChild(table);
    updateProgress();
}

function processCell(x, y) {
    if (currentMode === 'create') {
        if (currentTool === 'fill') {
            currentPattern[y][x] = currentFillColor + 1;
            currentState[y][x] = 1;
        } else if (currentTool === 'erase') {
            currentPattern[y][x] = 0;
            currentState[y][x] = 0;
        }
    } else {
        if (currentTool === 'fill') {
            currentState[y][x] = currentState[y][x] === 1 ? 0 : 1;
        } else if (currentTool === 'cross') {
            currentState[y][x] = currentState[y][x] === 2 ? 0 : 2;
        } else if (currentTool === 'erase') {
            currentState[y][x] = 0;
        }
    }
    showErrors = false;
    createBoard();
}

function handleBoardPointer(event) {
    const target = event.target.closest('.cell');
    if (!target) return;
    event.preventDefault();
    const x = Number(target.dataset.x);
    const y = Number(target.dataset.y);
    processCell(x, y);
}

boardContainer.addEventListener('pointerdown', event => {
    if (!event.target.closest('.cell')) return;
    isPointerDown = true;
    boardContainer.setPointerCapture(event.pointerId);
    handleBoardPointer(event);
});

boardContainer.addEventListener('pointermove', event => {
    if (!isPointerDown) return;
    if (!event.target.closest('.cell')) return;
    handleBoardPointer(event);
});

document.addEventListener('pointerup', event => {
    isPointerDown = false;
    if (event.pointerId !== undefined && boardContainer.hasPointerCapture(event.pointerId)) {
        boardContainer.releasePointerCapture(event.pointerId);
    }
});

boardContainer.addEventListener('contextmenu', event => {
    const target = event.target.closest('.cell');
    if (!target) return;
    event.preventDefault();
    const x = Number(target.dataset.x);
    const y = Number(target.dataset.y);
    if (currentMode === 'create') {
        currentPattern[y][x] = 0;
        currentState[y][x] = 0;
    } else {
        currentState[y][x] = currentState[y][x] === 2 ? 0 : 2;
    }
    showErrors = false;
    createBoard();
});

function loadLevel(level, creator = false) {
    currentLevel = level;
    currentSize = level.size;
    currentMode = creator ? 'create' : 'play';
    modeSelect.value = currentMode;
    sizeSelect.value = level.size;
    sizeSelect.disabled = !creator;

    currentPattern = copyGrid(level.pattern);
    currentState = creator ? currentPattern.map(row => row.map(value => (value > 0 ? 1 : 0))) : createGrid(level.size, 0);
    currentFillColor = Math.min(level.displayColor, PALETTE.length - 1);
    showErrors = false;
    updateInterface();
    createBoard();
    levelTitleEl.textContent = level.name;
    levelDescText.textContent = level.description;
}

function resetLevel() {
    showErrors = false;
    if (currentMode === 'create') {
        currentPattern = createGrid(currentSize);
        currentState = createGrid(currentSize);
    } else {
        currentState = createGrid(currentSize);
    }
    createBoard();
}

function populateSizeOptions() {
    [10, 15, 20].forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = `${size} × ${size}`;
        sizeSelect.appendChild(option);
    });
    sizeSelect.value = currentSize;
}

function populateLevelSelect() {
    levelSelect.innerHTML = '';
    const builtGroup = document.createElement('optgroup');
    builtGroup.label = 'Готовые уровни';
    PREBUILT_LEVELS.forEach(level => {
        const option = document.createElement('option');
        option.value = level.id;
        option.textContent = `${level.name} (${level.size}×${level.size})`;
        builtGroup.appendChild(option);
    });
    levelSelect.appendChild(builtGroup);

    if (customLevels.length) {
        const customGroup = document.createElement('optgroup');
        customGroup.label = 'Мои уровни';
        customLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.id;
            option.textContent = `${level.name} (${level.size}×${level.size})`;
            customGroup.appendChild(option);
        });
        levelSelect.appendChild(customGroup);
    }
}

function findLevelById(id) {
    return customLevels.find(level => level.id === id) || PREBUILT_LEVELS.find(level => level.id === id);
}

function saveCustomLevelStorage() {
    localStorage.setItem('nihongoNonogramCustomLevels', JSON.stringify(customLevels));
}

function loadCustomLevels() {
    const stored = localStorage.getItem('nihongoNonogramCustomLevels');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                customLevels = parsed;
            }
        } catch {
            customLevels = [];
        }
    }
}

function saveCurrentLevel() {
    if (currentMode !== 'create') {
        showMessage('Переключитесь в режим создания, чтобы сохранить уровень.');
        return;
    }
    const name = levelNameInput.value.trim() || `Уровень ${new Date().toLocaleTimeString()}`;
    const description = levelDescInput.value.trim() || 'Уровень, созданный в редакторе.';
    const custom = {
        id: `custom-${Date.now()}`,
        name,
        description,
        size: currentSize,
        displayColor: currentFillColor,
        pattern: copyGrid(currentPattern)
    };
    customLevels.unshift(custom);
    saveCustomLevelStorage();
    populateLevelSelect();
    renderCustomLevels();
    renderLevelCards();
    showMessage(`Уровень «${name}» сохранён.`);
}

function updateInterface() {
    const isCreate = currentMode === 'create';
    document.querySelector('.creator-panel').style.display = isCreate ? 'block' : 'none';
    levelNameInput.disabled = !isCreate;
    levelDescInput.disabled = !isCreate;
    saveLevelBtn.disabled = !isCreate;
    sizeSelect.disabled = !isCreate;
    if (currentLevel) {
        showMessage(isCreate ? 'Редактируйте уровень и сохраните его.' : `Решайте уровень «${currentLevel.name}».`);
    }
}

function checkSolution() {
    if (!currentLevel) return;
    let complete = true;
    const size = currentSize;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const isFilled = currentState[y][x] === 1;
            const expected = currentPattern[y][x] > 0;
            if (isFilled !== expected) {
                complete = false;
            }
        }
    }
    showErrors = true;
    createBoard();
    if (complete) {
        showMessage('Поздравляем! Уровень решён.');
    } else {
        showMessage('Есть ошибки — попробуйте ещё раз.');
    }
}

function revealSolution() {
    currentState = currentPattern.map(row => row.map(value => (value > 0 ? 1 : 0)));
    showErrors = false;
    createBoard();
    showMessage('Решение показано.');
}

sizeSelect.addEventListener('change', () => {
    currentSize = Number(sizeSelect.value);
    if (currentMode === 'create') {
        currentPattern = createGrid(currentSize);
        currentState = createGrid(currentSize);
        createBoard();
    }
});

modeSelect.addEventListener('change', () => {
    currentMode = modeSelect.value;
    if (currentMode === 'create') {
        currentSize = Number(sizeSelect.value);
        currentPattern = createGrid(currentSize);
        currentState = createGrid(currentSize);
        currentLevel = {
            name: 'Новый уровень',
            size: currentSize,
            displayColor: currentFillColor,
            pattern: currentPattern,
            description: 'Создайте свой собственный уровень.'
        };
        levelTitleEl.textContent = currentLevel.name;
        levelDescText.textContent = currentLevel.description;
        updateInterface();
        createBoard();
        return;
    }
    const selected = levelSelect.value;
    const target = findLevelById(selected) || PREBUILT_LEVELS[0];
    loadLevel(target, false);
});

levelSelect.addEventListener('change', () => {
    const selected = levelSelect.value;
    const level = findLevelById(selected);
    if (level) {
        loadLevel(level, false);
    }
});

toolSelect.addEventListener('change', () => {
    currentTool = toolSelect.value;
});

newLevelBtn.addEventListener('click', () => {
    currentMode = 'create';
    modeSelect.value = 'create';
    currentSize = Number(sizeSelect.value);
    currentPattern = createGrid(currentSize);
    currentState = createGrid(currentSize);
    currentLevel = {
        name: 'Новый уровень',
        size: currentSize,
        displayColor: currentFillColor,
        pattern: currentPattern,
        description: 'Создайте свой собственный уровень.'
    };
    levelTitleEl.textContent = currentLevel.name;
    levelDescText.textContent = currentLevel.description;
    updateInterface();
    createBoard();
});

resetBtn.addEventListener('click', resetLevel);
checkBtn.addEventListener('click', checkSolution);
revealBtn.addEventListener('click', revealSolution);
saveLevelBtn.addEventListener('click', saveCurrentLevel);

function init() {
    populateSizeOptions();
    loadCustomLevels();
    renderPalette();
    populateLevelSelect();
    renderCustomLevels();
    renderLevelCards();
    loadLevel(PREBUILT_LEVELS[0], false);
}

init();