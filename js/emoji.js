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
            
            // 복합 검색 디버깅
            if (searchTerm.includes(' ')) {
                console.log(`=== 복합 검색: "${searchTerm}" ===`);
                console.log(`검색 결과: ${searchResults.length}개`);
                if (searchResults.length > 0) {
                    console.log('상위 결과:', searchResults.slice(0, 5));
                }
                console.log('==========================');
            }
        }, 150); // 150ms 디바운싱
    }
    
    performSearch(searchTerm, emojiKeywords) {
        const scoredResults = [];
        
        // 복합 검색어 처리: 띄어쓰기로 분리하여 개별 단어로 검색
        const searchTerms = searchTerm.split(/\s+/).filter(term => term.length > 0);
        
        // 성능 최적화: 검색 대상을 현재 카테고리로 제한 (필요시)
        const searchPool = this.currentCategory === 'all' ? 
            this.allEmojis : 
            (window.emojiData[this.currentCategory] || []);
        
        for (const emoji of searchPool) {
            const keywords = emojiKeywords[emoji] || [];
            let score = 0;
            let matched = false;
            let matchTypes = new Set(); // 매칭 타입을 추적
            let matchedTerms = 0; // 매칭된 검색어 개수
            
            // 각 검색어에 대해 검사
            for (const currentSearchTerm of searchTerms) {
                let termMatched = false;
                let termScore = 0;
                
                for (let i = 0; i < keywords.length; i++) {
                    const keyword = keywords[i].toLowerCase();
                    
                    // 완전 일치 (최고 점수)
                    if (keyword === currentSearchTerm) {
                        termScore += 150;
                        termMatched = true;
                        matchTypes.add('exact');
                    } 
                    // 시작 부분 일치 (높은 점수)
                    else if (keyword.startsWith(currentSearchTerm)) {
                        termScore += 100;
                        termMatched = true;
                        matchTypes.add('start');
                    }
                    // 포함 (보통 점수)
                    else if (keyword.includes(currentSearchTerm)) {
                        termScore += 60;
                        termMatched = true;
                        matchTypes.add('contain');
                    }
                    
                    // 첫 번째 키워드 매칭 시 보너스 점수
                    if (i === 0 && (keyword === currentSearchTerm || keyword.startsWith(currentSearchTerm) || keyword.includes(currentSearchTerm))) {
                        termScore += 30;
                    }
                    
                    // 키워드 길이가 검색어와 비슷하면 보너스
                    if (termMatched && Math.abs(keyword.length - currentSearchTerm.length) <= 2) {
                        termScore += 20;
                    }
                }
                
                if (termMatched) {
                    matchedTerms++;
                    score += termScore;
                }
            }
            
            // 모든 검색어가 매칭되어야 결과에 포함
            if (matchedTerms === searchTerms.length) {
                matched = true;
                
                // 복합 검색어 보너스: 여러 단어가 모두 매칭되면 추가 점수
                if (searchTerms.length > 1) {
                    score += 100 * searchTerms.length;
                }
            }
            
            // 다양한 매칭 타입이 있으면 보너스 점수
            if (matchTypes.size > 1) {
                score += 25;
            }
            
            // 직관적 검색 보너스 점수 시스템
            if (matched) {
                const intuitiveBonuses = this.getIntuitiveBonus(searchTerm, emoji);
                score += intuitiveBonuses;
            }
            
            // 특별 규칙: "하트"와 "사랑" 검색 시 하트 이모지들에게 최고 우선순위 보장
            if (matched && (searchTerm === '하트' || searchTerm === '사랑')) {
                if (emoji === '❤️') {
                    score += 10000000; // 절대적 우선순위 - 1천만점
                } else if (emoji === '♥️') {
                    score += 5000000;  // 500만점
                } else if (emoji === '💑') {
                    score += 1000000;  // 100만점
                } else if (emoji === '💕') {
                    score += 800000;   // 80만점
                } else if (emoji === '💖') {
                    score += 700000;   // 70만점
                }
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

    getIntuitiveBonus(searchTerm, emoji) {
        let bonus = 0;
        
        // 직관적 검색 매핑: 특정 키워드에 대해 가장 직관적인 이모지에 높은 보너스 점수
        const intuitiveMap = {
            '하트': {
                '❤️': 500,    // 빨간 하트 - 가장 기본적인 하트
                '♥️': 450,    // 클래식 하트  
                '💕': 300,    // 두개 하트
                '💖': 250,    // 반짝 하트
                '💗': 240,    // 커지는 하트
                '💘': 230,    // 화살 하트
                '💞': 220,    // 회전 하트
                '💝': 210,    // 선물 하트
                '💟': 200,    // 하트 장식
                '💛': 150,    // 노란 하트
                '💚': 150,    // 초록 하트
                '💙': 150,    // 파란 하트
                '💜': 150,    // 보라 하트
                '🧡': 150,    // 주황 하트
                '🤎': 150,    // 갈색 하트
                '🖤': 150,    // 검은 하트
                '🤍': 150,    // 흰 하트
                '❣️': 140     // 하트 느낌표
            },
            '사랑': {
                '❤️': 500,    // 빨간 하트
                '♥️': 450,    // 클래식 하트
                '💕': 400,    // 두개 하트
                '💖': 350,    // 반짝 하트
                '💞': 340,    // 회전 하트
                '💘': 330,    // 화살 하트 (큐피드)
                '💗': 320,    // 커지는 하트
                '💝': 310,    // 선물 하트
                '💟': 300,    // 하트 장식
                '💑': 250,    // 커플
                '💏': 240,    // 키스하는 커플
                '💋': 200,    // 키스마크
                '🌹': 150,    // 장미
                '💌': 100     // 러브레터
            },
            '웃음': {
                '😀': 200,    // 활짝 웃는 얼굴
                '😁': 180,    // 이빨 보이는 웃음
                '😂': 170,    // 기쁨의 눈물
                '🤣': 160,    // 바닥 굴러가며 웃기
                '😄': 150,    // 눈웃음
                '😃': 140,    // 웃는 얼굴
                '😆': 130,    // 웃음 참기
                '😊': 120     // 부끄러운 웃음
            },
            '슬픔': {
                '😢': 200,    // 눈물
                '😭': 180,    // 크게 우는 얼굴
                '😞': 160,    // 실망한 얼굴
                '😔': 150,    // 침울한 얼굴
                '☹️': 140,    // 찌푸린 얼굴
                '😿': 130,    // 우는 고양이
                '💔': 120     // 상처받은 하트
            }
        };
        
        // Love 카테고리 이모지에 대한 추가 보너스
        if (window.emojiData && window.emojiData.love && window.emojiData.love.includes(emoji)) {
            if (searchTerm === '하트' || searchTerm === '사랑') {
                bonus += 200; // Love 카테고리 보너스
            }
        }
        
        // 직관적 매핑에서 보너스 점수 적용
        if (intuitiveMap[searchTerm] && intuitiveMap[searchTerm][emoji]) {
            bonus += intuitiveMap[searchTerm][emoji];
        }
        
        return bonus;
    }
}

// 전역에서 사용할 수 있도록 노출
window.EmojiManager = EmojiManager;