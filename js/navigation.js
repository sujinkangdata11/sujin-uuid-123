// 네비게이션 관련 JavaScript

class Navigation {
    constructor() {
        console.log('Navigation constructor called');
        this.init();
    }

    init() {
        console.log('Navigation init called');
        this.bindEvents();
        // handleInitialUrl 제거 - main.js에서 처리
        this.bindPopState();
        console.log('Navigation init completed');
    }

    bindEvents() {
        // 상단 네비게이션 탭 클릭 이벤트
        const navItems = document.querySelectorAll('.nav-item');
        console.log('Found nav items:', navItems.length, navItems);
        
        navItems.forEach(navItem => {
            console.log('Binding click event to:', navItem, navItem.dataset.type);
            navItem.addEventListener('click', (e) => {
                console.log('Click event triggered on:', e.target);
                e.preventDefault();
                e.stopPropagation();
                this.handleNavClick(e.target);
            });
        });
    }

    async handleNavClick(navItem) {
        console.log('handleNavClick called with:', navItem, navItem.dataset.type);
        // 활성 탭 변경
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        navItem.classList.add('active');
        
        const contentType = navItem.dataset.type;
        
        // URL 변경 (브라우저 히스토리에 추가)
        let newUrl;
        if (contentType === 'emoji') {
            newUrl = window.location.origin + window.location.pathname;
        } else {
            newUrl = window.location.origin + window.location.pathname + '?tab=' + contentType;
        }
        
        // 현재 URL을 즉시 업데이트하여 새로고침 시에도 상태 유지
        window.history.replaceState({ contentType }, '', newUrl);
        
        console.log('Current URL before change:', window.location.href);
        console.log('New URL to set:', newUrl);
        
        try {
            history.pushState({ contentType }, '', newUrl);
            console.log('URL after change:', window.location.href);
            console.log('History state:', history.state);
        } catch (error) {
            console.error('Error changing URL:', error);
        }
        
        // 메시지 탭 레이아웃 제어
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const floatingBox = document.querySelector('.floating-emoji-box');
        
        if (contentType === 'message') {
            document.body.classList.add('message-tab-active');
            
            // 사이드바 숨기기
            if (sidebar) {
                sidebar.style.display = 'none';
                console.log('Sidebar hidden for message tab');
            }
            
            // 플로팅 이모지 박스 숨기기
            if (floatingBox) {
                floatingBox.style.display = 'none';
                console.log('Floating emoji box hidden for message tab');
            }
            
            // 그리드 레이아웃을 1개 컬럼으로 변경
            if (mainContent) {
                mainContent.style.gridTemplateColumns = '1fr';
                mainContent.style.gap = '0';
                console.log('Grid layout changed to single column for message tab');
            }
            
            console.log('Added message-tab-active class');
        } else {
            document.body.classList.remove('message-tab-active');
            
            // 사이드바 복원
            if (sidebar) {
                sidebar.style.display = '';
                console.log('Sidebar restored for other tabs');
            }
            
            // 플로팅 이모지 박스 복원
            if (floatingBox) {
                floatingBox.style.display = '';
                console.log('Floating emoji box restored for other tabs');
            }
            
            // 그리드 레이아웃 복원
            if (mainContent) {
                mainContent.style.gridTemplateColumns = '1fr 300px';
                mainContent.style.gap = '20px';
                console.log('Grid layout restored to original');
            }
            
            console.log('Removed message-tab-active class');
        }
        
        // 페이지별 컨텐츠 로딩
        await this.loadPageContent(contentType);
        
        // 카테고리 탭과 검색 박스 표시/숨기기
        this.toggleEmojiFeatures(contentType === 'emoji');
    }

    async loadPageContent(contentType) {
        let contentContainer = document.querySelector('.main-section-content');
        
        // 메시지 탭은 별도 처리 (emoji-section 제거하고 평평한 구조)
        if (contentType === 'message') {
            const mainContent = document.querySelector('.main-content');
            // 메시지 탭에서는 기본 중첩 구조를 완전히 재구성
            if (mainContent) {
                console.log('메시지 탭: emoji-section 제거하고 평평한 구조로 재구성');
                mainContent.innerHTML = `
                    <!--/// BACKUP - 메시지 탭 평평한 구조 시작 ///-->
                    <div class="main-section-content">
                        <!-- 메시지 페이지 컨텐츠가 emoji-section 없이 직접 로드됩니다 -->
                    </div>
                    <!--/// BACKUP - 메시지 탭 평평한 구조 끝 ///-->
                `;
                contentContainer = document.querySelector('.main-section-content');
            }
        } else {
            // 다른 탭들은 기존 emoji-section 구조 강제 복원
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                console.log(`다른 탭 (${contentType}): emoji-section 구조 강제 복원`);
                // 다른 탭들은 항상 기존 구조로 재설정
                mainContent.innerHTML = `
                    <!--/// 다른 탭들 강제 복원: emoji-section 포함 구조 ///-->
                    <div class="emoji-section">
                        <div class="main-section-content">
                            <!-- 페이지 컨텐츠가 여기에 동적으로 로드됩니다 -->
                        </div>
                    </div>
                    <div class="sidebar">
                        <div class="ad-sidebar">
                            광고 영역
                        </div>
                    </div>
                `;
                contentContainer = document.querySelector('.main-section-content');
            }
        }
        
        if (!contentContainer) {
            console.error('메인 컨텐츠 컨테이너를 찾을 수 없습니다.');
            return;
        }

        try {
            // 페이지 파일 로딩 (캐시 방지를 위한 타임스탬프 추가)
            const timestamp = new Date().getTime();
            const url = `pages/${contentType}.html?v=${timestamp}`;
            console.log('=== LOADING PAGE ===');
            console.log('Content type:', contentType);
            console.log('Fetching:', url);
            const response = await fetch(url);
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            if (response.ok) {
                const html = await response.text();
                console.log('HTML content length:', html.length);
                console.log('HTML preview:', html.substring(0, 200));
                console.log('Is message tab?', contentType === 'message');
                contentContainer.innerHTML = html;
                
                // 페이지별 초기화
                if (contentType === 'emoji' && window.EmojiManager && window.emojiData) {
                    // 이모지 페이지 - 이모지 관리자 초기화
                    const emojiManager = new window.EmojiManager();
                    emojiManager.init();
                } else if (contentType === 'description') {
                    // 이모지 설명 페이지 - script 태그 실행
                    this.executePageScripts(contentContainer);
                } else if (contentType === 'message') {
                    // 메시지 페이지 - script 태그 실행
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
            message: '메시지',
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
    
    
    bindPopState() {
        window.addEventListener('popstate', (event) => {
            console.log('=== POPSTATE EVENT ===', event.state);
            const contentType = event.state?.contentType || this.getContentTypeFromPath();
            console.log('Popstate content type:', contentType);
            const targetTab = document.querySelector(`[data-type="${contentType}"]`);
            if (targetTab) {
                this.handleNavClick(targetTab);
            }
        });
    }
    
    getContentTypeFromPath() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('tab') || 'emoji';
    }
}

// 전역에서 사용할 수 있도록 노출
window.Navigation = Navigation;

console.log('navigation.js file loaded successfully');
console.log('Navigation class:', Navigation);
console.log('window.Navigation:', window.Navigation);