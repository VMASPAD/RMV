import { ElectronAPI } from '@electron-toolkit/preload'
interface api{
}
declare global {
  interface Window {
    electron: ElectronAPI
    api: api
  }
}
