let readerActive = false;
let originalBody = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'READER_TOGGLE') {
    if (readerActive) {
      deactivateReader();
    } else {
      activateReader();
    }
  }
});

function activateReader() {
  readerActive = true;
  originalBody = document.body.innerHTML;

  // Find main content
  const article = document.querySelector('article') ||
    document.querySelector('main') ||
    document.querySelector('.post-content') ||
    document.querySelector('.article-body') ||
    document.querySelector('.content') ||
    document.body;

  const content = article.innerText;
  const title = document.title;

  document.body.innerHTML = `
    <div style="
      max-width: 680px;
      margin: 60px auto;
      padding: 0 20px 80px;
      font-family: Georgia, serif;
      font-size: 18px;
      line-height: 1.8;
      color: #1a1a1a;
      background: white;
    ">
      <div style="margin-bottom:32px;">
        <a onclick="chrome.runtime.sendMessage({type:'READER_TOGGLE'})"
          style="font-size:13px;color:#999;cursor:pointer;font-family:sans-serif;">
          ← Exit Reader Mode
        </a>
      </div>
      <h1 style="font-size:28px;line-height:1.3;margin-bottom:24px;">${title}</h1>
      <div style="white-space:pre-wrap;">${content}</div>
    </div>
  `;

  document.body.style.background = 'white';
}

function deactivateReader() {
  readerActive = false;
  if (originalBody) {
    document.body.innerHTML = originalBody;
  }
}