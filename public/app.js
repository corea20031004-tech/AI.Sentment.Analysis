document.addEventListener('DOMContentLoaded', () => {
  const textInput = document.getElementById('text-input');
  const charCount = document.getElementById('char-count');
  const analyzeBtn = document.getElementById('analyze-btn');
  const errorMessage = document.getElementById('error-message');
  const loadingSection = document.getElementById('loading-section');
  const inputSection = document.querySelector('.input-section');
  const resultSection = document.getElementById('result-section');
  
  const sentimentBadge = document.getElementById('sentiment-badge');
  const confidenceBar = document.getElementById('confidence-bar');
  const confidenceValue = document.getElementById('confidence-value');
  const analysisReason = document.getElementById('analysis-reason');
  const resetBtn = document.getElementById('reset-btn');

  // Character count updates
  textInput.addEventListener('input', () => {
    const length = textInput.value.length;
    charCount.textContent = length;
    
    // Alert user visually if getting close to limit
    if (length >= 900) {
      charCount.style.color = 'var(--error-color)';
    } else {
      charCount.style.color = 'var(--text-muted)';
    }
  });

  // Handle Analysis Request
  analyzeBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    
    // Clear previous errors
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');

    // Validation
    if (!text) {
      errorMessage.textContent = '문장을 입력해 주세요. 공백은 분석할 수 없습니다.';
      errorMessage.classList.remove('hidden');
      return;
    }

    // Set UI to loading state
    setInputDisabled(true);
    showLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '요청 처리 중 오류가 발생했습니다.');
      }

      // Display results
      displayResult(data);

    } catch (err) {
      console.error(err);
      errorMessage.textContent = err.message || '네트워크 오류가 발생했습니다. 다시 시도해 주세요.';
      errorMessage.classList.remove('hidden');
      setInputDisabled(false);
      showLoading(false);
    }
  });

  // Reset to input state
  resetBtn.addEventListener('click', () => {
    textInput.value = '';
    charCount.textContent = '0';
    charCount.style.color = 'var(--text-muted)';
    
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
    
    resultSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    
    setInputDisabled(false);
    showLoading(false);
  });

  // Helper functions
  function setInputDisabled(disabled) {
    textInput.disabled = disabled;
    analyzeBtn.disabled = disabled;
  }

  function showLoading(isLoading) {
    if (isLoading) {
      loadingSection.classList.remove('hidden');
      analyzeBtn.querySelector('.btn-text').classList.add('hidden');
      analyzeBtn.querySelector('.btn-loader').style.display = 'block';
    } else {
      loadingSection.classList.add('hidden');
      analyzeBtn.querySelector('.btn-text').classList.remove('hidden');
      analyzeBtn.querySelector('.btn-loader').style.display = 'none';
    }
  }

  function displayResult(data) {
    // 1. Setup sentiment badge styles
    sentimentBadge.className = 'sentiment-badge'; // reset
    sentimentBadge.textContent = data.sentiment;

    let sentimentClass = 'sentiment-neutral';
    let progressClass = 'neutral';

    if (data.sentiment === '긍정') {
      sentimentClass = 'sentiment-positive';
      progressClass = 'positive';
    } else if (data.sentiment === '부정') {
      sentimentClass = 'sentiment-negative';
      progressClass = 'negative';
    }

    sentimentBadge.classList.add(sentimentClass);

    // 2. Setup progress bar
    confidenceBar.className = 'progress-bar'; // reset
    confidenceBar.classList.add(progressClass);
    
    // Trigger animation in next frame
    setTimeout(() => {
      confidenceBar.style.width = `${data.confidence}%`;
    }, 50);

    confidenceValue.textContent = `${data.confidence}%`;

    // 3. Setup reason
    analysisReason.textContent = data.reason;

    // 4. Update section visibility
    showLoading(false);
    inputSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
  }
});
