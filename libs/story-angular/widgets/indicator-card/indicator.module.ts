import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { TranslateModule } from '@ngx-translate/core'
import { PlaceholderAddComponent } from '@metad/story/story'
import { NgxEchartsModule } from 'ngx-echarts'
import { IndicatorCardComponent } from './indicator.component'

@NgModule({
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
    NgxEchartsModule,
    PlaceholderAddComponent
  ],
  exports: [IndicatorCardComponent],
  declarations: [IndicatorCardComponent],
  providers: []
})
export class AccountingIndicatorCardModule {}
