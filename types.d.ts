interface crotsSettings {
  file: string;
  week_hours: number;
}

interface weekData {
  week_hours: string | number;
  day_hours_decimal: number;
  day_milliseconds: number;
  day_seconds: number;
  day_minutes: number;
  day_hours: number;
  day_hours_human: number;
}

interface entry {
  date: string;
  start_time: string;
  breaks?: number | null;
  end_time: string;
  extra?: number | null;
  description?: string;
  description_parsed?: descriptionParsed;
  total: number | null;
  balance: number;
}

interface descriptionParsed {
  tags?: string[];
  emojis?: string;
  descs?: string[];
}

interface week {
  total_minutes: number;
  total_hours: number;
}

// Monthly data
type MonthlyData = {
  total_minutes: number;
  total_hours: number;
};

// Month's type
type Months = {
  [month: string]: MonthlyData;
};

// Year's type
type YearData = {
  [year: string]: Months;
};
