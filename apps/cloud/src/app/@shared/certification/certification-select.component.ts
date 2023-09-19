import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { NgmSelectComponent } from '@metad/ocap-angular/common'
import { ButtonGroupDirective, DensityDirective } from '@metad/ocap-angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { map } from 'rxjs/operators'
import { CertificationService } from '../../@core'
import { MaterialModule } from '../material.module'

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    TranslateModule,
    NgmSelectComponent,
    ButtonGroupDirective,
    DensityDirective
  ],
  selector: 'pac-certification-select',
  templateUrl: 'certification-select.component.html',
  styleUrls: ['certification-select.component.scss']
})
export class CertificationSelectComponent {
  private readonly certificationService = inject(CertificationService)

  certificationId: string | null = null

  public readonly certifications$ = this.certificationService
    .getAll()
    .pipe(
      map((certifications) =>
        certifications.map((certification) => ({ label: certification.name, value: certification.id }))
      )
    )
}
