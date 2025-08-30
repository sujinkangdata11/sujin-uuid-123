// 메시지 타이퍼 JavaScript - 완전한 remixed-673f97df.html 기능
class CleanMessageTyper {
    constructor() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messagesWrapper = document.getElementById('messagesWrapper');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.messageList = document.getElementById('messageList');
        this.addMessageBtn = document.getElementById('addMessageBtn');
        this.typingMode = document.getElementById('typingMode');
        this.speedGroup = document.getElementById('speedGroup');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.scaleSlider = document.getElementById('scaleSlider');
        this.scaleValue = document.getElementById('scaleValue');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // 녹화 관련 요소
        this.recordBtn = document.getElementById('recordBtn');
        this.stopRecordBtn = document.getElementById('stopRecordBtn');
        this.recordStatus = document.getElementById('recordStatus');
        this.recordTime = document.getElementById('recordTime');
        this.downloadSection = document.getElementById('downloadSection');
        this.downloadLink = document.getElementById('downloadLink');
        
        // 루프 모드
        this.loopMode = document.getElementById('loopMode');
        
        // 텍스트 파일 업로드 관련 요소
        this.textFileUpload = document.getElementById('textFileUpload');
        
        // 예시 모달 관련 요소
        this.showExampleBtn = document.getElementById('showExampleBtn');
        this.exampleModal = document.getElementById('exampleModal');
        this.closeExampleBtn = document.getElementById('closeExampleBtn');
        
        // 리사이저 관련 요소
        this.resizeHandle = document.getElementById('resizeHandle');
        this.controls = document.querySelector('.controls');
        
        this.messages = [];
        this.currentMessageIndex = 0;
        this.currentText = '';
        this.targetText = '';
        this.currentMessageType = '';
        this.isTyping = false;
        this.typeTimeout = null;
        this.messageTimeout = null;
        this.messageCounter = 1;
        
        // 녹화 관련 상태
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordStartTime = null;
        this.recordTimer = null;
        
        // 리사이저 상태
        this.isResizing = false;
        this.currentControlsWidth = 400;
        
        this.initEventListeners();
        this.initResizer();
        this.updateSpeedDisplay();
        this.updateScaleDisplay();
        this.updateSpeedGroupVisibility();
        this.addInitialMessages();
        this.initDragAndDrop();
        this.updateControlsWidth();
    }

    initEventListeners() {
        if (!this.startBtn) return;
        
        this.startBtn.addEventListener('click', () => this.startTyping());
        this.stopBtn.addEventListener('click', () => this.stopTyping());
        this.clearBtn.addEventListener('click', () => this.clearMessages());
        this.addMessageBtn.addEventListener('click', () => this.addMessage());
        
        // 녹화 이벤트 리스너
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopRecordBtn.addEventListener('click', () => this.stopRecording());
        
        this.speedSlider.addEventListener('input', () => this.updateSpeedDisplay());
        this.scaleSlider.addEventListener('input', () => this.updateScaleDisplay());
        
        this.typingMode.addEventListener('change', () => this.updateSpeedGroupVisibility());
        
        // 텍스트 파일 업로드 이벤트 리스너
        this.textFileUpload.addEventListener('change', (e) => this.handleTextFileUpload(e));
        
        // 예시 모달 이벤트 리스너
        this.showExampleBtn.addEventListener('click', () => this.showExample());
        this.closeExampleBtn.addEventListener('click', () => this.hideExample());
    }
    
    showExample() {
        this.exampleModal.style.display = 'block';
    }
    
    hideExample() {
        this.exampleModal.style.display = 'none';
    }
    
    handleTextFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.txt')) {
            alert('텍스트 파일(.txt)만 업로드 가능합니다.');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                this.parseTextFile(content);
                event.target.value = '';
            } catch (error) {
                alert('파일을 읽는 중 오류가 발생했습니다: ' + error.message);
                event.target.value = '';
            }
        };
        reader.onerror = () => {
            alert('파일을 읽을 수 없습니다.');
            event.target.value = '';
        };
        reader.readAsText(file, 'UTF-8');
    }
    
    parseTextFile(content) {
        this.messageList.innerHTML = '';
        this.messageCounter = 1;
        
        const lines = content.split('\n');
        let addedCount = 0;
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return;
            
            let messageText = '';
            let messageType = 'received';
            
            let processedLine = trimmedLine;
            if (processedLine.startsWith('"') && processedLine.endsWith('"')) {
                processedLine = processedLine.slice(1, -1);
            }
            
            if (processedLine.startsWith('//')) {
                messageType = 'sent';
                messageText = processedLine.substring(2).trim();
            } else {
                messageType = 'received';
                messageText = processedLine;
            }
            
            if (messageText) {
                this.addMessage(messageText, messageType);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            alert(`✅ ${addedCount}개의 메시지가 추가되었습니다!\n\n사용법:\n• "일반 텍스트" → 회색 메시지\n• "//텍스트" → 파란색 메시지`);
        } else {
            alert('⚠️ 유효한 메시지가 없습니다.\n빈 줄이 아닌 텍스트를 입력해주세요.');
        }
    }

    initDragAndDrop() {
        let draggedElement = null;
        
        this.messageList.addEventListener('dragstart', (e) => {
            draggedElement = e.target.closest('.message-item');
            if (draggedElement) {
                draggedElement.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });
        
        this.messageList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this.getDragAfterElement(this.messageList, e.clientY);
            if (afterElement == null) {
                this.messageList.appendChild(draggedElement);
            } else {
                this.messageList.insertBefore(draggedElement, afterElement);
            }
        });
        
        this.messageList.addEventListener('dragend', (e) => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement = null;
                this.updateMessageNumbers();
            }
        });
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.message-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    updateMessageNumbers() {
        const messageItems = this.messageList.querySelectorAll('.message-item');
        messageItems.forEach((item, index) => {
            const numberEl = item.querySelector('.message-number');
            numberEl.textContent = index + 1;
        });
    }
    
    initResizer() {
        if (!this.resizeHandle) return;
        
        let startX = 0;
        let startWidth = 0;
        
        this.resizeHandle.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            startX = e.clientX;
            startWidth = this.currentControlsWidth;
            
            this.resizeHandle.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isResizing) return;
            
            const deltaX = startX - e.clientX;
            const newWidth = Math.max(300, Math.min(window.innerWidth * 0.8, startWidth + deltaX));
            
            this.currentControlsWidth = newWidth;
            this.updateControlsWidth();
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                this.isResizing = false;
                this.resizeHandle.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }
    
    updateControlsWidth() {
        document.documentElement.style.setProperty('--controls-width', this.currentControlsWidth + 'px');
        if (this.controls) {
            this.controls.style.width = this.currentControlsWidth + 'px';
        }
    }
    
    addInitialMessages() {
        this.addMessage('안녕하세요! 반갑습니다.', 'received');
        this.addMessage('네, 잘 지내고 있어요!', 'sent');
        this.addMessage('깔끔한 메시지 스타일이에요.', 'received');
        this.addMessage('스크롤 테스트를 위해 메시지를 더 추가해볼게요.', 'sent');
        this.addMessage('메시지가 많아지면 스크롤이 생겨야 합니다.', 'received');
        this.addMessage('이제 스크롤이 잘 작동하는지 확인해보세요!', 'sent');
        this.addMessage('메시지를 더 추가해서 스크롤 기능을 테스트해보겠습니다.', 'received');
        this.addMessage('정말 잘 작동하고 있나요?', 'sent');
        this.addMessage('스크롤바가 보이나요?', 'received');
        this.addMessage('마지막 테스트 메시지입니다!', 'sent');
    }

    addMessage(text = '', type = 'received', hasMedia = false, mediaType = 'image') {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        messageItem.draggable = true;
        messageItem.innerHTML = `
            <div class="drag-handle"></div>
            <div class="message-number">${this.messageCounter}</div>
            <div class="message-content">
                <textarea class="message-input" placeholder="메시지를 입력하세요" rows="3">${text}</textarea>
                
                <div class="content-type-toggle">
                    <label>
                        <input type="checkbox" class="media-checkbox" ${hasMedia ? 'checked' : ''}>
                        📎 미디어 추가
                    </label>
                </div>
                
                <div class="media-upload-area" style="display: ${hasMedia ? 'block' : 'none'};">
                    <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                        <label>
                            <input type="radio" class="media-type-radio" name="media-type-${this.messageCounter}" value="image" ${!hasMedia || mediaType === 'image' ? 'checked' : ''}>
                            🖼️ 이미지
                        </label>
                        <label>
                            <input type="radio" class="media-type-radio" name="media-type-${this.messageCounter}" value="video" ${hasMedia && mediaType === 'video' ? 'checked' : ''}>
                            🎬 동영상
                        </label>
                    </div>
                    <input type="file" class="media-upload-input" accept="image/*">
                    <img class="media-preview" alt="미리보기">
                    <video class="video-preview" controls muted></video>
                    <div class="file-info" style="font-size: 12px; color: #8e8e93; margin-top: 5px;"></div>
                </div>
                
                <div class="message-type-toggle">
                    <select class="message-type-select">
                        <option value="received" ${type === 'received' ? 'selected' : ''}>⚪ 받은 메시지</option>
                        <option value="sent" ${type === 'sent' ? 'selected' : ''}>🔵 보낸 메시지</option>
                    </select>
                </div>
            </div>
            <div class="message-controls">
                <button class="remove-btn" onclick="this.closest('.message-item').remove()">삭제</button>
            </div>
        `;
        
        this.messageList.appendChild(messageItem);
        
        // 이벤트 리스너 추가
        const mediaCheckbox = messageItem.querySelector('.media-checkbox');
        const mediaRadios = messageItem.querySelectorAll('.media-type-radio');
        const mediaArea = messageItem.querySelector('.media-upload-area');
        const mediaInput = messageItem.querySelector('.media-upload-input');
        const mediaPreview = messageItem.querySelector('.media-preview');
        const videoPreview = messageItem.querySelector('.video-preview');
        const fileInfo = messageItem.querySelector('.file-info');
        const textInput = messageItem.querySelector('.message-input');
        
        textInput.addEventListener('input', () => {
            textInput.style.height = 'auto';
            textInput.style.height = textInput.scrollHeight + 'px';
        });
        
        mediaCheckbox.addEventListener('change', () => {
            if (mediaCheckbox.checked) {
                mediaArea.style.display = 'block';
                const imageRadio = mediaArea.querySelector('input[value="image"]');
                imageRadio.checked = true;
                mediaInput.accept = 'image/*';
            } else {
                mediaArea.style.display = 'none';
                mediaInput.value = '';
                mediaPreview.style.display = 'none';
                videoPreview.style.display = 'none';
                fileInfo.textContent = '';
            }
        });
        
        mediaRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const selectedValue = radio.value;
                if (selectedValue === 'image') {
                    mediaInput.accept = 'image/*';
                    videoPreview.style.display = 'none';
                    if (mediaInput.files[0] && mediaInput.files[0].type.startsWith('video/')) {
                        mediaInput.value = '';
                        fileInfo.textContent = '';
                    }
                } else if (selectedValue === 'video') {
                    mediaInput.accept = 'video/*';
                    mediaPreview.style.display = 'none';
                    if (mediaInput.files[0] && mediaInput.files[0].type.startsWith('image/')) {
                        mediaInput.value = '';
                        fileInfo.textContent = '';
                    }
                }
            });
        });
        
        mediaInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert('파일 크기가 5MB를 초과합니다. 더 작은 파일을 선택해주세요.');
                    mediaInput.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (file.type.startsWith('image/')) {
                        mediaPreview.src = e.target.result;
                        mediaPreview.style.display = 'block';
                        videoPreview.style.display = 'none';
                    } else if (file.type.startsWith('video/')) {
                        videoPreview.src = e.target.result;
                        videoPreview.style.display = 'block';
                        mediaPreview.style.display = 'none';
                    }
                    
                    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                    fileInfo.textContent = `${file.name} (${sizeInMB}MB)`;
                };
                reader.readAsDataURL(file);
            } else {
                mediaPreview.style.display = 'none';
                videoPreview.style.display = 'none';
                fileInfo.textContent = '';
            }
        });
        
        this.messageCounter++;
        textInput.focus();
    }
    
    updateSpeedDisplay() {
        if (this.speedValue) {
            this.speedValue.textContent = this.speedSlider.value + 'ms';
        }
    }
    
    updateScaleDisplay() {
        const scale = this.scaleSlider.value / 100;
        if (this.scaleValue) {
            this.scaleValue.textContent = this.scaleSlider.value + '%';
        }
        document.documentElement.style.setProperty('--message-scale', scale);
    }
    
    updateSpeedGroupVisibility() {
        const isCharacterMode = this.typingMode.value === 'character';
        if (this.speedGroup) {
            this.speedGroup.style.display = isCharacterMode ? 'block' : 'none';
        }
    }

    startTyping() {
        if (this.isTyping) return;
        
        this.messages = this.collectMessages();
        if (this.messages.length === 0) return;
        
        this.currentMessageIndex = 0;
        this.isTyping = true;
        this.updateButtons();
        this.typeNextMessage();
    }
    
    collectMessages() {
        const messageItems = this.messageList.querySelectorAll('.message-item');
        const messages = [];
        
        messageItems.forEach(item => {
            const typeSelect = item.querySelector('.message-type-select');
            const textInput = item.querySelector('.message-input');
            const mediaCheckbox = item.querySelector('.media-checkbox');
            const selectedMediaType = item.querySelector('.media-type-radio:checked')?.value || 'image';
            const mediaPreview = item.querySelector('.media-preview');
            const videoPreview = item.querySelector('.video-preview');
            
            if (!typeSelect) return;
            
            const text = textInput.value.trim();
            let hasMedia = mediaCheckbox.checked;
            let mediaSrc = null;
            let mediaType = selectedMediaType;
            
            if (hasMedia) {
                if (selectedMediaType === 'image' && mediaPreview.src && mediaPreview.style.display !== 'none') {
                    mediaSrc = mediaPreview.src;
                } else if (selectedMediaType === 'video' && videoPreview.src && videoPreview.style.display !== 'none') {
                    mediaSrc = videoPreview.src;
                } else {
                    hasMedia = false;
                }
            }
            
            if (text || hasMedia) {
                messages.push({
                    type: typeSelect.value,
                    text: text,
                    hasMedia: hasMedia,
                    mediaSrc: mediaSrc,
                    mediaType: mediaType
                });
            }
        });
        
        return messages;
    }
    
    typeNextMessage() {
        if (!this.isTyping || this.currentMessageIndex >= this.messages.length) {
            if (this.loopMode.checked && this.messages.length > 0) {
                setTimeout(() => {
                    this.clearMessagesOnly();
                    this.currentMessageIndex = 0;
                    this.typeNextMessage();
                }, 2000);
                return;
            }
            
            this.isTyping = false;
            this.updateButtons();
            this.hideTypingIndicator();
            return;
        }
        
        const message = this.messages[this.currentMessageIndex];
        this.currentMessageType = message.type;
        
        if (this.currentMessageType === 'received') {
            this.showTypingIndicator();
            
            this.messageTimeout = setTimeout(() => {
                this.hideTypingIndicator();
                this.startMessageTyping(message);
            }, Math.random() * 1000 + 1000);
        } else {
            this.startMessageTyping(message);
        }
    }
    
    clearMessagesOnly() {
        const messages = this.messagesContainer.querySelectorAll('.message, .message-group');
        messages.forEach(msg => msg.remove());
    }
    
    startMessageTyping(message) {
        if (!this.isTyping) return;
        
        this.currentMessageType = message.type;
        
        const messageGroup = document.createElement('div');
        messageGroup.className = `message-group ${this.currentMessageType}`;
        
        if (message.hasMedia) {
            const mediaContainer = document.createElement('div');
            mediaContainer.className = `message ${this.currentMessageType} image-message`;
            mediaContainer.style.padding = '0px';
            mediaContainer.style.background = 'transparent';
            mediaContainer.style.display = 'flex';
            mediaContainer.style.alignItems = 'center';
            mediaContainer.style.gap = `calc(8px * var(--message-scale))`;
            
            const mediaEl = document.createElement('div');
            mediaEl.style.position = 'relative';
            
            if (message.mediaType === 'image') {
                const img = document.createElement('img');
                img.src = message.mediaSrc;
                img.style.width = `calc(200px * var(--message-scale))`;
                img.style.height = 'auto';
                img.style.borderRadius = `calc(18px * var(--message-scale))`;
                img.style.display = 'block';
                mediaEl.appendChild(img);
            } else if (message.mediaType === 'video') {
                const video = document.createElement('video');
                video.src = message.mediaSrc;
                video.style.width = `calc(200px * var(--message-scale))`;
                video.style.height = 'auto';
                video.style.borderRadius = `calc(18px * var(--message-scale))`;
                video.style.display = 'block';
                video.controls = true;
                video.autoplay = true;
                video.muted = true;
                video.loop = false;
                video.playsInline = true;
                mediaEl.appendChild(video);
            }
            
            const shareBtn = document.createElement('div');
            shareBtn.className = 'share-button';
            shareBtn.style.cssText = `
                width: calc(32px * var(--message-scale));
                height: calc(32px * var(--message-scale));
                background: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: calc(1px * var(--message-scale)) solid #e5e5ea;
                align-self: center;
            `;
            
            shareBtn.innerHTML = `
                <svg class="share-icon" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
            `;
            
            shareBtn.addEventListener('mouseenter', () => {
                shareBtn.style.background = 'rgba(255, 255, 255, 1)';
                shareBtn.style.transform = 'scale(1.1)';
                shareBtn.style.borderColor = '#d1d1d6';
            });
            
            shareBtn.addEventListener('mouseleave', () => {
                shareBtn.style.background = 'rgba(255, 255, 255, 0.9)';
                shareBtn.style.transform = 'scale(1)';
                shareBtn.style.borderColor = '#e5e5ea';
            });
            
            shareBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = message.mediaSrc;
                link.download = `media_${Date.now()}.${message.mediaType === 'image' ? 'jpg' : 'mp4'}`;
                link.click();
            });
            
            mediaContainer.appendChild(mediaEl);
            mediaContainer.appendChild(shareBtn);
            messageGroup.appendChild(mediaContainer);
        }
        
        if (message.text) {
            const trimmedText = message.text.trim();
            const isEmojiOnly = this.isEmojiOnly(trimmedText);
            
            const textEl = document.createElement('div');
            textEl.className = `message ${this.currentMessageType}`;
            
            if (isEmojiOnly) {
                textEl.classList.add('emoji-only-message');
            }
            
            messageGroup.appendChild(textEl);
            
            this.targetText = message.text;
            this.currentText = '';
            
            this.messagesWrapper.appendChild(messageGroup);
            this.scrollToBottom();
            
            if (this.typingMode.value === 'instant') {
                textEl.textContent = this.targetText;
                this.currentMessageIndex++;
                this.messageTimeout = setTimeout(() => {
                    this.typeNextMessage();
                }, 1000);
            } else {
                this.typeCharacterForText(textEl);
            }
        } else if (message.hasMedia) {
            this.messagesWrapper.appendChild(messageGroup);
            this.scrollToBottom();
            
            this.currentMessageIndex++;
            
            this.messageTimeout = setTimeout(() => {
                this.typeNextMessage();
            }, 1000);
        }
    }
    
    isEmojiOnly(text) {
        const emojiRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\s]*$/u;
        return emojiRegex.test(text) && text.length > 0;
    }
    
    typeCharacterForText(textEl) {
        if (!this.isTyping) return;
        
        if (this.currentText.length < this.targetText.length) {
            this.currentText += this.targetText[this.currentText.length];
            textEl.innerHTML = this.currentText + '<span class="message-cursor"></span>';
            
            const speed = parseInt(this.speedSlider.value);
            this.typeTimeout = setTimeout(() => this.typeCharacterForText(textEl), speed);
        } else {
            textEl.textContent = this.currentText;
            
            this.currentMessageIndex++;
            
            this.messageTimeout = setTimeout(() => {
                this.typeNextMessage();
            }, 1000);
        }
        
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'block';
            this.messagesWrapper.appendChild(this.typingIndicator);
            this.scrollToBottom();
        }
    }
    
    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            if (this.messagesContainer) {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }
        }, 10);
    }
    
    stopTyping() {
        this.isTyping = false;
        
        if (this.typeTimeout) {
            clearTimeout(this.typeTimeout);
            this.typeTimeout = null;
        }
        
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }
        
        this.hideTypingIndicator();
        this.updateButtons();
    }
    
    clearMessages() {
        this.stopTyping();
        const messages = this.messagesContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
    }
    
    updateButtons() {
        if (this.startBtn) this.startBtn.disabled = this.isTyping;
        if (this.stopBtn) this.stopBtn.disabled = !this.isTyping;
    }

    async startRecording() {
        try {
            const isHTTPS = location.protocol === 'https:';
            const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            
            if (!isHTTPS && !isLocalhost) {
                throw new Error('HTTPS 연결이 필요합니다. 보안 연결에서만 화면 녹화가 가능합니다.');
            }
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('이 브라우저는 화면 녹화를 지원하지 않습니다.');
            }
            
            const userConfirm = confirm(
                '화면 녹화를 시작합니다.\n\n' +
                '팁:\n' +
                '• "전체 화면" 대신 "탭" 또는 "창" 선택을 권장합니다\n' +
                '• 메시지 영역이 잘 보이도록 창 크기를 조정해주세요\n\n' +
                '계속하시겠습니까?'
            );
            
            if (!userConfirm) return;
            
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: false
            });
            
            const supportedTypes = [
                'video/webm;codecs=h264',
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm'
            ];
            
            let mimeType = 'video/webm';
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            }
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 2500000
            });
            
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
                
                if (this.downloadLink) {
                    this.downloadLink.href = url;
                    this.downloadLink.download = `message-recording-${new Date().getTime()}.webm`;
                    this.downloadSection.style.display = 'block';
                }
                
                stream.getTracks().forEach(track => track.stop());
                
                alert('녹화가 완료되었습니다! 다운로드 링크를 클릭해주세요.\n\n참고: WebM 파일은 VLC, Chrome 등에서 재생 가능하며, 온라인 변환기로 MP4로 변환할 수 있습니다.');
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('녹화 중 오류:', event.error);
                this.stopRecording();
                alert('녹화 중 오류가 발생했습니다.');
            };
            
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                this.stopRecording();
                alert('화면 공유가 중단되어 녹화를 종료합니다.');
            });
            
            this.mediaRecorder.start(1000);
            this.isRecording = true;
            this.recordStartTime = Date.now();
            
            if (this.recordBtn) this.recordBtn.disabled = true;
            if (this.stopRecordBtn) this.stopRecordBtn.disabled = false;
            if (this.recordStatus) this.recordStatus.style.display = 'block';
            if (this.downloadSection) this.downloadSection.style.display = 'none';
            
            this.recordTimer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.recordStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const seconds = (elapsed % 60).toString().padStart(2, '0');
                if (this.recordTime) {
                    this.recordTime.textContent = `${minutes}:${seconds}`;
                }
            }, 1000);
            
        } catch (error) {
            console.error('녹화를 시작할 수 없습니다:', error);
            
            let errorMessage = '화면 녹화를 시작할 수 없습니다.\n\n';
            
            if (error.name === 'NotAllowedError') {
                errorMessage += '해결 방법:\n' +
                    '1. 브라우저에서 화면 공유를 허용해주세요\n' +
                    '2. HTTPS 연결인지 확인해주세요\n' +
                    '3. Chrome 설정에서 카메라/마이크 권한을 확인해주세요\n' +
                    '4. 시크릿 모드가 아닌 일반 모드에서 시도해주세요\n\n' +
                    '또는 OBS Studio 같은 화면 녹화 프로그램을 사용해보세요.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage += '이 브라우저는 화면 녹화를 지원하지 않습니다.\n' +
                    'Chrome, Edge, Firefox 최신 버전을 사용해주세요.';
            } else if (error.name === 'AbortError') {
                errorMessage += '사용자가 화면 공유를 취소했습니다.';
            } else {
                errorMessage += `오류: ${error.message}\n\n` +
                    '대안: OBS Studio나 다른 화면 녹화 프로그램을 사용해보세요.';
            }
            
            alert(errorMessage);
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            if (this.recordBtn) this.recordBtn.disabled = false;
            if (this.stopRecordBtn) this.stopRecordBtn.disabled = true;
            if (this.recordStatus) this.recordStatus.style.display = 'none';
            
            if (this.recordTimer) {
                clearInterval(this.recordTimer);
                this.recordTimer = null;
            }
        }
    }
}

// 전역에서 사용할 수 있도록 노출
window.CleanMessageTyper = CleanMessageTyper;