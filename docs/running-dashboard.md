---
title: Running dashboard
toc: false
---

```js
import { map } from "./components/map.js";
import { processData } from "./runningDataProcessor.js";

const runningData = await FileAttachment("./data/run_ww_2020_w.csv").csv({
  typed: true,
});

const europe = await FileAttachment("./data/europeUltra.json").json();
const europeanCountries = await FileAttachment(
  "./data/europeanCountries.json"
).json();
const countriesMesh = topojson.feature(europe, europe.objects.europe);

// Filter rows with countries in European countries list and filter outliers from data
const europeanRows = runningData.filter((row) => {
  const country = row.country;
  return europeanCountries.countries.some(
    (euCountry) =>
      euCountry.name === country && row.distance > 0 && row.duration > 0
  );
});

const processedData = processData(europeanRows);

// Create data type select menu
const selectValues = ["Distance", "Pace"];
const dataTypeFilter = view(
  Inputs.select(selectValues, {
    value: "Distance",
    label: "Avg Distance / Avg Pace",
  })
);

// Create data type select menu
const selectCountries = Object.keys(processedData.countries);
const selectedCountry = view(
  Inputs.select(selectCountries, {
    value: selectCountries[0],
    label: "Country selection",
  })
);

function chartPlot(data, dataTypeFilter, selectedCountry, { width }) {
  const ageGroups = Object.values(data.datasetStats.ageGroups);
  const countryAgeGroups = Object.values(
    data.countries[selectedCountry].ageGroups
  );

  // Map age group data with the source attribute
  const countryAgeGroupsMapped = countryAgeGroups.map((group) => ({
    ...group,
    source: selectedCountry,
  }));
  const ageGroupsMapped = ageGroups.map((group) => ({
    ...group,
    source: "European Average",
  }));

  return Plot.plot({
    width,
    y: {
      label: dataTypeFilter,
      grid: true,
    },
    x: {
      label: "Age group",
      tickRotate: -30,
    },
    marginBottom: 80,
    color: { legend: true }, // Enable legend
    marks: [
      Plot.barY(countryAgeGroupsMapped, {
        x: (d) => d.group + " " + selectedCountry,
        y: dataTypeFilter === "Distance" ? "distance" : "pace",
        fill: "source", // Color for country-specific data
        tip: true,
        dx: -0.2, // Adjust x-position slightly to the left
        dy: 2,
      }),
      Plot.barY(ageGroupsMapped, {
        x: (d) => d.group + " (EU Avg)",
        y: dataTypeFilter === "Distance" ? "distance" : "pace",
        fill: "source", // Color for European average data
        tip: true,
        dx: 0.2, // Adjust x-position slightly to the right
        dy: 2,
      }),
    ],
  });
}

function timelineChart(data, dataTypeFilter, selectedCountry, { width }) {
  const countryMonthlyData = data.countries[selectedCountry].monthlyStats;
  const totalMonthlyData = data.datasetStats.monthlyStats;
  const months = Object.keys(countryMonthlyData);

  // Create an array of objects with month, distance, and pace
  const countryMonthlyDataArray = Object.values(countryMonthlyData).map(
    (month, index) => ({
      month: months[index],
      Distance: parseFloat((month.distance / month.athletes.size).toFixed(2)),
      Pace: parseFloat((month.duration / month.distance).toFixed(2)),
      source: selectedCountry, // Indicate the source of data
    })
  );

  const totalMonthlyDataArray = Object.values(totalMonthlyData).map(
    (month, index) => ({
      month: months[index],
      Distance: parseFloat((month.distance / month.athletes.size).toFixed(2)),
      Pace: parseFloat((month.duration / month.distance).toFixed(2)),
      source: "European Average", // Indicate the source of data
    })
  );

  return Plot.plot({
    title: selectedCountry + "'s monthly division",
    width,
    marginBottom: 60,
    y: { grid: true, label: dataTypeFilter },
    x: {
      domain: [
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
      ],
      tickRotate: -30,
    },
    color: { legend: true },
    marks: [
      Plot.lineY(countryMonthlyDataArray, {
        x: "month",
        y: dataTypeFilter,
        curve: "natural",
        stroke: "source",
        strokeWidth: 2,
      }),
      Plot.dotY(countryMonthlyDataArray, {
        x: "month",
        y: dataTypeFilter,
        tip: true,
        fill: "source",
      }),
      Plot.lineY(totalMonthlyDataArray, {
        x: "month",
        y: dataTypeFilter,
        curve: "natural",
        stroke: "source",
        strokeOpacity: 0.7,
        strokeWidth: 2,
        dx: -2,
        dy: -2,
      }),
    ],
  });
}
```

<style>
  #observablehq-main {
    max-width: 1600px;
  }
  .dashboard-container {
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    width: 100%;
    height: 100%;
    justify-content: center;

  }
    .dashboard-map {
      grid-area: 1 / 1 / 3 / 3;

    }
    .dashboard-line {
      grid-area: 1/3/2/4;

    }
    .dashboard-chart{
      grid-area: 2/3/3/4;

    }

    
    .observablehq--block {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  </style>

<div class="dashboard-container"> 
    <div class="dashboard-map">${
      resize(() => map(countriesMesh, 
        dataTypeFilter,
        processedData, selectedCountry
      ))}
    </div>
    <div class="dashboard-line">${
      resize((width) => timelineChart(processedData, dataTypeFilter, selectedCountry, {width}))
    }
      </div>
      <div class="dashboard-chart">${
        resize((width) =>
          chartPlot(processedData, dataTypeFilter, selectedCountry, {width}))
        }
      </div>
<div>
