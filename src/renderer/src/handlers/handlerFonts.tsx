import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../../components/ui/dialog'
import { Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../components/ui/table'
import { useState } from 'react'
import { DesktopCapturerSource } from 'electron'
type Source = {
  id: string
  name: string
  thumbnail: string
  icon: string
}
function HandlerFonts({sourceId}): JSX.Element {
  const [sources, setSources] = useState<Source[]>([])
  const getSources = async () => {
    try {
      const fetchedSources = await window.electron.ipcRenderer.invoke('GET_SOURCES')
      setSources(
        fetchedSources.map((source: DesktopCapturerSource) => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL(),
          icon: source.appIcon
        }))
      )
    } catch (error) {
      console.error('Error al obtener fuentes:', error)
    }
    console.log(sources)
  }
  const handleEnviar = (id) => {
    sourceId(id); // Envía un dato al padre
    console.log(id);
  };
  return (
    <Dialog>
      <DialogTrigger>
        <Plus onClick={getSources} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fuentes</DialogTitle>
          <DialogDescription>
            <Table>
              <TableCaption>A list of your recent invoices.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Name</TableHead>
                  <TableHead>Id</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id} className='cursor-pointer' onClick={() => handleEnviar(source.id)}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>{source.id}</TableCell>
                    <TableCell>
                      <img src={source.thumbnail} alt={source.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default HandlerFonts
