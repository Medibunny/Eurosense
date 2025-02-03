const API_ENDPOINT = 'https://openapi.sensemaker-suite.com/apis/dashboards/';
const BEARER_TOKEN = 'eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjIzYjM4ZjE4OGMzY2IzOWYwOGZkOTdmZTdiNmJlZDAzYjRmNGM5M2MifQ.eyJhdWQiOiJodHRwczovL3BsYXRmb3JtLnNlbnNlbWFrZXItc3VpdGUuY29tIiwic3ViIjoiODY2ODY0YTAtOWFjNy00ZjFkLTlmZmUtOWNmZjE2NTk0NGM5IiwiY2xpZW50X2lkIjoiODk2OWEzYjgtZTliYS00ZDZkLWI2MDgtNzRjNWM5Mjk2ZTE0IiwiZ3JhbnRfdHlwZSI6ImF1dGhvcml6YXRpb25fY29kZSIsIm5vbmNlIjoxNzM4NTY1NjU0LCJleHAiOjE3Mzg1NjYyNTQsImlhdCI6MTczODU2NTY1NCwiaXNzIjoiaHR0cHM6Ly9hcGkuc2luZ3VsYXJpdHkuaWNhdGFseXN0LmNvbS92MS9pc3N1ZXIvODk2OWEzYjgtZTliYS00ZDZkLWI2MDgtNzRjNWM5Mjk2ZTE0Iiwic2NvcGUiOiJhdXRoIHByb2ZpbGUifQ.ALw3yyps4D7F9Wi6KV3OSMRS0fjHEEB7aOHimV4IIAPubKgU9q5lZ_EarcA_dJb-IuWGFlsd1_G2rPuF2j46Eoj8ABOVupsDQ0n61Wwxw_koWmZ4T5bUbNUPagxhDQNwfpWMGzBP9ds0tpWvjCIEOMx7hkDoTNZ2C3o2q1R0H1MZLfdq'
const COLORS = ["#133BC7", "#FDC220", "#1BBE6F", "#E63E12", "#502379"];

const replaceLongStrings = (input) => input?.length > 15 ? "Other" : input || "Not specified";

const getCountryCode = (countryName) => ({
    Austria: "AT", Belgium: "BE", Bulgaria: "BG", Croatia: "HR", Cyprus: "CY",
    Czechia: "CZ", Denmark: "DK", Estonia: "EE", Finland: "FI", France: "FR",
    Germany: "DE", Greece: "GR", Hungary: "HU", Ireland: "IE", Italy: "IT",
    Latvia: "LV", Lithuania: "LT", Luxembourg: "LU", Malta: "MT", Netherlands: "NL",
    Poland: "PL", Portugal: "PT", Romania: "RO", Slovakia: "SK", Slovenia: "SI",
    Spain: "ES", Sweden: "SE", "United Kingdom": "GB", Others: "EU"
}[countryName?.trim()] || null);

const getTop5PlusOthers = (countsObj) => {
    const sorted = Object.entries(countsObj).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5);
    const othersSum = sorted.slice(5).reduce((acc, [_, val]) => acc + val, 0);
    return Object.fromEntries([...top5, ...(othersSum > 0 ? [["Others", othersSum]] : [])]);
};

const assignNonConsecutiveColors = (dataLength, colorArray) => {
    const result = [];
    let lastColor = null;
    let colorIndex = 0;
    for (let i = 0; i < dataLength; i++) {
        let color = colorArray[colorIndex];
        if (color === lastColor) color = colorArray[++colorIndex % colorArray.length];
        result.push(color);
        lastColor = color;
        colorIndex = ++colorIndex % colorArray.length;
    }
    return result;
};

async function fetchAPIData() {
    try {
        const response = await fetch(API_ENDPOINT, {
            headers: { Authorization: `Bearer ${BEARER_TOKEN}` 
        }
        });

        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        console.log('API Data:', data);
        return data.results;

    } catch (error) {
        console.error('API Fetch Error:', error);
        return []; 
    }
}

function createBarCharts() {
    const barConfigs = [
        { id: 'barChart1', title: '2.1 Values vs Innovation', left: 'Values', right: 'Innovation', data: [10,20,30,40,50,60,70,80,90,100] },
        { id: 'barChart2', title: '2.2 Expected vs Unusual', left: 'Expected', right: 'Unusual', data: [20,25,30,35,40,45,50,55,60,65] },
        { id: 'barChart3', title: '2.3 Same vs Different', left: 'Same', right: 'Different', data: [5,10,15,20,25,30,35,40,45,50] },
        { id: 'barChart4', title: '2.4 Government Role', left: 'Interferes', right: 'Neglects', data: [15,20,25,30,35,40,45,50,55,60] }
    ];

    barConfigs.forEach(({ id, title, left, right, data }) => {
        echarts.init(document.getElementById(id)).setOption({
            title: { text: title, left: 'left', textStyle: { fontFamily: 'Inter' } },
            xAxis: { data: data.map((_, i) => i*10), axisLabel: { formatter: (val, idx) => 
                idx === 0 ? left : idx === data.length-1 ? right : val } },
            yAxis: { name: 'Responses' },
            series: [{ type: 'bar', data, itemStyle: { color: '#5B53F6' }, barMaxWidth: 30 }]
        });
    });
}

function createPieCharts(data) {
    const pieData = {
        chart1: { title: '6.3 Experience Frequency', field: 'experience_frequency' },
        chart2: { title: '6.4 Experience Countries', field: 'country' },
        chart3: { title: '6.5 Gender Identity', field: 'gender' },
        chart4: { title: '6.6 Age Groups', field: 'age_group' }
    };

    Object.entries(pieData).forEach(([id, { title, field }]) => {
        const counts = data.reduce((acc, row) => {
            const key = replaceLongStrings(row[field]);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const chartData = Object.entries(getTop5PlusOthers(counts)).map(([name, value], i) => ({
            name, value,
            itemStyle: { color: COLORS[i % COLORS.length] }
        }));

        echarts.init(document.getElementById(id)).setOption({
            title: { text: title, left: 'left' },
            tooltip: { trigger: 'item' },
            series: [{
                type: 'pie',
                radius: '65%',
                data: chartData,
                label: { formatter: '{b}\n({d}%)' }
            }]
        });
    });
}

function createEuropeMap(data) {
    const countryData = data.reduce((acc, row) => {
        const country = replaceLongStrings(row.country);
        if (country && country !== 'Not specified') {
            acc[country] = (acc[country] || 0) + 1;
        }
        return acc;
    }, {});

    fetch('https://code.highcharts.com/mapdata/custom/europe.topo.json')
        .then(response => response.json())
        .then(topology => {
            Highcharts.mapChart('europeMap', {
                chart: { map: topology },
                title: { text: '6.4 Experience Locations', style: { fontFamily: 'Inter' } },
                colorAxis: { min: 0, stops: [[0, "#133BC7"], [0.25, "#FDC220"], [0.5, "#1BBE6F"], [0.75, "#E63E12"], [1, "#502379"]] },
                series: [{
                    data: Object.entries(countryData).map(([name, value]) => ({
                        name,
                        value,
                        code: getCountryCode(name)
                    })),
                    joinBy: ['iso-a2', 'code'],
                    name: 'Experiences',
                    dataLabels: { enabled: false }
                }]
            });
        });
}

function createRadarChart(data) {
    const dimensions = ['past', 'present', 'future'];
    const averages = dimensions.map(dim => {
        const values = data.map(row => parseFloat(row[dim])).filter(v => !isNaN(v));
        return values.length ? values.reduce((a,b) => a + b, 0) / values.length : 0;
    });

    echarts.init(document.getElementById('radarChart')).setOption({
        title: { text: '3.1 Temporal Experience Analysis', left: 'left' },
        radar: {
            indicator: dimensions.map(name => ({ name: name.charAt(0).toUpperCase() + name.slice(1), max: 100 })),
            shape: 'polygon'
        },
        series: [{
            type: 'radar',
            data: [{
                value: averages,
                name: 'Experience',
                itemStyle: { color: '#6B4EE8' },
                areaStyle: { color: '#6B4EE8', opacity: 0.3 }
            }]
        }]
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchAPIData();
    if (data.length === 0) return;

    createBarCharts();
    createPieCharts(data);
    createEuropeMap(data);
    createRadarChart(data);

    window.addEventListener('resize', () => {
        Highcharts.charts.forEach(chart => chart?.reflow());
        ['barChart1', 'barChart2', 'barChart3', 'barChart4', 'chart1', 'chart2', 
         'chart3', 'chart4', 'radarChart'].forEach(id => 
            echarts.getInstanceByDom(document.getElementById(id))?.resize()
        );
    });
});