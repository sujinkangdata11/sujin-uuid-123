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
            // 네비게이션 초기화
            if (window.Navigation) {
                this.navigation = new window.Navigation();
            }

            // 기본 페이지(이모지) 로드
            await this.loadDefaultPage();

            console.log('앱이 성공적으로 초기화되었습니다.');
        } catch (error) {
            console.error('앱 초기화 중 오류 발생:', error);
        }
    }

    async loadDefaultPage() {
        // 기본적으로 이모지 페이지를 로드
        if (this.navigation) {
            await this.navigation.loadPageContent('emoji');
        }
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