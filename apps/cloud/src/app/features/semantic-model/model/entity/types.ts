import { CdkDragDrop } from '@angular/cdk/drag-drop'
import { AggregationRole, Dimension, Property, PropertyDimension } from '@metad/ocap-core'
import { serializeUniqueName } from '@metad/ocap-sql'
import { uuid } from 'apps/cloud/src/app/@core'
import { mapToTableColumnType } from '../../types'
import { MODEL_TYPE } from '../types'

export type CubeDimensionType = PropertyDimension & {
  isUsage?: boolean
}

export type CubeEventType = {
  type: 'dimension-created' | 'measure-created'
}

/**
 * Add a db table as inline dimension
 * 
 * @param dimensions Exists dimensions
 * @param table 
 * @param caption 
 * @returns 
 */
export function newDimensionFromTable(dimensions: PropertyDimension[], table: string, caption: string, isOlap: boolean) {
  const exists = dimensions.filter((d) => d.name === table)

  return {
    __id__: uuid(),
    name: exists.length > 0 ? `${table}_${exists.length}` : table,
    caption: caption,
    hierarchies: [
      {
        __id__: uuid(),
        name: '',
        hasAll: isOlap,
        visible: true,
        tables: [
          {
            __id__: uuid(),
            name: table,
          }
        ],
        levels: [
          
        ]
      }
    ]
  } as PropertyDimension
}

/**
 * Add a db column as inline dimension without independent table
 * 
 * @param column
 * @param isXmla 转成 olap 的维度，否则转成 sql 维度
 * @returns
 */
export function newDimensionFromColumn(column: Property, isOlap: boolean) {
  return {
    __id__: uuid(),
    name: column.name,
    caption: column.caption,
    defaultHierarchy: column.defaultHierarchy,
    semantics: column.semantics,
    hierarchies: [
      {
        __id__: uuid(),
        name: '',
        hasAll: isOlap, // olap 的维度默认有 All 成员， sql 维度默认没有 All 成员
        visible: true,
        levels: [
          {
            __id__: uuid(),
            name: column.name,
            caption: column.caption,
            column: column.name,
            type: mapToTableColumnType(column.dataType),
            visible: true
          }
        ]
      }
    ]
  } as PropertyDimension
}

/**
 * 计算来自于 'list-dimensions' 组件的数据项至可用的 Dimension ｜ Measure
 * 
 * @param event 
 * @param modelType 
 * @param dialect 
 * @returns 
 */
export function getDropProperty(event: CdkDragDrop<unknown[]>, modelType: MODEL_TYPE, dialect: string) {
  const property = event.item.data
  const item = {
    dimension: null,
    hierarchy: null,
    level: null,
    zeroSuppression: false
  } as Dimension
  if (property.role === AggregationRole.dimension) {
    item.dimension = modelType !== MODEL_TYPE.XMLA ? serializeUniqueName(dialect, property.name) : property.name
    // 取默认 hierarchy 或者默认与 dimension 同名的
    item.hierarchy = property.defaultHierarchy || item.dimension
  } else if (property.role === AggregationRole.hierarchy) {
    item.dimension =
      modelType !== MODEL_TYPE.XMLA ? serializeUniqueName(dialect, property.dimension) : property.dimension
    item.hierarchy =
      modelType !== MODEL_TYPE.XMLA ? serializeUniqueName(dialect, property.dimension, property.name) : property.name
  } else if (property.role === AggregationRole.level) {
    item.dimension =
      modelType !== MODEL_TYPE.XMLA ? serializeUniqueName(dialect, property.dimension) : property.dimension
    item.hierarchy =
      modelType !== MODEL_TYPE.XMLA
        ? serializeUniqueName(dialect, property.dimension, property.hierarchy)
        : property.hierarchy
    item.level =
      modelType !== MODEL_TYPE.XMLA
        ? serializeUniqueName(dialect, property.dimension, property.hierarchy, property.name)
        : property.name
  } else if (property.source && modelType !== MODEL_TYPE.XMLA) {
    // Dimension Usage
    item.dimension = serializeUniqueName(dialect, property.source)
  }

  return item
}
