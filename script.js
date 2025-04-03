document.addEventListener("DOMContentLoaded", function () {
    const colors = ["#133BC7", "#FDC220", "#1BBE6F", "#E63E12", "#502379"];
  
    async function loadCSVData() {
      try {
            const response = await fetch("./captures.csv");
            if (!response.ok) {
                throw new Error(`Failed to fetch the CSV file: ${response.statusText}`);
            }
            const csvText = await response.text();
            const jsonData = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
            }).data;
            return jsonData;
        } catch (error) {
            console.error("Error loading CSV data:", error);
        }
    }
  
    function replaceLongStrings(input) {
      if (input && input.length > 15) {
        return "Other";
      }
      return input || "Not specified";
    }
  
    function getCountryCode(countryName) {
      const countryCodes = {
        Austria: "AT",
        Belgium: "BE",
        Bulgaria: "BG",
        Croatia: "HR",
        Cyprus: "CY",
        Czechia: "CZ",
        Denmark: "DK",
        Estonia: "EE",
        Finland: "FI",
        France: "FR",
        Germany: "DE",
        Greece: "GR",
        Hungary: "HU",
        Ireland: "IE",
        Italy: "IT",
        Latvia: "LV",
        Lithuania: "LT",
        Luxembourg: "LU",
        Malta: "MT",
        Netherlands: "NL",
        Poland: "PL",
        Portugal: "PT",
        Romania: "RO",
        Slovakia: "SK",
        Slovenia: "SI",
        Spain: "ES",
        Sweden: "SE",
        "United Kingdom": "GB",
        Others: "EU",
      };
      return countryCodes[countryName.trim()] || null;
    }
  
    function getTop5PlusOthers(countsObj) {
      const sorted = Object.entries(countsObj).sort((a, b) => b[1] - a[1]);
      const top5 = sorted.slice(0, 5);
      const others = sorted.slice(5);
      const othersSum = others.reduce((acc, [_, val]) => acc + val, 0);
      const newDataObj = {};
      top5.forEach(([key, val]) => {
        newDataObj[key] = val;
      });
      if (othersSum > 0) {
        newDataObj["Others"] = othersSum;
      }
      return newDataObj;
    }
  
    function assignNonConsecutiveColors(dataLength, colorArray) {
      const result = [];
      let lastColor = null;
      let colorIndex = 0;
      for (let i = 0; i < dataLength; i++) {
        let color = colorArray[colorIndex];
        if (color === lastColor) {
          colorIndex = (colorIndex + 1) % colorArray.length;
          color = colorArray[colorIndex];
        }
        result.push(color);
        lastColor = color;
        colorIndex = (colorIndex + 1) % colorArray.length;
      }
      return result;
    }
  
    function createCharts(data) {
      if (data.length === 0) {
        console.error("CSV data is empty.");
        return;
      }
  
      const csvColumns = Object.keys(data[0]);
      console.log("Available CSV Columns:", csvColumns);
  
      const experienceFrequencyCounts = {};
      const countryCounts = {};
      const genderCounts = {};
      const ageGroupCounts = {};
  
      data.forEach((row) => {
        const experience = replaceLongStrings(row["6.3 The experience you described was..."]);
        experienceFrequencyCounts[experience] = (experienceFrequencyCounts[experience] || 0) + 1;
  
        const country = replaceLongStrings(row["6.4 My experience is from..."]);
        if (country.trim() !== "" && country.trim() !== "Not specified") {
          countryCounts[country.trim()] = (countryCounts[country.trim()] || 0) + 1;
        }
  
        const gender = replaceLongStrings(row["6.5 I identify as..."]);
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
  
        const ageGroup = replaceLongStrings(row["6.6 I am ..."]);
        ageGroupCounts[ageGroup] = (ageGroupCounts[ageGroup] || 0) + 1;
      });
  
      const experienceFrequencyData = Object.entries(experienceFrequencyCounts).map(([name, value]) => ({
        name,
        value,
      }));
  
      const totalCountries = Object.values(countryCounts).reduce((a, b) => a + b, 0);
      const fullCountryData = Object.entries(countryCounts).map(([name, value]) => ({
        value: ((value / totalCountries) * 100).toFixed(2),
        name,
        code: getCountryCode(name),
      }));
  
      const top5CountryCounts = getTop5PlusOthers(countryCounts);
      const top5CountryData = Object.entries(top5CountryCounts).map(([name, value]) => ({
        name,
        value,
      }));
  
      const genderData = Object.entries(genderCounts).map(([name, value]) => ({
        name,
        value,
      }));
  
      const ageGroupData = Object.entries(ageGroupCounts).map(([name, value]) => ({
        name,
        value,
      }));
  
      const barChartsData = [
        {
          id: "barChart1",
          title: "2.1 In the experience you shared, what matters most are...",
          leftLabel: "Values and traditions",
          rightLabel: "Change and innovation",
          xAxisData: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
          yAxisValues: [1, 0, 2, 1, 1, 2, 1, 3, 2, 5],
        },
        {
          id: "barChart2",
          title: "2.2 In the experience you shared, others behave...",
          leftLabel: "As expected",
          rightLabel: "Unusually",
          xAxisData: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
          yAxisValues: [2, 1, 1, 4, 5, 2, 1, 2, 1, 3],
        },
        {
          id: "barChart3",
          title: "2.3 In the experience you shared, everybody is treated...",
          leftLabel: "The same but it's not ok",
          rightLabel: "Differently but it's not ok",
          xAxisData: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
          yAxisValues: [1, 2, 0, 1, 0, 2, 3, 5, 2, 4],
        },
        {
          id: "barChart4",
          title: "2.4 In the experience you shared, you feel the government...",
          leftLabel: "Interferes too much",
          rightLabel: "Doesn't care at all",
          xAxisData: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
          yAxisValues: [0, 1, 1, 2, 3, 1, 2, 6, 3, 5],
        },
      ];
  
      barChartsData.forEach((cfg) => {
        const barChart = echarts.init(document.getElementById(cfg.id));
        barChart.setOption({
          title: {
            text: cfg.title,
            left: "left",
            textStyle: {
              fontFamily: "Inter, sans-serif",
            },
          },
          tooltip: {
            trigger: "axis",
          },
          xAxis: {
            type: "category",
            data: cfg.xAxisData,
            axisLabel: {
              formatter: function (val, idx) {
                if (idx === 0) return cfg.leftLabel;
                if (idx === cfg.xAxisData.length - 1) return cfg.rightLabel;
                return val;
              },
            },
          },
          yAxis: {
            type: "value",
            name: "Times Answered",
          },
          series: [
            {
              data: cfg.yAxisValues,
              type: "bar",
              itemStyle: {
                color: "#5B53F6",
              },
              barMaxWidth: 30,
            },
          ],
        });
      });
  
      function buildPieData(originalData) {
        const assignedColors = assignNonConsecutiveColors(originalData.length, colors);
        return originalData.map((item, i) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: assignedColors[i] },
        }));
      }
  
      const experiencePieData = buildPieData(experienceFrequencyData);
      const countryPieData = buildPieData(top5CountryData);
      const genderPieData = buildPieData(genderData);
      const agePieData = buildPieData(ageGroupData);
  
      const chartData = [
        {
          id: "chart1",
          title: "6.3 The experience you described was...",
          data: experiencePieData,
        },
        {
          id: "chart2",
          title: "6.4 My experience is from (Top 5 + Others)...",
          data: countryPieData,
        },
        {
          id: "chart3",
          title: "6.5 I identify as...",
          data: genderPieData,
        },
        {
          id: "chart4",
          title: "6.6 I am ...",
          data: agePieData,
        },
      ];
  
      chartData.forEach(({ id, title, data }) => {
        const chart = echarts.init(document.getElementById(id));
        chart.setOption({
          title: {
            text: title,
            left: "left",
            textStyle: {
              fontFamily: "Inter, sans-serif",
            },
          },
          tooltip: { trigger: "item" },
          series: [
            {
              name: title,
              type: "pie",
              radius: "65%",
              center: ["50%", "50%"],
              data,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: "rgba(0, 0, 0, 0.5)",
                },
              },
              label: { formatter: "{b}\n({d}%)" },
            },
          ],
        });
      });
  
      fetch("https://code.highcharts.com/mapdata/custom/europe.topo.json")
        .then((response) => response.json())
        .then((topology) => {
          Highcharts.mapChart("europeMap", {
            chart: {
              map: topology,
            },
            title: {
              text: "6.4 My experience is from...",
              align: "left",
              style: { fontFamily: "Inter, sans-serif" },
            },
            mapNavigation: {
              enabled: true,
              buttonOptions: { verticalAlign: "bottom" },
            },
            colorAxis: {
              min: 0,
              max: 100,
              type: "linear",
              stops: [
                [0, "#133BC7"],
                [0.25, "#FDC220"],
                [0.5, "#1BBE6F"],
                [0.75, "#E63E12"],
                [1, "#502379"],
              ],
            },
            tooltip: {
              formatter: function () {
                const point = this.point;
                const dataPoint = fullCountryData.find((d) => d.code === point["iso-a2"]);
                return `${point.name}: ${dataPoint ? dataPoint.value + "%" : "0%"}`;
              },
            },
            series: [
              {
                data: fullCountryData,
                name: "Experience Percentage",
                states: { hover: { color: "#BADA55" } },
                dataLabels: { enabled: false },
                joinBy: ["iso-a2", "code"],
              },
            ],
          });
        });
  
      createRadarChart(data);
  
      function createRadarChart(data) {
        const indicators = ["Past", "Future", "Present"];
        const requiredColumns = indicators.map((indicator) => {
          return Object.keys(data[0]).find((col) => col.toLowerCase().includes(indicator.toLowerCase()));
        });
  
        const missingColumns = requiredColumns.filter((col) => !col);
        if (missingColumns.length > 0) {
          console.error("CSV data does not contain the required columns for the radar chart.");
          console.error("Missing Columns:", missingColumns);
          console.log("Available Columns:", Object.keys(data[0]));
          return;
        }
  
        let pastTotal = 0,
          futureTotal = 0,
          presentTotal = 0,
          count = 0;
  
        data.forEach((row) => {
          const past = parseFloat(row[requiredColumns[0]].replace(",", "."));
          const future = parseFloat(row[requiredColumns[1]].replace(",", "."));
          const present = parseFloat(row[requiredColumns[2]].replace(",", "."));
  
          if (!isNaN(past) && !isNaN(future) && !isNaN(present)) {
            pastTotal += past;
            futureTotal += future;
            presentTotal += present;
            count++;
          }
        });
  
        if (count === 0) {
          console.error("No valid data available for the radar chart.");
          return;
        }
  
        const averagePast = pastTotal / count;
        const averageFuture = futureTotal / count;
        const averagePresent = presentTotal / count;
  
        const dataPoint = [
          parseFloat(averagePast.toFixed(2)),
          parseFloat(averageFuture.toFixed(2)),
          parseFloat(averagePresent.toFixed(2)),
        ];
  
        console.log("Radar Chart Data Point:", dataPoint);
  
        const chart = echarts.init(document.getElementById("radarChart"));
  
        const option = {
          title: {
            text: "3.1 The experience you shared relates to...",
            left: "left",
            textStyle: {
              fontFamily: "Inter, sans-serif",
            },
          },
          tooltip: {},
          radar: {
            indicator: indicators.map((name) => ({
              name,
              max: 100,
            })),
            shape: "polygon",
            splitArea: {
              areaStyle: {
                color: ["#fff", "#f4f4f9"],
              },
            },
            axisLine: {
              lineStyle: {
                color: "#999",
              },
            },
          },
          series: [
            {
              name: "Experience Analysis",
              type: "radar",
              data: [
                {
                  value: dataPoint,
                  name: "Experience Data",
                  itemStyle: {
                    color: "#6B4EE8",
                  },
                  areaStyle: {
                    opacity: 0.3,
                    color: "#6B4EE8",
                  },
                },
              ],
            },
          ],
        };
  
        chart.setOption(option);
  
        window.addEventListener("resize", () => {
          chart.resize();
        });
      }
  
      window.addEventListener("resize", function () {
        [
          "barChart1",
          "barChart2",
          "barChart3",
          "barChart4",
          "chart1",
          "chart2",
          "chart3",
          "chart4",
          "radarChart",
        ].forEach((id) => {
          const chartInstance = echarts.getInstanceByDom(document.getElementById(id));
          if (chartInstance) {
            chartInstance.resize();
          }
        });
        Highcharts.charts.forEach((chart) => chart?.reflow());
      });
    }
  
    loadCSVData().then((jsonData) => {
      if (jsonData) {
        createCharts(jsonData);
      }
    });
  });
  