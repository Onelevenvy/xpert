import { CommonModule } from '@angular/common'
import { Component, input } from '@angular/core'
import { NgmDensityDirective } from '@metad/ocap-angular/core'
import { IUser } from '../../../@core'
import { UserPipe } from '../../pipes'

@Component({
  standalone: true,
  selector: 'pac-user-profile-inline',
  templateUrl: 'profile.component.html',
  styleUrls: ['profile.component.scss'],
  imports: [ CommonModule, UserPipe ],
  host: {
    class: 'pac-user-profile-inline'
  },
  hostDirectives: [
    {
      directive: NgmDensityDirective,
      inputs: ['small', 'large']
    }
  ],
})
export class UserProfileInlineComponent {
  readonly user = input<IUser>()
}
