# crots — CROnos Time Sheet ⌛

Among the years, I have developed my own time sheet format. Although I'm not
always painstaking enough to click on a start button, I'm very frequently
interrupted in my work. The system I have ended with is to have an entry per
day including the date, the start time of the morning, the duration of the lunch
break, the end time of the day and a description of activities.

**crots** parse this file to create a summary and a report.

An entry can be either one of these 2 formats :
- `2024-01-01 08:30 60 17:30 0 [tag] description`
- `2024-01-06 08:30 12:05 13:00 0 [tag] description`

In other words, the lunch break can be a duration or end and start time.

In addition, some extra time (see the `0`) can be added in case you do something
in the evening. Everything after is the description of the day, which can have a
tag. Any line starting with a `#` should be considered as a comment.

## Installation

Mac, Linux:
```sh
curl -fsSL https://raw.githubusercontent.com/ponsfrilus/crots-timesheet/script/install.sh | sh
```

The releases are here:
https://github.com/ponsfrilus/crots-timesheet/releases/latest

## Format of entries

Option A: `ISO DATE` | `HOUR START` | `MINUTES BREAKS` | `HOUR END` | (`EXTRA`)
(`DESCRIPTION`)

Option B: `ISO DATE` | `HOUR START` | `HOUR END` | `HOUR START` | `HOUR END` |
(`EXTRA`) (`DESCRIPTION`)

- `ISO DATE` e.g. `2024-02-25`  
  The day in ISO format YYYY-MM-DD
- `HOUR START` e.g. `08:00`  
  The time you start your business day, format hh:mm
- `MINUTES BREAKS` e.g. `60`  
  Time taken for lunch or any other breaks, in minutes (mm)
- `HOUR END` e.g. `18:00`  
  The time you end your business day, format hh:mm
- `EXTRA` e.g. `120`  
  In minutes, for adding extras (e.g. you've responded to some emails in the
  evening)
- `DESCRIPTION` e.g. `text`  
  A free description of your business day, that might contains tags
  `[tag1,tags]` and an emoji

## Usage

(WIP) This is how I want to be able to use it, serves as a TODO list for now.

### Configuration

- [ ] `crots --init` create the default configuration
- [ ] `crots --config` display the active configuration
- [ ] `crots --week_hours 42` to configure how many hours you have to officially
      work each week. Use `--save` to store this in the settings.
- [ ] `crots --input_file tests/test.db` path to the file where you enter your
      daily entries. Use `--save` to store this in the settings.
- [ ] `crots --tag holidays vacances,holidays,off` set the keywords used for the
      holidays tags

### Testing

- [ ] `crots test` run the tests
- [ ] `crots check` validate the input file

### Reporting

- [ ] `crots` do all the reporting
- [ ] `crots 2024` do all the reporting for 2024
- [ ] `crots 2024-12` do all the reporting for december 2024
- [ ] `crots --html` create a HTML report
- [ ] `crots --summary` display only the summary
- [ ] `crots (--holidays|--sickness|--at-work|--at-home|--wfh|--leaves`) display
      the days based on tags. See `crots config tag`
