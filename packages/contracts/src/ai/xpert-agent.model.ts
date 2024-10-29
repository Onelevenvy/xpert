import { IBasePerTenantAndOrganizationEntityModel } from '../base-entity.model'
import { IXpertToolset } from './xpert-toolset.model'
import { IKnowledgebase } from './knowledgebase.model'
import { TAvatar } from './types'
import { IXpert, TXpertParameter } from './xpert.model'
import { ICopilotModel } from './copilot-model.model'

/**
 * Expert agent, ai agent for the xperts.
 */
export interface IXpertAgent extends IBasePerTenantAndOrganizationEntityModel {
  key: string
  name?: string
  title?: string
  description?: string
  avatar?: TAvatar
  /**
   * 系统提示语
   */
  prompt?: string
  /**
   * Input parameters for agent
   */
  parameters?: TXpertParameter[]
  
  /**
   * More configuration
   */
  options?: TXpertAgentOptions

  // One to one
  /**
   * This is the xpert's primary agent
   */
  xpert?: IXpert
  xpertId?: string
  /**
   * Copilot model of this agent
   */
  copilotModel?: ICopilotModel
  copilotModelId?: string

  // Many to one
  /**
   * This is one of the xpert team's agent
   */
  team?: IXpert
  teamId?: string

  /**
   * My leader in xpert team
   */
  leader?: IXpertAgent
  leaderKey?: string
  /**
   * I am the leader of followers in xpert's team
   */
  followers?: IXpertAgent[]

  // Many to many
  /**
   * External xpert teams
   */
  collaborators?: IXpert[]
  collaboratorNames?: string[]
  /**
   * I used toolsets
   */
  toolsets?: IXpertToolset[]
  toolsetIds?: string[]
  /**
   * I used knowledgebases
   */
  knowledgebases?: IKnowledgebase[]
  knowledgebaseIds?: string[]
}

export type TXpertAgentOptions = {
  //
}