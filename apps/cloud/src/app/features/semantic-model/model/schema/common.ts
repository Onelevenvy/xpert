import { AggregationRole, Semantics } from '@metad/ocap-core'
import { AccordionWrappers, FORMLY_W_FULL, FORMLY_ROW, FORMLY_W_1_2 } from '@metad/story/designer'
import { FormlyFieldConfig } from '@ngx-formly/core'
import { format } from 'date-fns'
import { map, startWith, tap } from 'rxjs'

export function SQLExpression(COMMON) {
  return {
    key: 'sql',
    fieldGroupClassName: FORMLY_ROW,
    fieldGroup: [
      {
        key: 'dialect',
        type: 'ngm-select',
        className: FORMLY_W_1_2,
        props: {
          label: COMMON?.SQLExpression?.Dialect ?? 'Dialect',
          searchable: true,
          valueKey: 'key',
          options: [
            { key: null, caption: COMMON?.None ?? 'None' },
            { key: 'generic', caption: 'generic' },
            { key: 'access', caption: 'access' },
            { key: 'db2', caption: 'db2' },
            { key: 'derby', caption: 'derby' },
            { key: 'firebird', caption: 'firebird' },
            { key: 'hsqldb', caption: 'hsqldb' },
            { key: 'mssql', caption: 'mssql' },
            { key: 'mysql', caption: 'mysql' },
            { key: 'oracle', caption: 'oracle' },
            { key: 'postgres', caption: 'postgres' },
            { key: 'sybase', caption: 'sybase' },
            { key: 'teradata', caption: 'teradata' },
            { key: 'ingres', caption: 'ingres' },
            { key: 'infobright', caption: 'infobright' },
            { key: 'luciddb', caption: 'luciddb' },
            { key: 'vertica', caption: 'vertica' },
            { key: 'neoview', caption: 'neoview' }
          ]
        }
      },
      {
        key: 'content',
        type: 'textarea',
        className: FORMLY_W_FULL,
        props: {
          label: COMMON?.SQLExpression?.Content ?? 'Content',
          rows: 1,
          autosize: true
        }
      }
    ]
  }
}

export function Role(I18N?) {
  return {
    key: 'role',
    type: 'select',
    className: FORMLY_W_1_2,
    props: {
      label: I18N?.AggregationRole ?? 'Aggregation Role',
      valueKey: 'key',
      options: [
        {
          key: null,
          caption: 'None'
        },
        {
          key: AggregationRole.dimension,
          caption: 'Dimension'
        },
        {
          key: AggregationRole.measure,
          caption: 'Measure'
        },
        {
          key: AggregationRole.hierarchy,
          caption: 'Hierarchy'
        },
        {
          key: AggregationRole.level,
          caption: 'Hierarchy Level'
        }
      ]
    }
  }
}

export function Semantic(COMMON?) {
  return {
    key: 'semantic',
    type: 'select',
    className: FORMLY_W_1_2,
    props: {
      icon: 'class',
      label: COMMON?.Semantic ?? 'Semantic',
      searchable: true,
      valueKey: 'key',
      options: [
        { key: null, caption: COMMON?.None ?? 'None' },
        { key: Semantics.Geography, caption: 'Geography' },
        {
          key: Semantics['GeoLocation.Latitude'],
          caption: 'GeoLocation Latitude'
        },
        {
          key: Semantics['GeoLocation.Longitude'],
          caption: 'GeoLocation Longitude'
        },
        {
          key: Semantics.Calendar,
          caption: 'Calendar'
        },
        { key: Semantics['Calendar.Year'], caption: 'Calendar Year' },
        { key: Semantics['Calendar.Quarter'], caption: 'Calendar Quarter' },
        { key: Semantics['Calendar.Month'], caption: 'Calendar Month' },
        { key: Semantics['Calendar.Week'], caption: 'Calendar Week' },
        { key: Semantics['Calendar.Day'], caption: 'Calendar Day' },
        {
          key: Semantics['Amount.CurrencyCode'],
          caption: 'Amount CurrencyCode'
        },
        {
          key: Semantics['Quantity.UnitOfMeasure'],
          caption: 'Quantity UnitOfMeasure'
        },
        {
          key: Semantics.CurrencyCode,
          caption: 'Currency Code'
        },
        {
          key: Semantics.UnitOfMeasure,
          caption: 'Unit of Measure'
        },
        {
          key: Semantics.Language,
          caption: 'Language'
        },
        {
          key: Semantics['Address.Region'],
          caption: 'Address Region'
        },
        {
          key: Semantics['Address.SubRegion'],
          caption: 'Address SubRegion'
        },
        {
          key: Semantics['Address.Country'],
          caption: 'Address Country'
        },
        {
          key: Semantics['Address.City'],
          caption: 'Address City'
        },
        {
          key: Semantics['Address.ZipCode'],
          caption: 'Address ZipCode'
        },
        {
          key: Semantics['Address.PostBox'],
          caption: 'Address PostBox'
        },
        {
          key: Semantics['Address.Street'],
          caption: 'Address Street'
        }
      ]
    }
  }
}

export function CalendarFormatter(COMMON?) {
  return {
    hideExpression: `!model || !model.semantic?.startsWith('Calendar')`,
    key: 'formatter',
    type: 'input',
    className: FORMLY_W_FULL,
    props: {
      icon: 'date_range',
      label: COMMON?.Formatter ?? 'Time formatter',
      options: [],
      valueKey: 'key',
    },
    hooks: {
      onInit: (field: FormlyFieldConfig) => {
        const formatters = [
          {
            semantic: Semantics['Calendar.Day'],
            key: 'yyyyMMdd',
            caption: format(new Date(), 'yyyyMMdd')
          },
          {
            semantic: Semantics['Calendar.Day'],
            key: 'yyyy.MM.dd',
            caption: format(new Date(), 'yyyy.MM.dd')
          },
          {
            semantic: Semantics['Calendar.Day'],
            key: 'yyyy-MM-dd',
            caption: format(new Date(), 'yyyy-MM-dd')
          },
          {
            semantic: Semantics['Calendar.Month'],
            key: `yyyyMM`,
            caption: format(new Date(), `yyyyMM`)
          },
          {
            semantic: Semantics['Calendar.Month'],
            key: `yyyy.MM`,
            caption: format(new Date(), `yyyy.MM`)
          },
          {
            semantic: Semantics['Calendar.Month'],
            key: `yyyy-MM`,
            caption: format(new Date(), `yyyy-MM`)
          },
          {
            semantic: Semantics['Calendar.Quarter'],
            key: `yyyy'Q'Q`,
            caption: format(new Date(), `yyyy'Q'Q`)
          },
          {
            semantic: Semantics['Calendar.Quarter'],
            key: `yyyy.'Q'Q`,
            caption: format(new Date(), `yyyy.'Q'Q`)
          },
          {
            semantic: Semantics['Calendar.Quarter'],
            key: `yyyy-'Q'Q`,
            caption: format(new Date(), `yyyy-'Q'Q`)
          },
          {
            semantic: Semantics['Calendar.Year'],
            key: `yyyy`,
            caption: format(new Date(), `yyyy`)
          }
        ]

        const semanticControl = field.parent.fieldGroup.find((fieldGroup) => fieldGroup.key === 'semantic').formControl
        field.props.options = semanticControl.valueChanges.pipe(
          tap(() => field.formControl.setValue(null)),
          startWith(semanticControl.value),
          map((semantic) => formatters.filter((item) => item.semantic === semantic))
        )
      }
    }
  }
}

export function SemanticsAccordionWrapper(i18n) {
  return AccordionWrappers([
    {
      key: 'semantics',
      label: i18n?.Semantics ?? 'Semantics',
      toggleable: true,
      fieldGroupClassName: FORMLY_ROW,
      fieldGroup: [Semantic(i18n), CalendarFormatter(i18n)]
    }
  ])
}

export function KeyExpressionAccordion(COMMON) {
  return {
    key: 'keyExpression',
    label: COMMON?.KeyExpression ?? 'Key Expression',
    toggleable: true,
    fieldGroup: [SQLExpression(COMMON)]
  }
}

export function NameExpressionAccordion(COMMON) {
  return {
    key: 'nameExpression',
    label: COMMON?.NameExpression ?? 'Name Expression',
    toggleable: true,
    fieldGroup: [SQLExpression(COMMON)]
  }
}

export function CaptionExpressionAccordion(COMMON) {
  return {
    key: 'captionExpression',
    label: COMMON?.CaptionExpression ?? 'Caption Expression',
    toggleable: true,
    fieldGroup: [SQLExpression(COMMON)]
  }
}

export function OrdinalExpressionAccordion(COMMON) {
  return {
    key: 'ordinalExpression',
    label: COMMON?.OrdinalExpression ?? 'Ordinal Expression',
    toggleable: true,
    fieldGroup: [SQLExpression(COMMON)]
  }
}

export function ParentExpressionAccordion(COMMON) {
  return {
    key: 'parentExpression',
    label: COMMON?.ParentExpression ?? 'Parent Expression',
    toggleable: true,
    fieldGroup: [SQLExpression(COMMON)]
  }
}

export function MeasureExpressionAccordion(COMMON) {
  return {
    key: 'measureExpression',
    label: COMMON?.MeasureExpression ?? 'Measure Expression',
    toggleable: true,
    fieldGroup: [SQLExpression(COMMON)]
  }
}

export function MeasureFormatting(FORMATTING?) {
  return {
    key: 'formatting',
    wrappers: ['panel'],
    fieldGroupClassName: FORMLY_ROW,
    props: {
      label: FORMATTING?.Title ?? 'Measure Formatting'
    },
    fieldGroup: [
      {
        key: 'shortNumber',
        type: 'checkbox',
        className: FORMLY_W_1_2,
        props: {
          label: FORMATTING?.ShortNumber ?? 'Short Number'
        }
      },
      {
        key: 'decimal',
        type: 'input',
        className: FORMLY_W_1_2,
        props: {
          label: FORMATTING?.DecimalFormatter ?? 'Decimal Formatter'
        }
      },
      {
        key: 'unit',
        type: 'input',
        className: FORMLY_W_1_2,
        props: {
          label: FORMATTING?.Unit ?? 'Unit'
        }
      }
    ]
  }
}
