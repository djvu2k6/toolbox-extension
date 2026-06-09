let readerActive = false;
let savedHTML = null;
let savedStyles = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'READER_TOGGLE') {
    readerActive ? deactivateReader() : activateReader();
  }
  if (msg.type === 'READER_STATUS') {
    chrome.runtime.sendMessage({ type: 'READER_IS', active: readerActive });
  }
});

function activateReader() {
  readerActive = true;
  savedHTML = document.body.innerHTML;
  savedStyles = document.body.getAttribute('style') || '';

  const article = document.querySelector('article') ||
    document.querySelector('main') ||
    document.querySelector('[class*="content"]') ||
    document.querySelector('[class*="article"]') ||
    document.body;

  const paragraphs = Array.from(article.querySelectorAll('p, h1, h2, h3, h4, li'))
    .map(el => {
      if (el.tagName === 'H1') return `<h1>${el.textContent}</h1>`;
      if (el.tagName.match(/H[2-4]/)) return `<h2>${el.textContent}</h2>`;
      if (el.tagName === 'LI') return `<li>${el.textContent}</li>`;
      return `<p>${el.textContent}</p>`;
    }).join('');

  document.body.innerHTML = `
    <div id="toolbox-reader" style="
      max-width:680px;margin:0 auto;
      padding:60px 24px 100px;
      font-family:Georgia,serif;
      font-size:18px;line-height:1.9;
      color:#1a1a1a;
    ">
      <button id="exitReader" style="
        position:fixed;top:20px;right:20px;
        background:#1a1a1a;color:white;
        border:none;padding:8px 16px;
        border-radius:20px;cursor:pointer;
        font-size:13px;font-family:sans-serif;
        z-index:9999;
      ">✕ Exit Reader</button>
      <h1 style="font-size:28px;line-height:1.3;margin-bottom:32px;font-family:Georgia,serif;">
        ${document.title}
      </h1>
      ${paragraphs}
    </div>
  `;

  document.body.style.cssText = 'background:white;margin:0;padding:0;';

  document.getElementById('exitReader').addEventListener('click', deactivateReader);
}

function deactivateReader() {
  readerActive = false;
  if (savedHTML) {
    document.body.innerHTML = savedHTML;
    document.body.setAttribute('style', savedStyles);
    savedHTML = null;
  }
}