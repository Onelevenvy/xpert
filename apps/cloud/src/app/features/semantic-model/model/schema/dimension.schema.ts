import { Injectable } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { AbstractControl } from '@angular/forms'
import { ISelectOption } from '@metad/ocap-angular/core'
import { DimensionType, EntityProperty, PropertyDimension, serializeUniqueName } from '@metad/ocap-core'
import { nonBlank, nonNullable } from '@metad/core'
import { FORMLY_ROW, FORMLY_W_1_2, FORMLY_W_FULL } from '@metad/story/designer'
import { FormlyFieldConfig } from '@ngx-formly/core'
import { Observable, combineLatest, firstValueFrom } from 'rxjs'
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators'
import { SemanticsExpansion } from './common'
import { CubeSchemaService } from './cube.schema'


@Injectable()
export class DimensionSchemaService<T extends EntityProperty = PropertyDimension> extends CubeSchemaService<T> {
  readonly dimension$ = this.select((state) => state.modeling)
  readonly dimensionName$ = this.dimension$.pipe(
    filter(nonNullable),
    map(({ name }) => name),
    distinctUntilChanged(),
    filter(nonBlank)
  )

  // 兼容在 Dimension Designer 中和在 Cube Designer 中
  public readonly hierarchies$ = this.select(
    (state) =>
      state.hierarchies ?? state.cube.dimensions?.find((item) => item.__id__ === state.modeling.__id__)?.hierarchies
  )

  readonly hierarchyOptions$ = combineLatest([this.dimensionName$, this.hierarchies$]).pipe(
    map(
      ([dimensionName, hierarchies]) =>
        hierarchies?.map((hierarchy) => ({
          key: serializeUniqueName(dimensionName, hierarchy.name),
          value: serializeUniqueName(dimensionName, hierarchy.name),
          caption: hierarchy.caption
        })) ?? []
    ),
  )
  readonly sharedDimensions$ = this.select((state) => state.dimensions)
  readonly otherDimensions$ = combineLatest([this.dimension$.pipe(map((dimension) => dimension?.__id__)), this.cube$.pipe(map((cube) => cube?.dimensions))])
    .pipe(
      map(([id, dimensions]) => dimensions?.filter((dimension) => dimension.__id__ !== id) ?? [])
    )

  dimensions = toSignal(combineLatest([
    this.sharedDimensions$,
    this.otherDimensions$
  ]).pipe(
    map(([sharedDimensions, dimensions]) => {
      return [
        ...(dimensions ?? []),
        ...(sharedDimensions ?? [])
      ]
    })
  ))

  DIMENSION: any
  rt = false
  isCube = false

  getSchema() {
    return combineLatest([this.select((state) => state.modeling?.rt), this.select((state) => !!state.cube)]).pipe(
      switchMap(async ([rt, isCube]) => {
        const SCHEMA = await firstValueFrom(this.translate.get('PAC.MODEL.SCHEMA'))
        this.SCHEMA = SCHEMA
        this.DIMENSION = SCHEMA.DIMENSION
        this.rt = rt
        this.isCube = isCube
        return [
          {
            type: 'tabs',
            fieldGroup: [this.builder]
          }
        ]
      })
    )
  }

  get builder(): any {
    return {
      props: {
        label: this.DIMENSION?.TITLE ?? 'Dimension',
        icon: 'account_tree'
      },
      fieldGroup: [
        {
          key: 'cube',
          type: 'empty'
        },
        DimensionModeling(this.SCHEMA, this.getTranslationFun(), this.hierarchyOptions$, this.factFields$, this.dimensions(), this.rt, this.isCube)
      ]
    }
  }
  
  getTranslationFun() {
    return (key: string, interpolateParams?: any) => {
      return this.getTranslation(key, interpolateParams)
    }
  }
}

/**
 *
 * @param i18n I18N
 * @param hierarchies$ 运行时的层次结构选项
 * @param factColumns$ 事实表的列选项
 * @param rt
 * @param isCube
 * @returns
 */
export function DimensionModeling(
  i18n,
  translate,
  hierarchies$: Observable<ISelectOption[]>,
  factColumns$: Observable<ISelectOption[]>,
  dimensions: PropertyDimension[],
  rt = false,
  isCube = false
) {
  const DIMENSION = i18n?.DIMENSION
  const COMMON = i18n?.COMMON

  const className = FORMLY_W_1_2
  return {
    key: 'modeling',
    fieldGroup: [
      {
        wrappers: ['panel'],
        props: {
          label: DIMENSION?.Modeling ?? 'Modeling',
          padding: true
        },
        fieldGroupClassName: FORMLY_ROW,
        fieldGroup: [
          {
            key: 'name',
            type: 'input',
            className,
            props: {
              label: DIMENSION?.Name ?? 'Name',
              readonly: rt,
              required: true
            },
            validators: {
              name: {
                expression: (c: AbstractControl) => !(!c.value || dimensions.find((item) => item.name === c.value)),
                message: (error: any, field: FormlyFieldConfig) => field.formControl.value ? 
                  translate('PAC.Messages.AlreadyExists', {Default: `Name already exists`, value: translate('PAC.KEY_WORDS.Name', {Default: 'Name'})}) : 
                  translate('PAC.Messages.IsRequired', {Default: `Name is required`, value: translate('PAC.KEY_WORDS.Name', {Default: 'Name'})})
              }
            }
          },
          {
            key: 'caption',
            type: 'input',
            className,
            props: {
              label: COMMON?.Caption ?? 'Caption'
            }
          },
          {
            className: FORMLY_W_FULL,
            key: 'description',
            type: 'textarea',
            props: {
              label: COMMON?.Description ?? 'Description',
              autosizeMinRows: 2,
              autosize: true
            }
          },
          ...(isCube
            ? [
                {
                  // 只有内联维度且有独立维度表的才需要设置此属性
                  key: 'foreignKey',
                  type: 'ngm-select',
                  className,
                  props: {
                    label: DIMENSION?.ForeignKey ?? 'Foreign Key',
                    options: factColumns$,
                    // required: isCube,
                    searchable: true,
                    info: DIMENSION?.ForeignKey_Info ?? 'Inline dimension with independent tables need to specify the foreign key of this fact table here.',
                  }
                }
              ]
            : []),
          {
            key: 'type',
            type: 'select',
            className,
            props: {
              label: DIMENSION?.DimensionType ?? 'Dimension Type',
              options: [
                {
                  value: null,
                  label: COMMON?.None ?? 'None'
                },
                {
                  value: DimensionType.StandardDimension,
                  label: 'Regular'
                },
                {
                  value: DimensionType.TimeDimension,
                  label: 'Time'
                },
                {
                  value: DimensionType.MeasuresDimension,
                  label: 'Measures'
                }
                // Mondrian 不支持其他维度类型, 需要用 Semantic 属性来实现
                // {
                //   value: 'GeographyDimension',
                //   label: 'Geography',
                // }
              ]
            }
          },
          {
            className,
            key: 'defaultHierarchy',
            type: 'select',
            props: {
              label: DIMENSION?.DefaultHierarchy ?? 'Default Hierarchy',
              options: hierarchies$
            }
          }
        ]
      },
      // Dimension 应该没有 KeyExpression
      // KeyExpression(COMMON),
      SemanticsExpansion(COMMON)
    ]
  }
}
