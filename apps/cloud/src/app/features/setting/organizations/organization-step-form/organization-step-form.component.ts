import { Component, DestroyRef, forwardRef, inject, OnInit, ViewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, Validators, FormGroup } from '@angular/forms'
import { MatStepper } from '@angular/material/stepper'
import { combineLatest } from 'rxjs'

@Component({
  selector: 'pac-organization-step-form',
  templateUrl: './organization-step-form.component.html',
  styleUrls: ['./organization-step-form.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => OrganizationStepFormComponent),
    }
  ]
})
export class OrganizationStepFormComponent implements OnInit, ControlValueAccessor {
  readonly destroyRef = inject(DestroyRef)

  @ViewChild('stepper') stepper: MatStepper

  basic = this.fb.group({
    name: ['', Validators.required],
    currency: ['CNY', Validators.required],
    defaultValueDateType: ['TODAY', Validators.required],
  })

  orgSettingsForm: FormGroup

  onChange: (value: any) => any
  constructor(private fb: FormBuilder) {
  }

  writeValue(obj: any): void {
    if (obj) {
      this.basic.patchValue(obj)
      this.orgSettingsForm.patchValue(obj)
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn
  }
  registerOnTouched(fn: any): void {
  }
  setDisabledState?(isDisabled: boolean): void {
  }

  ngOnInit(): void {
    this._initializedForm()
  }

  private _initializedForm() {
    this.orgSettingsForm = this.fb.group({
			invitesAllowed: [true],
			inviteExpiryPeriod: [7, [Validators.min(1)]]
		});

    combineLatest([
      this.basic.valueChanges,
      this.orgSettingsForm.valueChanges
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([basic, orgSettings]) => {
      this.onChange?.({
        ...basic,
        ...orgSettings
      })
    })
  }
}
