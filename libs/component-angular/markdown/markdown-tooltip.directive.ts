import { ConnectedPosition, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay'
import { ComponentPortal } from '@angular/cdk/portal'
import { Component, ComponentRef, Directive, ElementRef, HostListener, Input } from '@angular/core'

@Directive({
  selector: '[nxMarkdownTooltip]',
})
export class MarkdownTooltipDirective {
  @Input('nxMarkdownTooltip') markdown: string

  private overlayRef: OverlayRef
  constructor(private _overlay: Overlay, private _elementRef: ElementRef) {}

  ngOnInit(): void {
    let strategy = this._overlay.position()//.global().bottom().left()
    .flexibleConnectedTo(this._elementRef)
      .withPositions([{
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'bottom'
      } as ConnectedPosition])
      .withPush(false)
    let config = new OverlayConfig({ width: '300px', height: '100px', positionStrategy: strategy })
    this.overlayRef = this._overlay.create(config)
  }

  @HostListener('mouseenter')
  show() {
    // Create tooltip portal
    const tooltipPortal = new ComponentPortal(MarkdownTooltipComponent)

    // Attach tooltip portal to overlay
    const tooltipRef: ComponentRef<MarkdownTooltipComponent> = this.overlayRef.attach(tooltipPortal)

    // Pass content to tooltip component instance
    tooltipRef.instance.markdown = this.markdown
  }

  @HostListener('mouseleave')
  hide() {
    this.overlayRef.detach()
  }
}

@Component({
  selector: 'nx-markdown-tooltip',
  template: `<mat-card>
    <mat-card-content>
      <div [innerHTML]="markdown | markdown"></div>
    </mat-card-content>
  </mat-card>`,
  styles: [],
})
export class MarkdownTooltipComponent {
  @Input() markdown: string
}
