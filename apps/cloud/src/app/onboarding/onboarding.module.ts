import { NgModule } from '@angular/core'
import { MatBottomSheetModule } from '@angular/material/bottom-sheet'
import { FormlyModule } from '@ngx-formly/core'
import { FormlyMaterialModule } from '@ngx-formly/material'
import { ServerAgent } from '../@core'
import { OnboardingRoutingModule } from './onboarding-routing.module'
import { OnboardingComponent } from './onboarding.component'

@NgModule({
  imports: [OnboardingRoutingModule, FormlyModule.forRoot(), FormlyMaterialModule, MatBottomSheetModule],
  declarations: [OnboardingComponent],
  providers: [ServerAgent]
})
export class OnboardingModule {}
