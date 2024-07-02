type Settings = {
  'input_file': string;
  'week_hours': number;
};

type weekData = {
  'week_hours': string | number;
  'day_hours_decimal': number;
  'day_milliseconds': number;
  'day_seconds': number;
  'day_minutes': number;
  'day_hours': number;
  'day_hours_human': number;
};

type entry = {
  date: string;
  start_time: string;
  breaks?: number | null;
  end_time: string;
  extra?: number | null;
  description?: string;
  total: number | null;
  balance: number | null;
};
