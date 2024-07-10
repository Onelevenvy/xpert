import { Annotation, IMember, Measure, PrimitiveType, PropertyName, Syntax } from '../types'
import { CalculatedMember, ParameterControlEnum } from './calculated'
import { Indicator } from './indicator'
import { EntityProperty, PropertyAttributes } from './property'

/**
 * Base type for all entity types
 */
export interface Entity {
  /**
   * Catalog of entity
   */
  catalog?: string
  /**
   * Name of entity
   */
  name: string
  /**
   * Caption for entity
   */
  caption?: string

  /**
   * Visible Property
   */
  visible?: boolean
}

export interface Schema {
  name: string
  /**
   * Semantic Model Cubes
   */
  cubes?: Cube[]
  /**
   * Virtual Cubes
   */
  virtualCubes?: any[]
  /**
   * Semantic Model Dimensions
   */
  dimensions?: PropertyDimension[]
  annotations?: any[]
  functions?: any[]
  indicators?: Array<Indicator>
  /**
   * Runtime EntitySet
   */
  entitySets?: {
    [key: string]: EntitySet
  }
}

export interface Cube extends Entity {
  __id__?: string
  expression?: string
  tables?: Table[]
  dimensionUsages?: DimensionUsage[]
  dimensions?: PropertyDimension[]
  measures?: PropertyMeasure[]
  calculatedMembers?: CalculatedMember[]
  defaultMeasure?: string
}

export interface Table {
  __id__?: string
  name: string
  join?: Join
}

export interface Join {
  type: 'Left' | 'Inner' | 'Right'
  leftTable?: string
  fields: JoinField[]
  rightAlias?: string

  tables?: Array<Table>

  leftKey?: string
  rightKey?: string
}

export interface JoinField {
  leftKey: string
  rightKey: string
}

export interface SQL {
  dialect?: string
  content?: string
}

export interface SQLExpression {
  sql: SQL
}

export type KeyExpression = SQLExpression
export type NameExpression = SQLExpression
export type CaptionExpression = SQLExpression

export interface DimensionUsage {
  __id__?: string
  name: string
  source: string
  foreignKey: string
  caption?: string
  description?: string
}

/**
 */
export enum EntitySemantics {
  aggregate = 'aggregate',
  parameters = 'parameters',
  table = 'table',
  view = 'view'
}

/**
 * 未来将对接 Cube 定义
 *
 * Entity Type 类型接口
 */
export interface EntityType extends Entity {
  // entity type 名称， 一般是 entity 名称加上 'Type' 如 MyEntityType
  // 但复杂 entity 可能出现对应的多个 entityType 如 MyEntityParameters, MyEntityResult

  /**
   * Entity 主键们
   * 与 Parameters 的区别
   */
  keys?: string[]

  // entity type 属性们
  properties: {
    [name: string]: Property
  }

  /**
   * 要查询 Entity 的输入参数, 通常是必输字段
   */
  parameters?: {
    [name: string]: ParameterProperty
  }

  /**
   * @deprecated 应该移到 EntitySet 里
   */
  indicators?: Array<Indicator>

  // 数据源方言
  dialect?: any // string

  syntax?: Syntax

  /**
   *
   */
  semantics?: EntitySemantics

  defaultMeasure?: string

  cube?: Cube
}

/**
 * Mondrian 仅支持三种 Dimension 类型,
 * 更丰富的语义可以通过 Semantics 来定义
 */
export enum DimensionType {
  StandardDimension = 'StandardDimension',
  TimeDimension = 'TimeDimension',
  MeasuresDimension = 'MeasuresDimension'
}

export interface Property extends EntityProperty {
  expression?: string
  /**
   * The foreignKey of Fact table for this property
   */
  foreignKey?: string
  /**
   * The column of Dimension table for this property
   */
  column?: string
  /**
   * 维度类型, 或字段 DB 类型
   */
  type?: DimensionType | string
  description?: string
  hierarchies?: PropertyHierarchy[]
  defaultHierarchy?: string

  /**
   * 维度的属性字段
   */
  properties?: Array<EntityProperty>

  keyExpression?: KeyExpression

  /**
   * @deprecated
   */
  hierarchyNodeFor?: string
  /**
   * @deprecated
   */
  hierarchyLevelFor?: string
  /**
   * @deprecated
   */
  hierarchyParentNodeFor?: string
}

export type PropertyDimension = Property

export interface PropertyMeasure extends EntityProperty {
  formatting?: Measure['formatting']
  column?: string
  aggregator?: string
  formatString?: string
  /**
   * SQL Expression for measure
   */
  measureExpression?: SQLExpression
}

export interface PropertyHierarchy extends EntityProperty {
  tables?: Table[]
  join?: Join
  hasAll?: boolean
  allMemberName?: string
  allMemberCaption?: string
  allLevelName?: string
  primaryKey?: string
  primaryKeyTable?: string

  hierarchyCardinality?: number

  /**
   * 默认成员, 当上线文没有设置此维度的成员时默认取此成员
   */
  defaultMember?: string
  /**
   * 根成员, 代表所有值的汇总
   *
   * @deprecated should calculate from `hasAll` `allMemberName`
   */
  allMember?: string
  levels?: Array<PropertyLevel>
}

export interface PropertyLevel extends EntityProperty {
  hierarchy?: PropertyName
  column?: string
  nameColumn?: string
  captionColumn?: string
  ordinalColumn?: string
  parentColumn?: string
  nullParentValue?: string
  uniqueMembers?: boolean
  type?: 'String' | 'Integer' | 'Numeric' | 'Boolean' | 'Date' | 'Time' | 'Timestamp'
  table?: string
  closure?: Closure

  levelNumber?: number
  levelCardinality?: number
  /**
   * The type of level, such as 'TimeYears', 'TimeMonths', 'TimeDays' if dimension is a time dimension
   */
  levelType?: TimeLevelType | number | string
  properties?: Array<LevelProperty>
  // hierarchyLevelFor?: PropertyName
  parentChild?: boolean

  keyExpression?: KeyExpression
  nameExpression?: NameExpression
  captionExpression?: CaptionExpression
  ordinalExpression?: SQLExpression
  parentExpression?: SQLExpression
}

export enum TimeLevelType {
  TimeYears = 'TimeYears',
  TimeQuarters = 'TimeQuarters',
  TimeMonths = 'TimeMonths',
  TimeWeeks = 'TimeWeeks',
  TimeDays = 'TimeDays'
}

export interface LevelProperty extends PropertyAttributes {
  column?: string
  propertyExpression?: SQLExpression
}

export interface ParameterProperty extends EntityProperty {
  paramType: ParameterControlEnum
  value?: PrimitiveType | IMember[]

  // 候选成员
  availableMembers?: Array<IMember>

  // sap variables
  referenceDimension?: string
}

export interface VariableProperty extends ParameterProperty {
  defaultHigh: string
  defaultHighCaption: string
  defaultLow: string
  defaultLowCaption: string
  variableCaption: string
  variableEntryType: number
  variableGuid: string
  variableName: string
  variableOrdinal: number
  variableProcessingType: number
  variableSelectionType: number
  variableType: number
}

/**
 *
 * Entity 的 Meta 信息集合
 */
export interface EntitySet extends Entity {
  __id__?: string

  /**
   * Entity Type 定义
   */
  entityType?: EntityType

  annotations?: Array<Annotation>

  indicators?: Array<Indicator>

  /**
   * Is annotated cube
   */
  annotated?: boolean
}

export interface MDCube extends EntitySet {
  cubeType?: string
  cubeCaption?: string
}

export interface Catalog {
  name: string
  label: string
}

export interface Closure {
  parentColumn: string
  childColumn: string
  table: Table
}
