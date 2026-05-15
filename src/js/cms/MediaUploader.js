import { Component } from 'veda-client';

export default class MediaUploader extends Component(HTMLElement) {
  static tag = 'cms-media-uploader';

  constructor () {
    super();
    this.state.files = [];
    this.state.uploading = false;
    this.state.message = null;
  }

  // post() runs after every render — DOM is guaranteed to exist here
  post () {
    const zone = this.querySelector('.media-uploader');
    if (!zone) return;
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('media-uploader--drag-over');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('media-uploader--drag-over');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('media-uploader--drag-over');
      this.uploadFiles(e.dataTransfer.files);
    });
  }

  openFilePicker () {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,.pdf,.doc,.docx,.zip';
    input.onchange = (e) => this.uploadFiles(e.target.files);
    input.click();
  }

  async uploadFiles (fileList) {
    if (!fileList?.length) return;
    this.state.uploading = true;
    this.state.message = null;
    await this.update();

    const results = [];
    for (const file of fileList) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/files', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const uri = data.uri ?? data.id;
        results.push({ name: file.name, uri, url: `/files/${uri}` });
      } catch (e) {
        results.push({ name: file.name, error: e.message });
      }
    }

    this.state.files = [...this.state.files, ...results.filter((r) => !r.error)];
    const errors = results.filter((r) => r.error);
    this.state.message = errors.length
      ? { type: 'error', text: `Ошибка загрузки: ${errors.map((e) => e.name).join(', ')}` }
      : { type: 'success', text: `Загружено: ${results.length} файл(ов)` };
    this.state.uploading = false;
    await this.update();
  }

  // onclick="{copyUri}" — reads uri from data-uri
  copyUri (e) {
    const el = e.target.closest('[data-uri]');
    if (!el) return;
    const uri = el.dataset.uri;
    navigator.clipboard.writeText(uri).then(() => {
      this.state.message = { type: 'success', text: `Скопировано: ${uri}` };
      this.update();
    });
  }

  render () {
    const s = this.state;
    const msgHtml = s.message
      ? `<div class="alert alert-${s.message.type}">${s.message.text}</div>`
      : '';

    const fileItems = s.files.map((f) => `
      <div class="media-item" data-uri="${f.uri}" onclick="{copyUri}"
           title="Нажмите чтобы скопировать URI">
        ${/\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f.url || '')
          ? `<img src="${f.url}" alt="${f.name}">`
          : `<div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:2rem">📄</div>`
        }
        <div class="media-item__name">${f.name}</div>
      </div>
    `).join('');

    return `
      <div>
        <h2>Медиафайлы</h2>
        <p class="text-muted" style="margin:.5rem 0 1.5rem">
          Загружайте файлы и копируйте URI для вставки в Markdown статьи.
        </p>

        ${msgHtml}

        <div class="media-uploader" onclick="{openFilePicker}">
          <div class="media-uploader__icon">📁</div>
          ${s.uploading
            ? '<p>Загружаю...</p>'
            : '<p>Перетащите файлы сюда или нажмите для выбора</p>'
          }
        </div>

        ${fileItems ? `<div class="media-list">${fileItems}</div>` : ''}
      </div>
    `;
  }
}
