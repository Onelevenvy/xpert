import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AcceptInvitePageComponent } from './accept-invite/accept-invite.component'
import { PacAuthComponent } from './auth.component'
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component'
import { NoAuthGuard } from './guards/no-auth.guard'
import { UserLoginComponent } from './login/login.component'
import { PacLogoutComponent } from './logout/logout.component'
import { UserRegisterResultComponent } from './register-result/register-result.component'
import { UserRegisterComponent } from './register/register.component'
import { ResetPasswordComponent } from './reset-password/reset-password.component'
import { VarifyEmailComponent } from './verify-email/verify-email.component'

const routes: Routes = [
  // Auth Root
  {
    path: '',
    component: PacAuthComponent,
    children: [
      {
        path: 'login',
        component: UserLoginComponent,
        data: { title: '登录', titleI18n: 'app.login.login' }
      },
      {
        path: 'register',
        component: UserRegisterComponent,
        data: { title: '注册', titleI18n: 'app.register.register' }
      },
      {
        path: 'register-result',
        component: UserRegisterResultComponent,
        data: { title: '注册结果', titleI18n: 'app.register.register' }
      },
      {
				path: 'request-password',
				component: ForgotPasswordComponent,
				canActivate: [NoAuthGuard]
			},
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
				canActivate: [NoAuthGuard]
      },
      {
				path: 'accept-invite',
				component: AcceptInvitePageComponent,
				canActivate: [NoAuthGuard]
			},
      {
        path: 'verify',
        component: VarifyEmailComponent,
        canActivate: [NoAuthGuard]
      },
      {
        path: 'logout',
        component: PacLogoutComponent
      }
    ]
  }
  // 单页不包裹Layout
  //   { path: 'passport/callback/:type', component: CallbackComponent }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PacAuthRoutingModule {}
