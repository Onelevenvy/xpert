import { ChangeDetectionStrategy, Component, ElementRef, Renderer2, computed, effect, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute } from '@angular/router'
import { NgmSmartFilterBarService } from '@metad/ocap-angular/core'
import { WasmAgentService } from '@metad/ocap-angular/wasm-agent'
import { AgentType, omit } from '@metad/ocap-core'
import { UntilDestroy } from '@ngneat/until-destroy'
import { WidgetsService, convertStoryResult, convertStoryWidgetResult } from '@metad/cloud/state'
import { NxCoreService } from '@metad/core'
import { NxStoryService, getSemanticModelKey, prefersColorScheme } from '@metad/story/core'
import { NxStoryPointService } from '@metad/story/story'
import { BehaviorSubject, EMPTY } from 'rxjs'
import { catchError, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs/operators'
import { registerStoryThemes, subscribeStoryTheme } from '../../@theme'

@UntilDestroy({ checkProperties: true })
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'pac-public-widget',
  templateUrl: 'widget.component.html',
  styleUrls: ['widget.component.scss'],
  host: {
    class: 'pac-public-widget'
  },
  providers: [NxStoryService, NxStoryPointService, NgmSmartFilterBarService, NxCoreService]
})
export class PublicWidgetComponent {
  public storyService = inject(NxStoryService)
  private pointService = inject(NxStoryPointService)
  private widgetsService = inject(WidgetsService)
  private coreService = inject(NxCoreService)
  private wasmAgent = inject(WasmAgentService)
  private route = inject(ActivatedRoute)
  private renderer = inject(Renderer2)
  private _elementRef = inject(ElementRef)

  public readonly widgetId$ = this.route.params.pipe(
    startWith(this.route.snapshot.params),
    map((params) => params?.id),
    filter((id) => !!id),
    distinctUntilChanged()
  )

  public readonly widget = toSignal(
    this.widgetId$.pipe(
      switchMap((id) =>
        this.widgetsService
          .getPublicOne(id, [
            // 'point.story.model',
            // 'point.story.model.dataSource',
            // 'point.story.model.dataSource.type',
            // 'point.story.model.indicators',

            'point.story.models',
            'point.story.models.dataSource',
            'point.story.models.dataSource.type',
            'point.story.models.indicators',

            // 'point.story.points',
            'createdBy'
          ])
          .pipe(
            catchError((err) => {
              this.error$.next(err.error)
              return EMPTY
            })
          )
      )
    )
  )

  public readonly story = computed(() => {
    const widget = this.widget()
    if (!widget) {
      return null
    }

    return convertStoryResult({
      ...widget.point.story,
      points: [
        {
          ...widget.point,
          story: null,
          widgets: [
            omit(widget, 'point')
          ]
        }
      ]
    })
  })
  public readonly _widget = computed(() => {
    const widget = this.widget()
    if (!widget) {
      return null
    }
    return convertStoryWidgetResult(widget)
  })
  private readonly models = computed(() => this.story()?.models)

  public error$ = new BehaviorSubject(null)
  // System theme
  private prefersColorScheme$ = prefersColorScheme()

  // Subscribers
  private _themeSub = subscribeStoryTheme(this.storyService, this.coreService, this.renderer, this._elementRef)
  private _echartsThemeSub = registerStoryThemes(this.storyService)

  constructor() {
    effect(() => {
      if (this.story()) {
        this.storyService.setStory(this.story())
      }
    })

    effect(() => {
      const widget = this._widget()
      if (widget) {
        this.pointService.init(widget.point.key)
        this.pointService.active(true)
      }
    })

    effect(() => {
      const models = this.models()
      models?.forEach((model) => {
        if (model?.agentType === AgentType.Wasm) {
          this.wasmAgent.registerModel({
            ...model,
            name: getSemanticModelKey(model),
            catalog: model.catalog ?? 'main'
          })
        }
      })
    })
  }
}
