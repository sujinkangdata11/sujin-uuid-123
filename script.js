document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const emojiGrid = document.getElementById('emojiGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryTabsContainer = document.querySelector('.category-tabs');
    const notification = document.getElementById('copyNotification');

    // --- State ---
    let currentCategory = 'all';
    let allEmojis = [];
    let notificationTimer;

    // --- Data (from emoji-data.js) ---
    const emojiData = window.emojiData || {};
    const emojiKeywords = window.emojiKeywords || {};

    // --- Functions ---

    /**
     * Flattens the emoji data into a single array, removing duplicates.
     * @returns {string[]} A unique array of all emojis.
     */
    function getAllEmojis() {
        // Set을 사용하여 모든 카테고리의 이모지를 합치면서 중복을 자동으로 제거합니다.
        const emojiSet = new Set();
        for (const category in emojiData) {
            emojiData[category].forEach(emoji => emojiSet.add(emoji));
        }
        return Array.from(emojiSet);
    }

    /**
     * Renders a list of emojis to the grid using a DocumentFragment for performance.
     * @param {string[]} emojis - The array of emojis to render.
     */
    function renderEmojis(emojis) {
        // DocumentFragment를 사용해 모든 아이템을 메모리에서 만든 후, 한 번에 DOM에 추가합니다.
        // 이는 DOM reflow/repaint를 최소화하여 렌더링 성능을 크게 향상시킵니다.
        const fragment = document.createDocumentFragment();
        emojis.forEach(emoji => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.textContent = emoji;
            // 이벤트 위임을 위해 data 속성에 이모지 값을 저장합니다.
            item.dataset.emoji = emoji; 
            fragment.appendChild(item);
        });
        // 그리드를 비우고, 완성된 fragment를 한 번에 추가합니다.
        emojiGrid.innerHTML = '';
        emojiGrid.appendChild(fragment);
    }

    /**
     * Copies the given emoji to the clipboard and shows a notification.
     * @param {string} emoji - The emoji character to copy.
     */
    function copyEmoji(emoji) {
        if (!emoji) return;
        navigator.clipboard.writeText(emoji).then(() => {
            showCopyNotification(emoji);
        }).catch(err => {
            console.error('Failed to copy emoji: ', err);
        });
    }

    /**
     * Displays the copy notification with the copied emoji.
     * @param {string} copiedEmoji - The emoji that was copied.
     */
    function showCopyNotification(copiedEmoji) {
        if (notificationTimer) {
            clearTimeout(notificationTimer);
        }
        notification.textContent = `이모지가 복사되었습니다! ${copiedEmoji}`;
        notification.classList.add('show');
        notificationTimer = setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    /**
     * Filters emojis based on the current category and search term, then renders them.
     */
    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let emojisToRender;

        if (searchTerm) {
            emojisToRender = allEmojis.filter(emoji => {
                const keywords = emojiKeywords[emoji] || [];
                // 이모지 자체와 키워드 모두에서 검색합니다.
                return emoji.includes(searchTerm) || keywords.some(keyword => keyword.includes(searchTerm));
            });
        } else {
            emojisToRender = (currentCategory === 'all') ? allEmojis : (emojiData[currentCategory] || []);
        }
        renderEmojis(emojisToRender);
    }

    // --- Event Listeners (using Event Delegation for better performance) ---

    // emojiGrid에 단 하나의 이벤트 리스너를 추가하여 모든 자식 요소의 클릭을 처리합니다.
    emojiGrid.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('emoji-item')) {
            copyEmoji(e.target.dataset.emoji);
        }
    });

    // categoryTabsContainer에 단 하나의 리스너를 추가하여 모든 탭의 클릭을 처리합니다.
    categoryTabsContainer.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('tab')) {
            categoryTabsContainer.querySelector('.tab.active').classList.remove('active');
            e.target.classList.add('active');
            
            currentCategory = e.target.dataset.category;
            searchInput.value = ''; // 카테고리 변경 시 검색창 초기화
            filterAndRender();
        }
    });

    searchInput.addEventListener('input', filterAndRender);

    // --- Initialization ---
    function init() {
        allEmojis = getAllEmojis();
        filterAndRender();
    }

    init();
});