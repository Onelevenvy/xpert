import { DragDropModule } from '@angular/cdk/drag-drop'
import { CommonModule } from '@angular/common'
import { Component, effect, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { EditorThemeMap } from '@metad/components/editor'
import { ButtonGroupDirective, NgmThemeService, ThemesEnum } from '@metad/ocap-angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { MonacoEditorModule } from 'ngx-monaco-editor'


@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TranslateModule,
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MonacoEditorModule,
    ButtonGroupDirective
  ],
  selector: 'ngm-theme-builder',
  templateUrl: './theme-builder.component.html',
  styleUrls: ['./theme-builder.component.scss']
})
export class ThemeBuilderComponent {

  public readonly data = inject(MAT_DIALOG_DATA)
  readonly themeService = inject(NgmThemeService)

  c_light = ThemesEnum.light
  c_dark = ThemesEnum.dark
  // c_thin = 'thin'

  activeLink = ThemesEnum.light

  editorOptions = { theme: 'vs', language: 'json' }
  statement = ''
  themes = {}
  error = ''

  constructor() {
    effect(() => {
      this.editorOptions = {
        ...this.editorOptions,
        theme: EditorThemeMap[this.themeService.themeClass()]
      }
    })
    
    this.themes = {...this.data}
    
    this.onActive(this.activeLink)
  }

  onActive(link: ThemesEnum) {
    this.activeLink = link
    if (this.themes[link]) {
      try {
        this.statement = JSON.stringify(this.themes[link])
      } catch (err) {
        this.statement = ''
      }
    } else {
      this.statement = ''
    }
  }

  onStatementChange(result: string) {
    this.error = ''
    if (result.trim()) {
      try {
        this.themes[this.activeLink] = JSON.parse(result)
      } catch (err: any) {
        this.error = err.message
      }
    } else {
      this.themes[this.activeLink] = null
    }
  }
}
