import * as Plot from "npm:@observablehq/plot";
import { formatPace } from "../runningDataProcessor.js";

// Function to render the map
export function map(
  countriesMesh,
  dataTypeFilter,
  processedData,
  selectedCountry
) {
  return renderMap(
    countriesMesh,
    dataTypeFilter,
    processedData,
    selectedCountry
  );
}

// Function to render the map based on the selected option
function renderMap(
  countriesMesh,
  dataTypeFilter,
  processedData,
  selectedCountry
) {
  const colorLabel =
    dataTypeFilter === "Distance"
      ? "Average monthly distance (km)"
      : "Average pace (min/km)";

  return Plot.plot({
    projection: {
      type: "albers",
      rotate: [-10, -12],
      domain: countriesMesh,
    },
    color: {
      type: "quantize",
      n: 9,
      domain: dataTypeFilter === "Distance" ? [80, 200] : [5, 6],
      scheme: dataTypeFilter === "Distance" ? "oranges" : "blues",
      label: colorLabel,
      legend: true,
    },
    marks: [
      Plot.geo(
        countriesMesh,
        Plot.centroid({
          tip: true,
          channels: {
            Country: (d) => d.properties.NAME,
            Value: (d) => {
              // Find the country data object by its name
              const countryData = processedData.countries[d.properties.NAME];

              // Access the desired property based on the data type filter
              return dataTypeFilter === "Distance"
                ? (
                    countryData.totalDistance /
                    countryData.totalAthletes /
                    12
                  ).toFixed(2) + " km / month"
                : formatPace(
                    (
                      countryData.totalDuration / countryData.totalDistance
                    ).toFixed(2)
                  );
            },
          },
        })
      ),
      Plot.geo(
        countriesMesh,
        Plot.centroid({
          fill: (d) => {
            // Find the country data object by its name
            const countryData = processedData.countries[d.properties.NAME];

            // Access the desired property based on the data type filter
            return dataTypeFilter === "Distance"
              ? (
                  countryData.totalDistance /
                  countryData.totalAthletes /
                  12
                ).toFixed(2)
              : (countryData.totalDuration / countryData.totalDistance).toFixed(
                  2
                );
          },
        })
      ),
      Plot.geo(countriesMesh, {
        stroke: (d) => {
          return d.properties.NAME === selectedCountry ? "#efb118" : "#000";
        },
        strokeOpacity: 0.5,
        strokeWidth: (d) => {
          return d.properties.NAME === selectedCountry ? 20 : 1;
        },
      }),
    ],
    height: 800,
    width: 1000,
  });
}
