import { CdkMenu, CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectorRef, Component, inject, TemplateRef, ViewChild } from '@angular/core'
import { MatTabsModule } from '@angular/material/tabs'
import { IXpertRole } from 'apps/cloud/src/app/@core'
import { XpertInlineProfileComponent } from 'apps/cloud/src/app/@shared/xpert'
import { Subscription } from 'rxjs'
import { XpertStudioApiService } from '../../domain'
import { SelectionService } from '../../domain/selection.service'
import { XpertStudioComponent } from '../../studio.component'
import { XpertStudioKnowledgeMenuComponent } from '../knowledge-menu/knowledge.component'
import { XpertStudioToolsetMenuComponent } from '../toolset-menu/toolset.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'xpert-studio-context-menu',
  exportAs: 'menuComponent',
  standalone: true,
  imports: [
    CommonModule,
    CdkMenuModule,
    TranslateModule,
    MatTabsModule,
    XpertStudioKnowledgeMenuComponent,
    XpertStudioToolsetMenuComponent,
    XpertInlineProfileComponent
  ],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss'
})
export class XpertStudioContextMenuComponent {
  readonly apiService = inject(XpertStudioApiService)
  readonly selectionService = inject(SelectionService)
  private root = inject(XpertStudioComponent)
  readonly #cdr = inject(ChangeDetectorRef)

  @ViewChild(TemplateRef, { static: true })
  public template!: TemplateRef<CdkMenu>

  private subscriptions = new Subscription()

  public node: string | null = null

  readonly collaborators$ = this.apiService.collaborators$

  public ngOnInit(): void {
    this.subscriptions.add(this.subscribeToSelectionChanges())
  }

  private subscribeToSelectionChanges(): Subscription {
    return this.selectionService.selection$.subscribe((selection) => {
      if (this.root.fFlowComponent().getSelection().nodes.length === 1) {
        this.node = this.root.fFlowComponent().getSelection().nodes[0]
      }

      this.#cdr.detectChanges()
    })
  }

  public createAgent(menu: CdkMenu): void {
    menu.menuStack.closeAll()
    this.apiService.createAgent(this.root.contextMenuPosition)
  }

  public addCollaborator(xpert: IXpertRole): void {
    // menu.menuStack.closeAll()
    this.apiService.createCollaborator(this.root.contextMenuPosition, xpert)
  }

  public deleteNode(menu: CdkMenu, node: string): void {
    menu.menuStack.closeAll()
    if (node) {
      this.apiService.removeNode(node)
    }
  }

  public dispose(): void {
    // this.selectionService.reset()
  }
}
