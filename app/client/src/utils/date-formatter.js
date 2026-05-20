const SystemDateFormatter = ({ date }) => {
  // 1. Get the system's locale (e.g., "en-US", "de-DE")
  const locale = navigator.language;

  // 2. Create a formatter instance
  // It automatically uses the browser's local timezone
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short', // Includes timezone abbreviation (e.g., EST, CET)
  });

  // 3. Format the date
  return formatter.format(new Date(date));
};

export default SystemDateFormatter;   