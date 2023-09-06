import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { ButtonGroupDirective } from '@metad/ocap-angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { FormGroup } from '@angular/forms'
import { CommonModule } from '@angular/common'

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    DragDropModule,
    TranslateModule,
    ButtonGroupDirective
  ],
  selector: 'ngm-dialog',
  template: `<header mat-dialog-title cdkDrag cdkDragRootElement=".cdk-overlay-pane" cdkDragHandle>
      <span style="pointer-events: none;">{{ title }}</span>
    </header>

    <div mat-dialog-content class="flex-1">
      <ng-content></ng-content>
    </div>

    <div mat-dialog-actions align="end">
      <div ngmButtonGroup>
        <button mat-button mat-dialog-close cdkFocusInitial (click)="cancel.emit()">
          {{ cancelLabel ?? ('COMPONENTS.COMMON.CANCEL' | translate: {Default: 'Cancel'}) }}
        </button>
        <button mat-raised-button color="accent" [disabled]="form?.invalid" (click)="onApply()">
          {{ applyLabel ?? ('COMPONENTS.COMMON.Apply' | translate: {Default: 'Apply'}) }}
        </button>
      </div>
    </div>`,
  host: {
    class: 'ngm-dialog'
  },
  styles: [
    `
      :host {
        flex: 1;
        max-height: 100%;
        display: flex;
        flex-direction: column;
      }
    `
  ]
})
export class NgmDialogComponent implements OnInit {
  @Input() title: string
  @Input() applyLabel: string
  @Input() cancelLabel: string
  @Input() form: FormGroup

  @Output() apply = new EventEmitter()
  @Output() cancel = new EventEmitter()

  constructor(
    @Optional()
    public dialogRef: MatDialogRef<NgmDialogComponent> ) {}

  ngOnInit() {}

  onApply() {
    this.apply.emit(this.form?.value)
    this.dialogRef?.close(this.form?.value)
  }
}
