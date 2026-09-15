import { ExcelRowInput } from '../types';
import { EXCEL_LEADS_AUGUST_PART1 } from './leadsAugustPart1';
import { EXCEL_LEADS_AUGUST_PART2 } from './leadsAugustPart2';
import { EXCEL_LEADS_AUGUST_PART3 } from './leadsAugustPart3';
import { EXCEL_LEADS_AUGUST_PART4 } from './leadsAugustPart4';

export const EXCEL_LEADS_AUGUST: ExcelRowInput[] = [
  ...EXCEL_LEADS_AUGUST_PART1,
  ...EXCEL_LEADS_AUGUST_PART2,
  ...EXCEL_LEADS_AUGUST_PART3,
  ...EXCEL_LEADS_AUGUST_PART4,
];

