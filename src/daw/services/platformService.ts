
import type { DesktopWindowState, DirectoryScanRequest, FileData, ScannedFileEntry } from '../types.ts';
import { desktopRuntimeService } from './desktopRuntimeService.ts';

export interface ProjectBlobFile {
  blob: Blob;
  filename: string;
}

export interface ProjectFileSaveResult {
  success: boolean;
  filePath?: string;
}

class PlatformService {
  public isDesktop: boolean;
  public isElectron: boolean;
  public isNativeWindows: boolean;
  public platform: string;

  private toArrayBuffer(data: unknown): ArrayBuffer | null {
    if (!data) return null;

    if (data instanceof ArrayBuffer) {
        return data;
    }

    if (ArrayBuffer.isView(data)) {
      const view = data as Uint8Array;
      return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as any;
    }

    if (typeof data === 'object') {
      const candidate = data as { type?: unknown; data?: unknown };
      if (candidate.type === 'Buffer' && Array.isArray(candidate.data)) {
        return new Uint8Array(candidate.data).buffer;
      }

      const anyData = data as any;
      
      // Handle cross-context Uint8Array where prototypes are lost
      if (typeof anyData.byteLength === 'number') {
          if (anyData.buffer && typeof anyData.buffer.slice === 'function') {
              return anyData.buffer.slice(anyData.byteOffset || 0, (anyData.byteOffset || 0) + anyData.byteLength) as any;
          }
          
          // Electron sometimes sends a Uint8Array proxy that acts like an array
          const len = anyData.byteLength;
          const u8 = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
              u8[i] = anyData[i];
          }
          return u8.buffer;
      }
    }

    console.warn("Failed to convert IPC data to ArrayBuffer. Type is:", typeof data);
    return null;
  }

  private projectFileName(name: string): string {
    const safeName = name.replace(/[^a-z0-9\s-_]/gi, '').trim() || 'untitled';
    return `${safeName}.esp`;
  }

  private downloadProjectBlob(blob: Blob, fileName: string): ProjectFileSaveResult {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body?.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return { success: true, filePath: fileName.replace(/\.esp$/i, '') };
  }

  constructor() {
    this.isDesktop = desktopRuntimeService.isDesktop;
    this.isElectron = desktopRuntimeService.isElectron;
    this.isNativeWindows = desktopRuntimeService.isNativeWindows;
    this.platform = desktopRuntimeService.platform;
  }

  // --- Window Management ---

  public minimize() {
    const host = desktopRuntimeService.api;
    if (host) {
      host.minimize();
    }
  }

  public maximize() {
    const host = desktopRuntimeService.api;
    if (host) {
      host.maximize();
    }
  }

  public close() {
    const host = desktopRuntimeService.api;
    if (host) {
      host.close();
    }
  }

  public async getWindowState(): Promise<DesktopWindowState | null> {
    const host = desktopRuntimeService.api;
    if (!host?.getWindowState) {
      return null;
    }

    try {
      return await host.getWindowState();
    } catch (error) {
      console.error('Unable to read window state', error);
      return null;
    }
  }

  public onWindowStateChange(callback: (state: DesktopWindowState) => void): (() => void) {
    const host = desktopRuntimeService.api;
    if (!host?.onWindowStateChange) {
      return () => undefined;
    }

    try {
      return host.onWindowStateChange(callback);
    } catch (error) {
      console.error('Unable to subscribe window state', error);
      return () => undefined;
    }
  }

  public async openEditor(request?: any): Promise<boolean> {
    const host = desktopRuntimeService.api;
    if (!host?.openEditor) {
      return false;
    }

    try {
      const result = await host.openEditor(request);
      return result.success;
    } catch (error) {
      console.error('Unable to open editor', error);
      return false;
    }
  }

  public async showHub(): Promise<boolean> {
    const host = desktopRuntimeService.api;
    if (!host?.showHub) {
      return false;
    }

    try {
      const result = await host.showHub();
      return result.success;
    } catch (error) {
      console.error('Unable to show hub', error);
      return false;
    }
  }

  public async openDesktopAuth(request?: any): Promise<any> {
    const host = desktopRuntimeService.api;
    if (!host?.openDesktopAuth) {
      return {
        success: false,
        error: 'Desktop auth bridge is only available inside Electron.',
      };
    }

    try {
      return await host.openDesktopAuth(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Unable to open desktop auth bridge', error);
      return { success: false, error: message };
    }
  }

  public async openExternalUrl(url: string): Promise<boolean> {
    const host = desktopRuntimeService.api;
    if (!host?.openExternalUrl) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }

    try {
      const result = await host.openExternalUrl(url);
      return result.success;
    } catch (error) {
      console.error('Unable to open external URL', error);
      return false;
    }
  }

  public onHubRefresh(callback: () => void): (() => void) {
    const host = desktopRuntimeService.api;
    if (!host?.onHubRefresh) {
      return () => undefined;
    }

    try {
      return host.onHubRefresh(callback);
    } catch (error) {
      console.error('Unable to subscribe hub refresh', error);
      return () => undefined;
    }
  }

  // --- File System ---

  public async selectAudioFiles(): Promise<FileData[] | null> {
    const host = desktopRuntimeService.api;
    if (host) {
      try {
        const files = await host.selectFiles();
        const normalized: FileData[] = [];

        files.forEach((file) => {
          const rawData: unknown = (file as FileData & { data: unknown }).data;
          const data = this.toArrayBuffer(rawData);

          if (!data) {
            console.warn(`Skipping file with unsupported binary payload: ${file.name}`);
            return;
          }

          normalized.push({
            name: file.name,
            path: file.path,
            data
          });
        });

        return normalized;
      } catch (error) {
        console.error("Desktop file selection failed", error);
        return [];
      }
    }
    return null;
  }

  public async readFileFromPath(filePath: string): Promise<FileData | null> {
    const targetPath = filePath.trim();
    if (!targetPath) return null;

    const host = desktopRuntimeService.api;
    if (!host?.readFileFromPath) {
      return null;
    }

    try {
      const file = await host.readFileFromPath(targetPath);
      if (!file) return null;

      const data = this.toArrayBuffer((file as FileData & { data: unknown }).data);
      if (!data) {
        console.warn(`Skipping direct file read with unsupported payload: ${targetPath}`);
        return null;
      }

      return {
        name: file.name,
        path: file.path,
        data
      };
    } catch (error) {
      console.error('Direct file read failed', error);
      return null;
    }
  }

  public async selectDirectory(): Promise<string | null> {
    const host = desktopRuntimeService.api;
    if (host?.selectDirectory) {
      try {
        return await host.selectDirectory();
      } catch (error) {
        console.error('Desktop folder selection failed', error);
        return null;
      }
    }

    return null;
  }

  public async scanDirectoryFiles(directory: string, extensions: string[]): Promise<ScannedFileEntry[]> {
    const host = desktopRuntimeService.api;
    if (host?.scanDirectoryFiles) {
      try {
        const payload: DirectoryScanRequest = { directory, extensions };
        const files = await host.scanDirectoryFiles(payload);
        if (!Array.isArray(files)) return [];

        return files
          .filter((file): file is ScannedFileEntry => {
            return Boolean(file && typeof file.name === 'string' && typeof file.path === 'string');
          })
          .map((file) => ({
            name: file.name,
            path: file.path,
            size: Number.isFinite(file.size) ? Number(file.size) : 0
          }));
      } catch (error) {
        console.error('Directory scan failed', error);
        return [];
      }
    }

    return [];
  }

  public async saveProject(data: string, name: string): Promise<ProjectFileSaveResult> {
    const fileName = this.projectFileName(name);

    const host = desktopRuntimeService.api;
    if (host) {
      return await host.saveProject(data, fileName);
    }

    return this.downloadProjectBlob(new Blob([data], { type: 'application/json' }), fileName);
  }

  public async saveProjectBlob(blob: Blob, name: string): Promise<ProjectFileSaveResult> {
    const fileName = this.projectFileName(name);
    const host = desktopRuntimeService.api;
    if (host?.saveProjectBinary) {
      return await host.saveProjectBinary(await blob.arrayBuffer(), fileName);
    }
    if (host && blob.type === 'application/json') {
      return await host.saveProject(await blob.text(), fileName);
    }

    // Browser download is also the safe fallback for a host that has not yet
    // exposed a binary project bridge; the ZIP bytes are never coerced to text.
    return this.downloadProjectBlob(blob, fileName);
  }

  public async openProjectBlob(): Promise<ProjectBlobFile | null> {
    const host = desktopRuntimeService.api;
    if (host?.openProjectBinary) {
      try {
        const result = await host.openProjectBinary();
        if (!result) return null;
        const data = this.toArrayBuffer(result.data);
        if (!data) throw new Error('El bridge devolvió un payload binario inválido.');
        return {
          blob: new Blob([data], { type: result.mimeType || 'application/octet-stream' }),
          filename: result.filename,
        };
      } catch (error) {
        console.error('Desktop binary project open failed', error);
        return null;
      }
    }
    if (host) {
      try {
        const legacy = await host.openProject();
        return legacy
          ? { blob: new Blob([legacy.text], { type: 'application/json' }), filename: legacy.filename }
          : null;
      } catch (error) {
        console.error('Desktop legacy project open failed', error);
        return null;
      }
    }

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.esp,application/zip,application/json';
      let resolved = false;

      input.onchange = async (event: Event) => {
        resolved = true;
        window.removeEventListener('focus', onFocusBack);
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          resolve({ blob: file, filename: file.name });
        } catch (err) {
          console.error('Error reading project file', err);
          alert('Error de lectura de disco.');
          resolve(null);
        }
      };

      // Detect cancel: when the file dialog closes without selection,
      // the window regains focus. We use a delayed focus check to resolve null.
      const onFocusBack = () => {
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }, 300);
        window.removeEventListener('focus', onFocusBack);
      };
      window.addEventListener('focus', onFocusBack);

      input.click();
    });
  }

  /** Legacy text API retained for old JSON-only callers. */
  public async openProjectFile(): Promise<{ text: string; filename: string } | null> {
    const result = await this.openProjectBlob();
    if (!result) return null;
    return { text: await result.blob.text(), filename: result.filename };
  }
}

export const platformService = new PlatformService();
