const puppeteer = require('puppeteer');
const axios     = require('axios');

const GITHUB_TOKEN    = process.env.GITHUB_TOKEN;
const GITHUB_REPO     = 'iffardamahum/heuh-assets';
const GITHUB_BRANCH   = 'main';
const GITHUB_API_BASE = 'https://api.github.com';

// ── HTML template — clean GitHub-style diff ───────────────────────────────────
const buildDiffHtml = (diffLines, meta = {}) => {
    const { filename = '', additions = 0, deletions = 0 } = meta;

    const rows = diffLines.map((line) => {
        const isAdd = line.type === 'addition';
        const isDel = line.type === 'deletion';

        const rowBg     = isAdd ? '#e6ffec' : isDel ? '#ffebe9' : '#ffffff';
        const gutterBg  = isAdd ? '#ccffd8' : isDel ? '#ffd7d5' : '#f6f8fa';
        const textColor = isAdd ? '#1a7f37' : isDel ? '#cf222e' : '#24292f';
        const prefix    = isAdd ? '+' : isDel ? '-' : ' ';
        const lineNum   = line.lineNumber != null ? String(line.lineNumber) : '';

        const escaped = String(line.text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return `
        <tr style="background:${rowBg}; line-height:1.6">
            <td style="
                padding: 2px 12px 2px 8px;
                min-width: 36px;
                text-align: right;
                color: #8c959f;
                font-size: 13px;
                background: ${gutterBg};
                user-select: none;
                border-right: 1px solid #d0d7de;
                font-family: 'SFMono-Regular', Consolas, monospace;
            ">${lineNum}</td>
            <td style="
                padding: 2px 10px 2px 6px;
                width: 18px;
                text-align: center;
                color: ${textColor};
                font-size: 13px;
                font-weight: 600;
                background: ${gutterBg};
                border-right: 1px solid #d0d7de;
                font-family: 'SFMono-Regular', Consolas, monospace;
            ">${prefix}</td>
            <td style="
                padding: 2px 16px;
                font-size: 13px;
                color: ${textColor};
                white-space: pre;
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                width: 100%;
                letter-spacing: 0;
            ">${escaped}</td>
        </tr>`;
    }).join('');

    const addBadge = `<span style="
        background:#dafbe1; color:#1a7f37;
        font-weight:700; font-size:12px;
        padding: 2px 8px; border-radius:20px;
        border: 1px solid #1a7f3740;
    ">+${additions}</span>`;

    const delBadge = `<span style="
        background:#ffebe9; color:#cf222e;
        font-weight:700; font-size:12px;
        padding: 2px 8px; border-radius:20px;
        border: 1px solid #cf222e40;
        margin-left:6px;
    ">-${deletions}</span>`;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    width: 680px;
    padding: 0;
  }
  .card {
    border: 1px solid #d0d7de;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .file-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: #f6f8fa;
    border-bottom: 1px solid #d0d7de;
  }
  .filename {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 13px;
    font-weight: 600;
    color: #24292f;
  }
  table { width:100%; border-collapse:collapse; table-layout:fixed; }
  td { vertical-align:top; }
</style>
</head>
<body>
<div class="card">
  <div class="file-header">
    <span class="filename">${filename || 'code changes'}</span>
    <span>${addBadge}${delBadge}</span>
  </div>
  <table><tbody>${rows}</tbody></table>
</div>
</body>
</html>`;
};

// ── Screenshot → PNG buffer ───────────────────────────────────────────────────
const screenshotDiff = async (html) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 700, height: 600, deviceScaleFactor: 2.5 }); // retina-quality
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const height = await page.evaluate(() => document.body.scrollHeight);
        await page.setViewport({ width: 700, height: height + 24, deviceScaleFactor: 2.5 });

        return await page.screenshot({ type: 'png', fullPage: true });
    } finally {
        await browser.close();
    }
};

// ── Upload to GitHub → public URL ─────────────────────────────────────────────
const uploadToGitHub = async (pngBuffer, filename, githubToken) => {
    const base64Content = pngBuffer.toString('base64');
    const filePath      = `diff-previews/${filename}`;
    const apiUrl        = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`;
    const token         = githubToken || process.env.GITHUB_TOKEN;

    if (!token) throw new Error('GitHub Token not found for upload');

    let sha;
    try {
        const existing = await axios.get(apiUrl, {
            headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
        });
        sha = existing.data.sha;
    } catch { /* file doesn't exist yet */ }

    await axios.put(apiUrl, {
        message: `chore: diff preview ${filename}`,
        content: base64Content,
        branch:  GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
    }, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
    });

    return `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}?t=${Date.now()}`;
};

// ── Public ────────────────────────────────────────────────────────────────────
/**
 * @param {Array}  diffLines  [{ type: 'addition'|'deletion'|'context', text, lineNumber? }]
 * @param {Object} meta       { filename, additions, deletions, prNumber, repoName }
 * @param {String} githubToken Optional token from DB
 * @returns {Promise<string|null>} Public image URL
 */
const generateDiffImage = async (diffLines = [], meta = {}, githubToken) => {
    if (!diffLines.length) return null;
    const html      = buildDiffHtml(diffLines, meta);
    const png       = await screenshotDiff(html);
    const safeName  = (meta.repoName ?? 'repo').replace(/[^a-z0-9]/gi, '-');
    const filename  = `${safeName}-pr${meta.prNumber ?? 0}-${Date.now()}.png`;
    const url       = await uploadToGitHub(png, filename, githubToken);
    console.log(`✅ Diff image uploaded: ${url}`);
    return url;
};

module.exports = { generateDiffImage };