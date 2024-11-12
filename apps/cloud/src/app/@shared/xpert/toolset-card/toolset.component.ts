import { CommonModule } from '@angular/common'
import { booleanAttribute, Component, computed, input } from '@angular/core'
import { NgmI18nPipe } from '@metad/ocap-angular/core'
import { injectHelpWebsite, IXpertToolset } from '../../../@core'
import { EmojiAvatarComponent } from '../../avatar'
import { UserPipe } from '../../pipes'
import { TagComponent } from '../../tag'

@Component({
  standalone: true,
  imports: [CommonModule, EmojiAvatarComponent, NgmI18nPipe, TagComponent, UserPipe],
  selector: 'xpert-toolset-card',
  templateUrl: 'toolset.component.html',
  styleUrls: ['toolset.component.scss']
})
export class ToolsetCardComponent {
  readonly helpWebsite = injectHelpWebsite()

  readonly inline = input<boolean, boolean | string>(false, {
    transform: booleanAttribute
  })

  readonly toolset = input<IXpertToolset>()

  readonly tags = computed(() => this.toolset()?.tags)
  readonly tagsTitle = computed(() =>
    this.tags()
      ?.map((t) => t.name)
      .join(',')
  )

  // readonly title = input<string>(null)
  // readonly description = input<string>(null)
  // readonly helpUrl = input<string>(null)
  // readonly helpTitle = input<string>(null)

  // readonly create = output()

  // onCreate() {
  //   this.create.emit()
  // }
}
