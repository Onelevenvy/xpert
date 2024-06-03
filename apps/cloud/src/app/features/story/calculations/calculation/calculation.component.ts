import { CommonModule } from '@angular/common'
import { Component, DestroyRef, computed, effect, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { NgmCalculationEditorComponent } from '@metad/ocap-angular/entity'
import { CalculationProperty } from '@metad/ocap-core'
import { NxStoryService } from '@metad/story/core'
import { TranslateModule } from '@ngx-translate/core'
import { isEqual } from 'lodash-es'
import { derivedFrom } from 'ngxtension/derived-from'
import { injectParams } from 'ngxtension/inject-params'
import { of } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { StoryCalculationsComponent } from '../calculations.component'

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,

    NgmCalculationEditorComponent
  ],
  selector: 'pac-story-calculation',
  templateUrl: 'calculation.component.html',
  styleUrls: ['calculation.component.scss'],
  host: {
    class: 'pac-story-calculation'
  }
})
export class StoryCalculationComponent {
  readonly storyService = inject(NxStoryService)
  readonly router = inject(Router)
  readonly route = inject(ActivatedRoute)
  readonly destroyRef = inject(DestroyRef)
  readonly calculationsComponent = inject(StoryCalculationsComponent)
  readonly cubeName = injectParams('cube')
  readonly paramKey = injectParams('key')

  readonly dataSettings = computed(
    () => {
      const cubeName = decodeURIComponent(this.cubeName())
      if (cubeName) {
        const entities = this.calculationsComponent.entities$()
        const entity = entities.find((e) => e.key === cubeName)
        if (entity) {
          return {
            dataSource: entity.value.dataSource,
            entitySet: entity.key
          }
        }
      }
      return this.calculationsComponent.dataSettings()
    },
    { equal: isEqual }
  )

  readonly property = derivedFrom(
    [this.paramKey, this.dataSettings],
    switchMap(([key, dataSettings]) =>
      key && dataSettings
        ? this.storyService.selectEntitySchemaProperty<CalculationProperty>(
            dataSettings.dataSource,
            dataSettings.entitySet,
            key
          )
        : of(null)
    )
  )

  constructor() {
    effect(
      () => {
        this.calculationsComponent.property.set(this.property())
      },
      { allowSignalWrites: true }
    )

    effect(
      () => {
        if (this.dataSettings()) {
          this.calculationsComponent.activeEntity(this.dataSettings().dataSource, this.dataSettings().entitySet)
        }
      },
      { allowSignalWrites: true }
    )

    this.destroyRef.onDestroy(() => {
      this.calculationsComponent.property.set(null)
    })
  }

  close() {
    this.router.navigate(this.cubeName() ? ['../../'] : ['../'], { relativeTo: this.route })
  }

  onApply(event: CalculationProperty) {
    if (event) {
      this.storyService.addCalculationMeasure({ dataSettings: this.dataSettings(), calculation: event })
    }

    // updateCalculationMeasure
    this.close()
  }
}
