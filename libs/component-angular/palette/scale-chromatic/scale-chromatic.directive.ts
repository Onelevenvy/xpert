import { ChangeDetectorRef, Directive, HostBinding, HostListener, Inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { NX_SCALE_CHROMATIC } from '@metad/core'
// import { NxScaleChromaticService } from './scale-chromatic.service'

@Directive({
  selector: '[nxScaleChromatic]',
})
export class NxScaleChromaticDirective {
  constructor(
    // @Inject(NX_SCALE_CHROMATIC)
    // public scaleChromaticService: NxScaleChromaticService,
    public dialog: MatDialog,
    private _cdr: ChangeDetectorRef
  ) {}

  @HostBinding('style.cursor') styleCursor = 'pointer'

  @HostListener('click', ['$event'])
  onClick(event) {

    // const dialogRef = this.dialog.open(NxChromaticDialogComponent, {
    //   data: {
    //     scaleChromaticService: this.scaleChromaticService,
    //   },
    // })

    // dialogRef.afterClosed().subscribe((result) => {
    //   this._cdr.markForCheck()
    //   this._cdr.detectChanges()
    // })

    // this.dialogService
    //   .open(NxScaleChromaticComponent, {
    //     context: {
    //       scaleChromaticService: this.scaleChromaticService,
    //     },
    //     autoFocus: false,
    //   })
    //   .onClose.subscribe(() => {

    //   })
  }
}
