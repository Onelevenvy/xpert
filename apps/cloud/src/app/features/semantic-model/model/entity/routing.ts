import { Routes } from '@angular/router'
import { ModelEntityCalculationComponent } from './calculation/calculation.component'
import { ModelEntityComponent } from './entity.component'
import { ModelEntityPreviewComponent } from './preview/preview.component'
import { EntityQueryComponent } from './query/query.component'
import { ModelEntityStructureComponent } from './structure/structure.component'
import { NotFoundComponent } from 'apps/cloud/src/app/@shared'

export const routes: Routes = [
  {
    path: '404',
    component: NotFoundComponent
  },
  {
    path: ':id',
    component: ModelEntityComponent,
    children: [
      {
        path: '',
        redirectTo: 'structure',
        pathMatch: 'full'
      },
      {
        path: 'structure',
        component: ModelEntityStructureComponent,
        data: {
          title: 'Model / Cube / Structure'
        }
      },
      {
        path: 'calculation',
        redirectTo: 'calculation/'
      },
      {
        path: 'calculation/:id',
        component: ModelEntityCalculationComponent
      },
      {
        path: 'preview',
        component: ModelEntityPreviewComponent
      },
      {
        path: 'query',
        component: EntityQueryComponent,
        data: {
          reuseRoute: true
        }
      }
    ]
  }
]
