import React, { useState, useRef } from 'react'
import { DesktopCapturerSource } from 'electron'
import { Button } from '../../components/ui/button'
import { ScrollArea, ScrollBar } from '../../components/ui/scroll-area'
import { Plus } from 'lucide-react'
import HandlerFonts from './handlers/handlerFonts'
import Ecualizer from './components/Ecualizer'
import Footer from './components/Footer'

const App: React.FC = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [mp4Path, setMp4Path] = useState<string | null>(null) // Ruta del archivo MP4 generado
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [idCapture, setIdCapture] = useState('')

  const getCaptureId = (id) => {
    setIdCapture(id) // Actualiza el estado con el dato recibido del hijo
    console.log(idCapture)
  }
  const startRecording = async (sourceId: string) => {
    console.log(sourceId)
    try {
      chunksRef.current = []
      setRecordedChunks([])
      setIsRecording(true)

      const stream = await (navigator.mediaDevices as any).getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080
          }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 25000000
      })

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
          setRecordedChunks((prev) => [...prev, event.data])
        }
      }

      recorder.onstop = async () => {
        try {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, {
              type: 'video/webm;codecs=vp8,opus'
            })

            const buffer = await blob.arrayBuffer()
            const webmPath = await window.electron.ipcRenderer.invoke('SAVE_VIDEO', buffer)

            if (webmPath) {
              console.log('Archivo WebM guardado en:', webmPath)

              // Convierte el archivo a MP4
              const convertedMp4Path = await window.electron.ipcRenderer.invoke(
                'CONVERT_TO_MP4',
                webmPath
              )
              setMp4Path(convertedMp4Path)

              console.log('Archivo MP4 guardado en:', convertedMp4Path)
            } else {
              console.log('El usuario canceló el guardado')
            }
          } else {
            console.error('No hay chunks para guardar')
          }
        } catch (error) {
          console.error('Error durante el guardado/conversión:', error)
        } finally {
          chunksRef.current = []
          setRecordedChunks([])
          setIsRecording(false)
        }
      }

      setMediaRecorder(recorder)
      recorder.start(1000)
    } catch (error) {
      console.error('Error al iniciar la grabación:', error)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder?.state !== 'inactive') {
      mediaRecorder?.stop()
      mediaRecorder?.requestData()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  return (
    <div className="grid grid-rows-2">
      <video ref={videoRef} className="w-full max-h-[500px] bg-black" autoPlay muted />
      <div className="space-y-4">

        <div className="mt-4">
          <p>Estado de la grabación: {isRecording ? 'Grabando' : 'Detenido'}</p>
          <p>Chunks grabados: {recordedChunks.length}</p>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="w-auto h-auto bg-blue-500 border-2 border-red-500">Escenas</div>
          <div className="w-auto h-auto bg-blue-500 border-2 border-red-500 grid grid-rows-2 h-96">
            <ScrollArea className="">
              <ScrollBar orientation="vertical" />
            </ScrollArea>
            <div className="flex items-end">
              <HandlerFonts sourceId={getCaptureId} />
            </div>
          </div>
          <div className="w-auto h-auto bg-blue-500 border-2 border-red-500">Transicones</div>
          <div className="w-auto h-auto bg-blue-500 border-2 border-red-500">
            Ecualizadores
            <Ecualizer />
          </div>
          <div className="w-auto h-auto bg-blue-500 border-2 border-red-500 flex flex-col justify-center gap-5">
            <Button onClick={() => startRecording(idCapture)}>Iniciar Grabacion</Button>

            <Button
              onClick={stopRecording}
              disabled={!isRecording}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
            >
              Detener Grabación
            </Button>
            <Button>Ajustes</Button>
            <Button>Directo</Button>
            <Button>Salir</Button>
          </div>
        </div>
        <div>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default App
