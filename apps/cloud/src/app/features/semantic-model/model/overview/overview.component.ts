import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { map } from 'rxjs/operators'
import { ModelComponent } from '../model.component'
import { SemanticModelService } from '../model.service'

@Component({
  selector: 'pac-model-overview',
  templateUrl: 'overview.component.html',
  styleUrls: ['overview.component.scss']
})
export class ModelOverviewComponent {
  private readonly modelState = inject(SemanticModelService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  readonly #model = inject(ModelComponent)

  conversations = []
  asking = false
  text = ''

  public readonly dimensions$ = this.modelState.dimensions$
  public readonly cubes$ = this.modelState.cubes$
  public readonly virtualCubes$ = this.modelState.virtualCubes$
  public readonly stories$ = this.modelState.stories$
  public readonly roles$ = this.modelState.roles$.pipe(map((roles) => (roles?.length ? roles : null)))
  public readonly indicators$ = this.modelState.indicators$

  readonly modelSideMenuOpened = this.#model.sideMenuOpened

  openSideMenu() {
    this.modelSideMenuOpened.set(true)
  }
}
