import { CommonModule } from '@angular/common'
import { Component, Input, OnInit, forwardRef } from '@angular/core'
import { ControlValueAccessor, FormControl, ReactiveFormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips'
import { ThemePalette } from '@angular/material/core'
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { distinctUntilChanged } from 'rxjs'

@Component({
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatFormFieldModule, MatIconModule, ReactiveFormsModule],
  selector: 'pac-form-field-emails',
  templateUrl: 'emails.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => FormFieldEmailsComponent),
    }
  ]
})
export class FormFieldEmailsComponent implements ControlValueAccessor, OnInit {
  
  @Input() appearance: MatFormFieldAppearance
  @Input() label: string
  @Input() placeholder: string
  @Input() color: ThemePalette = undefined
  @Input() removable: boolean

  addOnBlur = true
  keywords = new Set([])
  formControl = new FormControl([])
  _onChange: (value: string[]) => void

  ngOnInit(): void {
    this.formControl.valueChanges.pipe(distinctUntilChanged()).subscribe((value) => {
      this._onChange?.(value)
    })
  }

  writeValue(obj: any): void {
    if (obj) {
      this.formControl.setValue(obj)
    }
  }
  registerOnChange(fn: any): void {
    this._onChange = fn
  }
  registerOnTouched(fn: any): void {
  }
  setDisabledState?(isDisabled: boolean): void {
  }

  addKeywordFromInput(event: MatChipInputEvent) {
    if (event.value) {
      this.keywords.add(event.value)
      event.chipInput!.clear()
      this.formControl.setValue(Array.from(this.keywords))
    }
  }

  removeKeyword(keyword: string) {
    this.keywords.delete(keyword)
    this.formControl.setValue(Array.from(this.keywords))
  }
}
