import { CreateMemoryStoreHandler } from './create-memory-store.handler'
import { LoadStorageFileHandler } from './load-storage-file.handler'
import { LoadStorageSheetHandler } from './load-storage-sheet.handler'

export const CommandHandlers = [LoadStorageFileHandler, LoadStorageSheetHandler, CreateMemoryStoreHandler]
