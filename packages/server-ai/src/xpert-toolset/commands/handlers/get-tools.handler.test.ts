import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ToolsetGetToolsHandler } from './get-tools.handler';
import { XpertToolsetService } from '../../xpert-toolset.service';
import { ToolsetGetToolsCommand } from '../get-tools.command';
import { createToolset } from '../../toolset';
import { XpertToolset } from '../../xpert-toolset.entity';
import { In } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs'
import { ApiBasedToolSchemaParser } from '../../utils/parser';
import { ApiToolBundle } from '@metad/contracts';

describe('ToolsetGetToolsHandler', () => {
  let handler: ToolsetGetToolsHandler;
  let toolsetService: XpertToolsetService;
  let toolBundles: ApiToolBundle[]

  beforeAll(() => {
    const yamlPath = path.join(__dirname, '../../provider/openapi/open-meteo/oas.yaml')
    const yamlContent = fs.readFileSync(yamlPath, 'utf8')
    toolBundles = ApiBasedToolSchemaParser.parseOpenapiYamlToToolBundle(yamlContent)
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsetGetToolsHandler,
        {
          provide: XpertToolsetService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({ items: [] }),
          },
        },
        {
          provide: CommandBus,
          useValue: {},
        },
      ],
    }).compile();

    handler = module.get<ToolsetGetToolsHandler>(ToolsetGetToolsHandler);
    toolsetService = module.get<XpertToolsetService>(XpertToolsetService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should call toolsetService.findAll with correct parameters', async () => {
	const ids = ['1', '2']
    const command = new ToolsetGetToolsCommand(ids);
    await handler.execute(command);
    expect(toolsetService.findAll).toHaveBeenCalledWith({
      where: {
        id: In(ids)
      },
    });
  });

  it('should return an array of toolsets', async () => {

    const mockToolsets = [{
      id: '1',
      type: 'openapi',
      credentials: {

      },
      tools: [
        {
          options: {
            api_bundle: toolBundles[0]
          }
        }
      ]
    }, { id: '2' }] as XpertToolset[];
    jest.spyOn(toolsetService, 'findAll').mockResolvedValueOnce({ total: 2, items: mockToolsets });

    const command = new ToolsetGetToolsCommand(['1', '2']);
    const result = await handler.execute(command);


    expect(result).toEqual(mockToolsets.map(toolset => createToolset(toolset)));
  });
});