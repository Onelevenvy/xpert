import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { FormControl } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { BaseEditorDirective } from '@metad/components/editor'
import { CopilotChatMessageRoleEnum } from '@metad/copilot'
import { calcEntityTypePrompt, convertQueryResultColumns, getErrorMessage } from '@metad/core'
import {
  NgmCopilotService,
} from '@metad/ocap-angular/copilot'
import { EntityCapacity, EntitySchemaNode, EntitySchemaType } from '@metad/ocap-angular/entity'
import { nonNullable, uniqBy } from '@metad/ocap-core'
import { serializeName } from '@metad/ocap-sql'
import { Store } from 'apps/cloud/src/app/@core'
import { TranslationBaseComponent } from 'apps/cloud/src/app/@shared'
import { cloneDeep, isEqual, isPlainObject } from 'lodash-es'
import { nanoid } from 'nanoid'
import { NGXLogger } from 'ngx-logger'
import { NgxPopperjsPlacements, NgxPopperjsTriggers } from 'ngx-popperjs'
import { BehaviorSubject, EMPTY, Observable, Subscription, combineLatest, firstValueFrom, of } from 'rxjs'
import { catchError, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators'
import { FeaturesComponent } from '../../../../features.component'
import { ModelComponent } from '../../model.component'
import { SemanticModelService } from '../../model.service'
import { MODEL_TYPE, QueryResult } from '../../types'
import { quoteLiteral } from '../../utils'
import { QueryLabService } from '../query-lab.service'
import { QueryService } from './query.service'
import { QueryCopilotEngineService } from './copilot.service'
import { injectQueryCommand } from '../../copilot'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'pac-model-query',
  templateUrl: 'query.component.html',
  styleUrls: ['query.component.scss'],
  providers: [QueryService, QueryCopilotEngineService]
})
export class QueryComponent extends TranslationBaseComponent {
  MODEL_TYPE = MODEL_TYPE
  NgxPopperjsTriggers = NgxPopperjsTriggers
  NgxPopperjsPlacements = NgxPopperjsPlacements
  EntityCapacity = EntityCapacity

  readonly #queryService = inject(QueryService)
  private readonly modelComponent = inject(ModelComponent)
  public readonly modelService = inject(SemanticModelService)
  public readonly queryLabService = inject(QueryLabService)
  readonly copilotService = inject(NgmCopilotService)
  private readonly _cdr = inject(ChangeDetectorRef)
  private readonly route = inject(ActivatedRoute)
  // private readonly _toastrService = inject(ToastrService)
  private readonly store = inject(Store)
  readonly #logger = inject(NGXLogger)
  readonly featuresComponent = inject(FeaturesComponent)
  readonly #copilotEngine = inject(QueryCopilotEngineService)
  readonly #destroyRef = inject(DestroyRef)

  @ViewChild('editor') editor!: BaseEditorDirective

  themeName = toSignal(this.store.preferredTheme$.pipe(map((theme) => theme?.split('-')[0])))

  get dataSourceName() {
    return this.modelService.originalDataSource?.options.key
  }

  get dbInitialization() {
    return this.modelService.modelSignal()?.dbInitialization
  }

  textSelection: {
    range: {
      startLineNumber: number
      startColumn: number
      endLineNumber: number
      endColumn: number
      selectionStartLineNumber: number
    }
    text: string
  }
  get selectedStatement() {
    return this.textSelection?.text || this.statement
  }

  // Copilot
  prompt = new FormControl<string>(null)
  answering = signal(false)
  // private entityTypes: EntityType[]
  /**
   * @deprecated tranform to copilot command
   */
  private get promptTables() {
    return this.entityTypes()?.map((entityType) => {
      return `${this.isMDX() ? 'Cube' : 'Table'} name: "${entityType.name}",
caption: "${entityType.caption}",
${this.isMDX() ? 'dimensions and measures' : 'columns'} : [${Object.keys(entityType.properties)
        .map(
          (key) =>
            `${serializeName(key, entityType.dialect)} ${entityType.properties[key].dataType}` +
            (entityType.properties[key].caption ? ` ${entityType.properties[key].caption}` : '')
        )
        .join(', ')}]`
    })
  }
  /**
   * @deprecated tranform to copilot command
   */
  get #promptCubes() {
    return this.entityTypes()?.map((entityType) => {
      return `Cube name: [${entityType.name}],
Cube info is:
\`\`\`json
${calcEntityTypePrompt(entityType)}
\`\`\`
`
    })
  }

  readonly copilotContext = computed(() => {
    return {
      dialect: this.entityTypes()[0]?.dialect,
      isMDX: this.isMDX(),
      entityTypes: this.entityTypes()
    }
  })

  public readonly queryId$ = this.route.paramMap.pipe(
    startWith(this.route.snapshot.paramMap),
    map((paramMap) => paramMap.get('id')),
    filter((value) => !!value),
    map(decodeURIComponent),
    distinctUntilChanged()
  )

  public readonly queryState$ = this.queryId$.pipe(
    switchMap((id) => this.queryLabService.selectQuery(id)),
    filter((value) => !!value),
    shareReplay(1)
  )
  public readonly query$ = this.queryState$.pipe(
    map((state) => state.query),
    shareReplay(1)
  )
  public readonly results$ = this.queryState$.pipe(
    map((state) => state.results),
    shareReplay(1)
  )

  readonly statementSignal = toSignal(this.query$.pipe(map((query) => query.statement)))
  readonly _statement = signal('')
  get statement() {
    return this._statement()
  }
  set statement(value) {
    this.onStatementChange(value)
  }

  public readonly tables$ = this.modelService.selectDBTables()
  public readonly conversations$ = this.query$.pipe(map((query) => query.conversations))

  // for results table
  public readonly loading$ = new BehaviorSubject<boolean>(false)
  // error: string

  readonly _error = signal('')
  readonly querySubscription = signal<Subscription>(null)

  /**
  |--------------------------------------------------------------------------
  | Signals
  |--------------------------------------------------------------------------
  */
  // 当前使用 MDX 查询
  readonly modelType = toSignal(this.modelService.modelType$)
  readonly isMDX = computed(() => this.modelType() === MODEL_TYPE.XMLA)
  readonly useSaveAsSQL = computed(() => this.modelType() === MODEL_TYPE.SQL)
  readonly isWasm = toSignal(this.modelService.isWasm$)
  readonly entities = toSignal(this.query$.pipe(map((query) => query.entities ?? [])))
  readonly entityTypes = toSignal(
    this.query$.pipe(
      map((query) => query.entities ?? []),
      switchMap((entities) =>
        combineLatest(entities.map((entity) => this.modelService.selectOriginalEntityType(entity)))
      )
    )
  )
  readonly queryKey = toSignal(this.queryId$)

  readonly dbTablesPrompt = computed(() =>
    this.isMDX()
      ? `The source dialect is ${this.entityTypes()[0]?.dialect}, the cubes information are ${this.#promptCubes?.join(
          '\n'
        )}`
      : `The database dialect is ${
          this.entityTypes()[0]?.dialect
        }, the tables information are ${this.promptTables?.join('\n')}`
  )
  sqlEditorActionLabel = toSignal(
    this.translateService.stream('PAC.MODEL.QUERY.EditorActions', {
      Default: {
        Nl2SQL: 'NL 2 SQL',
        Explain: 'Explain',
        Optimize: 'Optimize'
      }
    })
  )
  sqlEditorActions = [
    {
      id: `sql-editor-action-nl-sql`,
      label: computed(() => this.sqlEditorActionLabel().Nl2SQL),
      action: (text, options) => {
        const statement = text || this.statement
        if (statement) {
          this.answering.set(true)
          this.nl2SQL(statement).subscribe((result) => {
            this.answering.set(false)
            const lines = this.statement.split('\n')
            const endLineNumber = text ? options.selection.endLineNumber : lines.length
            lines.splice(endLineNumber, 0, result)
            this.statement = lines.join('\n')
          })
        }
      }
    },
    {
      id: `sql-editor-action-explain-sql`,
      label: computed(() => this.sqlEditorActionLabel().Explain),
      action: (text, options) => {
        const statement = text || this.statement
        if (statement) {
          this.answering.set(true)
          this.explainSQL(statement).subscribe((result) => {
            this.answering.set(false)
            const startLineNumber = text ? options.selection.startLineNumber : 1
            const lines = this.statement.split('\n')
            lines.splice(startLineNumber - 1, 0, `/**\n${result}\n*/`)
            this.statement = lines.join('\n')
          })
        }
      }
    },
    {
      id: `sql-editor-action-optimize-sql`,
      label: computed(() => this.sqlEditorActionLabel().Optimize),
      action: (text, options) => {
        const statement = text || this.statement
        if (statement) {
          this.answering.set(true)
          this.optimizeSQL(statement).subscribe((result) => {
            this.answering.set(false)
            this.statement = this.statement.replace(statement, result)
          })
        }
      }
    }
  ]

  get results() {
    return this.queryLabService.results[this.queryKey()]
  }
  set results(value) {
    this.queryLabService.results[this.queryKey()] = value
  }
  get activeResult() {
    return this.queryLabService.activeResults[this.queryKey()]
  }
  set activeResult(value) {
    this.queryLabService.activeResults[this.queryKey()] = value
  }
  get dirty() {
    return this.queryLabService.dirty[this.queryKey()]
  }
  set dirty(value) {
    this.queryLabService.dirty[this.queryKey()] = value
  }

  /**
  |--------------------------------------------------------------------------
  | Copilot
  |--------------------------------------------------------------------------
  */
  #queryCommand = injectQueryCommand(this._statement, this.copilotContext, async (statement: string) => {
    return await firstValueFrom(this._query(statement))
  })
  //   d = injectCopilotCommand({
  //     name: 'query',
  //     description: this.translateService.instant('PAC.MODEL.Copilot.Examples.QueryDBDesc', {
  //       Default: 'Describe the data you want to query'
  //     }),
  //     systemPrompt: async () =>
  //       this.isMDX()
  //         ? `Assuming you are an expert in MDX programming, provide a prompt if the system does not offer information on the cubes.
  // The cube information is:
  // \`\`\`
  // ${this.dbTablesPrompt()}
  // \`\`\`
  // Please provide the corresponding MDX statement for the given question.
  // `
  //         : `Assuming you are an expert in SQL programming, provide a prompt if the system does not offer information on the database tables.
  // The table information is:
  // \`\`\`
  // ${this.dbTablesPrompt()}
  // \`\`\`
  // Please provide the corresponding SQL statement for the given question.
  // Note: Table fields are case-sensitive and should be enclosed in double quotation marks.`,
  //     // `假设你是数据库 SQL 编程专家, 如果 system 未提供 database tables information 请给出提示, ${this.dbTablesPrompt()}, 请给出问题对应的 sql 语句 (注意：表字段区分大小写，需要用双引号括起来)。 `
  //     actions: [
  //       injectMakeCopilotActionable({
  //         name: 'query-db',
  //         description: 'query db using statement',
  //         argumentAnnotations: [
  //           {
  //             name: 'query',
  //             type: 'string',
  //             description: `query extracting info to answer the user's question.
  // statement should be written using this database schema.
  // The query should be returned in plain text, not in JSON.
  // `,
  //             required: true
  //           }
  //         ],
  //         implementation: async (query: string) => {
  //           // Set into editor
  //           this.statement = query
  //           // Run query on db
  //           this.query(query)
  //           // Return to message content
  //           return query
  //         }
  //       })
  //     ]
  //   })

//   #fixCommand = injectCopilotCommand({
//     name: 'fix',
//     description: this.translateService.instant('PAC.MODEL.Copilot.Examples.FixQueryDesc', {
//       Default: 'Describe how to fix the statement'
//     }),
//     systemPrompt: async () => {
//       return `Fix the statement of db query:
// \`\`\`
// ${this.selectedStatement}
// \`\`\`
// `
//     },
//     actions: [
//       injectMakeCopilotActionable({
//         name: 'fix_query',
//         description: 'Fix the statement of db query',
//         argumentAnnotations: [
//           {
//             name: 'statement',
//             type: 'string',
//             description: `
// statement should be written using this database schema.
// The query should be returned in plain text, not in JSON.
// `,
//             required: true
//           }
//         ],
//         implementation: async (statement: string) => {
//           this.#logger.debug(`Copilot_Action:fix_query('${statement}')`)
//           this.statement = this.statement.replace(this.selectedStatement, statement)
//           // Return to message content
//           return statement
//         }
//       })
//     ]
//   })

  /**
  |--------------------------------------------------------------------------
  | Subscribers
  |--------------------------------------------------------------------------
  */
  private dirtySub = this.queryState$.pipe(takeUntilDestroyed()).subscribe((state) => {
    this.dirty = !isEqual(state.origin, state.query)
  })
  #conversationSub = this.#queryService
    .select((state) => state.query?.conversations ?? [])
    .pipe(takeUntilDestroyed())
    .subscribe((conversations) => {
      this.#copilotEngine.conversations$.set(cloneDeep(conversations))
    })

  constructor() {
    super()

    effect(
      () => {
        if (this.#queryService.initialized()) {
          if (!isEqual(this.#queryService.conversations(), this.#copilotEngine.conversations())) {
            this.#queryService.setConversations(this.#copilotEngine.conversations())
          }
        }
      },
      { allowSignalWrites: true }
    )

    // Set individual engine to global copilot chat
    this.featuresComponent.copilotEngine = this.#copilotEngine
    this.#destroyRef.onDestroy(() => {
      this.featuresComponent.copilotEngine = null
    })

    // Sync statement in local and store
    effect(
      () => {
        if (nonNullable(this.statementSignal())) {
          this._statement.set(this.statementSignal())
        }
      },
      { allowSignalWrites: true }
    )

    effect(
      () => {
        if (nonNullable(this._statement())) {
          this.queryLabService.setStatement({ key: this.queryKey(), statement: this._statement() })
        }
      },
      { allowSignalWrites: true }
    )
  }

  onSelectionChange(event) {
    this.textSelection = event
  }

  editorDropPredicate(event: CdkDrag<EntitySchemaNode>) {
    // 排除 query results 拖进来
    return !['pac-model__query-results'].includes(event.dropContainer.id)
  }

  executeQuery(statement: string) {
    this._error.set(null)
    if (statement) {
      this.loading$.next(true)
    } else {
      this.loading$.next(false)
    }

    this.querySubscription()?.unsubscribe()
    if (statement) {
      const subscription = this._query(statement).subscribe()
      this.querySubscription.set(subscription)
    } else {
      this.querySubscription.set(null)
    }
  }

  _query(statement: string) {
    return this.modelService.originalDataSource.query({ statement, forceRefresh: true }).pipe(
      tap((result) => {
        const { status, error, schema } = result
        let { data } = result

        if (status === 'ERROR' || error) {
          // console.error(error)
          this._error.set(error || status)

          this.appendResult({
            statement,
            error
          })

          this._cdr.detectChanges()
          return
        }

        try {
          const columns = convertQueryResultColumns(schema)

          if (isPlainObject(data)) {
            data = [data]
          }
          if (columns.length === 0 && data.length > 0) {
            columns.push(...typeOfObj(data[0]))
          }

          let preview = data
          if (data?.length > 1000) {
            preview = data.slice(0, 1000)
          }

          this.appendResult({
            statement,
            data,
            columns: uniqBy(columns, 'name'),
            preview,
            stats: {
              numberOfEntries: data?.length ?? 0
            }
          })

          this.loading$.next(false)
          // this._cdr.detectChanges()
        } catch (err) {
          console.error(err)
        }
      }),
      catchError((error) => {
        this._error.set(getErrorMessage(error))
        this.appendResult({
          statement,
          error
        })
        this.loading$.next(false)
        // this._cdr.detectChanges()
        return of({
          error: error
        })
      }),
    )
  }

  // query = effectAction((origin$: Observable<string>) => {
  //   return origin$.pipe(
  //     tap((statement) => {
  //       if (statement) {
  //         this.error = null
  //         this.loading$.next(true)
  //       } else {
  //         this.error = null
  //         this.loading$.next(false)
  //       }
  //     }),
  //     switchMap((statement) =>
  //       statement
  //         ? this.modelService.originalDataSource.query({ statement, forceRefresh: true }).pipe(
  //             catchError((error) => {
  //               this.error = error
  //               this.appendResult({
  //                 statement,
  //                 error
  //               })
  //               this.loading$.next(false)
  //               this._cdr.detectChanges()
  //               return EMPTY
  //             }),
  //             tap((result) => {
  //               const { status, error, schema } = result
  //               let { data } = result

  //               if (status === 'ERROR' || error) {
  //                 console.error(error)
  //                 this.error = error || status

  //                 this.appendResult({
  //                   statement,
  //                   error
  //                 })

  //                 this._cdr.detectChanges()
  //                 return
  //               }

  //               try {
  //                 const columns = convertQueryResultColumns(schema)

  //                 if (isPlainObject(data)) {
  //                   data = [data]
  //                 }
  //                 if (columns.length === 0 && data.length > 0) {
  //                   columns.push(...typeOfObj(data[0]))
  //                 }

  //                 let preview = data
  //                 if (data?.length > 1000) {
  //                   preview = data.slice(0, 1000)
  //                 }

  //                 this.appendResult({
  //                   statement,
  //                   data,
  //                   columns: uniqBy(columns, 'name'),
  //                   preview,
  //                   stats: {
  //                     numberOfEntries: data?.length ?? 0
  //                   }
  //                 })

  //                 this.loading$.next(false)
  //                 this._cdr.detectChanges()
  //               } catch (err) {
  //                 console.error(err)
  //               }
  //             })
  //           )
  //         : EMPTY
  //     )
  //   )
  // })

  cancelQuery() {
    this.executeQuery('')
  }

  appendResult(result: QueryResult) {
    this.results = this.results ?? []
    this.results.push(result)
    this.activeResult = this.results[this.results.length - 1]
  }

  async run() {
    const statement: string = this.editor.getSelectText()?.trim() || this.statement
    this.executeQuery(statement)
  }

  async onEditorKeyDown(event) {
    if (event.code === 'F8') {
      await this.run()
    }
  }

  onStatementChange(event: string) {
    if (this.queryKey()) {
      this.queryLabService.setStatement({ key: this.queryKey(), statement: event })
    }
  }

  /**
   * 另存为 SQL Model
   */
  saveAsModel() {
    this.modelComponent.createByExpression(this.statement)
  }

  async saveAsDBScript() {
    const statement: string = this.editor.getSelectText()?.trim() || this.statement
    this.modelService.updateModel({ dbInitialization: statement })
  }

  dropEntity(event: CdkDragDrop<{ name: string }[]>) {
    if (event.previousContainer.id === 'pac-model-entitysets') {
      if (event.item.data?.name) {
        this.queryLabService.addEntity({
          key: this.queryKey(),
          entity: event.item.data?.name,
          currentIndex: event.currentIndex
        })
      }
    } else if (event.container === event.previousContainer) {
      this.queryLabService.moveEntityInQuery({ key: this.queryKey(), event })
    }
  }

  drop(event: CdkDragDrop<{ name: string }[]>) {
    const text = event.item.data?.name
    if (text) {
      this.editor.insert(text)
    }
  }

  /**
   * Drop in query results
   *
   * @param event
   */
  async dropTable(event: CdkDragDrop<{ name: string }[]>) {
    const modelType = await firstValueFrom(this.modelService.modelType$)
    const dialect = this.modelService.originalDataSource.options.dialect
    let statement = ''
    if (modelType === MODEL_TYPE.XMLA) {
      statement = await this.getXmlaQueryStatement(event.item.data)
    } else {
      if (event.item.data) {
        if (event.item.data.type === EntitySchemaType.Member) {
          statement = `SELECT * FROM ${serializeName(event.item.data.entity, dialect)} WHERE ${serializeName(
            event.item.data.dimension,
            dialect
          )} = ${quoteLiteral(event.item.data.memberKey)}`
        } else if (event.item.data.type === EntitySchemaType.Dimension) {
          statement = `SELECT DISTINCT ${serializeName(event.item.data.column, dialect)} FROM ${serializeName(
            event.item.data.entity,
            dialect
          )}`
        } else if (event.item.data.type === EntitySchemaType.IMeasure) {
          statement = `SELECT SUM(${serializeName(event.item.data.name, dialect)}), AVG(${serializeName(
            event.item.data.name,
            dialect
          )}), MAX(${serializeName(event.item.data.name, dialect)}), MIN(${serializeName(
            event.item.data.name,
            dialect
          )}) FROM ${serializeName(event.item.data.entity, dialect)}`
        } else {
          statement = `SELECT * FROM ${serializeName(event.item.data.name, dialect)} LIMIT 1000`
        }
      }
    }

    if (statement) {
      this.executeQuery(statement)
    }
  }

  async getXmlaQueryStatement(data) {
    if (data.cubeType === 'CUBE' || data.cubeType === 'QUERY CUBE') {
      return `SELECT {[Measures].Members} ON COLUMNS FROM [${data.name}]`
    } else if ((<EntitySchemaNode>data).type === EntitySchemaType.Entity) {
      return `SELECT {[Measures].Members} ON COLUMNS FROM [${data.name}]`
    } else if ((<EntitySchemaNode>data).type === EntitySchemaType.Dimension) {
      return `SELECT {[Measures].Members} ON COLUMNS, {${data.name}.Members} ON ROWS FROM [${data.entity}]`
    } else if (
      (<EntitySchemaNode>data).type === EntitySchemaType.Hierarchy ||
      (<EntitySchemaNode>data).type === EntitySchemaType.Level
    ) {
      return `SELECT {[Measures].Members} ON COLUMNS, {${data.name}.${data.allMember || 'Members'}} ON ROWS FROM [${
        data.cubeName
      }]`
    } else if ((<EntitySchemaNode>data).type === EntitySchemaType.Member) {
      return `SELECT {[Measures].Members} ON COLUMNS, {${data.raw.memberUniqueName}} ON ROWS FROM [${data.raw.cubeName}]`
    } else if ((<EntitySchemaNode>data).type === EntitySchemaType.Field) {
      return `SELECT {[Measures].Members} ON COLUMNS, {${data.levelUniqueName}.Members} DIMENSION PROPERTIES ${data.name} ON ROWS FROM [${data.cubeName}]`
    }

    return ``
  }

  entityDeletePredicate(item: CdkDrag<EntitySchemaNode>) {
    return item.data?.type === EntitySchemaType.Entity
  }

  deleteEntity(event: CdkDragDrop<{ name: string }[]>) {
    this.queryLabService.removeEntity({ key: this.queryKey(), entity: event.item.data.name })
  }

  deleteResult(i: number) {
    let index = this.results.indexOf(this.activeResult)
    this.results.splice(i, 1)
    if (index >= i) {
      index--
    }
    if (index === -1) {
      index = 0
    }
    this.activeResult = this.results[index]
  }

  closeAllResults() {
    this.results = []
    this.activeResult = null
  }

  save() {
    this.queryLabService.save(this.queryKey())
  }

  triggerFormat() {
    this.editor.formatDocument()
  }

  triggerCompress() {
    this.editor.compressDocument()
  }

  triggerClear() {
    this.editor.clearDocument()
  }

  triggerFind() {
    this.editor.startFindAction()
  }

  triggerUndo() {
    this.editor.undo()
  }

  triggerRedo() {
    this.editor.redo()
  }

  onConversationsChange(event) {
    this.queryLabService.setConversations({ key: this.queryKey(), conversations: event })
  }

  // async dropCopilot(event: CdkDragDrop<any[], any[], any>) {
  //   const data = event.item.data
  //   if (event.previousContainer.id === 'pac-model__query-entities' && (<EntitySchemaNode>data).type === 'Entity') {
  //     const entityType = await firstValueFrom(this.modelService.selectOriginalEntityType((<EntitySchemaNode>data).name))
  //     this.copilotChat.addMessage({
  //       id: nanoid(),
  //       role: CopilotChatMessageRoleEnum.User,
  //       content: calcEntityTypePrompt(entityType)
  //     })
  //   } else if (event.previousContainer.id === 'pac-model__query-results') {
  //     this.copilotChat.addMessage({
  //       id: nanoid(),
  //       role: CopilotChatMessageRoleEnum.User,
  //       data: {
  //         columns: data.columns,
  //         content: data.preview
  //       },
  //       content:
  //         data.columns.map((column) => column.name).join(',') +
  //         `\n` +
  //         data.preview.map((row) => data.columns.map((column) => row[column.name]).join(',')).join('\n')
  //     })
  //   }
  // }

  onCopilotCopy(text: string) {
    this.editor.appendText(text)
  }

  export() {
    this._export('QueryLabResult', this.activeResult.data, this.activeResult.columns)
  }

  async _export(name: string, data: any[], COLUMNS) {
    const xlsx = await import('xlsx')

    const hNameRow = {}
    const headerRow = {}
    COLUMNS.forEach(({ name, label }) => {
      hNameRow[name] = name
      headerRow[name] = label || name
    })

    data = data.map((item) => {
      const row = {}
      COLUMNS.forEach((col) => {
        row[col.name] = item[col.name]
      })
      return row
    })

    /* generate worksheet */
    const ws /**: xlsx.WorkSheet */ = xlsx.utils.json_to_sheet([headerRow, ...data], {
      header: COLUMNS.map(({ name }) => name),
      skipHeader: true
    })

    /* generate workbook and add the worksheet */
    const wb /**: XLSX.WorkBook */ = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1')

    let fileName = `${name}.xlsx`
    /* save to file */
    xlsx.writeFile(wb, fileName)
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'F8') {
      this.run()
      event.preventDefault()
    }
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 's' || event.key === 'S')) {
      this.saveAsModel()
      event.preventDefault()
    }
    if ((event.metaKey || event.ctrlKey) && (event.key === 's' || event.key === 'S')) {
      this.save()
      event.preventDefault()
    }
  }

  nl2SQL(sql: string): Observable<string> {
    return this.copilotService
      .chatCompletions([
        {
          id: nanoid(),
          role: CopilotChatMessageRoleEnum.System,
          content: `假如你是一个数据库管理员，已知数据库信息有：\n${this.dbTablesPrompt()}`
        },
        {
          id: nanoid(),
          role: CopilotChatMessageRoleEnum.User,
          content: `请根据给定的表信息和要求给出相应的SQL语句(仅输出 sql 语句)， 要求：\n${sql}，答案：`
        }
      ])
      .pipe(map(({ choices }) => choices[0]?.message?.content))
  }

  explainSQL(sql: string): Observable<string> {
    return this.copilotService
      .chatCompletions([
        {
          id: nanoid(),
          role: CopilotChatMessageRoleEnum.System,
          content: `假如你是一个数据库管理员，已知数据库信息有：\n${this.dbTablesPrompt()}`
        },
        {
          id: nanoid(),
          role: CopilotChatMessageRoleEnum.User,
          content: `请根据给定的表信息解释一下这个SQL语句：\n${sql}`
        }
      ])
      .pipe(map(({ choices }) => choices[0]?.message?.content))
  }

  optimizeSQL(sql: string): Observable<string> {
    return this.copilotService
      .chatCompletions([
        {
          id: nanoid(),
          role: CopilotChatMessageRoleEnum.System,
          content: `假如你是一个数据库管理员，已知数据库信息有：\n${this.dbTablesPrompt()}`
        },
        {
          id: nanoid(),
          role: CopilotChatMessageRoleEnum.User,
          content: `请根据给定的表信息优化一下这个SQL语句(仅输出 sql 语句)：\n${sql}`
        }
      ])
      .pipe(map(({ choices }) => choices[0]?.message?.content))
  }
}

/**
 * 根据 SQL 查询结果对象分析出字段类型
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
 *
 * @param obj
 * @returns
 */
export function typeOfObj(obj) {
  return Object.entries(obj).map(([key, value]) => ({
    name: key,
    type: value === null || value === undefined ? null : typeof value
  }))
}
