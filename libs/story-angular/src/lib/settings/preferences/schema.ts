import { ColorPalettes } from '@metad/core'
import {
  AccordionWrappers,
  Appearances,
  Borders,
  BoxShadow,
  FontCss,
  FORMLY_ROW,
  FORMLY_W_1_2,
  FORMLY_W_FULL
} from '@metad/story/designer'
import { PageHeaderLabelEnum } from '@metad/story/core'
import { gridsterOptions } from '../schemas'

export function PreferencesSchema(Story: any) {
  const CSS = Story?.STYLING?.CSS
  const I18NGridOptions = Story?.GridOptions
  const className = FORMLY_W_1_2

  return [
    {
      wrappers: ['accordion'],
      props: {
        elevationZ: true
      },
      fieldGroup: [
        {
          key: 'storyStyling',
          type: 'styling',
          props: {
            label: Story?.Widgets?.Common?.StoryStyling ?? 'Story Styling',
            expanded: false
          }
        },
        {
          key: 'pageStyling',
          type: 'styling',
          props: {
            label: Story?.Preferences?.PageStyles ?? 'Page Styles',
            expanded: false
          }
        }
      ]
    },
    ...AccordionWrappers([
      {
        key: 'story',
        label: Story?.Common?.Story ?? 'Story',
        toggleable: true,
        fieldGroup: StoryPreferences(className, Story)
      },

      {
        key: 'defaultGridOptions',
        label: I18NGridOptions?.TITLE ?? 'Grid Layout',
        toggleable: true,
        fieldGroup: [
          {
            fieldGroupClassName: FORMLY_ROW,
            fieldGroup: gridsterOptions(FORMLY_W_1_2, I18NGridOptions)
          }
        ]
      },
      {
        key: 'widget',
        toggleable: true,
        label: Story?.Preferences?.WidgetStyles ?? 'Widget Styles',
        fieldGroup: [
          {
            key: 'styling',
            type: 'styling'
          }
        ]
      },
      {
        key: 'card',
        toggleable: true,
        label: Story?.Preferences?.CardStyles ?? 'Card Styles',
        fieldGroup: [
          {
            key: 'styling',
            type: 'styling'
          }
        ]
      },
      {
        key: 'text',
        toggleable: true,
        label: Story?.Preferences?.TextStyles ?? 'Text Styles',
        fieldGroup: [FontStyle(className, CSS?.FONT), BoxStyle(className, CSS?.BOX)]
      },
      {
        key: 'table',
        toggleable: true,
        label: Story?.Preferences?.TableStyles ?? 'Table Styles',
        fieldGroup: [
          {
            key: 'styling',
            type: 'styling'
          }
        ]
      },
      {
        key: 'control',
        toggleable: true,
        label: Story?.Preferences?.ControlStyles ?? 'Control Styles',
        fieldGroup: [
          {
            key: 'styling',
            type: 'styling'
          }
        ]
      }
    ])
  ]
}

function FontStyle(className: string, TRANSLATE) {
  return {
    fieldGroupClassName: FORMLY_ROW,
    wrappers: ['panel'],
    props: { label: TRANSLATE?.TITLE ?? 'Font' },
    fieldGroup: FontCss(className, TRANSLATE)
  }
}

function BoxStyle(className: string, TRANSLATE) {
  return {
    fieldGroupClassName: FORMLY_ROW,
    wrappers: ['panel'],
    props: { label: TRANSLATE?.TITLE ?? 'Box' },
    fieldGroup: [...Borders(className, TRANSLATE), BoxShadow(FORMLY_W_FULL, TRANSLATE)]
  }
}

function StoryPreferences(className: string, Story) {
  const CSS = Story?.STYLING?.CSS
  return [
    // {
    //   fieldGroupClassName: FORMLY_ROW,
    //   fieldGroup: [
    //     {
    //       className,
    //       key: 'width',
    //       type: 'input-inline',
    //       props: {
    //         label: Story?.Preferences?.Width ?? 'Width',
    //         type: 'number'
    //       }
    //     },
    //     {
    //       className,
    //       key: 'height',
    //       type: 'input-inline',
    //       props: {
    //         label: Story?.Preferences?.Height ?? 'Height',
    //         type: 'number'
    //       }
    //     }
    //   ]
    // },
    {
      key: 'tabBar',
      type: 'button-toggle',
      defaultValue: 'fixed',
      props: {
        label: Story?.Preferences?.TabBar ?? 'Tab Bar',
        options: [
          { value: 'fixed', label: Story?.Preferences?.TabBar_Fixed ?? 'Fixed' },
          { value: 'point', label: Story?.Preferences?.TabBar_Point ?? 'Point' },
          { value: 'hidden', label: Story?.Preferences?.TabBar_Hidden ?? 'Hidden' }
        ]
      }
    },
    {
      key: 'pageHeaderPosition',
      type: 'button-toggle',
      defaultValue: 'above',
      props: {
        label: Story?.Preferences?.PageHeaderPosition ?? 'Page Header Position',
        options: [
          { value: 'above', label: Story?.Preferences?.PageHeaderPosition_Above ?? 'Above' },
          { value: 'below', label: Story?.Preferences?.PageHeaderPosition_Below ?? 'Below' }
        ]
      },
      expressions: {
        hide: `!model || model.tabBar === 'hidden'`
      }
    },
    {
      key: 'pageHeaderAlignTabs',
      type: 'button-toggle',
      defaultValue: 'center',
      props: {
        label: Story?.Preferences?.PageHeaderAlignTabs ?? 'Page Header Align Tabs',
        options: [
          {
            value: 'start',
            label: Story?.Preferences?.PageHeaderAlignTabs_Start ?? 'Start'
          },
          {
            value: 'center',
            label: Story?.Preferences?.PageHeaderAlignTabs_Center ?? 'Center'
          },
          {
            value: 'end',
            label: Story?.Preferences?.PageHeaderAlignTabs_End ?? 'End'
          }
        ]
      },
      expressions: {
        hide: `!model || model.tabBar === 'hidden'`
      }
    },
    {
      key: 'pageHeaderStretchTabs',
      type: 'checkbox',
      props: {
        label: Story?.Preferences?.PageHeaderStretchTabs ?? 'Page Header Stretch Tabs'
      },
      expressions: {
        hide: `!model || model.tabBar === 'hidden'`
      }
    },
    {
      key: 'pageHeaderShowLabel',
      type: 'button-toggle',
      props: {
        label: Story?.Preferences?.PageHeaderShowLabel ?? 'Page Header Show Label',
        options: [
          {
            value: PageHeaderLabelEnum.auto,
            label: Story?.Preferences?.PageHeaderShowLabel_Auto ?? 'Auto'
          },
          {
            value: PageHeaderLabelEnum.always,
            label: Story?.Preferences?.PageHeaderShowLabel_Always ?? 'Always'
          },
          {
            value: PageHeaderLabelEnum.never,
            label: Story?.Preferences?.PageHeaderShowLabel_Never ?? 'Never'
          }
        ]
      },
      expressions: {
        hide: `!model || model.tabBar !== 'point'`
      }
    },
    {
      key: 'appearance',
      wrappers: ['panel'],
      props: {
        label: Story?.Widgets?.Common?.Appearance ?? 'Appearance'
      },
      fieldGroup: Appearances(FORMLY_W_FULL, Story?.Widgets?.Common)
    },
    {
      key: 'themeName',
      type: 'button-toggle',
      props: {
        label: Story?.Common?.Theme?.Title ?? 'Theme',
        options: [
          { value: 'default', label: Story?.Common?.Theme?.Default ?? 'Default' },
          { value: 'light', label: Story?.Common?.Theme?.Light ?? 'Light' },
          { value: 'dark', label: Story?.Common?.Theme?.Dark ?? 'Dark' },
          // { value: 'thin', label: Story?.Common?.Theme?.Thin ?? 'Thin' } 需要改造 thin theme 暂时先禁用
        ]
      }
    },
    {
      key: 'colors',
      type: 'colors',
      props: {
        label: Story?.Widgets?.Common?.Colors ?? 'Colors',
        options: [...ColorPalettes]
      }
    },
    ...AccordionWrappers([
      {
        key: 'watermarkOptions',
        showKey: 'enableWatermark',
        label: Story?.Preferences?.WatermarkOptions ?? 'Watermark Options',
        fieldGroup: [
          {
            key: 'text',
            type: 'input-inline',
            props: {
              label: Story?.Preferences?.Text ?? 'Text',
              placeholder: Story?.Preferences?.WatermarkText ?? 'watermark text'
            }
          },
          {
            key: 'alpha',
            type: 'slider',
            props: {
              label: Story?.Preferences?.Alpha ?? 'Alpha',
              placeholder: 'alpha',
              type: 'number',
              min: 0,
              max: 1,
              step: 0.01,
              thumbLabel: true
            }
          },
          {
            key: 'degree',
            type: 'slider',
            props: {
              label: Story?.Preferences?.Degree ?? 'Degree',
              placeholder: 'degree (-90 : 90)',
              type: 'number',
              min: -90,
              max: 90,
              step: 1,
              thumbLabel: true
            }
          },

          {
            key: 'width',
            type: 'slider',
            props: {
              label: CSS?.SIZE?.Width ?? 'Width',
              placeholder: 'width',
              type: 'number',
              autoScale: true,
              thumbLabel: true
            }
          },
          {
            key: 'height',
            type: 'slider',
            props: {
              label: CSS?.SIZE?.Height ?? 'Height',
              placeholder: 'height',
              type: 'number',
              autoScale: true,
              thumbLabel: true
            }
          },
          FontStyle(className, CSS?.FONT)
        ]
      }
    ])
  ]
}
