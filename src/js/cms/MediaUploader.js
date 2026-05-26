import { Component, html } from 'veda-client';

export default class MediaUploader extends Component(HTMLElement) {
  static tag = 'cms-media-uploader';

  constructor () {
    super();
    this.state.files = [];
    this.state.uploading = false;
    this.state.message = null;
  }

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
    input.accept = 'image/*,video/*,.pdf,.doc,.docx,.zip,.svg';
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
        results.push({
          name: file.name,
          uri,
          url: `/files/${uri}`,
          isImage: /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(file.name),
        });
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
    return html`
      <div>
        <h2>Медиафайлы</h2>
        <p class="text-muted" style="margin:.5rem 0 1.5rem">
          Загружайте файлы и копируйте URI для вставки в контент.
        </p>
        <veda-if condition="{state.message}">
          <div class="alert alert-{state.message.type}">{state.message.text}</div>
        </veda-if>
        <div class="media-uploader" onclick="{openFilePicker}">
          <div class="media-uploader__icon">📁</div>
          <veda-if condition="{state.uploading}"><p>Загружаю...</p></veda-if>
          <veda-if condition="{!state.uploading}">
            <p>Перетащите файлы сюда или нажмите для выбора</p>
          </veda-if>
        </div>
        <veda-if condition="{state.files.length}">
          <div class="media-list">
            <veda-loop items="{state.files}" as="f" key="uri">
              <div class="media-item" data-uri="{f.uri}" onclick="{copyUri}"
                   title="Нажмите чтобы скопировать URI">
                <veda-if condition="{f.isImage}">
                  <img src="{f.url}" alt="{f.name}">
                </veda-if>
                <veda-if condition="{!f.isImage}">
                  <div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:2rem">📄</div>
                </veda-if>
                <div class="media-item__name">{f.name}</div>
              </div>
            </veda-loop>
          </div>
        </veda-if>
      </div>
    `;
  }
}
