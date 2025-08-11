// 이모지 관련 JavaScript

class EmojiManager {
    constructor() {
        this.currentCategory = 'all';
        this.allEmojis = [];
        this.notificationTimer = null;
        this.searchTimeout = null; // 검색 디바운싱용
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
        searchTerm = searchTerm.toLowerCase().trim();
        
        if (!searchTerm) {
            if (this.currentCategory === 'all') {
                this.renderEmojis(this.allEmojis, true);
            } else {
                this.renderEmojis(window.emojiData[this.currentCategory] || []);
            }
            // 검색 결과 개수 숨기기
            this.showSearchResultCount(0, '');
            return;
        }

        const emojiKeywords = window.emojiKeywords || {};
        
        // 성능 최적화: 빈번한 검색을 위한 디바운싱
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.searchTimeout = setTimeout(() => {
            const searchResults = this.performSearch(searchTerm, emojiKeywords);
            this.renderEmojis(searchResults);
            this.showSearchResultCount(searchResults.length, searchTerm);
            
            // 검색 분석 로깅 (디버깅용)
            console.log(`검색어: "${searchTerm}", 결과: ${searchResults.length}개`);
        }, 150); // 150ms 디바운싱
    }
    
    performSearch(searchTerm, emojiKeywords) {
        const scoredResults = [];
        
        // 성능 최적화: 검색 대상을 현재 카테고리로 제한 (필요시)
        const searchPool = this.currentCategory === 'all' ? 
            this.allEmojis : 
            (window.emojiData[this.currentCategory] || []);
        
        for (const emoji of searchPool) {
            const keywords = emojiKeywords[emoji] || [];
            let score = 0;
            let matched = false;
            let matchTypes = new Set(); // 매칭 타입을 추적
            
            for (let i = 0; i < keywords.length; i++) {
                const keyword = keywords[i].toLowerCase();
                
                // 완전 일치 (최고 점수)
                if (keyword === searchTerm) {
                    score += 150;
                    matched = true;
                    matchTypes.add('exact');
                } 
                // 시작 부분 일치 (높은 점수)
                else if (keyword.startsWith(searchTerm)) {
                    score += 100;
                    matched = true;
                    matchTypes.add('start');
                }
                // 포함 (보통 점수)
                else if (keyword.includes(searchTerm)) {
                    score += 60;
                    matched = true;
                    matchTypes.add('contain');
                }
                
                // 첫 번째 키워드 매칭 시 보너스 점수
                if (i === 0 && matched) {
                    score += 30;
                }
                
                // 키워드 길이가 검색어와 비슷하면 보너스
                if (matched && Math.abs(keyword.length - searchTerm.length) <= 2) {
                    score += 20;
                }
            }
            
            // 다양한 매칭 타입이 있으면 보너스 점수
            if (matchTypes.size > 1) {
                score += 25;
            }
            
            if (matched) {
                scoredResults.push({ emoji, score, matchTypes });
            }
        }
        
        // 점수 순으로 정렬 (높은 점수가 먼저)
        scoredResults.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // 점수가 같으면 매칭 타입 우선순위로 정렬
            if (a.matchTypes.has('exact') && !b.matchTypes.has('exact')) return -1;
            if (b.matchTypes.has('exact') && !a.matchTypes.has('exact')) return 1;
            if (a.matchTypes.has('start') && !b.matchTypes.has('start')) return -1;
            if (b.matchTypes.has('start') && !a.matchTypes.has('start')) return 1;
            return 0;
        });
        
        return scoredResults.map(result => result.emoji);
    }
    
    showSearchResultCount(count, searchTerm) {
        // 검색 결과 개수를 표시할 요소가 있다면 업데이트
        const resultCount = document.getElementById('searchResultCount');
        if (resultCount) {
            if (count > 0) {
                resultCount.textContent = `"${searchTerm}" 검색 결과: ${count}개`;
                resultCount.style.display = 'block';
            } else {
                resultCount.textContent = `"${searchTerm}" 검색 결과가 없습니다.`;
                resultCount.style.display = 'block';
            }
        }
        
        // 검색어가 없으면 결과 개수 숨기기
        if (!searchTerm) {
            if (resultCount) {
                resultCount.style.display = 'none';
            }
        }
    }

    renderEmojis(emojis, showDividers = false) {
        const grid = document.getElementById('emojiGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (showDividers && this.currentCategory === 'all') {
            this.renderAllCategoriesWithDividers();
        } else {
            // 성능 최적화: DocumentFragment 사용하여 DOM 조작 최소화
            const fragment = document.createDocumentFragment();
            emojis.forEach(emoji => {
                const item = document.createElement('div');
                item.className = 'emoji-item';
                item.textContent = emoji;
                item.onclick = () => this.copyEmoji(emoji);
                fragment.appendChild(item);
            });
            grid.appendChild(fragment);
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

        // 성능 최적화: DocumentFragment 사용
        const fragment = document.createDocumentFragment();
        let isFirst = true;
        
        for (const category in window.emojiData) {
            // 첫 번째 카테고리가 아닌 경우 구분자 추가
            if (!isFirst) {
                const divider = document.createElement('div');
                divider.className = 'category-divider';
                divider.textContent = `광고 영역 - ${categoryNames[category] || category} 섹션`;
                fragment.appendChild(divider);
            }
            isFirst = false;

            // 해당 카테고리의 이모지들 추가 - 배치로 처리
            const categoryEmojis = window.emojiData[category];
            categoryEmojis.forEach(emoji => {
                const item = document.createElement('div');
                item.className = 'emoji-item';
                item.textContent = emoji;
                item.onclick = () => this.copyEmoji(emoji);
                fragment.appendChild(item);
            });
        }
        
        // 한 번에 DOM에 추가
        grid.appendChild(fragment);
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