import { CommonModule } from '@angular/common'
import { Component, inject, input, signal } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { TXpertParameter } from '../../../@core'
import { XpertParametersFormComponent } from '../parameters-form/parameters.component'
import { NgxControlValueAccessor } from 'ngxtension/control-value-accessor'
import { FormsModule } from '@angular/forms'

@Component({
  standalone: true,
  selector: 'xpert-parameters-card',
  templateUrl: './parameters.component.html',
  styleUrl: 'parameters.component.scss',
  imports: [CommonModule, FormsModule, TranslateModule, XpertParametersFormComponent],
  hostDirectives: [ NgxControlValueAccessor ]
})
export class XpertParametersCardComponent {

  public cva = inject<NgxControlValueAccessor<Partial<Record<string, unknown>> | null>>(NgxControlValueAccessor)
  readonly value = this.cva.value$

  readonly parameters = input<TXpertParameter[]>()

  readonly paramsExpanded = signal(false)

  toggleParams() {
    this.paramsExpanded.update((state) => !state)
  }
}
