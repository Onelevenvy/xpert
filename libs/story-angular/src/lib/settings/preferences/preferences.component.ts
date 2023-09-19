import { ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { FormlyFormOptions } from '@ngx-formly/core'
import { TranslateService } from '@ngx-translate/core'
import { ConfirmCodeEditorComponent } from '@metad/components/editor'
import { cloneDeep } from 'lodash-es'
import { firstValueFrom } from 'rxjs'
import { PreferencesSchema } from './schema'
import { pick } from '@metad/ocap-core'

@Component({
  selector: 'ngm-settings-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent implements OnInit {
  
  private readonly _dialog = inject(MatDialog)
  private readonly _cdr = inject(ChangeDetectorRef)

  menus = [
    {
      link: 'general',
      label: 'General'
    },
  ]
  activeLink = ''
  schemas = []
  private _preferencesSchema: any

  preferences: any = {}

  echartsTheme: any
  constructor(
    private translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef?: MatDialogRef<PreferencesComponent>
  ) {}

  ngOnInit() {
    this.echartsTheme = cloneDeep(this.data.echartsTheme)
    this.preferences = cloneDeep(this.data.preferences)

    this.translateService.get('Story').subscribe((CSS) => {
      this._preferencesSchema = (<any>PreferencesSchema(CSS).pop()).fieldGroup
      this.menus = this._preferencesSchema.map((item) => ({
        link: item.key,
        label: item.props.label,
      }))

      if (!this.activeLink) {
        this.onActive(this.menus[0])
        this._cdr.detectChanges()
      }
    })
  }

  onActive(menu) {
    const model = cloneDeep(pick(this.preferences, menu.link)) ?? {}
    model[menu.link] = model[menu.link] || {}
    this.activeLink = menu.link
    this.schemas = [
      {
        key: menu.link,
        fields: this._preferencesSchema.filter((item) => item.key === menu.link),
        model,
        options: {} as FormlyFormOptions,
        form: new FormGroup({})
      }
    ]
  }

  onApply() {
    this.dialogRef.close({
      preferences: this.preferences,
      echartsTheme: this.echartsTheme
    })
  }

  onModelChange(key: string, event) {
    this.preferences = {
      ...this.preferences,
      ...event
    }
  }

  reset() {
    // this.model = cloneDeep(this.data)
    // this.form.reset()
  }

  async openThemeEditor() {
    const result = await firstValueFrom(
      this._dialog
        .open(ConfirmCodeEditorComponent, {
          panelClass: 'large',
          data: {
            language: 'json',
            model: this.echartsTheme
          }
        })
        .afterClosed()
    )
    if (result) {
      this.echartsTheme = result
    }
  }
}
