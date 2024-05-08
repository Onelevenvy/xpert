import { Injectable } from '@angular/core'
import { EntityProperty, PropertyDimension } from '@metad/ocap-core'
import { FORMLY_ROW, FORMLY_W_1_2 } from '@metad/story/designer'
import { combineLatestWith, map } from 'rxjs/operators'
import { SemanticsAccordionWrapper } from './common'
import { CubeSchemaService } from './cube.schema'

@Injectable()
export class DimensionAttributesSchema<T extends EntityProperty = PropertyDimension> extends CubeSchemaService<T> {
  public readonly hierarchies$ = this.select((state) => {
    return state.cube.dimensions.find((item) => item.__id__ === state.modeling.__id__)?.hierarchies
  })

  DIMENSION: any

  getSchema() {
    return this.translate.stream('PAC.MODEL.SCHEMA').pipe(
      combineLatestWith(this.select((state) => state.modeling?.rt)),
      map(([SCHEMA, rt]) => {
        this.SCHEMA = SCHEMA
        this.DIMENSION = SCHEMA.DIMENSION

        return [
          {
            type: 'tabs',
            fieldGroup: [
              {
                props: {
                  label: this.DIMENSION?.TITLE ?? 'Dimension',
                  icon: 'account_tree'
                },
                fieldGroup: [this.builder]
              },
              this.dataDistribution
            ]
          }
        ]
      })
    )
  }

  get builder(): any {
    const COMMON = this.SCHEMA.COMMON
    const DIMENSION = this.DIMENSION
    return {
      key: 'modeling',
      wrappers: ['panel'],
      props: {
        label: DIMENSION?.Modeling ?? 'Modeling',
        padding: true
      },
      fieldGroup: [
        {
          fieldGroupClassName: FORMLY_ROW,
          fieldGroup: [
            {
              key: 'name',
              type: 'input',
              className: FORMLY_W_1_2,
              props: {
                label: DIMENSION?.Name ?? 'Name',
                readonly: true
              }
            },
            {
              key: 'caption',
              type: 'input',
              className: FORMLY_W_1_2,
              props: {
                label: COMMON?.Caption ?? 'Caption'
              }
            },

            {
              className: FORMLY_W_1_2,
              key: 'defaultHierarchy',
              type: 'ngm-select',
              props: {
                label: DIMENSION?.DefaultHierarchy ?? 'Default Hierarchy',
                options: this.hierarchies$.pipe(
                  map(
                    (hierarchies) =>
                      hierarchies?.map((hierarchy) => ({
                        value: hierarchy.name ?? '',
                        key: hierarchy.name ?? '',
                        caption: hierarchy.caption
                      })) ?? []
                  )
                )
              }
            }
          ]
        },

        ...SemanticsAccordionWrapper(COMMON)
      ]
    }
  }
}
