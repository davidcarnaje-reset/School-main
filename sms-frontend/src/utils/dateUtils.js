// src/utils/dateUtils.js
export const getActiveSchoolYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  if (currentMonth >= 5 && currentMonth <= 11) {
    return {
      syStart: currentYear,
      syEnd: currentYear + 1,
      semester: currentMonth <= 9 ? "1st Semester" : "2nd Semester"
    };
  } else if (currentMonth >= 0 && currentMonth <= 2) {
    return { syStart: currentYear - 1, syEnd: currentYear, semester: "2nd Semester" };
  } else {
    return { syStart: currentYear - 1, syEnd: currentYear, semester: "Summer Classes" };
  }
};