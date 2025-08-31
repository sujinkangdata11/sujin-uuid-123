// 메인 애플리케이션 JavaScript

class App {
    constructor() {
        this.navigation = null;
        this.emojiManager = null;
    }

    init() {
        // DOM이 로드되면 앱 초기화
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }

    async initializeApp() {
        try {
            // URL 기반 탭 상태 우선 처리 (네비게이션 초기화 전에)
            await this.handleInitialTab();
            
            // 네비게이션 초기화 (탭 상태 처리 후)
            if (window.Navigation) {
                this.navigation = new window.Navigation();
            }

            console.log('앱이 성공적으로 초기화되었습니다.');
        } catch (error) {
            console.error('앱 초기화 중 오류 발생:', error);
        }
    }

    async handleInitialTab() {
        // URL 파라미터 우선 확인
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        let contentType = tabParam || 'emoji';
        
        console.log('=== INITIAL TAB DEBUG ===');
        console.log('Current URL:', window.location.href);
        console.log('URL params:', urlParams.toString());
        console.log('Tab param:', tabParam);
        console.log('Content type:', contentType);
        
        // 모든 탭에서 active 제거
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        // URL 기준 탭 활성화
        const targetTab = document.querySelector(`[data-type="${contentType}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
            console.log('Tab activated:', contentType, targetTab);
        }
        
        // 메시지 탭인 경우 강제로 레이아웃 설정
        if (contentType === 'message') {
            console.log('=== MESSAGE TAB FORCED SETUP ===');
            document.body.classList.add('message-tab-active');
            
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            const floatingBox = document.querySelector('.floating-emoji-box');
            
            if (sidebar) sidebar.style.display = 'none';
            if (floatingBox) floatingBox.style.display = 'none';
            if (mainContent) {
                mainContent.style.gridTemplateColumns = '1fr';
                mainContent.style.gap = '0';
            }
        }
        
        // 네비게이션 없이 직접 페이지 로드
        await this.loadPageDirectly(contentType);
    }

    async loadPageDirectly(contentType) {
        console.log('=== DIRECT PAGE LOAD ===', contentType);
        
        // 메시지 탭 구조 설정
        const mainContent = document.querySelector('.main-content');
        if (contentType === 'message' && mainContent) {
            mainContent.innerHTML = `<div class="main-section-content"></div>`;
        } else if (mainContent) {
            mainContent.innerHTML = `
                <div class="emoji-section">
                    <div class="main-section-content"></div>
                </div>
                <div class="sidebar">
                    <div class="ad-sidebar">광고 영역</div>
                </div>
            `;
        }
        
        // 페이지 컨텐츠 로드
        const contentContainer = document.querySelector('.main-section-content');
        if (contentContainer) {
            try {
                const timestamp = new Date().getTime();
                const url = `pages/${contentType}.html?v=${timestamp}`;
                console.log('Loading directly:', url);
                const response = await fetch(url);
                if (response.ok) {
                    const html = await response.text();
                    contentContainer.innerHTML = html;
                    console.log('Direct load success:', contentType);
                    
                    // 스크립트 실행
                    this.executePageScripts(contentContainer);
                }
            } catch (error) {
                console.error('Direct page load error:', error);
            }
        }
    }

    executePageScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            try {
                if (!script.src) {
                    const scriptFunction = new Function(script.textContent);
                    scriptFunction();
                }
            } catch (error) {
                console.error('Script execution error:', error);
            }
        });
    }

    // 다른 모듈에서 사용할 수 있는 유틸리티 메서드들
    static async loadHTML(url) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.text();
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            console.error('HTML 로딩 실패:', error);
            throw error;
        }
    }

    static showError(message) {
        console.error(message);
        // TODO: 사용자에게 에러 메시지를 보여주는 UI 구현
    }

    static showLoading(show = true) {
        // TODO: 로딩 스피너 표시/숨기기 구현
        console.log(show ? '로딩 시작' : '로딩 완료');
    }
}

// 앱 초기화
const app = new App();
app.init();

// 전역에서 사용할 수 있도록 노출
window.App = app;