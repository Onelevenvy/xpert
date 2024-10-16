import { IBasePerTenantAndOrganizationEntityModel } from '../base-entity.model'
import { ICopilot } from './copilot.model'

export interface ICopilotModel extends IBasePerTenantAndOrganizationEntityModel {
  /**
   * Use a separate copilot
   */
  copilot?: ICopilot
  copilotId?: string
  
  /**
   * Referenced copilot model if not using a separate copilot
   */
  referencedModel?: ICopilotModel
  referencedId?: string

  model?: string

  /** 
   * Details config for ai model
   */
  options?: TCopilotModelOptions
}

export type TCopilotModelOptions = {
  //
}