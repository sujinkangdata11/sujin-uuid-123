// 이모지 관련 JavaScript

class EmojiManager {
    constructor() {
        this.currentCategory = 'all';
        this.allEmojis = [];
        this.notificationTimer = null;
    }

    init() {
        this.allEmojis = this.getAllEmojis();
        this.bindEvents();
        this.renderEmojis(this.allEmojis, true);
    }

    bindEvents() {
        // 카테고리 탭 클릭 이벤트
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.handleCategoryClick(e.target);
            });
        });

        // 검색 기능
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // 플로팅 박스 이벤트
        this.bindFloatingBoxEvents();

        // 터치 이벤트
        this.bindTouchEvents();

        // 화면 회전 및 리사이즈 이벤트
        this.bindResizeEvents();
    }

    bindFloatingBoxEvents() {
        const copyAllBtn = document.getElementById('copyAllBtn');
        const clearBtn = document.getElementById('clearBtn');

        if (copyAllBtn) {
            copyAllBtn.addEventListener('click', () => {
                this.copyAllEmojis();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearCollector();
            });
        }
    }

    bindTouchEvents() {
        let touchStartY = 0;
        let isScrolling = false;

        document.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('emoji-item')) {
                touchStartY = e.touches[0].clientY;
                isScrolling = false;
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.target.classList.contains('emoji-item')) {
                const touchY = e.touches[0].clientY;
                const deltaY = Math.abs(touchY - touchStartY);
                
                if (deltaY > 10) {
                    isScrolling = true;
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (e.target.classList.contains('emoji-item') && !isScrolling) {
                e.preventDefault();
                const emoji = e.target.textContent;
                this.copyEmoji(emoji);
            }
        }, { passive: false });

        // 모바일에서 더블탭 줌 방지
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // iOS Safari에서 바운스 스크롤 방지
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.floating-emoji-box') && 
                !e.target.closest('.emoji-collector')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    bindResizeEvents() {
        // 화면 회전 감지 및 레이아웃 재조정
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.currentCategory === 'all') {
                    this.renderEmojis(this.allEmojis, true);
                } else {
                    this.renderEmojis(window.emojiData[this.currentCategory] || []);
                }
            }, 500);
        });

        // 뷰포트 높이 조정
        this.setViewportHeight();
        window.addEventListener('resize', () => {
            this.setViewportHeight();
        });
    }

    setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    getAllEmojis() {
        const all = [];
        if (window.emojiData) {
            for (const category in window.emojiData) {
                all.push(...window.emojiData[category]);
            }
        }
        return all;
    }

    handleCategoryClick(tab) {
        // 활성 탭 변경
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // 카테고리 변경
        this.currentCategory = tab.dataset.category;
        
        if (this.currentCategory === 'all') {
            this.renderEmojis(this.allEmojis, true);
        } else {
            this.renderEmojis(window.emojiData[this.currentCategory] || []);
        }
    }

    handleSearch(searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        
        if (!searchTerm) {
            if (this.currentCategory === 'all') {
                this.renderEmojis(this.allEmojis, true);
            } else {
                this.renderEmojis(window.emojiData[this.currentCategory] || []);
            }
            return;
        }

        const emojiKeywords = window.emojiKeywords || {};
        let searchResults = [];
        
        for (const emoji of this.allEmojis) {
            const keywords = emojiKeywords[emoji] || [];
            if (keywords.some(keyword => keyword.includes(searchTerm))) {
                searchResults.push(emoji);
            }
        }
        
        this.renderEmojis(searchResults);
    }

    renderEmojis(emojis, showDividers = false) {
        const grid = document.getElementById('emojiGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (showDividers && this.currentCategory === 'all') {
            this.renderAllCategoriesWithDividers();
        } else {
            emojis.forEach(emoji => {
                const item = document.createElement('div');
                item.className = 'emoji-item';
                item.textContent = emoji;
                item.onclick = () => this.copyEmoji(emoji);
                grid.appendChild(item);
            });
        }
    }

    renderAllCategoriesWithDividers() {
        const grid = document.getElementById('emojiGrid');
        const categoryNames = {
            'people': '사람·표정',
            'hands': '손',
            'races': '인종',
            'jobs': '직업',
            'love': '사랑',
            'nature': '동물·자연',
            'food': '음식·음료',
            'activities': '활동',
            'travel': '여행·장소',
            'objects': '사물',
            'symbols': '기호',
            'flags': '국기'
        };

        let isFirst = true;
        for (const category in window.emojiData) {
            // 첫 번째 카테고리가 아닌 경우 구분자 추가
            if (!isFirst) {
                const divider = document.createElement('div');
                divider.className = 'category-divider';
                divider.textContent = `광고 영역 - ${categoryNames[category] || category} 섹션`;
                grid.appendChild(divider);
            }
            isFirst = false;

            // 해당 카테고리의 이모지들 추가
            window.emojiData[category].forEach(emoji => {
                const item = document.createElement('div');
                item.className = 'emoji-item';
                item.textContent = emoji;
                item.onclick = () => this.copyEmoji(emoji);
                grid.appendChild(item);
            });
        }
    }

    copyEmoji(emoji) {
        // 터치 피드백
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        navigator.clipboard.writeText(emoji).then(() => {
            this.showCopyNotification(emoji);
            this.addToCollector(emoji);
        }).catch(() => {
            // 클립보드 API가 실패한 경우 대체 방법
            this.fallbackCopyTextToClipboard(emoji);
            this.showCopyNotification(emoji);
            this.addToCollector(emoji);
        });
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback: 복사 실패', err);
        }
        
        document.body.removeChild(textArea);
    }

    addToCollector(emoji) {
        const collector = document.getElementById('emojiCollector');
        if (!collector) return;
        
        if (collector.hasAttribute('data-placeholder')) {
            collector.textContent = emoji;
            collector.removeAttribute('data-placeholder');
        } else {
            collector.textContent += emoji;
        }
    }

    showCopyNotification(copiedEmoji) {
        const notification = document.getElementById('copyNotification');
        if (!notification) return;
        
        notification.textContent = `이모지가 복사되었습니다! ${copiedEmoji}`;
        notification.classList.add('show');
        
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }

        this.notificationTimer = setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    copyAllEmojis() {
        const collector = document.getElementById('emojiCollector');
        if (!collector) return;
        
        const allEmojisText = collector.textContent;
        if (allEmojisText && allEmojisText !== '이모지를 클릭하세요') {
            // 터치 피드백
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
            
            navigator.clipboard.writeText(allEmojisText).then(() => {
                this.showCopyNotification(`복사완료! ${allEmojisText}`);
            }).catch(() => {
                this.fallbackCopyTextToClipboard(allEmojisText);
                this.showCopyNotification(`복사완료! ${allEmojisText}`);
            });
        }
    }

    clearCollector() {
        const collector = document.getElementById('emojiCollector');
        if (!collector) return;
        
        collector.textContent = '이모지를 클릭하세요';
        collector.setAttribute('data-placeholder', 'true');
    }
}

// 전역에서 사용할 수 있도록 노출
window.EmojiManager = EmojiManager;