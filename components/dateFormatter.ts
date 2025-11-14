export const getOrdinalSuffix = (d: number): string => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
};

export const formatStandardDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }); // e.g., "26 Oct 2023"
}

export const formatPrintDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.toLocaleString('default', { month: 'long' });

  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`; // e.g., "26th October 2023"
};

export const formatFullDateTime = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }); // e.g., "26 Oct 2023, 10:00 AM"
}

export const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    // The input value from type="date" is yyyy-mm-dd, which JS Date constructor treats as UTC.
    // By appending T00:00:00 we ensure it's parsed in the user's local timezone.
    const date = new Date(`${dateString}T00:00:00`);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`; // e.g., "26 October, 2023"
};
