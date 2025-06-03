document.addEventListener('DOMContentLoaded', function() {
    const startRecordBtn = document.getElementById('start-record-btn');
    const stopRecordBtn = document.getElementById('stop-record-btn');
    const transcriptionElement = document.getElementById('transcription');

    let recognition;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';

        recognition.onstart = function() {
            transcriptionElement.textContent = '正在录音...';
            startRecordBtn.disabled = true;
            stopRecordBtn.disabled = false;
        };

        recognition.onresult = function(event) {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    transcriptionElement.textContent += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            transcriptionElement.textContent = interimTranscript;
        };

        recognition.onerror = function(event) {
            transcriptionElement.textContent = '发生错误: ' + event.error;
        };

        recognition.onend = function() {
            transcriptionElement.textContent += ' 录音结束。';
            startRecordBtn.disabled = false;
            stopRecordBtn.disabled = true;
        };
    } else {
        transcriptionElement.textContent = '抱歉，您的浏览器不支持语音识别。';
        startRecordBtn.disabled = true;
    }

    startRecordBtn.addEventListener('click', function() {
        if (recognition) {
            recognition.start();
        }
    });

    stopRecordBtn.addEventListener('click', function() {
        if (recognition) {
            recognition.stop();
        }
    });
}); 