'use client'
import React, { useState, useEffect } from 'react'

async function iniciarCapturaAudio(setNivel) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()

    // Configuración del analizador
    analyser.fftSize = 256 // Resolución del análisis
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    source.connect(analyser)

    const actualizarNivel = () => {
      analyser.getByteFrequencyData(dataArray)
      const volumen = dataArray.reduce((a, b) => a + b) / dataArray.length
      setNivel(volumen) // Actualiza el estado React
      requestAnimationFrame(actualizarNivel)
    }

    actualizarNivel()
  } catch (error) {
    console.error('Error al capturar audio:', error)
  }
}

function Ecualizer() {
  const [nivel, setNivel] = useState(0)

  useEffect(() => {
    iniciarCapturaAudio(setNivel)
  }, [])

  const calcularColor = (volumen) => {
    if (volumen < 50) return 'green'
    if (volumen < 150) return 'yellow'
    if (volumen < 200) return 'red'
    return 'red'
  }

  return (
    <div className='w-5 h-full border-black border-solid border-2'>
      <div
        style={{
          backgroundColor: calcularColor(nivel),
          height: `${nivel}%`,
          transition: 'height 0.01s, background-color 0.01s'
        }}
      />
    </div>
  )
}

export default Ecualizer
