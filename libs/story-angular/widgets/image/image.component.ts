import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { UntilDestroy } from '@ngneat/until-destroy'
import { TranslateModule } from '@ngx-translate/core'
import { AbstractStoryWidget } from '@metad/core'
import { distinctUntilChanged, map } from 'rxjs/operators'

export interface ImageWidgetOptions {
  imageUrl?: string
  imageObj?: {
    id?: string
    url?: string
  }
  imageSizeMode?: 'strecth' | 'fitWidth' | 'fitHeight' | 'originalSize'
}

@UntilDestroy({ checkProperties: true })
@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule],
  selector: 'ngm-story-widget-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss']
})
export class NxWidgetImageComponent extends AbstractStoryWidget<ImageWidgetOptions> {
  private readonly domSanitizer = inject(DomSanitizer)

  classes = {}

  public imageUrl$ = this.options$.pipe(
    map((options) => options?.imageObj?.url ?? options?.imageUrl),
    distinctUntilChanged(),
    map((url) => (url ? this.domSanitizer.bypassSecurityTrustResourceUrl(url) : null))
  )

  private imageSizeModeSub = this.options$
    .pipe(
      map((options) => options?.imageSizeMode ?? 'strecth'),
      distinctUntilChanged()
    )
    .subscribe((mode) => {
      switch (mode) {
        case 'strecth':
          this.classes = {
            strecth: true
          }
          break
        case 'fitWidth':
          this.classes = {
            'fit-width': true
          }
          break
        case 'fitHeight':
          this.classes = {
            'fit-height': true
          }
          break
        case 'originalSize':
          this.classes = {
            'original-size': true
          }
          break
        default:
          this.classes = {}
          break
      }
    })
}
