import { SpirographParams, Mode, Shape } from '../types';

export const serializeParamsToQueryString = (params: SpirographParams): string => {
  const searchParams = new URLSearchParams();
  
  // Serialize core parameters
  searchParams.set('R', params.R.toString());
  searchParams.set('r', params.r.toString());
  searchParams.set('d', params.d.toString());
  // Strip # for cleaner URL if present
  searchParams.set('c', params.color.replace('#', ''));
  searchParams.set('s', params.speed.toString());
  searchParams.set('m', params.mode);
  searchParams.set('sh', params.shape);
  searchParams.set('w', params.strokeWidth.toString());
  searchParams.set('e', params.elongation.toString());

  return searchParams.toString();
};

export const parseParamsFromQueryString = (search: string): Partial<SpirographParams> => {
  const searchParams = new URLSearchParams(search);
  const result: Partial<SpirographParams> = {};

  const parseNum = (key: string) => {
    const val = searchParams.get(key);
    return val ? Number(val) : undefined;
  };

  const R = parseNum('R');
  if (R && !isNaN(R)) result.R = R;

  const r = parseNum('r');
  if (r && !isNaN(r)) result.r = r;

  const d = parseNum('d');
  if (d && !isNaN(d)) result.d = d;

  const c = searchParams.get('c');
  if (c) {
    // Add # back if missing
    result.color = c.startsWith('#') ? c : '#' + c;
  }

  const s = parseNum('s');
  if (s && !isNaN(s)) result.speed = s;

  const m = searchParams.get('m');
  if (m === Mode.INNER || m === Mode.OUTER) result.mode = m as Mode;

  const sh = searchParams.get('sh');
  if (sh && Object.values(Shape).includes(sh as Shape)) result.shape = sh as Shape;

  const w = parseNum('w');
  if (w && !isNaN(w)) result.strokeWidth = w;

  const e = parseNum('e');
  if (e && !isNaN(e)) result.elongation = e;

  return result;
};