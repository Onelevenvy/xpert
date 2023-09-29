import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatRadioModule } from '@angular/material/radio'
import { NgmColorsComponent } from '@metad/components/form-field'
import { DensityDirective } from '@metad/ocap-angular/core'
import { FormlyModule } from '@ngx-formly/core'
import { TranslateModule } from '@ngx-translate/core'
import { NgmFormlyChartPropertyComponent } from './property-select.component'
import { NgmChartPropertyComponent } from '../chart-property/chart-property.component'

@NgModule({
  declarations: [NgmFormlyChartPropertyComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatRadioModule,
    MatCheckboxModule,
    TranslateModule,

    DensityDirective,
    NgmColorsComponent,
    NgmChartPropertyComponent,

    FormlyModule.forChild({
      types: [
        {
          name: 'chart-property',
          component: NgmFormlyChartPropertyComponent
        }
      ]
    })
  ],
  exports: [NgmFormlyChartPropertyComponent]
})
export class NgmFormlyChartPropertModule {}
