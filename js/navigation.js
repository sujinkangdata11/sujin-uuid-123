// 네비게이션 관련 JavaScript

class Navigation {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 상단 네비게이션 탭 클릭 이벤트
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.addEventListener('click', (e) => {
                this.handleNavClick(e.target);
            });
        });
    }

    async handleNavClick(navItem) {
        // 활성 탭 변경
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        navItem.classList.add('active');
        
        const contentType = navItem.dataset.type;
        
        // 페이지별 컨텐츠 로딩
        await this.loadPageContent(contentType);
        
        // 카테고리 탭과 검색 박스 표시/숨기기
        this.toggleEmojiFeatures(contentType === 'emoji');
    }

    async loadPageContent(contentType) {
        const contentContainer = document.querySelector('.main-section-content');
        
        if (!contentContainer) {
            console.error('메인 컨텐츠 컨테이너를 찾을 수 없습니다.');
            return;
        }

        try {
            // 페이지 파일 로딩
            const response = await fetch(`pages/${contentType}.html`);
            if (response.ok) {
                const html = await response.text();
                contentContainer.innerHTML = html;
                
                // 페이지별 초기화
                if (contentType === 'emoji' && window.EmojiManager && window.emojiData) {
                    // 이모지 페이지 - 이모지 관리자 초기화
                    const emojiManager = new window.EmojiManager();
                    emojiManager.init();
                } else if (contentType === 'description') {
                    // 이모지 설명 페이지 - script 태그 실행
                    this.executePageScripts(contentContainer);
                }
            } else {
                // 파일이 없으면 기본 빈 컨텐츠 표시
                contentContainer.innerHTML = this.getDefaultContent(contentType);
            }
        } catch (error) {
            console.error('페이지 로딩 실패:', error);
            contentContainer.innerHTML = this.getDefaultContent(contentType);
        }
    }

    getDefaultContent(contentType) {
        const titles = {
            emoji: '이모지',
            description: '이모지 설명',
            special: '특수문자',
            news: '뉴스'
        };

        return `
            <div class="empty-content">
                <p>${titles[contentType] || contentType} 페이지 준비 중입니다.</p>
            </div>
        `;
    }

    toggleEmojiFeatures(show) {
        // 이모지 페이지가 아닐 때는 이 기능들이 페이지 HTML에 포함되지 않으므로
        // 여기서 별도로 숨길 필요가 없습니다.
        // 각 페이지 HTML에서 필요한 요소들을 포함하고 있습니다.
    }

    executePageScripts(container) {
        // 동적으로 로드된 페이지의 script 태그들을 실행
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            try {
                if (script.src) {
                    // 외부 스크립트는 스킵 (이미 로드된 것으로 가정)
                    return;
                } else {
                    // 인라인 스크립트를 직접 실행
                    const scriptFunction = new Function(script.textContent);
                    scriptFunction();
                }
            } catch (error) {
                console.error('스크립트 실행 오류:', error);
            }
        });
    }
}

// 전역에서 사용할 수 있도록 노출
window.Navigation = Navigation;