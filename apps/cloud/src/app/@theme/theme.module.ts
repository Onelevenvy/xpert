import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { DensityDirective } from '@metad/ocap-angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { MaterialModule } from '../@shared'
import { SidenavNavigatorComponent } from './header'
import { OrganizationSelectorComponent } from './header/organization-selector/organization-selector.component'

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    TranslateModule,
    DensityDirective,
    SidenavNavigatorComponent,
    OrganizationSelectorComponent
  ],
  exports: [OrganizationSelectorComponent, SidenavNavigatorComponent],
  declarations: [],
  providers: []
})
export class PACThemeModule {}
