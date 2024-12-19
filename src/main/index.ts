import { app, shell, BrowserWindow, ipcMain, desktopCapturer, dialog } from 'electron'
import { join } from 'path'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static' // Ruta al binario de FFmpeg
import * as fs from 'fs'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('GET_SOURCES', async () => {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] })
    return sources
  })

  ipcMain.handle('SAVE_VIDEO', async (event, buffer: ArrayBuffer) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: 'grabacion.webm',
        filters: [{ name: 'Videos WebM', extensions: ['webm'] }],
        buttonLabel: 'Save video'
      })

      if (canceled || !filePath) return false

      await fs.promises.writeFile(filePath, Buffer.from(buffer))
      return filePath // Devuelve la ruta del archivo WebM
    } catch (error) {
      console.error('Error al guardar el video:', error)
      throw error
    }
  })

  ipcMain.handle('CONVERT_TO_MP4', async (event, webmPath: string) => {
    try {
      const outputPath = `${webmPath.replace('.webm', '')}.mp4`

      return await new Promise<string>((resolve, reject) => {
        ffmpeg(webmPath)
          .setFfmpegPath(ffmpegPath as string) // Configura FFmpeg estático
          .output(outputPath)
          .videoCodec('libx264') // Codec de video
          .audioCodec('aac') // Codec de audio
          .outputOptions(['-movflags +faststart']) // Optimiza para streaming
          .on('end', () => resolve(outputPath))
          .on('error', (err) => reject(err))
          .run()
      })
    } catch (error) {
      console.error('Error al convertir a MP4:', error)
      throw error
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
