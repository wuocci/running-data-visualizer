export function processData(data) {
  const result = {
    datasetStats: {
      totalAthletes: 0,
      totalDistance: 0,
      totalDuration: 0,
      avgYearlyPace: 0,
      monthlyStats: {},
      ageGroups: {},
    },
    countries: {},
  };

  // Calculate total distance and duration
  data.forEach((entry) => {
    result.datasetStats.totalDistance += parseFloat(entry.distance);
    result.datasetStats.totalDuration += parseFloat(entry.duration);
  });

  // Calculate total athletes
  result.datasetStats.totalAthletes = new Set(
    data.map((entry) => entry.athlete)
  ).size;

  // Function to calculate average pace by age group
  const calculateAveragePaceByAgeGroup = (data) => {
    const paceByAgeGroup = {};
    const totalPaceByAgeGroup = {};
    const totalDistanceByAgeGroup = {};
    const totalAthletesByAgeGroup = {};

    data.forEach((entry) => {
      const distance = parseFloat(entry.distance);
      const duration = parseFloat(entry.duration);
      const ageGroup = entry.age_group;
      const athlete = entry.athlete;
      if (
        !isNaN(distance) &&
        !isNaN(duration) &&
        ageGroup &&
        duration !== 0 &&
        distance !== 0
      ) {
        const pace = duration / distance;
        if (!paceByAgeGroup[ageGroup]) {
          paceByAgeGroup[ageGroup] = {};
          totalPaceByAgeGroup[ageGroup] = 0;
          totalDistanceByAgeGroup[ageGroup] = 0;
          totalAthletesByAgeGroup[ageGroup] = new Set();
        }
        if (!paceByAgeGroup[ageGroup][athlete]) {
          paceByAgeGroup[ageGroup][athlete] = 0;
          totalAthletesByAgeGroup[ageGroup].add(athlete);
        }
        paceByAgeGroup[ageGroup][athlete] += pace;
        totalPaceByAgeGroup[ageGroup] += duration;
        totalDistanceByAgeGroup[ageGroup] += distance;
      }
    });

    const averagePaceByAgeGroup = {};
    Object.keys(paceByAgeGroup).forEach((ageGroup) => {
      const totalPace = totalPaceByAgeGroup[ageGroup];
      const totalAthletes = totalAthletesByAgeGroup[ageGroup].size;
      const totalDistance = totalDistanceByAgeGroup[ageGroup];
      const averagePace = totalPace / totalDistance;
      averagePaceByAgeGroup[ageGroup] = {
        group: ageGroup,
        pace: parseFloat(averagePace.toFixed(2)),
        distance: parseFloat((totalDistance / totalAthletes / 12).toFixed(2)),
        totalAthletes: totalAthletes,
      };
    });

    return averagePaceByAgeGroup;
  };

  // Populate datasetStats with average pace by age group
  const overallAgeGroupStats = calculateAveragePaceByAgeGroup(data);
  result.datasetStats.ageGroups = overallAgeGroupStats;

  // Function to calculate average yearly pace and distance
  const calculateAvgYearlyStats = (data) => {
    const totalEntries = data.length;
    let totalPace = 0;
    let totalDistance = 0;

    data.forEach((entry) => {
      const distance = parseFloat(entry.distance);
      const duration = parseFloat(entry.duration);
      if (!isNaN(distance) && !isNaN(duration)) {
        totalPace += duration / distance;
        totalDistance += distance;
      }
    });

    return {
      avgYearlyPace: totalEntries > 0 ? totalPace / totalEntries : 0,
      avgYearlyDistance: totalEntries > 0 ? totalDistance / totalEntries : 0,
    };
  };

  // Populate datasetStats with average yearly pace and distance
  const yearlyStats = calculateAvgYearlyStats(data);
  result.datasetStats.avgYearlyPace = yearlyStats.avgYearlyPace;
  result.datasetStats.avgYearlyDistance = yearlyStats.avgYearlyDistance;

  // Calculate total distance and duration by country
  const calculateTotalDistanceByCountry = (data) => {
    const distanceByCountry = {};
    data.forEach((entry) => {
      const distance = parseFloat(entry.distance);
      if (!isNaN(distance)) {
        const country = entry.country;
        distanceByCountry[country] =
          (distanceByCountry[country] || 0) + distance;
      }
    });
    return distanceByCountry;
  };

  const calculateTotalDurationByCountry = (data) => {
    const durationByCountry = {};
    data.forEach((entry) => {
      const duration = parseFloat(entry.duration);
      if (!isNaN(duration)) {
        const country = entry.country;
        durationByCountry[country] =
          (durationByCountry[country] || 0) + duration;
      }
    });
    return durationByCountry;
  };

  const totalDistanceByCountry = calculateTotalDistanceByCountry(data);
  const totalDurationByCountry = calculateTotalDurationByCountry(data);

  // Calculate overall monthly totals
  const overallMonthlyData = {};
  data.forEach((entry) => {
    const monthName = getMonthName(entry.datetime.getMonth() + 1); // Get month name
    if (!overallMonthlyData[monthName]) {
      overallMonthlyData[monthName] = {
        distance: 0,
        duration: 0,
        athletes: new Set(),
      };
    }
    overallMonthlyData[monthName].distance += parseFloat(entry.distance);
    overallMonthlyData[monthName].duration += parseFloat(entry.duration);
    overallMonthlyData[monthName].athletes.add(entry.athlete);
  });

  // Populate overall monthly statistics
  result.datasetStats.monthlyStats = overallMonthlyData;

  // Populate countries data
  Object.keys(totalDistanceByCountry).forEach((country) => {
    const totalDistance = totalDistanceByCountry[country];
    const totalDuration = totalDurationByCountry[country];
    // Calculate total athletes for the country
    const uniqueAthletes = new Set(
      data
        .filter((entry) => entry.country === country)
        .map((entry) => entry.athlete)
    );
    const totalAthletes = uniqueAthletes.size;

    result.countries[country] = {
      totalAthletes: totalAthletes,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalDuration: parseFloat(totalDuration.toFixed(2)),
      avgYearlyDistance: yearlyStats.avgYearlyDistance,
      avgYearlyPace: yearlyStats.avgYearlyPace,
      ageGroups: {},
      monthlyStats: {},
    };

    // Calculate monthly totals for the country
    const monthlyData = {};
    data.forEach((entry) => {
      if (entry.country === country) {
        const monthName = getMonthName(entry.datetime.getMonth() + 1); // Get month name
        if (!monthlyData[monthName]) {
          monthlyData[monthName] = {
            distance: 0,
            duration: 0,
            athletes: new Set(),
          };
        }
        monthlyData[monthName].distance += parseFloat(entry.distance);
        monthlyData[monthName].duration += parseFloat(entry.duration);
        monthlyData[monthName].athletes.add(entry.athlete);
      }
    });

    result.countries[country].ageGroups = calculateAveragePaceByAgeGroup(
      data.filter((entry) => entry.country === country)
    );

    // Populate country-specific monthly statistics
    result.countries[country].monthlyStats = monthlyData;
  });

  return result;
}

// Function to get month name from month number (1-12)
function getMonthName(month) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1];
}

export function formatPace(paceDecimal) {
  const minutes = Math.floor(paceDecimal); // Extract whole minutes
  const seconds = Math.round((paceDecimal - minutes) * 60); // Convert remainder to seconds
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds} min/km`;
}
