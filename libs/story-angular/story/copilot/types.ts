import { InjectionToken, Signal } from '@angular/core'
import { BaseRetriever } from '@langchain/core/retrievers'
import {
  C_MEASURES,
  Dimension,
  EntityType,
  Measure,
  PropertyDimension,
  PropertyLevel,
  getEntityProperty,
  getEntityProperty2,
  wrapBrackets
} from '@metad/ocap-core'
import { createRetrieverTool } from 'langchain/tools/retriever'

export abstract class BaseDimensionMemberRetriever extends BaseRetriever {
  model: Signal<string>
  cube: Signal<string>
}

export const MEMBER_RETRIEVER_TOKEN = new InjectionToken<BaseDimensionMemberRetriever>('DimensionMemberRetriever')

export function createDimensionMemberRetrieverTool(
  retriever: BaseDimensionMemberRetriever,
  model: Signal<string>,
  cube: Signal<string>
) {
  retriever.model = model
  retriever.cube = cube
  return createRetrieverTool(retriever, {
    name: 'dimensionMemberKeySearch',
    description:
      'Search for dimension member key information about filter conditions. For any needs about filtering data, you must use this tool!'
  })
}

/**
 * @deprecated use tryFixDimension
 */
export function fixDimension(item: Dimension, entityType: EntityType) {
  if ((<Measure>item).measure) {
    return fixMeasure(item, entityType)
  }

  let { dimension, hierarchy, level } = item

  dimension = wrapBrackets(dimension)
  hierarchy = wrapBrackets(hierarchy)

  let property: PropertyLevel | PropertyDimension = getEntityProperty<PropertyDimension>(entityType, dimension)
  if (!property) {
    property = getEntityProperty2(entityType, dimension)
    dimension = property.dimension
    hierarchy = (<PropertyLevel>property).hierarchy ?? property.name
  }

  if (level) {
    property = getEntityProperty2(entityType, level)
    // Can't find level, set level to null
    if (!property) {
      level = null
    }
  }

  return {
    ...item,
    dimension,
    hierarchy,
    level
  }
}

export function fixMeasure(item: Measure | Dimension, entityType?: EntityType) {
  return {
    ...item,
    dimension: item.dimension === `[${C_MEASURES}]` ? C_MEASURES : item.dimension
  }
}
