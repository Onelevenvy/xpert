import { CommonModule } from '@angular/common'
import { Injector, ModuleWithProviders, NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatTabsModule } from '@angular/material/tabs'
import { MatTooltipModule } from '@angular/material/tooltip'
import {MatDividerModule} from '@angular/material/divider'
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router'
import { OcapCoreModule } from '@metad/ocap-angular/core'
import { MtxAlertModule } from '@ng-matero/extensions/alert'
import { TranslateModule } from '@ngx-translate/core'
import { PacAuthRoutingModule } from './auth-routing.module'
import { PacAuthComponent } from './auth.component'
import {
  defaultAuthOptions,
  PacAuthOptions,
  PacAuthStrategyClass,
  PAC_AUTH_INTERCEPTOR_HEADER,
  PAC_AUTH_OPTIONS,
  PAC_AUTH_STRATEGIES,
  PAC_AUTH_TOKENS,
  PAC_AUTH_TOKEN_INTERCEPTOR_FILTER,
  PAC_AUTH_USER_OPTIONS
} from './auth.options'
import { PacMenuGroupComponent } from './components/menu-group/menu-group.component'
import { PacMenuComponent } from './components/menu/menu.component'
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component'
import { NoAuthGuard } from './guards/no-auth.guard'
import { deepExtend } from './helpers'
import { UserLoginComponent } from './login/login.component'
import { PacLogoutComponent } from './logout/logout.component'
import { UserRegisterResultComponent } from './register-result/register-result.component'
import { UserRegisterComponent } from './register/register.component'
import { ResetPasswordComponent } from './reset-password/reset-password.component'
import { PacAuthService } from './services/auth.service'
import { NbAuthSimpleToken } from './services/token/token'
import { PacAuthTokenParceler, PAC_AUTH_FALLBACK_TOKEN } from './services/token/token-parceler'
import { PacTokenLocalStorage, PacTokenStorage } from './services/token/token-storage'
import { PacTokenService } from './services/token/token.service'
import { PacAuthStrategy } from './strategies/auth-strategy'
import { PacAuthStrategyOptions } from './strategies/auth-strategy-options'
import { VarifyEmailComponent } from './verify-email/verify-email.component'
import { AcceptInviteModule } from './accept-invite/accept-invite.module'

export function nbStrategiesFactory(options: PacAuthOptions, injector: Injector): PacAuthStrategy[] {
  const strategies = []
  options.strategies.forEach(([strategyClass, strategyOptions]: [PacAuthStrategyClass, PacAuthStrategyOptions]) => {
    const strategy: PacAuthStrategy = injector.get(strategyClass)
    strategy.setOptions(strategyOptions)

    strategies.push(strategy)
  })
  return strategies
}

export function nbOptionsFactory(options) {
  return deepExtend(defaultAuthOptions, options)
}

@NgModule({
  declarations: [
    PacAuthComponent,
    UserLoginComponent,
    UserRegisterComponent,
    UserRegisterResultComponent,
    PacLogoutComponent,
    PacMenuComponent,
    PacMenuGroupComponent,

    ForgotPasswordComponent,
    ResetPasswordComponent,
    VarifyEmailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PacAuthRoutingModule,
    MatIconModule,
    TranslateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    
    MtxAlertModule,

    OcapCoreModule,

    AcceptInviteModule
  ],
  exports: [
    PacAuthComponent,
    UserLoginComponent,
    UserRegisterComponent,
    UserRegisterResultComponent,
    PacLogoutComponent,
    PacMenuComponent,
    PacMenuGroupComponent
  ],
  providers: [
    PacAuthService,
    PacTokenService,
    {
      provide: PacTokenStorage,
      useClass: PacTokenLocalStorage
    },
    PacAuthTokenParceler,
    {
      provide: PAC_AUTH_TOKENS,
      useFactory: function nbOptionsFactory(options) {
        return {}
      },
      deps: [PAC_AUTH_STRATEGIES]
    },
    { provide: PAC_AUTH_FALLBACK_TOKEN, useValue: NbAuthSimpleToken },
    { provide: PAC_AUTH_INTERCEPTOR_HEADER, useValue: 'Authorization' },
    { provide: PAC_AUTH_TOKEN_INTERCEPTOR_FILTER, useValue: {} },

    NoAuthGuard
  ]
})
export class PacAuthModule {
  static forRoot(pacAuthOptions?: PacAuthOptions): ModuleWithProviders<PacAuthModule> {
    return {
      ngModule: PacAuthModule,
      providers: [
        { provide: PAC_AUTH_USER_OPTIONS, useValue: pacAuthOptions },
        {
          provide: PAC_AUTH_OPTIONS,
          useFactory: nbOptionsFactory,
          deps: [PAC_AUTH_USER_OPTIONS]
        },
        {
          provide: PAC_AUTH_STRATEGIES,
          useFactory: nbStrategiesFactory,
          deps: [PAC_AUTH_OPTIONS, Injector]
        }
      ]
    }
  }
}
