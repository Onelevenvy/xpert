import { CommonModule } from '@angular/common'
import { ChangeDetectorRef, Component, inject } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { AppearanceDirective, ButtonGroupDirective, DensityDirective } from '@metad/ocap-angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { BehaviorSubject, combineLatest, firstValueFrom, map, switchMap } from 'rxjs'
import { ICertification, IProject, IUser, ProjectService, Store, ToastrService } from '../../../@core'
import {
  CertificationSelectComponent,
  UserProfileComponent,
  UserProfileInlineComponent,
  UserRoleSelectComponent,
  userLabel,
  TranslationBaseComponent
} from '../../../@shared'
import { InlineSearchComponent } from '../../../@shared/form-fields'
import { ProjectComponent } from '../project.component'
import { uniq } from 'lodash-es'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NgmTableComponent } from '@metad/ocap-angular/common'


@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    UserRoleSelectComponent,
    InlineSearchComponent,
    UserProfileComponent,
    UserProfileInlineComponent,
    ButtonGroupDirective,
    DensityDirective,
    AppearanceDirective,
    NgmTableComponent
  ],
  selector: 'pac-project-members',
  templateUrl: 'members.component.html',
  styles: [
    `
      :host {
        width: 100%;
        overflow: auto;
      }
      .rounded-full.mat-stroked-button {
        border-radius: 50%;
      }
    `
  ]
})
export class ProjectMembersComponent extends TranslationBaseComponent {
  userLabel = userLabel

  // Injectors
  private projectService = inject(ProjectService)
  private projectComponent = inject(ProjectComponent)
  private store = inject(Store)
  private _dialog = inject(MatDialog)
  private _cdr = inject(ChangeDetectorRef)
  private _toastrService = inject(ToastrService)

  searchControl = new FormControl()

  project: IProject
  members: { id: string; user: IUser; loading: boolean }[]
  certifications: ICertification[] = []
  get isOwner() {
    return this.store.user?.id === this.project?.ownerId
  }

  public readonly refresh$ = new BehaviorSubject<void>(null)

  // Subscribers
  private _projectDetailSub = combineLatest([this.refresh$, this.projectComponent.projectId$])
    .pipe(
      switchMap(([, projectId]) =>
        this.projectService.getOne(projectId ?? null, ['owner', 'members', 'certifications'])
      ),
      takeUntilDestroyed()
    )
    .subscribe((project) => {
      this.project = project
      this.members = project.members.map((user) => ({
        id: user.id,
        user,
        loading: false
      }))
      this.certifications = project.certifications
      this.projectComponent.updateCertifications(project.certifications)
      this._cdr.detectChanges()
    })

  private _searchSub = this.searchControl.valueChanges
    .pipe(
      map((text) => text?.trim().toLowerCase()),
      takeUntilDestroyed()
    )
    .subscribe((text) => {
      this.members = (
        text
          ? this.project.members.filter(
              (member) =>
                member.email?.toLowerCase().includes(text) ||
                member.fullName?.toLowerCase().includes(text) ||
                member.firstName?.toLowerCase().includes(text) ||
                member.lastName?.toLowerCase().includes(text)
            )
          : this.project.members
      ).map((user) => ({
        id: user.id,
        user,
        loading: false
      }))
    })

  async transferOwner() {
    const value = await firstValueFrom(
      this._dialog
        .open<UserRoleSelectComponent, any, { users: IUser[] }>(UserRoleSelectComponent, { data: { single: true } })
        .afterClosed()
    )
    const user = value?.users?.[0]
    if (user) {
      await firstValueFrom(this.projectService.update(this.project.id, { ownerId: user.id }))
      this.project.owner = user
      this.project.ownerId = user.id
      this._toastrService.success('PAC.Project.TransferOwnership', { Default: 'Transfer Ownership' })
    }
  }

  async openMemberSelect() {
    const value = await firstValueFrom(
      this._dialog.open<UserRoleSelectComponent, any, { users: IUser[] }>(UserRoleSelectComponent).afterClosed()
    )
    if (value) {
      this.addMembers(value.users.map(({ id }) => id))
    }
  }

  async addMembers(members: string[]) {
    if (this.project?.id) {
      await firstValueFrom(
        this.projectService.updateMembers(this.project.id, uniq([...members, ...this.members.map(({ id }) => id)]))
      )
      this.refresh$.next()
    }
  }

  async removeMember(id: string) {
    if (this.project?.id) {
      const member = this.members.find((item) => item.id === id)
      member.loading = true
      await firstValueFrom(this.projectService.deleteMember(this.project.id, id))
      this.refresh$.next()
    }
  }

  async openCertificationSelect() {
    if (this.project?.id) {
      const certificationId = await firstValueFrom(
        this._dialog.open(CertificationSelectComponent, { data: {} }).afterClosed()
      )
      if (this.certifications.find((item) => item.id === certificationId)) {
        this._toastrService.warning('PAC.Project.CertificationAlreadyAdded', { Default: 'Certification Already Added' })
        return
      }
      if (certificationId) {
        try {
          await firstValueFrom(
            this.projectService.updateCertifications(
              this.project.id,
              uniq([...this.project.certifications.map((item) => item.id), certificationId])
            )
          )
          this.refresh$.next()
          this._toastrService.success('PAC.Project.AddCertification', { Default: 'Add Certification' })
        } catch (err) {
          this._toastrService.error(err)
        }
      }
    }
  }

  async removeCertification(id: string) {
    if (this.project?.id) {
      try {
        await firstValueFrom(this.projectService.deleteCertification(this.project.id, id))
        this.refresh$.next()
        this._toastrService.success('PAC.Project.RemoveCertification', { Default: 'Remove Certification' })
      } catch (err) {
        this._toastrService.error(err)
      }
    }
  }
}
