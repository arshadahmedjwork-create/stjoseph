
import { Institution } from './types';

export const INSTITUTION_OPTIONS: { value: Institution; label: string }[] = [
  { value: Institution.SJCBA, label: 'St. Joseph\'s College of Arts & Science (SJCBA)' },
  { value: Institution.SJPUC, label: 'St. Joseph\'s Pre-University College (SJPUC)' },
  { value: Institution.SJIT, label: 'St. Joseph\'s Institute of Technology (SJIT)' },
  { value: Institution.Other, label: 'Other St. Joseph\'s Institution' },
];

export const BATCH_YEAR_OPTIONS = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 10 - i).map(String);
