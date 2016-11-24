import { ipcRenderer } from 'electron'
import { MenuIDs } from '../main-process/menu'
import { v4 as guid } from 'node-uuid'
import { IHTTPRequest, IHTTPResponse } from '../lib/http'

/** Show the app menu as a popup. */
export function showPopupAppMenu() {
  ipcRenderer.send('show-popup-app-menu')
}

/** Set the menu item's enabledness. */
export function setMenuEnabled(id: MenuIDs, enabled: boolean) {
  ipcRenderer.send('set-menu-enabled', { id, enabled })
}

/** Set the menu item's visibility. */
export function setMenuVisible(id: MenuIDs, visible: boolean) {
  ipcRenderer.send('set-menu-visible', { id, visible })
}

/** Tell the main process that the renderer is ready. */
export function sendReady(time: number) {
  ipcRenderer.send('renderer-ready', time)
}

export interface IMenuItem {
  readonly label: string
  readonly action: () => void
}

/** Show the given menu items in a contextual menu. */
export function showContextualMenu(items: ReadonlyArray<IMenuItem>) {
  ipcRenderer.once('contextual-menu-action', (event: Electron.IpcRendererEvent, index: number) => {
    const item = items[index]
    item.action()
  })

  ipcRenderer.send('show-contextual-menu', items)
}

export function proxyRequest(options: IHTTPRequest): Promise<IHTTPResponse> {
  return new Promise<IHTTPResponse>((resolve, reject) => {
    const id = guid()

    ipcRenderer.once(`proxy/response/${id}`, (event: any, { error, response }: { error: Error | undefined, response: IHTTPResponse | undefined }) => {
      // TODO: what error handling do we need to introduce here?

      if (error) {
        reject(error)
        return
      }

      if (response === undefined) {
        reject('no response received, and no error reported. should probably look into this')
        return
      }

      resolve(response)
    })

    const body: string | undefined = options.body
      ? JSON.stringify(options.body)
      : undefined

    ipcRenderer.send('proxy/request', { id, options, body })
  })
}
