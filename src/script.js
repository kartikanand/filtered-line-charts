let datasets = [];

window.onload = function() {
    for (let i=0; i<10; ++i) {
        datasets.push({
            label: 'My First dataset',
            backgroundColor: window.chartColors.red,
            borderColor: window.chartColors.red,
            data: [
                randomScalingFactor(),
                randomScalingFactor(),
                randomScalingFactor(),
                randomScalingFactor(),
                randomScalingFactor(),
                randomScalingFactor(),
                randomScalingFactor()
            ],
            fill: false,
        });
    }

    createChart(datasets);

    init();
};

function createChart(datasets) {
    var config = {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: datasets
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Chart.js Line Chart'
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Month'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    }
                }]
            },
            animation: {
                duration: 0
            },
            tooltips: {enabled: false},
            hover: {mode: null}
        }
    };

    if (window.chart) {
        window.chart.destroy();
    }

    var ctx = document.getElementById('js-chart').getContext('2d');
    window.chart = new Chart(ctx, config);

}
