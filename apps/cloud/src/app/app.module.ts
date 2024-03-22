import { PlatformModule } from '@angular/cdk/platform'
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http'
import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { BrowserModule, HammerModule } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { RouteReuseStrategy } from '@angular/router'
import { ServiceWorkerModule } from '@angular/service-worker'
import { Ability, PureAbility } from '@casl/ability'
import { AbilityModule } from '@casl/angular'
import { NxCoreModule } from '@metad/core'
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger'
import { MarkdownModule } from 'ngx-markdown'
import { NgxPermissionsModule } from 'ngx-permissions'
import {
  APIInterceptor,
  AppInitService,
  AppRouteReuseStrategy,
  CoreModule,
  LOCALE_DEFAULT,
  LanguageInterceptor,
  TenantInterceptor,
  TokenInterceptor,
  UpdateService
} from './@core'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'

const TYPE_KEY = '__subject__'
function detectSubjectType(subject) {
  if (!subject || typeof subject === 'string') {
    return subject
  }

  return subject[TYPE_KEY]
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    // angular
    BrowserModule,
    PlatformModule,
    HammerModule,

    // RouterModule.forRoot([], { initialNavigation: 'enabledBlocking' }),
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MatSnackBarModule,
    CoreModule.forRoot(),
    NgxPermissionsModule.forRoot(),
    LoggerModule.forRoot({
      level: NgxLoggerLevel.WARN,
      serverLogLevel: NgxLoggerLevel.ERROR,
      colorScheme: ['purple', 'teal', 'gray', 'gray', 'red', 'red', 'red'],
      enableSourceMaps: true
    }),
    NxCoreModule.forRoot(),
    AbilityModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: false, // environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),

    MarkdownModule.forRoot()
  ],
  providers: [
    provideAnimations(),
    UpdateService,
    {
      provide: LOCALE_ID,
      useValue: LOCALE_DEFAULT
    },
    {
      provide: RouteReuseStrategy,
      useClass: AppRouteReuseStrategy
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: APIInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LanguageInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TenantInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (appInitService: AppInitService) => () => {
        return appInitService.init()
      },
      deps: [AppInitService],
      multi: true
    },
    { provide: Ability, useValue: new Ability([], { detectSubjectType }) },
    { provide: PureAbility, useExisting: Ability }

    // {
    //   provide: ErrorHandler,
    //   useValue: Sentry.createErrorHandler({
    //     showDialog: false,
    //   }),
    // },
    // {
    //   provide: Sentry.TraceService,
    //   deps: [Router],
    // },
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: () => () => {},
    //   deps: [Sentry.TraceService],
    //   multi: true,
    // },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
