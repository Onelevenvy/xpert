import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { isNil } from '@metad/ocap-core'
import { TenantService } from '../../../../@core'

interface ItemData {
  id?: string
  name: string
  value: any
}

@Component({
  selector: 'pac-tenant-settings',
  templateUrl: 'settings.component.html',
  styles: [':host {display: block; width: 100%; padding: 1rem;}']
})
export class SettingsComponent implements OnInit {
  i = 0
  editCache: { [key: string]: { edit: boolean; data: ItemData } } = {}

  listOfData: ItemData[] = []
  constructor(private readonly tenantService: TenantService, private readonly _cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    const settings = await this.tenantService.getSettings()
    Object.keys(settings)
      .filter((name) => !isNil(settings[name]))
      .forEach((name) => {
        this.add({ name, value: settings[name] })
      })
    this._cdr.detectChanges()
  }

  add(item?: ItemData) {
    this.listOfData = [
      ...this.listOfData,
      {
        id: `${++this.i}`,
        name: item?.name || '',
        value: item?.value || ''
      }
    ]
    this.updateEditCache()
  }

  startEdit(id: string): void {
    this.editCache[id].edit = true
  }

  cancelEdit(id: string): void {
    const index = this.listOfData.findIndex((item) => item.id === id)
    this.editCache[id] = {
      data: { ...this.listOfData[index] },
      edit: false
    }
  }

  async saveEdit(id: string) {
    const index = this.listOfData.findIndex((item) => item.id === id)
    Object.assign(this.listOfData[index], this.editCache[id].data)
    this.editCache[id].edit = false

    await this.tenantService.saveSettings({
      [this.editCache[id].data.name]: this.editCache[id].data.value
    })
  }

  async deleteRow(id: string) {
    const index = this.listOfData.findIndex((item) => item.id === id)
    await this.tenantService.saveSettings({ [this.listOfData[index].name]: null })
    this.listOfData.splice(index, 1)
    this.listOfData = [...this.listOfData]
    this._cdr.detectChanges()
  }

  updateEditCache(): void {
    this.listOfData.forEach((item) => {
      this.editCache[item.id] = {
        edit: false,
        data: { ...item }
      }
    })
  }
}
