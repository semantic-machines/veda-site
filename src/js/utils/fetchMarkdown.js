/** In-flight and resolved markdown file text by URL (avoids duplicate fetches). */
const textByUrl = new Map();

/**
 * @param {string} fileUrl
 * @returns {Promise<string>}
 */
export async function fetchMarkdownText (fileUrl) {
  let pending = textByUrl.get(fileUrl);
  if (!pending) {
    pending = fetch(fileUrl).then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    });
    textByUrl.set(fileUrl, pending);
  }
  return pending;
}
