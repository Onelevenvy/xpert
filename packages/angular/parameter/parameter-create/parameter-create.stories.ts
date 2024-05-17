import type { Meta, StoryObj } from '@storybook/angular'

import { applicationConfig, argsToTemplate, componentWrapperDecorator, moduleMetadata } from '@storybook/angular'

import { provideHttpClient } from '@angular/common/http'
import { provideAnimations } from '@angular/platform-browser/animations'
import { CUBE_SALES_ORDER_NAME, ENTITY_TYPE_SALES_ORDER, MODEL_KEY, provideOcapMock, provideTranslate } from '@metad/ocap-angular/mock'
import { action } from '@storybook/addon-actions'
import { NgmParameterCreateComponent } from './parameter-create.component'

export const actionsData = {
  onPinTask: action('onPinTask'),
  onArchiveTask: action('onArchiveTask')
}

const meta: Meta<NgmParameterCreateComponent> = {
  title: 'Parameter/ParameterCreate',
  component: NgmParameterCreateComponent,
  excludeStories: /.*Data$/,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideAnimations(), provideHttpClient(), provideOcapMock(), provideTranslate()]
    }),
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      declarations: [],
      imports: []
    }),
    //👇 Wraps our stories with a decorator
    componentWrapperDecorator((story) => `<div style="margin: 3em">${story}</div>`)
  ],
  render: (args) => ({
    props: {
      ...args
    },
    template: `<ngm-parameter-create ${argsToTemplate(args)}></ngm-parameter-create>`
  })
}

export default meta
type Story = StoryObj<NgmParameterCreateComponent>

export const Default: Story = {
  args: {
    dataSettings: {
      dataSource: MODEL_KEY,
      entitySet: CUBE_SALES_ORDER_NAME
    },
    entityType: ENTITY_TYPE_SALES_ORDER
  }
}
